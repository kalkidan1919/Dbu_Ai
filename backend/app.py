import os
import base64
import json
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

# --- PHASE 6: UPDATED ENHANCED UNIVERSITY DATABASE ---
DBU_KNOWLEDGE = """
ABOUT DEBRE BERHAN UNIVERSITY (DBU):
- Location: Debre Berhan, Ethiopia (130 km northeast of Addis Ababa).
- Established: 2007 G.C.
- Motto: "Knowledge for Development!"
- Vision: To be one of the top ten universities in Ethiopia by 2025.

KEY FACULTIES & COLLEGES:
1. College of Natural and Computational Sciences (CNCS): Biology, Chemistry, Physics, Mathematics, Sport Science, Statistics.
2. College of Social Sciences and Humanities: English, Amharic, History, Geography, Sociology.
3. College of Business and Economics: Accounting, Economics, Management, Tourism.
4. College of Agriculture and Natural Resource Sciences.
5. College of Health Sciences: Medicine, Nursing, Public Health, Midwifery.
6. Institute of Technology (IoT): 
   - Civil Engineering
   - Electrical & Computer Engineering
   - Mechanical Engineering
   - Computing (Computer Science, Software Engineering, IT, Information Systems).
7. School of Law.

CAMPUS LIFE:
- The campus is known for its cold weather (high altitude).
- Students often wear warm clothes ("Gabi" or modern jackets).
- Main Library is 24/7 during exam weeks.

CONTACT INFORMATION:
- President: Dr. Asmare Melese
- Registrar: Dr. Asratemedhin Bekele (Executive Director).
- Website Contact: Dawit Abate.
NEW ACADEMIC DATA (DBU):
- Grading System: 
    A (85-100), B (70-84), C (50-69), D (40-49), F (0-39).
- Academic Year: Typically starts in October (Meskerem) and ends in July (Hamle).
- Semester Break: Usually late February.
- Graduation: Typically held in early July.
DBU CAMPUS NAVIGATOR:
- Main Cafe: Located near the Graduation Field.
- Dormitories: High-rise buildings named 'Block A' to 'Block G' for new students.
- Library: Night reading is 24/7 in 'Block 4'.
"""

# 2. SETUP ENVIRONMENT
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'users.db')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                dept TEXT NOT NULL,
                year TEXT NOT NULL
            )
        ''')
        db.commit()

init_db()

@app.route('/')
def home():
    return "DBU AI Core & Auth Service Active."

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    dept = data.get('dept')
    year = data.get('year')

    if not all([username, password, name, dept, year]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return jsonify({"error": "Username already exists"}), 409

        # Hash the password and insert user
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, name, dept, year) VALUES (?, ?, ?, ?, ?)",
            (username, password_hash, name, dept, year)
        )
        db.commit()
        return jsonify({"success": True, "message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password_hash'], password):
            # Login successful
            profile = {
                "name": user['name'],
                "dept": user['dept'],
                "year": user['year']
            }
            return jsonify({"success": True, "profile": profile})
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Check if it's a FormData request (for images) or a JSON request
        if request.form:
            user_message = request.form.get("message", "")
            image_file = request.files.get("image")
            profile_str = request.form.get("profile", "{}")
            history_str = request.form.get("history", "[]") # PHASE 7: Get history
        elif request.json:
            user_message = request.json.get("message", "")
            image_file = None
            profile_str = json.dumps(request.json.get("profile", {}))
            history_str = json.dumps(request.json.get("history", []))
        else:
            user_message = "Hello"
            image_file = None
            profile_str = "{}"
            history_str = "[]"
        
        # Parse Data
        profile = json.loads(profile_str)
        history = json.loads(history_str)
        
        name = profile.get("name", "Student")
        dept = profile.get("dept", "General")
        year = profile.get("year", "1")

        print(f"Personalizing for: {name} ({dept}) | Msg: {user_message}")

        # --- PHASE 7: BUILD PERSONALIZED PROMPT WITH MEMORY ---
               # --- NEW OPTIMIZED INSTRUCTIONS (SLEEK & ATTRACTIVE) ---
        smart_system_instruction = f"""
You are 'DBU AI', a premium academic navigator for Debre Berhan University.

USER CONTEXT: Name: {name} | Major: {dept} | Year: {year}.

STRICT GUIDELINES:
1. RESPONSE STYLE: Use professional, encouraging, and clear language.
2. PERSONALIZATION: Address {name} naturally. If they ask about courses, relate it to {dept}.
3. FORMATTING: Use Markdown (e.g., # for headers, - for bullets, ** for emphasis).
4. UNIVERSITY DATA: Use the provided DBU_KNOWLEDGE block to answer facts accurately.
"""


        # Start prompt with instructions
        prompt_content = [smart_system_instruction]

        # Add Memory (Last few messages)
        for msg in history:
            role_label = "ASSISTANT" if msg['role'] == "assistant" else "USER"
            prompt_content.append(f"{role_label}: {msg['content']}")
            
        # Add Current Question
        prompt_content.append(f"CURRENT USER QUESTION: {user_message}")

        # Image Handling
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