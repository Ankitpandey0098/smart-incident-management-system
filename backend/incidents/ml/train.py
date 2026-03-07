import pandas as pd
import pickle
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# ===============================
# Load dataset
# ===============================
df = pd.read_csv("dataset/incidents.csv")

# Remove accidental header rows if present
df = df[df["category"] != "category"]

# Drop empty rows just in case
df = df.dropna(subset=["incident", "category"])

# ===============================
# Text cleaning (improved)
# ===============================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)   # remove URLs
    text = re.sub(r"[^a-z\s]", " ", text)         # keep only letters
    text = re.sub(r"\s+", " ", text).strip()      # remove extra spaces
    return text

df["clean_incident"] = df["incident"].apply(clean_text)

X = df["clean_incident"]
y = df["category"]


print("\nCategory distribution:")
print(y.value_counts())

# ===============================
# Train–test split (VERY IMPORTANT)
# ===============================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ===============================
# TF-IDF Vectorizer (optimized)
# ===============================
vectorizer = TfidfVectorizer(
    stop_words="english",
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.9,
    sublinear_tf=True
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ===============================
# Naive Bayes model
# ===============================
model = MultinomialNB(alpha=0.2)

model.fit(X_train_vec, y_train)

# ===============================
# Evaluation (for YOU, not frontend)
# ===============================
y_pred = model.predict(X_test_vec)

print("\n📊 Model Evaluation")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# ===============================
# Save model & vectorizer
# ===============================
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("\n✅ ML model trained and saved successfully")
