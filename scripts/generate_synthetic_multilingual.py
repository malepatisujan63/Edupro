# -*- coding: utf-8 -*-
import json
import random
import os

LANGUAGES = [
    "English", "Hindi", "Telugu", "Tamil", "Malayalam", 
    "Kannada", "Marathi", "Bengali", "Gujarati", "Punjabi", 
    "Odia", "Urdu"
]
ROWS_PER_LANGUAGE = 100000

# Load the massive profanity dictionary we just compiled
PROFANITY_DICT = {}
try:
    with open(os.path.join("datasets", "profanity_dict.json"), "r", encoding="utf-8") as f:
        PROFANITY_DICT = json.load(f)
except FileNotFoundError:
    print("Warning: profanity_dict.json not found. Run fetch_profanity_dictionaries.py first.")

# Base Lexicons (Simplified representation for generation)
TOXIC_TEMPLATES = [
    {
        "category": "Threat", "intent": "threaten", "severity": "critical",
        "templates": {
            "English": ["i will kill you tomorrow", "i am going to blow up the school", "i will destroy you"],
            "Hindi": ["kal main tujhe jaan se maar dunga", "main school uda dunga", "tera game baja dunga"],
            "Telugu": ["ninnu champestha", "school pelchesta", "ne anthu chustha"],
            "Tamil": ["naan unnai kolven", "school ai vedika veppen", "unnai azhithu viduven"],
            "Malayalam": ["njan ninne kollum", "school pottikum", "ninne njan theerkum"],
            "Kannada": ["naanu ninna kolluthene", "school blast madtini", "ninna mukkaisi bitre"],
            "Marathi": ["me tula marun takel", "school udvun takel", "tuzi vaat lavel"],
            "Bengali": ["ami toke mere felbo", "school uriye debo", "tor khobor ache"],
            "Gujarati": ["hu tane mari nakhish", "school fodi nakhish", "tari vaat lagaidish"],
            "Punjabi": ["main tenu maar daanga", "school uda daanga", "tera kam tamam kar daanga"],
            "Odia": ["mu tumaku mari debi", "school boma pakaibi", "tumaku nast karidebi"],
            "Urdu": ["main tumhe jaan se maar dunga", "main school uda dunga", "tumhara khatma kar dunga"]
        }
    },
    {
        "category": "Self Harm", "intent": "suicide", "severity": "critical",
        "templates": {
            "English": ["i want to end it all", "i'm going to commit suicide tonight"],
            "Hindi": ["mujhe marne ka man kar raha hai", "main khudkushi kar lunga"],
            "Telugu": ["nenu ivala suicide cheskunta", "naaku brathakalani ledu"],
            "Tamil": ["ellarkum bye naan sethudren", "naan tharkolai seiya poren"],
            "Malayalam": ["enikku marikkanam", "njan aathmahathya cheyum"],
            "Kannada": ["naanu saybeku annistide", "suicide madkothini"],
            "Marathi": ["mala maravas vatatoy", "me aatmahatya karnar"],
            "Bengali": ["amar morte icche korche", "ami attohotta korbo"],
            "Gujarati": ["mare mari javu che", "hu aapghat karish"],
            "Punjabi": ["mera maran nu jee karda", "main khudkushi kar langa"],
            "Odia": ["mote mariba pain iccha heuchi", "mu atmahatya karibi"],
            "Urdu": ["mera marne ka dil kar raha hai", "main khudkushi kar loonga"]
        }
    },
    {
        "category": "Friendly", "intent": "greeting", "severity": "safe",
        "templates": {
            "English": ["good morning sir", "can you help me with homework?", "hello bro"],
            "Hindi": ["namaste sir", "kya tum homework mein madad karoge?", "kya haal hai"],
            "Telugu": ["namaskaram sir", "homework ki help chesthava?", "ela unnav"],
            "Tamil": ["vanakkam sir", "homework panna help pannuviya?", "eppadi irukka"],
            "Malayalam": ["namaskaram sir", "homework cheyan sahayikamo?", "enthu und vishesham"],
            "Kannada": ["namaskara sir", "homework ge help madtya?", "hegidiya"],
            "Marathi": ["namaskar sir", "homework sathi madat karshil ka?", "kasa aahes"],
            "Bengali": ["nomoskar sir", "homework a shahajjo korbe?", "kemon acho"],
            "Gujarati": ["namaste sir", "homework ma madad karish?", "kem cho"],
            "Punjabi": ["sat sri akal sir", "homework ch madad karenga?", "ki haal chal"],
            "Odia": ["namaskar sir", "homework re sahajya kariba ki?", "kemiti acha"],
            "Urdu": ["adaab sir", "kya tum homework mein madad karoge?", "kya haal hai"]
        }
    },
    {
        "category": "Harassment", "intent": "mockery", "severity": "medium",
        "templates": {
            "English": ["you are a complete idiot", "tu ek number ka chutiya hai", "nobody likes you"],
            "Hindi": ["tu ek number ka pagal hai", "tujhe koi pasand nahi karta", "tu bewaqoof hai"],
            "Telugu": ["nuvvu pedda waste gadivi", "ninne evaru ishtapadaru", "burra thakkuva vaada"],
            "Tamil": ["loosu payale shut up", "unnai yaarukkum pidikkathu", "mutta payale"],
            "Malayalam": ["nee oru pottan aanu", "ninne aarkum ishtamalla", "thallipoli"],
            "Kannada": ["neenu dodda dadda", "ninna yaru ishta padalla", "loos nan magane"],
            "Marathi": ["tu ek number cha murkh aahes", "tula koni pasand karat nahi", "vedya"],
            "Bengali": ["tui ekta boka", "toke keu pochondo kore na", "gadha"],
            "Gujarati": ["tu ek number no pagal che", "tane koi pasand nathi kartu", "gando"],
            "Punjabi": ["tu ek number da pagal hai", "tenu koi pasand nahi karda", "bewaqoof"],
            "Odia": ["tume eka number ra boka", "tumaku kehi pasanda karanti nahi", "pagala"],
            "Urdu": ["tum ek number ke pagal ho", "tumhe koi pasand nahi karta", "bewaqoof"]
        }
    }
]

