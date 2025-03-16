# split_pdf.py
from flask import Blueprint, jsonify, request, send_from_directory
import os
import logging
from PyPDF2 import PdfReader, PdfWriter
import traceback

split_pdf_bp = Blueprint('split_pdf', __name__)
UPLOAD_FOLDER = 'static/uploads'

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_pdf(pdf_path, upload_folder):
    try:
        pdf = PdfReader(pdf_path)
        return len(pdf.pages)
    except Exception as e:
        logger.error(f"process_pdf error: {str(e)}")
        raise

def split_pdf(pdf_path, start, end, output_path):
    try:
        start = int(start) - 1
        end = int(end)
        pdf_reader = PdfReader(pdf_path)
        pdf_writer = PdfWriter()
        total_pages = len(pdf_reader.pages)
        if start < 0 or end > total_pages or start >= end:
            raise ValueError("Invalid page range")
        for page_num in range(start, end):
            pdf_writer.add_page(pdf_reader.pages[page_num])
        with open(output_path, 'wb') as output_file:
            pdf_writer.write(output_file)
    except Exception as e:
        logger.error(f"split_pdf error: {str(e)}")
        raise

@split_pdf_bp.route('/upload', methods=['POST'])
def upload_pdf():
    logger.info("Received upload request")
    print("Request method:", request.method)
    print("Request files:", request.files)
    logger.debug(f"Request files: {request.files}")
    
    try:
        if 'pdf' not in request.files:
            logger.error("No file part in request")
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['pdf']
        logger.debug(f"Received file: {file.filename}")
        
        if file.filename == '' or not file.filename.endswith('.pdf'):
            logger.error("Invalid file received")
            return jsonify({'success': False, 'error': 'Invalid file'}), 400
        
        # Clear previous uploads
        for f in os.listdir(UPLOAD_FOLDER):
            try:
                os.remove(os.path.join(UPLOAD_FOLDER, f))
                logger.debug(f"Removed previous file: {f}")
            except Exception as e:
                logger.warning(f"Failed to remove file {f}: {str(e)}")
        
        pdf_path = os.path.join(UPLOAD_FOLDER, 'input.pdf')
        file.save(pdf_path)
        logger.info(f"File saved to: {pdf_path}")
        
        pages = process_pdf(pdf_path, UPLOAD_FOLDER)
        logger.info(f"PDF processed successfully. Pages: {pages}")
        return jsonify({'success': True, 'pages': pages})
    
    except Exception as e:
        logger.error("Upload processing failed:")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': f"Server error: {str(e)}"}), 500

@split_pdf_bp.route('/split', methods=['POST'])
def split():
    logger.info("Received split request")
    try:
        data = request.get_json()
        start = data['start']
        end = data['end']
        logger.info(f"Split request: pages {start} to {end}")
        
        pdf_path = os.path.join(UPLOAD_FOLDER, 'input.pdf')
        output_path = os.path.join(UPLOAD_FOLDER, 'split_output.pdf')
        
        split_pdf(pdf_path, start, end, output_path)
        logger.info("PDF split successfully")
        return jsonify({'success': True, 'download_url': '/static/uploads/split_output.pdf'})
    except Exception as e:
        logger.error("Split processing failed:")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@split_pdf_bp.route('/static/uploads/<filename>')
def uploaded_file(filename):
    logger.info(f"Serving file: {filename}")
    return send_from_directory(UPLOAD_FOLDER, filename)