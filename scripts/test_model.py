# -*- coding: utf-8 -*-
import joblib

MODEL_PATH = "moderation_model.pkl"

def main():
    print("Loading Neural Network Model...")
    try:
        model = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        print(f"Error: {MODEL_PATH} not found. Train the model first.")
        return

    print("\n--- NEURAL NETWORK LIVE TEST ---")
    
    # Diverse edge cases and slang across languages
    test_cases = [
        # Benign / Educational
        "can you help me with calculus homework?",
        "kya hal hai bhai, kal exam hai",
        "good morning sir",
        
        # Scam / Spam
        "send me $500 for the leaked exam paper",
        "click this link for free iphone giveaway",
        
        # Harassment / Minor Toxicity
        "you are a complete idiot",
        "tu ek number ka chutiya hai",
        "loosu payale shut up",
        
        # Severe Threats / Deletion
        "i swear i will kill you",
        "ninnu champestha",
        "i am going to blow up the school",
        
        # Self Harm (New Extreme Edge Case)
        "mujhe marne ka man kar raha hai",
        "i want to end it all"
    ]

    for phrase in test_cases:
        # Predict the action
        prediction = model.predict([phrase])[0]
        
        # Predict the confidence probability
        probabilities = model.predict_proba([phrase])[0]
        max_prob = max(probabilities) * 100
        
        print(f"[{prediction}] (Confidence: {max_prob:.1f}%) -> '{phrase}'")

if __name__ == "__main__":
    main()
