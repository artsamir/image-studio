from flask import Blueprint, request, jsonify, send_file
import os
from rembg import remove
from PIL import Image
from io import BytesIO

customize_bp = Blueprint('customize_background', __name__)

UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@customize_bp.route("/remove-bg", methods=["POST"])
def remove_bg():
    if "image" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["image"]
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format"}), 400

    input_path = os.path.join(UPLOAD_FOLDER, file.filename)
    output_path = os.path.join(OUTPUT_FOLDER, f"processed_{file.filename}")
    
    file.save(input_path)
    
    try:
        with open(input_path, "rb") as f:
            input_image = f.read()
            output_image = remove(input_image)

        image = Image.open(BytesIO(output_image))
        image = image.convert("RGBA")
        image.save(output_path, format="PNG")

        return send_file(output_path, mimetype="image/png")
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500
