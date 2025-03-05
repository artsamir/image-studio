import io
import zipfile
import logging
import cairosvg
from cairosvg import exceptions

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def convert_to_svg(files):
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

                    logger.debug(f"Processing file: {filename}")

                    if ext == 'svg':
                        logger.debug(f"File is already SVG, adding to zip: {filename}")
                        zip_file.writestr(file.filename, file.read())
                    else:
                        logger.debug(f"Converting to SVG: {filename}")
                        try:
                            img_bytes = file.read()
                            svg_bytes = cairosvg.svg2svg(bytestring=img_bytes)
                            output_filename = file.filename.rsplit('.', 1)[0] + '.svg'
                            zip_file.writestr(output_filename, svg_bytes)
                            logger.debug(f"Successfully converted and added to zip: {output_filename}")
                        except exceptions.CairoSVGError as e:  # Corrected exception handling
                            logger.error(f"CairoSVG error converting {filename}: {e}")
                            continue  # Skip to the next file
                        except Exception as e:
                            logger.error(f"Error reading or processing {filename}: {e}")
                            continue # Skip to the next file

                except Exception as e:
                    logger.error(f"General error processing {file.filename}: {str(e)}")
                    continue

        zip_buffer.seek(0)
        logger.debug("Conversion process completed.")
        return zip_buffer

    except Exception as e:
        logger.error(f"Error creating ZIP: {str(e)}")
        zip_buffer.close()
        raise