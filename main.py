from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
import io
import logging
import subprocess
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image
from rembg import remove
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "super-secret-key"

# Configuration
UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"
STATIC_FOLDER = 'static'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
COMPRESSED_FOLDER = 'compressed_files'
ALLOWED_PDF_EXTENSIONS = {'pdf'}

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB limit

# Helper functions
def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_pdf_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_PDF_EXTENSIONS

# Serve sitemap.xml
@app.route('/robots.txt')
def robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')

@app.route('/sitemap.xml')
def serve_sitemap():
    return send_from_directory(STATIC_FOLDER, 'sitemap.xml')

# Route controls
@app.route('/')
def index():
    return render_template('customize-background.html')

@app.route('/customize-background')
def customize_background():
    return render_template('customize-background.html')

@app.route('/combined-photo')
def combined_photo():
    return render_template('combined-photo.html')

@app.route('/pdf-compress')
def pdfcompress():
    return render_template('pdf-compress.html')

@app.route('/photo-resizer')
def photoresizer():
    return render_template('photo-resizer.html')

@app.route('/photo-editor')
def photoeditor():
    return render_template('photo-editor.html')

@app.route('/webp-png-converter')
def webp_png_converter():
    return render_template('webp-png-converter.html')

@app.route('/about')
def about():
    return render_template('about.html')

# Remove Background Logic
@app.route("/remove-bg", methods=["POST"])
def remove_bg():
    if "image" not in request.files:
        return "No file uploaded", 400

    file = request.files["image"]
    input_path = os.path.join(UPLOAD_FOLDER, file.filename)
    output_path = os.path.join(OUTPUT_FOLDER, f"processed_{file.filename}")

    file.save(input_path)

    # Process image
    with open(input_path, "rb") as f:
        input_image = f.read()
        output_image = remove(input_image)

    # Convert output to PNG
    image = Image.open(BytesIO(output_image))
    image = image.convert("RGBA")
    image.save(output_path, format="PNG")

    return send_file(output_path, mimetype="image/png")

# Image Resizing Logic
def resize_image(image_data, target_size_kb, width, height, dpi):
    try:
        img = Image.open(io.BytesIO(image_data))
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        if width and height:
            img = img.resize((int(width), int(height)), Image.Resampling.LANCZOS)

        if dpi:
            img.info['dpi'] = (int(dpi), int(dpi))

        quality = 95
        output = io.BytesIO()
        while quality > 5:
            output.seek(0)
            output.truncate()
            img.save(output, format='JPEG', quality=quality, dpi=(int(dpi), int(dpi)) if dpi else None)
            if len(output.getvalue()) <= target_size_kb * 1024:
                break
            quality -= 5

        output.seek(0)
        return output
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return None

@app.route('/resize', methods=['POST'])
def resize():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        if not file or not allowed_image_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        target_size = request.form.get('target_size', type=int)
        width = request.form.get('width', type=int)
        height = request.form.get('height', type=int)
        dpi = request.form.get('dpi', type=int)

        if not target_size or target_size <= 0:
            return jsonify({'error': 'Target size must be a positive integer'}), 400

        image_data = file.read()
        resized_image = resize_image(image_data, target_size, width, height, dpi)

        if not resized_image:
            return jsonify({'error': 'Error processing image'}), 500

        return send_file(resized_image, mimetype='image/jpeg', as_attachment=True, download_name='resized_image.jpg')
    except Exception as e:
        logger.error(f"Error in resize endpoint: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

# ==================================================================================================
#                  PDF Compression Logic
# ===================================================================================================
def compress_pdf(input_path, output_path, dpi, target_size_kb=None):
    try:
        logger.info(f"Compressing {input_path} to {output_path} with DPI {dpi}, Target {target_size_kb} KB")
        original_size = os.path.getsize(input_path) / 1024

        # Initial compression with given DPI
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

        # Adjust to stay within ±5% if target_size_kb is specified
        if target_size_kb:
            current_dpi = dpi
            temp_output = output_path + '.tmp'
            best_output = output_path
            best_size = compressed_size

            min_size = target_size_kb * 0.95  # e.g., 665 KB for 700 KB
            max_size = target_size_kb * 1.05  # e.g., 735 KB for 700 KB

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
    
@app.route('/upload', methods=['POST'])
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
    
@app.route('/compress', methods=['POST'])
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

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(COMPRESSED_FOLDER, filename, as_attachment=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Railway's provided port
    app.run(host="0.0.0.0", port=port)