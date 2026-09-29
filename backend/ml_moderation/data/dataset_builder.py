# -*- coding: utf-8 -*-
"""
KOINEXA Content Moderation Dataset Builder & Synthesizer
Generates, curates, and partitions a balanced, multi-lingual, multi-category dataset
for training and evaluating academic language moderation models.
"""

import json
import os
import random
import re
from typing import List, Dict, Any, Tuple

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 1. ACADEMIC & CONSTRUCTIVE LEARNING CORPUS (CLASS 0: CLEAN) ──
ACADEMIC_SEEDS = [
    # Computer Science & Algorithms
    "How does Dijkstra's algorithm guarantee the shortest path in non-negative edge graphs?",
    "Can someone explain the time complexity of quicksort in the worst case vs average case?",
    "In modern operating systems, memory paging and concurrency control avoid deadlocks.",
    "The B-tree index structure provides logarithmic search time for database queries.",
    "Dynamic programming solves overlapping subproblems with optimal substructure.",
    "What is the difference between TCP three-way handshake and UDP connectionless protocol?",
    "React useEffect runs after every render unless a dependency array is provided.",
    "Can you share the lecture slides for compiler design and syntax directed translation?",
    "Understanding pointer arithmetic and memory allocation in C is fundamental for systems.",
    "Convolutional neural networks extract spatial feature hierarchies from visual inputs.",
    "Binary search requires the input array to be sorted in ascending or descending order.",
    "Explain the difference between process and thread context switching overhead.",
    "The halting problem proves that no general algorithm can decide program termination.",
    "Graph coloring algorithms can be applied to register allocation in modern compilers.",
    "In relational algebra, inner joins filter rows based on a matching equality condition.",
    "Object oriented design patterns such as Singleton and Factory improve code reusability.",
    "How does the garbage collector handle circular references in modern runtimes?",
    "Distributed consensus protocols like Raft ensure fault-tolerant state machine replication.",
    "Depth-first search uses a recursion stack while breadth-first search uses a FIFO queue.",
    "Red-black trees maintain balance by enforcing five fundamental node color properties.",

    # Mathematics & Statistics
    "The determinant of an invertible matrix is always non-zero.",
    "Eigenvalues and eigenvectors represent invariant directions under linear transformations.",
    "Cauchy-Schwarz inequality plays a critical role in inner product spaces.",
    "Linear regression minimizes the sum of squared residuals between observed and predicted values.",
    "The central limit theorem states that sample means approximate a normal distribution.",
    "Integration by parts relies on the product rule of differentiation in calculus.",
    "Euler's formula e^(i*pi) + 1 = 0 connects five fundamental mathematical constants.",
    "Bayes theorem calculates posterior probability using prior belief and likelihood.",
    "A continuous function on a closed bounded interval attains its supremum and infimum.",
    "Taylor series expansions approximate differentiable functions near a specified point.",
    "Solving second-order homogeneous differential equations using characteristic polynomials.",
    "Singular value decomposition factors any real matrix into orthogonal and diagonal matrices.",
    "Markov chains model memoryless stochastic processes with transition probability matrices.",

    # Physics & Engineering
    "Newton's third law states that every action has an equal and opposite reaction.",
    "Thermodynamics dictates that the total entropy of an isolated system always increases.",
    "Maxwell's equations unify electricity, magnetism, and optics into a single framework.",
    "The photoelectric effect demonstrated the quantized particulate nature of light.",
    "Bernoulli's principle relates fluid velocity to static pressure in laminar flow.",
    "Schrodinger's wave equation describes the quantum state evolution of subatomic particles.",
    "Carnot efficiency represents the theoretical maximum limit for any heat engine cycle.",
    "Hooke's law describes the restoring force of an ideal spring within elastic limits.",
    "Kirchhoff's voltage law asserts that sum of potential differences in any closed loop is zero.",
    "Doppler effect causes frequency shift when wave source and observer are in relative motion.",

    # Chemistry & Materials
    "Electronegativity differences determine whether chemical bonds are covalent or ionic.",
    "Le Chatelier's principle predicts how equilibrium shifts in response to pressure changes.",
    "SN2 reactions proceed via a concerted mechanism with backside attack and inversion.",
    "Gibbs free energy determines the thermodynamic spontaneity of chemical transformations.",
    "The periodic table organizes elements by increasing atomic number and valence shells.",
    "Mass spectrometry identifies chemical compounds by ionizing and measuring mass-to-charge ratio.",
    "Activation energy represents the minimum kinetic energy required for reactive collisions.",

    # Classroom & Peer Discussions
    "Good morning professor, could you please clarify question 3 from yesterday's problem set?",
    "I have submitted the assignment on the portal. Please let me know if any revisions are needed.",
    "Anyone interested in forming a study group for the upcoming mid-semester examinations?",
    "Thank you for the detailed feedback on my project proposal, I will refine the architecture.",
    "Where can I find the reference textbook for advanced discrete mathematics?",
    "The lab session will be conducted tomorrow at 10 AM in the computer center.",
    "Could someone explain how to set up the virtual environment for the assignment?",
    "Great explanation in today's lecture on algorithmic game theory!",
    "Please check my pull request for the community project repository.",
    "Does anyone have notes from Friday's session on operating system scheduling?"
]

