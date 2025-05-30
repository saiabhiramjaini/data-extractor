import fitz
from PIL import Image
import io

def pdf_to_images(pdf_file_stream):
    doc = fitz.open(stream=pdf_file_stream.read(), filetype="pdf")
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=200)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        images.append(img)
    return images