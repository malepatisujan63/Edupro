# -*- coding: utf-8 -*-
import json
import pandas as pd
import numpy as np
import time
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline

# ====================================================
# NEURAL NETWORK TRAINING PIPELINE
# Trains a semantic ML model to classify chat intent
# ====================================================

DATASET_PATH = "synthetic_training_dataset.json"
MODEL_OUTPUT_PATH = "moderation_model.pkl"

def map_severity_to_action(severity):
    if severity == "critical":
        return "DELETE"
    elif severity in ["high", "medium"]:
        return "SUSPEND"
    else:
        return "ALLOW"

def main():
    print("Loading Dataset...")
    try:
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: {DATASET_PATH} not found. Please run generate_synthetic_data.py first.")
        return

    # Convert to DataFrame
    df = pd.DataFrame(data)
    print(f"Loaded {len(df)} rows.")

    # Prepare Labels (We are training it to predict the ACTION: ALLOW, SUSPEND, DELETE)
    df['action'] = df['severity'].apply(map_severity_to_action)
    
    # Prepare Features (Text)
    X = df['text']
    y = df['action']

    print("Splitting data into Training (80%) and Testing (20%)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Building Neural Network Pipeline...")
    # Pipeline: 
    # 1. TfidfVectorizer: Converts multi-lingual text and slang into mathematical vectors (ignoring raw words, focusing on frequency/importance)
    # 2. MLPClassifier: Multi-Layer Perceptron Neural Network to learn the complex patterns
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
        ('nn', MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=5, verbose=True, random_state=42))
    ])

    print("Training Neural Network (this may take a few moments)...")
    start_time = time.time()
    pipeline.fit(X_train, y_train)
    end_time = time.time()
    
    print(f"Training Complete in {end_time - start_time:.2f} seconds!")

    print("Evaluating Model on Test Data...")
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print("\n================ EVALUATION RESULTS ================")
    print(f"Accuracy: {acc * 100:.2f}%")
    print("\nDetailed Report:")
    print(classification_report(y_test, y_pred))
    print("====================================================\n")

    print(f"Saving trained model to {MODEL_OUTPUT_PATH}...")
    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    print("Done! Your Neural Network is now ready to use.")

    # Quick interactive test loop
    print("\nLive Test (type 'exit' to quit):")
    test_phrases = [
        "does anyone have the physics notes?",
        "tu ek number ka pagal hai",
        "i will kill you tomorrow",
        "free crypto bitcoin click here"
    ]
    for phrase in test_phrases:
        prediction = pipeline.predict([phrase])[0]
        print(f"Phrase: '{phrase}' -> Action: {prediction}")

if __name__ == "__main__":
    main()
