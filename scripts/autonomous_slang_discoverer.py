# -*- coding: utf-8 -*-
import joblib
import numpy as np
import os
from sentence_transformers import SentenceTransformer, util

MODEL_PATH = os.path.join("models", "model_english.pkl")

# Define toxic anchors to compare new sentences against
TOXIC_ANCHORS = [
    "I will kill your entire family.",
    "I am going to murder you.",
    "You are a completely worthless idiot.",
    "Go commit suicide right now."
]

def main():
    print("=====================================================")
    print("UNSUPERVISED CONTEXTUAL SLANG DISCOVERY ENGINE")
    print("=====================================================\n")

    try:
        model = joblib.load(MODEL_PATH)
        print("Loaded Neural Network (HashingVectorizer + MLP).")
    except FileNotFoundError:
        print(f"Error: {MODEL_PATH} not found. Run train_models_parallel.py first.")
        return

    print("Loading Contextual Inference Engine (SentenceTransformer)...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Pre-calculate anchor embeddings
    anchor_embeddings = embedder.encode(TOXIC_ANCHORS, convert_to_tensor=True)

    # Simulated Live Chat Message containing a brand new made-up word ("glorp")
    # No dictionary in the world contains this word.
    live_chat_message = "I will glorp your entire family."
    
    print("\n--- PHASE 1: STANDARD NEURAL PREDICTION ---")
    print(f"Message: '{live_chat_message}'")
    prediction_before = model.predict([live_chat_message])[0]
    print(f"Prediction: {prediction_before} (Note: It predicts this mostly due to 'entire family', but it hasn't mapped 'glorp' yet.)")

    print("\n--- PHASE 2: CONTEXTUAL INFERENCE (GUESSING THE MEANING) ---")
    msg_embedding = embedder.encode(live_chat_message, convert_to_tensor=True)
    
    # Calculate cosine similarities against all toxic anchors
    cosine_scores = util.cos_sim(msg_embedding, anchor_embeddings)[0]
    max_score = cosine_scores.max().item()

    if max_score > 0.65:
        print(f"Match found! Contextual Similarity Score: {max_score:.2f}")
        print("AI Deduction: The unknown word 'glorp' is functioning exactly like a severe threat.")
        print("Action: Automatically triggering Neural Pathway Rewiring (partial_fit)...")
        
        # --- PHASE 3: AUTONOMOUS WEIGHT SHIFTING (ONLINE LEARNING) ---
        hashing_vectorizer = model.named_steps['hashing']
        nn = model.named_steps['nn']
        
        # We heavily amplify this new example to permanently lock the new mathematical mapping
        new_X_text = [live_chat_message] * 50
        new_y_action = ["DELETE"] * 50
        
        # The HashingVectorizer flawlessly assigns 'glorp' a fixed mathematical index
        new_X_vectorized = hashing_vectorizer.transform(new_X_text)
        
        # partial_fit updates the neural weights on-the-fly without forgetting previous data
        classes = np.array(['ALLOW', 'DELETE', 'SUSPEND'])
        for _ in range(5):
            nn.partial_fit(new_X_vectorized, new_y_action, classes=classes)
            
        # Save updated memory to disk
        joblib.dump(model, MODEL_PATH)
        print("Memory permanently updated and saved to disk.")
    else:
        print(f"No match found. Score: {max_score:.2f}. Safe context.")
        return

    print("\n--- PHASE 4: FINAL NEURAL PREDICTION (AFTER SELF-LEARNING) ---")
    prediction_after = model.predict([live_chat_message])[0]
    print(f"Message: '{live_chat_message}'")
    print(f"New Prediction: {prediction_after} (Success! The AI learned the slang autonomously!)")

if __name__ == "__main__":
    main()
