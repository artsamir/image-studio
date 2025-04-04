from flask import Blueprint, request, jsonify, send_from_directory
import os
import subprocess
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

pdf_compress_bp = Blueprint('pdf_compress', __name__)

UPLOAD_FOLDER = "static/uploads"
COMPRESSED_FOLDER = "compressed_files"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)

def compress_pdf(input_path, output_path, dpi, target_size_kb=None):
    try:
        logger.info(f"Compressing {input_path} to {output_path} with DPI {dpi}, Target {target_size_kb} KB")
        original_size = os.path.getsize(input_path) / 1024

        cmd = [
            'gs',
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/screen',
            f'-dColorImageResolution={dpi}',
            '-dNOPAUSE', '-dQUIET', '-dBATCH',
            f'-sOutputFile={output_path}',
            input_path
        ]
        subprocess.run(cmd, check=True)
        compressed_size = os.path.getsize(output_path) / 1024
        logger.info(f"Initial compression: {compressed_size:.2f} KB")

        if target_size_kb:
            current_dpi = dpi
            temp_output = output_path + '.tmp'
            best_output = output_path
            best_size = compressed_size

            min_size = target_size_kb * 0.95
            max_size = target_size_kb * 1.05

            while compressed_size > max_size and current_dpi > 10:
                current_dpi = max(int(current_dpi * (target_size_kb / compressed_size)), 10)
                logger.info(f"Re-compressing with DPI {current_dpi} to approach {target_size_kb} KB")
                cmd = [
                    'gs',
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/screen',
                    f'-dColorImageResolution={current_dpi}',
                    '-dNOPAUSE', '-dQUIET', '-dBATCH',
                    f'-sOutputFile={temp_output}',
                    output_path
                ]
                subprocess.run(cmd, check=True)
                compressed_size = os.path.getsize(temp_output) / 1024
                logger.info(f"New size: {compressed_size:.2f} KB")

                if min_size <= compressed_size <= max_size:
                    os.replace(temp_output, output_path)
                    break
                elif compressed_size < min_size:
                    if abs(best_size - target_size_kb) < abs(compressed_size - target_size_kb):
                        compressed_size = best_size
                    else:
                        os.replace(temp_output, output_path)
                        compressed_size = compressed_size
                    break
                elif abs(compressed_size - target_size_kb) < abs(best_size - target_size_kb):
                    os.replace(temp_output, output_path)
                    best_size = compressed_size
                else:
                    break

            if os.path.exists(temp_output):
                os.remove(temp_output)

        logger.info(f"Final: Original {original_size:.2f} KB, Compressed {compressed_size:.2f} KB")
        return original_size, compressed_size
    except subprocess.CalledProcessError as e:
        logger.error(f"Ghostscript error: {str(e)}")
        raise Exception(f"Compression failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise Exception(f"Compression failed: {str(e)}")

@pdf_compress_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        logger.info("Received upload request")
        if 'file' not in request.files:
            logger.error("No file part in request")
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({'error': 'No file selected'}), 400
        
        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        logger.info(f"Saving file to {input_path}")
        file.save(input_path)
        file_size = os.path.getsize(input_path) / 1024
        logger.info(f"File saved: {file.filename}, Size: {file_size:.2f} KB")
        return jsonify({
            'filename': file.filename,
            'file_size': f'{file_size:.2f} KB'
        })
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@pdf_compress_bp.route('/compress', methods=['POST'])
def compress_file():
    try:
        data = request.get_json()
        filename = data['filename']
        dpi = int(data['dpi'])
        target_size = float(data['target_size']) if data['target_size'] else None
        
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        output_filename = 'compressed_' + filename
        output_path = os.path.join(COMPRESSED_FOLDER, output_filename)
        
        original_size, compressed_size = compress_pdf(input_path, output_path, dpi, target_size)
        
        logger.info(f"Compression complete: Original {original_size:.2f} KB, Compressed {compressed_size:.2f} KB")
        return jsonify({
            'original_size': f'{original_size:.2f} KB',
            'compressed_size': f'{compressed_size:.2f} KB',
            'download_path': f'/download/{output_filename}'
        })
    except Exception as e:
        logger.error(f"Compression route error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pdf_compress_bp.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(COMPRESSED_FOLDER, filename, as_attachment=True)