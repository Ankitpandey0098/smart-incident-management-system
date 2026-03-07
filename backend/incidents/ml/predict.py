import os
import pickle
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
vectorizer = None

# ===============================
# Load ML model & vectorizer
# ===============================
try:
    with open(os.path.join(BASE_DIR, "model.pkl"), "rb") as f:
        model = pickle.load(f)

    with open(os.path.join(BASE_DIR, "vectorizer.pkl"), "rb") as f:
        vectorizer = pickle.load(f)

except Exception as e:
    print("⚠️ ML model load failed:", e)


# ===============================
# Keyword safety net (Civic specific)
# ===============================
KEYWORD_RULES = {
    "Drainage Issue": [
        "drain", "sewage", "water logging", "waterlogged", "blocked drain", "naali"
    ],
    "Illegal Dumping": [
        "garbage", "waste", "dump", "trash", "plastic", "burning waste"
    ],
    "Deforestation": [
        "tree cut", "cutting trees", "forest", "wood", "logging"
    ],
    "Pollution": [
        "smoke", "pollution", "air quality", "chemical", "toxic"
    ],
    "Road Damage": [
        "pothole", "road damage", "broken road", "street damaged"
    ],
    "Public Health Hazard": [
        "mosquito", "disease", "health risk", "dirty water"
    ],
    "Animal Injury": [
        "injured animal", "dead animal", "cow injured", "dog injured"
    ],
}


# ===============================
# Text cleaning (MATCH training)
# ===============================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ===============================
# Keyword detection
# ===============================
def keyword_match(text):
    for category, keywords in KEYWORD_RULES.items():
        for kw in keywords:
            if kw in text:
                return category
    return None


# ===============================
# Prediction function
# ===============================
def predict_category(text):
    if not text or model is None or vectorizer is None:
        return {
            "category": None,
            "confidence": 0.0
        }

    cleaned_text = clean_text(text)

    # ---------- ML Prediction ----------
    X = vectorizer.transform([cleaned_text])
    probs = model.predict_proba(X)[0]

    ml_confidence = float(probs.max())
    ml_category = model.classes_[probs.argmax()]

    # ---------- Keyword Rule ----------
    rule_category = keyword_match(cleaned_text)

    # ---------- Decision Logic ----------
    if rule_category:
        # Boost confidence if keyword matches ML
        if rule_category == ml_category:
            confidence = min(ml_confidence + 0.15, 1.0)
        else:
            confidence = max(ml_confidence, 0.65)

        final_category = rule_category

    else:
        final_category = ml_category
        confidence = ml_confidence

    confidence = round(confidence, 3)

    # ---------- Low Confidence Fallback ----------
    if confidence < 0.35:
        return {
            "category": None,
            "confidence": confidence
        }

    return {
        "category": final_category,
        "confidence": confidence
    }
