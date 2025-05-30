import easyocr

def extract_text_from_images(images):
    text = ""

    for image in images:
        reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you have CUDA
        results = reader.readtext(image, detail=0)
        text+="\n".join(results)

    return text.strip()