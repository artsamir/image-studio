from flask import Blueprint, request, jsonify, send_from_directory
import os
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

photo_resizer_bp = Blueprint('photo_resizer', __name__)

UPLOAD_FOLDER = "static/uploads"
RESIZED_FOLDER = "resized_images"

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESIZED_FOLDER, exist_ok=True)

def resize_image(input_path, output_path, width=None, height=None, target_size=None, dpi=72):
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Get original dimensions if width/height not provided
            orig_width, orig_height = img.size
            width = width or orig_width
            height = height or orig_height

            # Resize image
            logger.info(f"Resizing {input_path} to {width}x{height} pixels")
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            
            # Adjust quality to meet target size (if provided)
            quality = 90
            img.save(output_path, quality=quality, dpi=(dpi, dpi))
            
            if target_size:
                while os.path.getsize(output_path) / 1024 > target_size and quality > 5:
                    quality -= 5
                    img.save(output_path, quality=quality, dpi=(dpi, dpi))
            
            resized_size = os.path.getsize(output_path) / 1024  # Convert to KB
            logger.info(f"Resized image saved: {output_path}, Size: {resized_size:.2f} KB")
            return resized_size
    except Exception as e:
        logger.error(f"Error resizing image: {str(e)}")
        raise Exception(f"Resizing failed: {str(e)}")

@photo_resizer_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        logger.info("Received image upload request")
        if 'image' not in request.files:
            logger.error("No file part in request")
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['image']
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

@photo_resizer_bp.route('/resize', methods=['POST'])
def resize_file():
    try:
        if 'image' not in request.files:
            logger.error("No image file in request")
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({'error': 'No file selected'}), 400

        # Save the uploaded file
        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(input_path)

        # Get form data
        width = request.form.get('width', type=int)
        height = request.form.get('height', type=int)
        target_size = request.form.get('target_size', type=int)
        dpi = request.form.get('dpi', default=72, type=int)

        # Generate output filename
        output_filename = f"resized_{file.filename}"
        output_path = os.path.join(RESIZED_FOLDER, output_filename)
        
        # Resize the image
        resized_size = resize_image(input_path, output_path, width, height, target_size, dpi)
        
        logger.info(f"Resizing complete: Resized size {resized_size:.2f} KB")
        return send_from_directory(RESIZED_FOLDER, output_filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Resizing route error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@photo_resizer_bp.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(RESIZED_FOLDER, filename, as_attachment=True)