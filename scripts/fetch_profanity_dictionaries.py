# -*- coding: utf-8 -*-
import urllib.request
import json
import os
import ssl

# Bypass SSL verification for legacy systems
ssl._create_default_https_context = ssl._create_unverified_context

OUTPUT_FILE = os.path.join("datasets", "profanity_dict.json")

# We will fetch English and Hindi from the famous LDNOOBW repository
GITHUB_BASE_URL = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/"

# For other Indian languages where open-source repos are lacking, we compile an aggressive localized dictionary
# focusing on sexual harassment, extreme profanity, and regional slang.
REGIONAL_PROFANITY = {
    "telugu": [
        "lanja", "lathkor", "modda", "puku", "guddha", "howla", "vedhava", 
        "erripuka", "nee yamma", "dengu", "dengutha", "sulemakal", "kojja", 
        "munda", "ranku", "bokachoda", "poramboku", "pichakuntla"
    ],
    "tamil": [
        "koothi", "punda", "ommale", "baadu", "thevidiya", "mayire", 
        "poolu", "kundi", "suthi", "sunni", "vennai", "panni", "poramboke", 
        "tayoli", "echha", "tharkuri", "gommala", "soothu"
    ],
    "malayalam": [
        "myre", "pooru", "thayoli", "nayinte mone", "pundachi", "kunna", 
        "theetam", "kazhappu", "andi", "koothi", "pulaya", "polayadi",
        "thevidiya", "patti", "kazhuveri"
    ],
    "kannada": [
        "bolimaga", "sulemaga", "lowda", "gandu", "koothi", "bewarsi", 
        "hucha", "tullu", "kullu", "chutiya", "soole", "halka", "daridra",
        "keyso", "shata"
    ],
    "marathi": [
        "madarchod", "bhenchod", "chutiya", "gandu", "bhosadichya", 
        "zavdya", "bulli", "aizavadhya", "raand", "bhadkhau", "chinal",
        "lavdya", "halkat", "yedzavya"
    ],
    "bengali": [
        "bokachoda", "khankir chele", "bara", "bal", "magi", "gandu", 
        "suorer bacha", "banchod", "chudani", "haramjada", "besha", 
        "kuttar bacha", "shala", "shuyorer baccha"
    ],
    "gujarati": [
        "bhenchod", "madarchod", "gandu", "chutiya", "bhosdina", 
        "rand", "chodu", "loda", "bhadva", "chinal", "gandmara",
        "halkat", "luccha"
    ],
    "punjabi": [
        "bund", "lunn", "penchod", "kanjar", "kutiya", "gandu", 
        "bhenchod", "madarchod", "chutiya", "fuddu", "bhadwa", 
        "haramzada", "khasma nu khani"
    ],
    "odia": [
        "maghia", "banda", "bia", "choda", "gandi", "bokachoda", 
        "veshya", "kutta", "haramjada", "shala", "gandu"
    ],
    "urdu": [
        "madarchod", "bhenchod", "chutiya", "gandu", "bhosdike", 
        "randi", "haramzada", "kutta", "kamina", "twaif", 
        "dala", "lodu", "gashti"
    ]
}

def fetch_github_dict(lang_code):
    try:
        url = f"{GITHUB_BASE_URL}{lang_code}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        content = response.read().decode('utf-8')
        words = [w.strip() for w in content.split('\n') if w.strip()]
        print(f"[OK] Fetched {len(words)} words from GitHub for code '{lang_code}'")
        return words
    except Exception as e:
        print(f"[ERROR] Failed to fetch from GitHub for '{lang_code}': {e}")
        return []

def main():
    print("=====================================================")
    print("MASSIVE PROFANITY VOCABULARY EXPANSION TOOL")
    print("=====================================================\n")

    os.makedirs("datasets", exist_ok=True)
    master_dict = {}

    # Fetch global repositories
    print("Fetching English global dictionary...")
    eng_words = fetch_github_dict("en")
    master_dict["english"] = eng_words if eng_words else ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "faggot", "slut", "whore"]

    print("Fetching Hindi global dictionary...")
    hi_words = fetch_github_dict("hi")
    master_dict["hindi"] = hi_words if hi_words else ["madarchod", "bhenchod", "chutiya", "gandu", "bhosdike", "randi", "bhadwa", "loda", "chinal"]

    # Load regional dictionaries
    print("\nInjecting highly aggressive regional profanity/sexual slang...")
    for lang, words in REGIONAL_PROFANITY.items():
        master_dict[lang] = words
        print(f"[OK] Injected {len(words)} specialized sexual/bad words for {lang.upper()}")

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(master_dict, f, ensure_ascii=False, indent=4)

    total_words = sum(len(v) for v in master_dict.values())
    print(f"\nSuccessfully compiled a massive dictionary of {total_words} profanities across 12 languages!")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
