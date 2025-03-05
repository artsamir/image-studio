import io
import zipfile
import logging
import cairosvg
from PIL import Image
import img2pdf

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def convert_to_svg(files):
    zip_buffer = io.BytesIO()
    supported_formats = {'jpg', 'jpeg', 'png', 'bmp', 'webp', 'tiff', 'svg', 'pdf'}

    try:
        with zipfile.ZipFile(zip_buffer, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file in files[:170]:
                try:
                    filename = file.filename.lower()
                    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''

                    if ext not in supported_formats:
                        logger.warning(f"Unsupported format: {filename}")
                        continue

                    logger.debug(f"Processing file: {filename}")

                    if ext == 'svg':
                        logger.debug(f"File is already SVG, adding to zip: {filename}")
                        zip_file.writestr(file.filename, file.read())
                    elif ext in {'jpg', 'jpeg', 'png', 'bmp', 'webp', 'tiff'}:
                        logger.debug(f"Converting raster image to SVG: {filename}")
                        img = Image.open(file)
                        svg_output = io.BytesIO()
                        img.save(svg_output, format="PNG")  # Convert to PNG (for tracing)
                        svg_data = cairosvg.png2svg(bytestring=svg_output.getvalue())  # Convert to SVG
                        output_filename = file.filename.rsplit('.', 1)[0] + '.svg'
                        zip_file.writestr(output_filename, svg_data)
                        logger.debug(f"Successfully converted and added to zip: {output_filename}")
                    else:
                        logger.error(f"Cannot process format: {ext}")

                except Exception as e:
                    logger.error(f"Error processing {file.filename}: {str(e)}")
                    continue

        zip_buffer.seek(0)
        logger.debug("Conversion process completed.")
        return zip_buffer

    except Exception as e:
        logger.error(f"Error creating ZIP: {str(e)}")
        zip_buffer.close()
        raise