# ── 2. HARD NEGATIVES (ACADEMIC WORDS WITH PROFANE SUBSTRINGS) ──
HARD_NEGATIVES = [
    "Memory paging, and concurrency control are essential in modern operating systems.",
    "The teacher asked us to analyze the program's concurrency and thread synchronization.",
    "Let us make the simplest assumption to model the laminar fluid velocity profile.",
    "Linear regression analysis demonstrates strong correlation between study time and score.",
    "We use cumulative distribution functions to compute the exact probability bounds.",
    "In object-oriented programming, class inheritance allows extending base functionality.",
    "The aircraft cockpit simulation models turbulence and aerodynamic lift accurately.",
    "The Scunthorpe problem highlights the difficulty of naive substring filtering.",
    "He graduated summa cum laude with top honors in computer science and mathematics.",
    "Mass spectrometer measurements confirmed the molecular weight of the synthesized compound.",
    "Pass by value creates a local copy, whereas pass by reference modifies the original variable.",
    "The analytical approach provides closed-form solutions for second order equations.",
    "Bitwise shift operations are used to optimize integer multiplication and division.",
    "The algorithm handles associative and commutative operations over abelian groups.",
    "Document classification using naive Bayes and logistic regression models.",
    "The matrix decomposition algorithm has cubic worst-case time complexity.",
    "Ensure you document all assumptions made during the experimental procedure.",
    "We need to pass the semester examination with high cumulative grade points.",
    "The compiler performs dead code elimination and constant propagation optimizations.",
    "Concurrently running transactions require serializability to maintain consistency."
]

