import os
import pickle
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

category_model = None
vectorizer = None
emergency_model = None

# ===============================
# Load ML models
# ===============================
try:
    with open(os.path.join(BASE_DIR, "model.pkl"), "rb") as f:
        category_model = pickle.load(f)

    with open(os.path.join(BASE_DIR, "vectorizer.pkl"), "rb") as f:
        vectorizer = pickle.load(f)

    with open(os.path.join(BASE_DIR, "emergency_model.pkl"), "rb") as f:
        emergency_model = pickle.load(f)

except Exception as e:
    print("⚠️ ML model load failed:", e)


# ===============================
# Text cleaning
# ===============================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ===============================
# Prediction function
# ===============================
def predict_category(text):

    if not text or category_model is None or vectorizer is None:
        return {
            "category": None,
            "confidence": 0.0,
            "emergency": False
        }

    cleaned_text = clean_text(text)

    X = vectorizer.transform([cleaned_text])

    # -------- CATEGORY PREDICTION --------
    probs = category_model.predict_proba(X)[0]
    confidence = float(probs.max())
    category = category_model.classes_[probs.argmax()]

    # -------- EMERGENCY PREDICTION --------
    emergency = False

    if emergency_model:
        emergency = bool(emergency_model.predict(X)[0])

    confidence = round(confidence, 3)

    return {
        "category": category,
        "confidence": confidence,
        "emergency": emergency
    }
