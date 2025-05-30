from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import numpy as np

from controllers.model import extract_text_from_images
from controllers.pdf2image_convertor import pdf_to_images
from controllers.llm_model import get_structured_json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/api/extract_json', methods=['POST'])
def extract_json():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file provided"}), 400

    filename = file.filename.lower()

    try:
        # Step 1: Convert to images
        if filename.endswith('.pdf'):
            file_stream = io.BytesIO(file.read())
            images = pdf_to_images(file_stream)
        else:
            image = Image.open(file.stream).convert("RGB")
            images = [image]

        # Step 2: OCR
        images_np = [np.array(img) for img in images]
        extracted_text = extract_text_from_images(images_np)

        # Step 3: LLaMA 3.3 JSON Formatting
        structured_json = get_structured_json(extracted_text)

        return structured_json

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)