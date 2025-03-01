from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os #customize_background, pdf_compress
import io
import logging #customize_background, pdf_compress
import subprocess
from werkzeug.utils import secure_filename
# from PyPDF2 import PdfReader, PdfWriter

from backend.combined_photo import combine_bp  # Adjusted import path
from backend.customize_background import customize_bp
from backend.pdf_compress import pdf_compress_bp 
from backend.photo_resizer import photo_resizer_bp


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

# Register the Blueprint from backend/combined-photo.py
app.register_blueprint(combine_bp)  # Combined Photo
app.register_blueprint(customize_bp)  # Background customization
app.register_blueprint(pdf_compress_bp)  # PDF compression
app.register_blueprint(photo_resizer_bp)  # Image resizing

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB limit


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

# Serve static files (CSS and JS)
@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Railway's provided port
    app.run(host="0.0.0.0", port=port)