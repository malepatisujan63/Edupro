# -*- coding: utf-8 -*-
import json
import random
import uuid
import os
import io

# ==========================================
# EXTRAORDINARY MULTILINGUAL DATA GENERATOR
# ==========================================
# This script uses permutation logic and randomized injection
# to programmatically generate hundreds of thousands (lakhs)
# of high-quality synthetic data points for Neural Network training.

OUTPUT_FILE = "synthetic_training_dataset.json"
TARGET_ROWS = 500000  # 5 Lakhs

# Base Lexicons
LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Code-Mixed"]
AGE_GROUPS = ["child", "teen", "adult"]
LENGTHS = ["short", "medium", "long"]
EMOJIS_TOXIC = ["😡", "🤬", "💀", "🔪", "🩸", "🖕"]
EMOJIS_SAFE = ["🙏", "😂", "📚", "✨", "👍", "💯"]

# Toxic Templates (Suspension/Deletion triggers)
TOXIC_TEMPLATES = [
    {
        "category": "Harassment", "subcategory": "Bullying", "intent": "insult",
        "severity": "high", "toxicity_score": "0.90", "profanity": True,
        "templates": [
            ("you are a complete {insult}", "tu ek number ka {insult_hi} hai"),
            ("why are you so {insult} bro", "nuvvu antha {insult_te} entra"),
            ("shut up you {insult}", "moodra {insult_ta}")
        ]
    },
    {
        "category": "Threat", "subcategory": "Violence", "intent": "threaten",
        "severity": "critical", "toxicity_score": "0.98", "profanity": False,
        "templates": [
            ("i will {violence} you tomorrow", "kal main tujhe {violence_hi}"),
            ("don't come to college or I'll {violence} you", "college ki raku, ninnu {violence_te}"),
            ("i swear i will {violence} you", "naan unnai {violence_ta} da"),
            ("i am going to blow up the school", "main school uda dunga"),
            ("i will bring a bomb to class", "class lo bomb pedatha")
        ]
    },
    {
        "category": "Threat", "subcategory": "Self Harm", "intent": "suicide",
        "severity": "critical", "toxicity_score": "0.99", "profanity": False,
        "templates": [
            ("i want to end it all", "mujhe marne ka man kar raha hai"),
            ("i'm going to commit suicide tonight", "nenu ivala suicide cheskunta"),
            ("goodbye forever everyone", "ellarkum bye naan sethudren")
        ]
    },
    {
        "category": "Harassment", "subcategory": "Bullying", "intent": "mockery",
        "severity": "medium", "toxicity_score": "0.80", "profanity": False,
        "templates": [
            ("nobody even likes you", "tujhe koi pasand nahi karta"),
            ("you're so ugly it hurts", "nuvvu chala worst ga unnav"),
            ("just drop out already", "college vitu po da")
        ]
    },
    {
        "category": "Spam", "subcategory": "Scam", "intent": "phishing",
        "severity": "medium", "toxicity_score": "0.40", "profanity": False,
        "templates": [
            ("click this link for free {crypto}", "free {crypto} ke liye link dabao"),
            ("send me {money} and I will do your assignment", "naaku {money} pampu, nenu rastha"),
            ("win a free {crypto} gift card now", "free gift card venum na click pannu")
        ]
    }
]

# Safe Templates (Educational, Casual)
SAFE_TEMPLATES = [
    {
        "category": "Educational", "subcategory": "College", "intent": "question",
        "severity": "none", "toxicity_score": "0.01", "profanity": False,
        "templates": [
            ("can someone help me with {subject}?", "koi {subject_hi} me help karega?"),
            ("does anyone have notes for {subject}?", "{subject_te} notes unnaya?"),
            ("i have an exam on {subject} tomorrow", "nale {subject_ml} exam und")
        ]
    },
    {
        "category": "Casual Chat", "subcategory": "Greeting", "intent": "greeting",
        "severity": "none", "toxicity_score": "0.00", "profanity": False,
        "templates": [
            ("hey bro what's up", "kya haal hai bhai"),
            ("hello everyone", "andhariki namaskaram"),
            ("good morning guys", "kaalai vanakkam")
        ]
    }
]

