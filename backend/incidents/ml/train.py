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

# Remove header duplicates
df = df[df["category"] != "category"]

# Drop empty rows
df = df.dropna(subset=["incident", "category", "emergency"])

# ===============================
# Text cleaning
# ===============================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


df["clean_incident"] = df["incident"].apply(clean_text)

X = df["clean_incident"]
y_category = df["category"]
y_emergency = df["emergency"]


print("\nCategory distribution:")
print(y_category.value_counts())

print("\nEmergency distribution:")
print(y_emergency.value_counts())

# ===============================
# Train test split
# ===============================
X_train, X_test, y_train_cat, y_test_cat = train_test_split(
    X,
    y_category,
    test_size=0.2,
    random_state=42,
    stratify=y_category
)

# Emergency split
X_train_e, X_test_e, y_train_em, y_test_em = train_test_split(
    X,
    y_emergency,
    test_size=0.2,
    random_state=42,
    stratify=y_emergency
)

# ===============================
# Vectorizer
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

X_train_vec_e = vectorizer.transform(X_train_e)
X_test_vec_e = vectorizer.transform(X_test_e)

# ===============================
# CATEGORY MODEL
# ===============================
category_model = MultinomialNB(alpha=0.2)

category_model.fit(X_train_vec, y_train_cat)

y_pred = category_model.predict(X_test_vec)

print("\n📊 Category Model Evaluation")
print("Accuracy:", accuracy_score(y_test_cat, y_pred))
print(classification_report(y_test_cat, y_pred))


# ===============================
# EMERGENCY MODEL
# ===============================
emergency_model = MultinomialNB()

emergency_model.fit(X_train_vec_e, y_train_em)

y_pred_em = emergency_model.predict(X_test_vec_e)

print("\n🚨 Emergency Model Evaluation")
print("Accuracy:", accuracy_score(y_test_em, y_pred_em))
print(classification_report(y_test_em, y_pred_em))


# ===============================
# Save models
# ===============================
pickle.dump(category_model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))
pickle.dump(emergency_model, open("emergency_model.pkl", "wb"))

print("\n✅ Models trained and saved successfully")