# ── 3. MULTILINGUAL TOXIC & ABUSIVE CORPUS (CLASS 1: TOXIC) ──
TOXIC_SEEDS = [
    # English Direct Abusive & Hostile
    "Shut the fuck up you idiot, your answer is completely wrong.",
    "You are a stupid piece of shit, go learn basic programming first.",
    "This teacher is a complete asshole who cannot explain simple concepts.",
    "Stop wasting everyone's time with your pathetic, retarded questions.",
    "You bitch about every single assignment instead of actually studying.",
    "Get lost you motherfucker, nobody wants you in this study group.",
    "Your code is total garbage and you are an absolute dumbass.",
    "You are too stupid to pass this exam, just drop out already.",
    "Go fuck yourself, I don't care about your stupid project rules.",
    "Only a brainless bastard would write code like this in production.",
    "Stop spamming this channel with your bullshit excuses.",
    "You are completely useless, what a waste of university resources.",
    "Nobody asked for your worthless opinion you arrogant prick.",
    "You suck at math, just give up before you embarrass yourself further.",
    "What a pathetic clown, delete your account and never come back.",

    # Hinglish & Hindi Abusive Expressions
    "Tu bilkul chutiya hai kya, itna simple question bhi nahi samajh aaya.",
    "Apna bakwas muh band rakh madarchod, kisi ko teri zaroorat nahi.",
    "Bhenchod kitna harami insaan hai tu, cheating karke pass hua hai.",
    "Chup bsdk, tere jaise kutte bahut dekhe hain campus mein.",
    "Saala lodu, code run karna aata nahi aur bada developer ban raha hai.",
    "Bhosadike tu pass hone ke layak nahi hai, fail ho jaayega.",
    "Kitna bada gandu hai yaar tu, sabka assignment copy kar liya.",
    "Teri aukaat nahi hai engineering karne ki, jhaat barabar dimag hai.",
    "Kamine chup chap baith, warna maar maar ke suar bana dunga.",
    "Harami launde, assignment ka solution de warna dekh lunga tujhe.",
    "Tu pura behenchod hai, dusro ka time waste karta rehta hai.",
    "Chutiye jaisa sawal mat pucha kar group mein.",
    "Abe lund ke andhe, question dhang se padh pehle.",
    "Bhadwe teri complaint karunga principal se.",
    "Chup kar randi ke bache, bakwaas mat kar yahan.",

    # Telugu Abusive Expressions
    "Nuvvu pedda lanjakodaku vi ra, em raadu neeku chaduvu.",
    "Guddha moosukoni kurcho bevarsi naayala, sollu aapu.",
    "Dengutha ninnu eppudaina group lo sollu matladithe.",
    "Neeku modda lo knowledge ledu, malli doubts aduguthunnav.",
    "Pooku lo logic idi, evadaina ila code raasthada ra.",
    "Chetha naayala, exam lo fail ayyi road meeda tiruguthav.",
    "Kallu kanipinchatleda lanjodaka, question sarigga choodu.",
    "Donganaayala assignment copy kotti submit chesthava.",

    # Tamil Abusive Expressions
    "Otha olaraama poidu da, loosu koo thirudura velai parkatha.",
    "Thevidiya paiya, unakku padikka therila na veetla iru.",
    "Omala baadu, ethukku da ivlo periya sollu vudra.",
    "Thayoli unakku code ezhutha therila, waste candidate.",
    "Kena bunda mathiri kelvi ketkatha da.",
    "Sunni mathiri nadanthukatha, class kavanikama enna panra.",

    # French & Spanish Expressions
    "Ferme ta gueule espece de connard, ton code est nul a chier.",
    "Putain de merde, tu comprends rien a rien c'est incroyable.",
    "Tu es vraiment un pauvre salope avec ton projet ridicule.",
    "Vete a la mierda hijo de puta, nadie quiere tu proyecto asqueroso.",
    "Eres un completo pendejo que no sabe ni compilar un programa.",
    "Callate la boca cabron, dejas de molestar en este grupo."
]

# ── 4. ADVERSARIAL EVASION GENERATOR (LEETSPEAK, SPACING, NOISE) ──
LEET_SUBS = {
    'a': ['@', '4'],
    'e': ['3'],
    'i': ['!', '1'],
    'o': ['0'],
    's': ['$', '5'],
    't': ['7', '+'],
    'b': ['8'],
    'c': ['(']
}

def to_leetspeak(text: str) -> str:
    """Converts key vulgar tokens into leetspeak."""
    res = []
    for ch in text:
        low = ch.lower()
        if low in LEET_SUBS and random.random() < 0.65:
            res.append(random.choice(LEET_SUBS[low]))
        else:
            res.append(ch)
    return "".join(res)

def to_spaced_evasion(word: str) -> str:
    """Inserts spaces or noise characters between letters: 'f u c k' or 'f_u_c_k'."""
    sep = random.choice([' ', '  ', '.', '_', '-', '*'])
    return sep.join(list(word))

def to_repeated_chars(word: str) -> str:
    """Duplicates letters: 'fuuuuck', 'shiiit'."""
    res = []
    for ch in word:
        if ch.isalpha() and random.random() < 0.4:
            res.append(ch * random.randint(2, 5))
        else:
            res.append(ch)
    return "".join(res)