# Fillers / Variables
VARS = {
    "insult": ["idiot", "loser", "moron", "trash", "garbage"],
    "insult_hi": ["chutiya", "gawar", "pagal", "bewakoof"],
    "insult_te": ["vedhava", "sannasi", "pichoda"],
    "insult_ta": ["muttaal", "loosu"],
    
    "violence": ["kill", "destroy", "beat", "stab", "hurt"],
    "violence_hi": ["maar dunga", "khatam kar dunga", "peetunga"],
    "violence_te": ["champestha", "kottesta", "narikestha"],
    "violence_ta": ["konruven", "adichiruven"],
    
    "subject": ["calculus", "data structures", "physics", "machine learning"],
    "subject_hi": ["maths", "science", "programming"],
    "subject_te": ["exams", "labs", "records"],
    "subject_ml": ["exam", "assignment"],
    
    "crypto": ["bitcoin", "ethereum", "money", "iphone", "giveaway"],
    "money": ["500 rupees", "1000rs", "$50", "2000 inr"]
}

def inject_noise(text):
    """Simulates realistic typos, abbreviation, and slang variations."""
    noise_level = random.random()
    if noise_level > 0.8:
        # Simulate missing punctuation & capitalization
        text = text.lower().replace("?", "").replace("!", "").replace(",", "")
    elif noise_level > 0.6:
        # Simulate internet abbreviations
        text = text.replace("you", "u").replace("are", "r").replace("tomorrow", "tmrw").replace("brother", "bro")
    elif noise_level > 0.4:
        # Add repeated letters for emphasis
        if "!" in text: text = text.replace("!", "!!!!")
        text = text.replace("kill", "killlll").replace("bro", "broooo")
    return text

def generate_record():
    is_toxic = random.choice([True, False])
    source = random.choice(TOXIC_TEMPLATES) if is_toxic else random.choice(SAFE_TEMPLATES)
    
    lang_idx = random.randint(0, 1) # 0 for English, 1 for Native Transliteration
    template_pair = random.choice(source["templates"])
    raw_text = template_pair[lang_idx]
    
    # Resolve variables
    for key, values in VARS.items():
        placeholder = "{" + key + "}"
        if placeholder in raw_text:
            raw_text = raw_text.replace(placeholder, random.choice(values))
            
    # Inject noise and emojis
    raw_text = inject_noise(raw_text)
    contains_emoji = random.random() > 0.5
    if contains_emoji:
        emoji_set = EMOJIS_TOXIC if is_toxic else EMOJIS_SAFE
        raw_text += " " + "".join([random.choice(emoji_set) for _ in range(random.randint(1, 3))])
        
    return {
        "id": "gen_" + uuid.uuid4().hex[:8],
        "text": raw_text,
        "language": random.choice(LANGUAGES),
        "script": "Latin", # Currently generating transliterated forms
        "transliteration": raw_text,
        "category": source["category"],
        "subcategory": source["subcategory"],
        "intent": source["intent"],
        "severity": source["severity"],
        "emotion": "varied",
        "toxicity_score": str(float(source["toxicity_score"]) + random.uniform(-0.05, 0.05))[:4],
        "contains_profanity": source["profanity"],
        "contains_threat": "violence" in raw_text or "kill" in raw_text or "champestha" in raw_text,
        "contains_harassment": source["category"] == "Harassment",
        "contains_personal_info": False,
        "contains_url": "link" in raw_text or "http" in raw_text,
        "contains_phone": False,
        "contains_email": False,
        "contains_money": "rs" in raw_text or "rupees" in raw_text or "$" in raw_text,
        "contains_emoji": contains_emoji,
        "contains_code_mix": lang_idx == 1,
        "age_group": random.choice(AGE_GROUPS),
        "length": random.choice(LENGTHS)
    }

def main():
    print("Generating " + str(TARGET_ROWS) + " high-quality synthetic rows...")
    dataset = []
    
    for i in range(TARGET_ROWS):
        if i > 0 and i % 10000 == 0:
            print("Generated " + str(i) + " rows...")
        dataset.append(generate_record())
        
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(dataset, f, indent=2)
        
    print("SUCCESS: Saved " + str(TARGET_ROWS) + " rows to " + OUTPUT_FILE + "!")

if __name__ == "__main__":
    main()
