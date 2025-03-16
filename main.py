from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
import io
import logging
from werkzeug.utils import secure_filename

from backend.customize_background import customize_bp
from backend.pdf_compress import pdf_compress_bp 
from backend.photo_resizer import photo_resizer_bp
from backend.webp_converter import convert_to_webp
from backend.jpeg_converter import convert_to_jpeg
from backend.png_converter import convert_to_png
from backend.svg_converter import convert_to_svg
from backend.combined_photo import init_routes
from backend.split_pdf import split_pdf_bp  # Import the Blueprint

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
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, STATIC_FOLDER, COMPRESSED_FOLDER, RESIZED_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Register Blueprints
app.register_blueprint(customize_bp)
app.register_blueprint(pdf_compress_bp)
app.register_blueprint(photo_resizer_bp)
app.register_blueprint(split_pdf_bp, url_prefix='/split_pdf')  # Register the split_pdf Blueprint
init_routes(app)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1500 * 1024 * 1024

# ------------ Static file routes
@app.route('/robots.txt')
def robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')

# ------------ Page routes
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

@app.route('/split-pdf')
def split_pdf_page():
    return render_template('split-pdf.html')

@app.route('/photo-resizer')
def photoresizer():
    return render_template('photo-resizer.html')

@app.route('/photo-editor')
def photoeditor():
    return render_template('photo-editor.html')

@app.route('/webp-converter')
def webp_converter():
    return render_template('webp-converter.html')

@app.route('/jpeg-converter')
def jpeg_converter():
    return render_template('jpeg-converter.html')

@app.route('/png-converter')
def png_converter():
    return render_template('png-converter.html')

@app.route('/svg-converter')
def svg_converter():
    return render_template('svg-converter.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# ------------ Image Conversion Routes
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

@app.route('/convert-to-jpeg', methods=['POST'])
def convert_images_to_jpeg():
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400
        zip_buffer = convert_to_jpeg(files)
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='converted_images.zip'
        )
    except Exception as e:
        logger.error(f"Error in conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/convert-to-png', methods=['POST'])
def convert_images_to_png():
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400
        zip_buffer = convert_to_png(files)
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='converted_images.zip'
        )
    except Exception as e:
        logger.error(f"Error in conversion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/convert-to-svg', methods=['POST'])
def convert_images_to_svg():
    try:
        files = request.files.getlist('images')
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400
        zip_buffer = convert_to_svg(files)
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