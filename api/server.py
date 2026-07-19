from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException
import time

# Ensure consistent language detection
DetectorFactory.seed = 0

app = FastAPI(title="Edupro AI Moderation Server")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models into RAM
MODELS = {}
LANGUAGES = [
    "english", "hindi", "telugu", "tamil", "malayalam", 
    "kannada", "marathi", "bengali", "gujarati", "punjabi", 
    "odia", "urdu"
]

# Map ISO 639-1 language codes to our model names
LANG_MAP = {
    'en': 'english',
    'hi': 'hindi',
    'te': 'telugu',
    'ta': 'tamil',
    'ml': 'malayalam',
    'kn': 'kannada',
    'mr': 'marathi',
    'bn': 'bengali',
    'gu': 'gujarati',
    'pa': 'punjabi',
    'or': 'odia',
    'ur': 'urdu'
}

def load_models():
    print("Loading 12 Neural Networks into Memory...")
    start_time = time.time()
    # The API will run from the root directory 'd:/Edunetwork', so 'models/' is available
    base_path = os.path.join(os.path.dirname(__file__), "..", "models")
    for lang in LANGUAGES:
        model_path = os.path.join(base_path, f"model_{lang}.pkl")
        if os.path.exists(model_path):
            MODELS[lang] = joblib.load(model_path)
            print(f"Loaded: {lang}")
        else:
            print(f"WARNING: Model for {lang} not found at {model_path}")
    print(f"All models loaded in {time.time() - start_time:.2f}s")

# Load models on startup
load_models()

class MessagePayload(BaseModel):
    text: str

@app.post("/api/moderate")
def moderate_message(payload: MessagePayload):
    text = payload.text.strip()
    if not text:
        return {"action": "ALLOW", "confidence": 100.0, "language": "unknown"}

    # Detect Language
    try:
        lang_code = detect(text)
    except LangDetectException:
        lang_code = 'en' # Fallback to english if detection fails (e.g., numbers/emojis)

    # Route to specific model
    target_lang = LANG_MAP.get(lang_code, 'english') # Default to english for unsupported languages
    
    model = MODELS.get(target_lang)
    if not model:
        # Fallback to English model if the requested model failed to load
        model = MODELS.get('english')
    
    if not model:
        raise HTTPException(status_code=500, detail="Neural Network models not loaded.")

    # Run AI Inference
    prediction = model.predict([text])[0]
    confidence = max(model.predict_proba([text])[0]) * 100

    return {
        "action": prediction,
        "confidence": confidence,
        "language": target_lang
    }
