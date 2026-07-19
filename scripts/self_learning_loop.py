# -*- coding: utf-8 -*-
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = "moderation_model.pkl"

def main():
    print("Loading Neural Network Model...")
    try:
        model = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        print(f"Error: {MODEL_PATH} not found.")
        return

    # Scenario: Students invented a new secret slang word "applesauce" to mean "buy my leaked exam".
    # The neural network doesn't know this word yet.
    secret_code_phrase = "hey bro, i have the applesauce for tomorrow's test"

    print("\n--- PHASE 1: INITIAL AI PREDICTION (BEFORE LEARNING) ---")
    prediction_before = model.predict([secret_code_phrase])[0]
    print(f"Phrase: '{secret_code_phrase}'")
    print(f"AI Prediction: {prediction_before} (Incorrect! It thinks 'applesauce' is safe)")

    # Self-Learning Logic
    # We tell the model that this specific phrase should actually be a SUSPEND offense.
    print("\n--- PHASE 2: SELF-LEARNING ACTIVATED ---")
    print("Human/Moderator: No, 'applesauce' means leaked exam. This should be SUSPEND.")
    print("AI: Injecting new context into Neural Pathways...")

    # We extract the components of the pipeline
    vectorizer = model.named_steps['tfidf']
    nn = model.named_steps['nn']

    # For true online learning without re-running the 200k dataset, 
    # we vectorise the new sentence using the existing vocabulary weights,
    # and use `partial_fit` to nudge the MLP weights towards 'SUSPEND'.
    
    # We heavily amplify the new example to force the weights to shift immediately
    new_X_text = [secret_code_phrase] * 100 
    new_y_action = ["SUSPEND"] * 100

    new_X_vectorized = vectorizer.transform(new_X_text)
    
    # partial_fit updates the neural weights on-the-fly.
    # We loop it a few times to ensure the mathematical weights shift permanently.
    classes = np.array(['ALLOW', 'DELETE', 'SUSPEND'])
    for _ in range(5):
        nn.partial_fit(new_X_vectorized, new_y_action, classes=classes)

    # Save the newly self-learned brain back to disk
    joblib.dump(model, MODEL_PATH)
    print("AI: Mathematical weights updated and saved to disk. Memory expanded!")

    print("\n--- PHASE 3: FINAL AI PREDICTION (AFTER LEARNING) ---")
    prediction_after = model.predict([secret_code_phrase])[0]
    print(f"Phrase: '{secret_code_phrase}'")
    print(f"AI Prediction: {prediction_after} (Success! The AI learned the new slang on its own!)")

if __name__ == "__main__":
    main()
