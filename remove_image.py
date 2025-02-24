import os
from rembg import remove
from PIL import Image

# Define input and output directories
INPUT_FOLDER = "input_images"
OUTPUT_FOLDER = "output_images"

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Get list of all image files in the input folder
image_files = [f for f in os.listdir(INPUT_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

if not image_files:
    print("No images found in the input folder.")
else:
    print(f"Processing {len(image_files)} images...")

# Process each image
for image_name in image_files:
    input_path = os.path.join(INPUT_FOLDER, image_name)
    output_path = os.path.join(OUTPUT_FOLDER, f"bg_removed_{image_name}")

    try:
        # Open image
        with Image.open(input_path) as img:
            # Remove background
            output_image = remove(img)

            # Save the processed image
            output_image.save(output_path, "PNG")  # Saves as PNG to preserve transparency

        print(f"✅ Processed: {image_name} -> Saved to {output_path}")

    except Exception as e:
        print(f"❌ Error processing {image_name}: {e}")

print("🎉 Background removal completed for all images!")
