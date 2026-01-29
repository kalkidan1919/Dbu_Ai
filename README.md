# 🚀 DBU Intellect Navigator

A premium, full-stack AI assistant tailored for the **Debre Berhan University** community. Developed from scratch using modern web technologies and the Google Gemini AI engine.

---

## 🌟 Core Superpowers

- **🎓 DBU Specialist**: Expert knowledge of university departments, motto, staff, and campus life.
- **📷 Vision Engine**: Upload photos (campus buildings, notes, etc.) and let the AI analyze them.
- **🎤 Neural Voice**: Features real-time Speech-to-Text (Microphone) and Text-to-Speech responses.
- **📜 Intelligence History**: Sidebar tracking of your recent academic sessions.
- **✨ Elite UI**: A stunning glassmorphism interface using the official **DBU Blue (#2980B9)**.

---

## 🛠️ The Tech Stack

| Layer               | Technology                       |
| :------------------ | :------------------------------- |
| **Brain (Backend)** | Python, Flask, Google Gemini API |
| **Face (Frontend)** | React.js, Vite, Tailwind CSS v4  |
| **Vision**          | Gemini Pro Vision Pipeline       |
| **Voice**           | Web Speech API                   |

---

## 🚀 Installation & Setup

### 1. Backend (Python)

```bash
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install flask flask-cors python-dotenv google-generativeai
# Create a .env file and add: GEMINI_API_KEY=your_api_key_here
python app.py
```