def generate_adversarial_samples(base_toxic: List[str]) -> List[Dict[str, Any]]:
    """Synthesizes adversarial variations designed to evade naive filters."""
    evasions = []
    
    target_words = [
        "fuck", "shit", "bitch", "asshole", "chutiya", "madarchod",
        "bhenchod", "bhosdike", "gandu", "harami", "lanja", "dengu", "otha"
    ]
    
    for sentence in base_toxic:
        # Strategy A: Leetspeak conversion
        leet_ver = to_leetspeak(sentence)
        if leet_ver != sentence:
            evasions.append({
                "text": leet_ver,
                "label": 1,
                "category": "adversarial_leetspeak",
                "language": "multilingual"
            })
            
        # Strategy B: Repeated character elongation
        words = sentence.split()
        elongated_words = [to_repeated_chars(w) for w in words]
        elongated_ver = " ".join(elongated_words)
        if elongated_ver != sentence:
            evasions.append({
                "text": elongated_ver,
                "label": 1,
                "category": "adversarial_repeated",
                "language": "multilingual"
            })

    # Strategy C: Explicit spaced tokens in natural carrier phrases
    carrier_phrases = [
        "Why are you acting like a {} here?",
        "Go {} yourself and leave this chat.",
        "Stop posting this {} nonsense.",
        "You complete {}, go study the book.",
        "Abe {} chup chap homework kar.",
        "What a total {} move by the team.",
        "Just {} off already, nobody cares."
    ]
    
    for word in target_words:
        for _ in range(4):
            spaced = to_spaced_evasion(word)
            carrier = random.choice(carrier_phrases)
            sample_text = carrier.format(spaced)
            evasions.append({
                "text": sample_text,
                "label": 1,
                "category": "adversarial_spaced",
                "language": "multilingual"
            })
            
    return evasions

# ── 5. DATASET SYNTHESIS & COMBINATORIAL EXPANSION ──
def expand_academic_samples(seeds: List[str], count: int = 1500) -> List[Dict[str, Any]]:
    """Expands academic corpus using pedagogical templates and domain questions."""
    prefixes = [
        "Could you explain how",
        "Can anyone provide an intuitive explanation for why",
        "In our lecture on",
        "For the upcoming lab experiment,",
        "What is the mathematical justification when",
        "I was reviewing the textbook chapter where",
        "When implementing an algorithm for",
        "Could someone please help verify my proof that",
        "What are the primary differences between",
        "How do we rigorously demonstrate that"
    ]
    
    suffixes = [
        "in distributed systems?",
        "during asymptotic analysis?",
        "when solving JEE advanced problems?",
        "in modern software engineering?",
        "under boundary conditions?",
        "according to standard university syllabus?",
        "in discrete mathematics?",
        "for competitive programming challenges?"
    ]
    
    expanded = []
    
    # 1. Base seeds
    for s in seeds:
        expanded.append({
            "text": s,
            "label": 0,
            "category": "academic_clean",
            "language": "en"
        })
        
    # 2. Hard negatives
    for hn in HARD_NEGATIVES:
        expanded.append({
            "text": hn,
            "label": 0,
            "category": "academic_hard_negative",
            "language": "en"
        })
        # Generate variations of hard negatives with natural inquiry wrappers
        expanded.append({
            "text": f"Professor, could you clarify: {hn}",
            "label": 0,
            "category": "academic_hard_negative",
            "language": "en"
        })
        expanded.append({
            "text": f"In assignment 3, we studied: {hn}",
            "label": 0,
            "category": "academic_hard_negative",
            "language": "en"
        })

    # 3. Combinatorial generation
    cs_topics = [
        ("quicksort pivot selection", "minimizes recursive stack depth"),
        ("deadlock prevention", "violates hold-and-wait condition"),
        ("TCP flow control", "uses sliding window mechanisms"),
        ("binary search trees", "satisfies the in-order traversal property"),
        ("dynamic memory paging", "optimizes virtual address translation"),
        ("cache coherence protocols", "maintain multi-core consistency"),
        ("AVL tree rotations", "restore logarithmic height balance"),
        ("graph topological sorting", "orders directed acyclic dependencies"),
        ("dynamic programming memoization", "caches intermediate recursion states"),
        ("B-tree indexing", "accelerates disk block read efficiency")
    ]
    
    math_topics = [
        ("eigenvalue decomposition", "diagonalizes symmetric matrices"),
        ("Taylor series approximation", "converges within the radius of convergence"),
        ("Gaussian elimination", "transforms augmented matrices to row echelon form"),
        ("Fourier transform analysis", "decomposes signals into frequency harmonics"),
        ("Poisson distribution", "models discrete events occurring at constant rates"),
        ("Bayesian inference", "updates posterior distributions using prior evidence"),
        ("Stokes theorem", "relates surface integrals to boundary line integrals")
    ]
    
    all_topics = cs_topics + math_topics
    
    while len(expanded) < count:
        topic, fact = random.choice(all_topics)
        prefix = random.choice(prefixes)
        suffix = random.choice(suffixes)
        variant = f"{prefix} {topic} {fact} {suffix}"
        expanded.append({
            "text": variant,
            "label": 0,
            "category": "academic_clean",
            "language": "en"
        })
        
    return expanded

