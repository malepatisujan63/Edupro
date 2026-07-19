# -*- coding: utf-8 -*-
import os
import joblib
import time
import concurrent.futures

LANGUAGES = [
    "english", "hindi", "telugu", "tamil", "malayalam", 
    "kannada", "marathi", "bengali", "gujarati", "punjabi", 
    "odia", "urdu"
]

# The "Goated" Testing Suite: Extremely tough edge cases combining multiple intents
EDGE_CASES = {
    "english": [
        "can we study together?", # ALLOW
        "i have the exam answers send $100", # SUSPEND
        "i'm going to blow up the school" # DELETE
    ],
    "hindi": [
        "kya hum kal padhai karein?", # ALLOW
        "free crypto jeetne ke liye link pe click karo", # SUSPEND
        "main school uda dunga" # DELETE
    ],
    "telugu": [
        "repu exam ki chadhuvuthunava?", # ALLOW
        "homework chesi pedatha money pampu", # SUSPEND
        "ninnu champestha" # DELETE
    ],
    "tamil": [
        "naalai exam eppadi ezhuthiruka?", # ALLOW
        "unna pakkave sagikkala po da", # SUSPEND
        "naan tharkolai seiya poren" # DELETE
    ],
    "malayalam": [
        "padikkan sahayikamo?", # ALLOW
        "nee oru pottan aanu", # SUSPEND
        "njan ninne kollum" # DELETE
    ],
    "kannada": [
        "nanage help madtya?", # ALLOW
        "neenu dodda dadda", # SUSPEND
        "suicide madkothini" # DELETE
    ],
    "marathi": [
        "mala madat karshil ka?", # ALLOW
        "tu ek number cha murkh aahes", # SUSPEND
        "school udvun takel" # DELETE
    ],
    "bengali": [
        "tumi ki ektu help korbe?", # ALLOW
        "tui ekta boka", # SUSPEND
        "ami toke mere felbo" # DELETE
    ],
    "gujarati": [
        "shu tu mane madad karish?", # ALLOW
        "tu ek number no pagal che", # SUSPEND
        "hu tane mari nakhish" # DELETE
    ],
    "punjabi": [
        "ki tu meri madad karenga?", # ALLOW
        "tu ek number da pagal hai", # SUSPEND
        "main tenu maar daanga" # DELETE
    ],
    "odia": [
        "tume sahajya kariba ki?", # ALLOW
        "tume eka number ra boka", # SUSPEND
        "mu tumaku mari debi" # DELETE
    ],
    "urdu": [
        "kya tum meri madad karoge?", # ALLOW
        "tum ek number ke pagal ho", # SUSPEND
        "main tumhe jaan se maar dunga" # DELETE
    ]
}

def test_language_model(lang):
    """
    Tests a specific language model. Runs in parallel.
    """
    model_path = os.path.join("models", f"model_{lang}.pkl")
    
    try:
        model = joblib.load(model_path)
    except FileNotFoundError:
        return f"[{lang.upper()}] ERROR: Model not found. Please train models first."

    cases = EDGE_CASES[lang]
    results = [f"\n--- {lang.upper()} GOATED TEST SUITE ---"]
    
    passed_all = True
    
    for case in cases:
        prediction = model.predict([case])[0]
        prob = max(model.predict_proba([case])[0]) * 100
        results.append(f"[{prediction}] ({prob:.1f}% conf) -> '{case}'")
        
        # Simple sanity check logic to verify the model didn't predict ALLOW for a threat
        if "kill" in case or "uda dunga" in case or "champestha" in case or "suicide" in case or "tharkolai" in case or "kollum" in case or "mere felbo" in case or "mari nakhish" in case or "maar daanga" in case or "mari debi" in case or "jaan se maar" in case or "marne" in case or "blow up" in case or "suicide" in case:
            if prediction != "DELETE":
                passed_all = False
                results.append(f"    WARNING: AI FAILED TO DETECT CRITICAL THREAT!")

    results.append(f"[{lang.upper()}] STATUS: {'PASSED GOATED STATUS' if passed_all else 'FAILED'}")
    return "\n".join(results)


def main():
    print("=========================================================")
    print("       INITIALIZING GOATED PARALLEL TESTING SUITE        ")
    print("   Bombarding 12 Neural Networks across CPU cores...     ")
    print("=========================================================\n")
    
    start_time = time.time()
    
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = executor.map(test_language_model, LANGUAGES)
        
        for res in results:
            print(res)

    total_time = time.time() - start_time
    print("\n=========================================================")
    print(f" ALL 12 NEURAL NETWORKS TESTED IN PARALLEL: {total_time:.2f}s")
    print("=========================================================")

if __name__ == "__main__":
    main()
