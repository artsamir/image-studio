# jpeg_converter.py
import io
import zipfile
from PIL import Image
import logging
import pillow_heif

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def convert_to_jpeg(files):
    zip_buffer = io.BytesIO()
    supported_formats = {
        'jpg', 'jpeg', 'png', 'bmp', 'heic', 'svg', 'webp', 'tiff', 'psd',
        'pdf', 'ai', 'indd', 'raw', 'eps'
    }

    try:
        with zipfile.ZipFile(zip_buffer, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file in files[:170]:
                try:
                    filename = file.filename.lower()
                    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''

                    if ext not in supported_formats:
                        logger.warning(f"Unsupported format: {filename}")
                        continue

                    if ext == 'heic':
                        heif_file = pillow_heif.read_heif(file)
                        img = Image.frombytes(heif_file.mode, heif_file.size, heif_file.data, "raw", heif_file.mode, heif_file.stride)
                    else:
                        img = Image.open(file)

                    if img.mode in ('RGBA', 'P', 'CMYK', 'LA'):
                        img = img.convert('RGB')

                    jpeg_buffer = io.BytesIO()
                    img.save(jpeg_buffer, 'JPEG', quality=80)

                    output_filename = file.filename.rsplit('.', 1)[0] + '.jpeg'
                    zip_file.writestr(output_filename, jpeg_buffer.getvalue())

                    jpeg_buffer.close()
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