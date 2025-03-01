from flask import Blueprint, request, send_file
from PIL import Image
import io

combine_bp = Blueprint('combine', __name__)

@combine_bp.route('/combine', methods=['POST'])
def combine_images():
    # Get uploaded images
    image1 = request.files['image1']
    image2 = request.files['image2']

    # Open images with PIL
    img1 = Image.open(image1).convert('RGB')
    img2 = Image.open(image2).convert('RGB')

    # Standard passport size in pixels (at 300 DPI): 2x2 inches = 600x600 pixels
    # We'll use half width for each image: 300x600 pixels
    passport_width = 600
    passport_height = 600
    half_width = passport_width // 2

    # Resize images
    img1 = img1.resize((half_width, passport_height), Image.Resampling.LANCZOS)
    img2 = img2.resize((half_width, passport_height), Image.Resampling.LANCZOS)

    # Create a new blank image with passport size
    combined = Image.new('RGB', (passport_width, passport_height))

    # Paste both images side by side
    combined.paste(img1, (0, 0))
    combined.paste(img2, (half_width, 0))

    # Save to bytes buffer
    buffer = io.BytesIO()
    combined.save(buffer, format="JPEG")
    buffer.seek(0)

    return send_file(buffer, mimetype='image/jpeg')