def expand_toxic_samples(seeds: List[str], count: int = 1500) -> List[Dict[str, Any]]:
    """Expands toxic corpus with direct, colloquial, and adversarial variations."""
    expanded = []
    
    # Base toxic seeds
    for s in seeds:
        expanded.append({
            "text": s,
            "label": 1,
            "category": "toxic_direct",
            "language": "multilingual"
        })
        
    # Adversarial variations
    adv = generate_adversarial_samples(seeds)
    expanded.extend(adv)
    
    # Conversational templates
    insult_templates = [
        "You are an absolute {} who knows nothing about this subject.",
        "Why is this {} always talking nonsense in class?",
        "Don't listen to this {}, his code has never worked.",
        "Such a pathetic {}, can't even solve question 1.",
        "Tu pura {} hai, chup kar group mein.",
        "Abe oye {}, nikal yahan se koi nahi sun raha tujhe.",
        "Yeh teacher bilkul {} hai, marks kaat liye mere.",
        "Nuvvu pedda {} vi ra, em ardham kavatleda.",
        "Otha {}, ivlo pesura aana oru doubt solve panna mudiyala."
    ]
    
    slurs = [
        "chutiya", "madarchod", "bhenchod", "bhosdike", "gandu",
        "harami", "kamina", "bastard", "asshole", "idiot", "dumbass",
        "lanjakodaka", "bevarsi", "thevidiya", "baadu"
    ]
    
    while len(expanded) < count:
        tmpl = random.choice(insult_templates)
        slur = random.choice(slurs)
        
        # 30% chance to apply leetspeak or character repetition
        if random.random() < 0.3:
            slur = to_leetspeak(slur)
        elif random.random() < 0.3:
            slur = to_repeated_chars(slur)
            
        sentence = tmpl.format(slur)
        expanded.append({
            "text": sentence,
            "label": 1,
            "category": "toxic_templated",
            "language": "multilingual"
        })
        
    return expanded

# ── 6. DATASET COMPILATION & PARTITIONING ──
def build_and_save_datasets() -> Tuple[int, int, int]:
    """
    Synthesizes the complete dataset, validates label balance,
    and writes out train.jsonl (70%), val.jsonl (15%), test.jsonl (15%).
    """
    clean_samples = expand_academic_samples(ACADEMIC_SEEDS, count=1600)
    toxic_samples = expand_toxic_samples(TOXIC_SEEDS, count=1600)
    
    all_samples = clean_samples + toxic_samples
    random.shuffle(all_samples)
    
    total = len(all_samples)
    n_train = int(total * 0.70)
    n_val = int(total * 0.15)
    
    train_data = all_samples[:n_train]
    val_data = all_samples[n_train:n_train + n_val]
    test_data = all_samples[n_train + n_val:]
    
    # Write files
    def write_jsonl(filepath: str, data: List[Dict[str, Any]]):
        with open(filepath, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
                
    write_jsonl(os.path.join(DATA_DIR, "moderation_dataset.jsonl"), all_samples)
    write_jsonl(os.path.join(DATA_DIR, "train.jsonl"), train_data)
    write_jsonl(os.path.join(DATA_DIR, "val.jsonl"), val_data)
    write_jsonl(os.path.join(DATA_DIR, "test.jsonl"), test_data)
    
    print(f"[DATASET COMPLETE] Total Samples: {total}")
    print(f"  - Train Set: {len(train_data)} ({sum(1 for x in train_data if x['label']==1)} toxic, {sum(1 for x in train_data if x['label']==0)} clean)")
    print(f"  - Val Set  : {len(val_data)} ({sum(1 for x in val_data if x['label']==1)} toxic, {sum(1 for x in val_data if x['label']==0)} clean)")
    print(f"  - Test Set : {len(test_data)} ({sum(1 for x in test_data if x['label']==1)} toxic, {sum(1 for x in test_data if x['label']==0)} clean)")
    
    return len(train_data), len(val_data), len(test_data)

if __name__ == "__main__":
    build_and_save_datasets()
