# -*- coding: utf-8 -*-
import json
import pandas as pd
import numpy as np
import time
import os
import joblib
import concurrent.futures
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline

# Suppress sklearn convergence warnings for clean output
import warnings
from sklearn.exceptions import ConvergenceWarning
warnings.filterwarnings("ignore", category=ConvergenceWarning)

LANGUAGES = [
    "english", "hindi", "telugu", "tamil", "malayalam", 
    "kannada", "marathi", "bengali", "gujarati", "punjabi", 
    "odia", "urdu"
]

def train_language_model(lang):
    """
    Trains a specialized Neural Network for a specific language.
    This function will be executed in parallel across CPU cores.
    """
    dataset_path = os.path.join("datasets", f"dataset_{lang}.json")
    model_output_path = os.path.join("models", f"model_{lang}.pkl")
    
    start_time = time.time()
    
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        return f"[{lang.upper()}] Error: {dataset_path} not found."

    df = pd.DataFrame(data)
    
    X = df['text']
    y = df['action']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 1. TF-IDF to vectorize text mathematically
    # 2. Multi-Layer Perceptron (Neural Network)
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=2000, ngram_range=(1, 2))),
        ('nn', MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=5, random_state=42))
    ])

    # Train the Model
    pipeline.fit(X_train, y_train)
    
    # Evaluate Accuracy
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred) * 100
    
    # Save the specialized Model
    joblib.dump(pipeline, model_output_path)
    
    duration = time.time() - start_time
    
    return f"[{lang.upper()}] Training Complete! | Rows: {len(df)} | Acc: {acc:.2f}% | Time: {duration:.2f}s"

def main():
    print("=====================================================")
    print("INITIALIZING MULTITHREADED AI TRAINING PIPELINE")
    print(f"Executing {len(LANGUAGES)} Neural Networks simultaneously across all CPU cores...")
    print("=====================================================\n")
    
    start_time = time.time()
    
    # Use ProcessPoolExecutor to truly utilize multiple CPU cores
    with concurrent.futures.ProcessPoolExecutor() as executor:
        # Submit all 12 language training jobs to the process pool simultaneously
        results = executor.map(train_language_model, LANGUAGES)
        
        # Print results as they finish
        for result in results:
            print(result)

    total_time = time.time() - start_time
    print(f"\nALL {len(LANGUAGES)} NEURAL NETWORKS SUCCESSFULLY TRAINED in {total_time:.2f} seconds!")
    print("Models saved in the 'models/' directory.")

if __name__ == "__main__":
    main()
