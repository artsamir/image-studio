from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
import io
import logging
import subprocess
from werkzeug.utils import secure_filename

from backend.combined_photo import combine_bp
from backend.customize_background import customize_bp
from backend.pdf_compress import pdf_compress_bp 
from backend.photo_resizer import photo_resizer_bp
from backend.webp_converter import convert_to_webp

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "super-secret-key"

# Configuration
UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"
STATIC_FOLDER = 'static'
COMPRESSED_FOLDER = 'compressed_files'
RESIZED_FOLDER = "resized_images"
ALLOWED_PDF_EXTENSIONS = {'pdf'}

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)

# Register Blueprints
app.register_blueprint(combine_bp)
app.register_blueprint(customize_bp)
app.register_blueprint(pdf_compress_bp)
app.register_blueprint(photo_resizer_bp)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1500 * 1024 * 1024  # Increased to 100MB

# Serve static files
@app.route('/robots.txt')
def robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')

# Routes for different pages
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

@app.route('/webp-converter')
def webp_converter():
    return render_template('webp-converter.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/convert-to-webp', methods=['POST'])
def convert_images():
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400

        zip_buffer = convert_to_webp(files)
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='converted_images.zip'
        )
    except Exception as e:
        logger.error(f"Error in conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)