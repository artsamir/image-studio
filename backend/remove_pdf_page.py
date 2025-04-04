from flask import Blueprint, jsonify, request, send_from_directory
import os
import logging
from PyPDF2 import PdfReader, PdfWriter

remove_pdf_bp = Blueprint('remove_pdf', __name__)
UPLOAD_FOLDER = 'static/uploads'

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@remove_pdf_bp.route('/upload', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400
    
    file = request.files['pdf']
    if file.filename == '' or not file.filename.endswith('.pdf'):
        return jsonify({'success': False, 'error': 'Invalid file'}), 400
    
    for f in os.listdir(UPLOAD_FOLDER):
        os.remove(os.path.join(UPLOAD_FOLDER, f))
    
    pdf_path = os.path.join(UPLOAD_FOLDER, 'input.pdf')
    file.save(pdf_path)
    pdf = PdfReader(pdf_path)
    return jsonify({'success': True, 'pages': len(pdf.pages)})

@remove_pdf_bp.route('/remove_pages', methods=['POST'])
def remove_pages():
    data = request.get_json()
    removed_pages = set(data['removed_pages'])  # Pages are 1-indexed
    pdf_path = os.path.join(UPLOAD_FOLDER, 'input.pdf')
    output_path = os.path.join(UPLOAD_FOLDER, 'removed_pages.pdf')
    
    pdf_reader = PdfReader(pdf_path)
    pdf_writer = PdfWriter()
    
    for i in range(len(pdf_reader.pages)):
        if (i + 1) not in removed_pages:  # Convert to 1-indexed
            pdf_writer.add_page(pdf_reader.pages[i])
    
    with open(output_path, 'wb') as output_file:
        pdf_writer.write(output_file)
    
    return jsonify({'success': True, 'download_url': '/static/uploads/removed_pages.pdf'})

@remove_pdf_bp.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)