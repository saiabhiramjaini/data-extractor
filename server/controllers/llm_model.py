from together import Together
from dotenv import load_dotenv
import os

load_dotenv()
client = Together(api_key=os.getenv("TOGETHER_API_KEY"))

def get_structured_json(OCR_TEXT):

    prompt = f"""
        You are an AI assistant skilled in reading and understanding bills, receipts, or invoices from raw OCR-extracted text.

        Your task is to carefully analyze the entire text and extract all meaningful, relevant information to keep in invoice/ billing json data. Then, organize this information into a well-structured JSON object.

        Do not limit yourself to any predefined fields or schemas; instead, identify the key sections and details that naturally appear in the text, such as vendor information, dates, line items, totals, customer info, payment details, or anything else important.

        Make sure to:

        - Include only fields that you can confidently extract from the text and meaningful to keep in invoice/ billing json data.
        - Omit any fields or values if the information is missing or unclear but don't keep the values like "", NULL etc...
        - Group related information logically under appropriate keys.
        - Format the JSON cleanly and correctly.

        Here is the raw OCR text extracted from the bill/invoice:

        ""{OCR_TEXT}""

        Return only the JSON object without any extra explanation.

    """

    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        final_response =  response.choices[0].message.content

        # Clean: strip code block markdown
        if final_response.startswith("```json"):
            final_response = final_response.removeprefix("```json").strip()
        if final_response.startswith("```"):
            final_response = final_response.removeprefix("```").strip()
        if final_response.endswith("```"):
            final_response = final_response.removesuffix("```").strip()

        return final_response
    
    except Exception as e:
        return f"Error: {str(e)}"