def map_severity_to_action(severity):
    if severity == "critical":
        return "DELETE"
    elif severity in ["high", "medium"]:
        return "SUSPEND"
    else:
        return "ALLOW"

def main():
    print(f"Generating Multilingual Datasets for {len(LANGUAGES)} languages...")
    print(f"Goal: {ROWS_PER_LANGUAGE} rows per language (Total: {len(LANGUAGES) * ROWS_PER_LANGUAGE} rows)")
    
    for lang in LANGUAGES:
        dataset = []
        
        # Extract profanity for this specific language (fallback to english if missing)
        lang_key = lang.lower()
        bad_words = PROFANITY_DICT.get(lang_key, PROFANITY_DICT.get("english", ["fuck", "bitch"]))
        
        for i in range(ROWS_PER_LANGUAGE):
            # 20% chance to generate an extreme sexual/profanity edge case using the massive dictionary
            if random.random() < 0.2:
                bad_word = random.choice(bad_words)
                # Various sentence structures injecting the bad word
                structures = [
                    f"you are a {bad_word}",
                    f"shut up {bad_word}",
                    f"what a {bad_word}",
                    f"{bad_word}",
                    f"i will {bad_word} you",
                    f"go to hell {bad_word}",
                    f"you absolute {bad_word}"
                ]
                final_text = random.choice(structures)
                dataset.append({
                    "text": final_text,
                    "severity": "critical",
                    "action": "DELETE",
                    "language": lang
                })
                continue
            
            # Pick a random template category for the remaining 80%
            t = random.choice(TOXIC_TEMPLATES)
            
            # Pick a phrase from that language's specific dictionary
            try:
                phrase = random.choice(t["templates"][lang])
            except KeyError:
                # Fallback to English if not defined
                phrase = random.choice(t["templates"]["English"])
            
            # Add some noise/randomization to make the data more robust
            noise = random.choice(["", ".", "!", "?", " bro", " yaar", " da", " re", " lmaoo"])
            final_text = (phrase + noise).strip().lower()
            
            dataset.append({
                "text": final_text,
                "severity": t["severity"],
                "action": map_severity_to_action(t["severity"]),
                "language": lang
            })
        
        file_path = os.path.join("datasets", f"dataset_{lang.lower()}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, ensure_ascii=False)
        
        print(f"Saved {ROWS_PER_LANGUAGE} rows to {file_path}")

if __name__ == "__main__":
    main()
