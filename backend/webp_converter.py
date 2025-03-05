import io
import zipfile
from PIL import Image
import logging
import PyPDF2
import img2pdf
import pillow_heif  # Import for HEIC support

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def convert_to_webp(files):
    """
    Convert a list of image files to WebP format and return them in a ZIP buffer
    Args:
        files: List of file objects from Flask request
    Returns:
        io.BytesIO: Buffer containing ZIP file with converted images
    """
    zip_buffer = io.BytesIO()
    supported_formats = {
        'jpg', 'jpeg', 'png', 'bmp', 'heic', 'svg', 'webp', 'tiff', 'psd',
        'pdf', 'ai', 'indd', 'raw', 'eps'
    }
    
    try:
        with zipfile.ZipFile(zip_buffer, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file in files[:300]:  # Limit to 300 files
                try:
                    filename = file.filename.lower()
                    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
                    
                    if ext not in supported_formats:
                        logger.warning(f"Unsupported format: {filename}")
                        continue

                    # Handle HEIC files
                    if ext == 'heic':
                        heif_file = pillow_heif.read_heif(file)
                        img = Image.frombytes(
                            heif_file.mode,
                            heif_file.size,
                            heif_file.data,
                            "raw",
                            heif_file.mode,
                            heif_file.stride,
                        )
                    # Handle PDF separately
                    elif ext == 'pdf':
                        pdf_file = PyPDF2.PdfReader(file)
                        for page_num in range(len(pdf_file.pages)):
                            # Convert PDF page to image
                            img_buffer = io.BytesIO()
                            file.seek(0)  # Reset file pointer
                            img = img2pdf.convert(file.read())
                            img_file = Image.open(io.BytesIO(img))
                            webp_buffer = io.BytesIO()
                            img_file.save(webp_buffer, 'WEBP', quality=80)
                            output_filename = f"{filename.rsplit('.', 1)[0]}_page{page_num + 1}.webp"
                            zip_file.writestr(output_filename, webp_buffer.getvalue())
                            webp_buffer.close()
                            img_file.close()
                        continue
                    # Handle all other image formats
                    else:
                        img = Image.open(file)
                    
                    # Convert to RGB if needed
                    if img.mode in ('RGBA', 'P', 'CMYK', 'LA'):
                        img = img.convert('RGB')
                    
                    # Create buffer for WebP conversion
                    webp_buffer = io.BytesIO()
                    img.save(webp_buffer, 'WEBP', quality=80)
                    
                    # Get filename and replace extension
                    output_filename = file.filename.rsplit('.', 1)[0] + '.webp'
                    
                    # Write to ZIP
                    zip_file.writestr(output_filename, webp_buffer.getvalue())
                    
                    # Clean up
                    webp_buffer.close()
                    img.close()
                    
                except Exception as e:
                    logger.error(f"Error converting {file.filename}: {str(e)}")
                    continue
                    
        zip_buffer.seek(0)
        return zip_buffer
        
    except Exception as e:
        logger.error(f"Error creating ZIP: {str(e)}")
        zip_buffer.close()
        raise

if __name__ == '__main__':
    import os
    from werkzeug.datastructures import FileStorage
    
    test_files = []
    test_dir = "test_images"
    if os.path.exists(test_dir):
        for filename in os.listdir(test_dir):
            with open(os.path.join(test_dir, filename), 'rb') as f:
                test_files.append(FileStorage(f, filename))
        
        if test_files:
            result = convert_to_webp(test_files)
            with open('test_output.zip', 'wb') as f:
                f.write(result.getvalue())
            print("Test conversion completed")