from flask import request, send_file
from rembg import remove
from PIL import Image
import io

def init_routes(app):
    @app.route('/remove-bg', methods=['POST'])
    def remove_background():
        try:
            image = request.files.get('image')
            if not image:
                return "No image uploaded", 400
            
            output = remove(image.read())  # Remove background
            return send_file(io.BytesIO(output), mimetype='image/png')

        except Exception as e:
            print(f"❌ Error removing background: {e}")
            return f"Internal Server Error: {e}", 500

    @app.route('/combine-images', methods=['POST'])
    def combine():
        try:
            # Get images from the request
            image1 = request.files.get('image1')
            image2 = request.files.get('image2')

            if not image1 or not image2:
                return "Both images are required", 400

            # Open images using PIL
            img1 = Image.open(image1).convert('RGBA')
            img2 = Image.open(image2).convert('RGBA')

            # Resize images to the same size
            img1 = img1.resize((300, 400), Image.LANCZOS)
            img2 = img2.resize((300, 400), Image.LANCZOS)

            # Create a blank canvas
            combined = Image.new('RGBA', (600, 400))

            # Paste images at correct positions
            combined.paste(img1, (0, 0), img1)  # Ensure transparency is maintained
            combined.paste(img2, (300, 0), img2)  # Place second image correctly

            # Save the output to a BytesIO object
            output = io.BytesIO()
            combined.save(output, format="PNG")
            output.seek(0)  # Move cursor to the beginning

            # Return the combined image
            return send_file(output, mimetype="image/png")

        except Exception as e:
            print(f"❌ Error combining images: {e}")
            return f"Internal Server Error: {e}", 500
