# -*- coding: utf-8 -*-
import os
import json
import random
import nltk
from nltk.corpus import wordnet
from sentence_transformers import SentenceTransformer, util

print("Initializing Teacher Model (NLTK WordNet)...")
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

print("Initializing Judge Model (SentenceTransformer 'all-MiniLM-L6-v2')...")
# Fast, lightweight model for cosine similarity
judge_model = SentenceTransformer('all-MiniLM-L6-v2')

# Some basic seeds to start the learning loop
SEEDS = [
    "I am going to kill you tomorrow.",
    "You are a completely worthless idiot.",
    "I will blow up the entire school.",
    "Go commit suicide right now.",
    "I will destroy your life."
]

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for l in syn.lemmas():
            synonyms.add(l.name().replace("_", " "))
    if word in synonyms:
        synonyms.remove(word)
    return list(synonyms)

def synonym_replacement(sentence, n=2):
    words = sentence.split()
    new_words = words.copy()
    random_word_list = list(set([word for word in words if word.isalnum()]))
    random.shuffle(random_word_list)
    num_replaced = 0
    for random_word in random_word_list:
        synonyms = get_synonyms(random_word)
        if len(synonyms) >= 1:
            synonym = random.choice(synonyms)
            new_words = [synonym if word == random_word else word for word in new_words]
            num_replaced += 1
        if num_replaced >= n: 
            break
    return ' '.join(new_words)

def random_swap(sentence, n=1):
    words = sentence.split()
    if len(words) < 2: return sentence
    new_words = words.copy()
    for _ in range(n):
        idx1, idx2 = random.sample(range(len(new_words)), 2)
        new_words[idx1], new_words[idx2] = new_words[idx2], new_words[idx1]
    return ' '.join(new_words)

def autonomous_augmentation_loop(iterations=50):
    print("=======================================================")
    print("INITIATING AUTONOMOUS SELF-LEARNING AUGMENTATION LOOP")
    print("=======================================================\n")
    
    valid_augmentations = []
    
    for i in range(iterations):
        seed = random.choice(SEEDS)
        
        # Teacher generates a hallucination/mutation
        mutation_type = random.choice(["synonym", "swap", "both"])
        mutated_text = seed
        
        if mutation_type in ["synonym", "both"]:
            mutated_text = synonym_replacement(mutated_text, n=random.randint(1, 3))
        if mutation_type in ["swap", "both"]:
            mutated_text = random_swap(mutated_text, n=1)
            
        mutated_text = mutated_text.lower().strip()
        if mutated_text == seed.lower():
            continue
            
        # Judge calculates semantic validity
        embeddings1 = judge_model.encode(seed, convert_to_tensor=True)
        embeddings2 = judge_model.encode(mutated_text, convert_to_tensor=True)
        
        cosine_score = util.cos_sim(embeddings1, embeddings2).item()
        
        # Rigorous threshold
        if cosine_score >= 0.85:
            print(f"[ACCEPTED] Score: {cosine_score:.2f}")
            print(f"   Original: {seed}")
            print(f"   Mutated : {mutated_text}")
            valid_augmentations.append(mutated_text)
        else:
            print(f"[REJECTED] Score: {cosine_score:.2f} (Meaning drifted too far)")
            print(f"   Original: {seed}")
            print(f"   Mutated : {mutated_text}")
            
    print(f"\n[OK] Loop Complete! Discovered {len(valid_augmentations)} semantically valid new phrasing structures.")
    return valid_augmentations

if __name__ == "__main__":
    autonomous_augmentation_loop(10)
    print("\n(Run complete. In production, this data is injected into the training datasets and the models are retrained.)")
