import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# 1. UNIVERSITY DATABASE (Moved inside here to be safe)
DBU_KNOWLEDGE = """
UNIVERSITY OVERVIEW:
- Name: Debre Berhan University (DBU)
- Established: 2007 G.C.
- Motto: "Knowledge for Development!"
- Location: Debre Berhan, Ethiopia (Cold high-altitude climate).

ACADEMICS & DEPARTMENTS:
1. Institute of Technology (IoT): Computer Science, Software Engineering, Civil Engineering, Electrical, Mechanical.
2. College of Health Sciences: Medicine, Nursing, Midwifery, Public Health.
3. College of Natural Sciences: Biology, Chemistry, Physics, Mathematics, Statistics.
"""

# 2. SETUP ENVIRONMENT
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
# Using the model that worked for you earlier
model = genai.GenerativeModel('gemini-flash-latest')
app = Flask(__name__)
CORS(app)

SYSTEM_PROMPT = f"""
You are the 'DBU Intelligence Navigator'. You are the official AI for Debre Berhan University.
KNOWLEDGE BASE: {DBU_KNOWLEDGE}
STYLE: Use bold headers and clean bullet points. Always remind students to wear warm clothes!
"""

@app.route('/')
def home():
    return "DBU AI Core is Active."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Check if the data is coming from the form (for images) or JSON
        if request.form:
            user_message = request.form.get("message", "")
            image_file = request.files.get("image")
        elif request.json:
            user_message = request.json.get("message", "")
            image_file = None
        else:
            user_message = "Hello"
            image_file = None
        
        print(f"User Message: {user_message}")

        prompt_content = [f"{SYSTEM_PROMPT}\n\nUser Question: {user_message}"]

        if image_file:
            print("Processing Image Attachment...")
            image_data = image_file.read()
            image_parts = [{"mime_type": image_file.content_type, "data": image_data}]
            prompt_content.append(image_parts[0])

        # Execute Gemini
        response = model.generate_content(prompt_content)
        return jsonify({"reply": response.text})

    except Exception as e:
        print(f"BACKEND ERROR: {str(e)}")
        return jsonify({"reply": f"AI Error: {str(e)}"}), 200

if __name__ == "__main__":
    app.run(port=5001, debug=True)