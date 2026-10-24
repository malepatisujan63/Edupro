# -*- coding: utf-8 -*-
"""
Comprehensive Test Suite for Koinexa Context-Aware Moderation & Autonomous Agent
Validates:
1. Anti-Scunthorpe protection (zero false-positives on academic & benign words)
2. Polysemic contextual disambiguation (academic vs abusive usage)
3. Leetspeak & adversarial obfuscation detection
4. Autonomous Wiktionary-powered unknown-word investigation & SQLite self-learning
5. Pragmatic Speech-Act Target Directedness (Austin & Searle Theory: Self, System, Artifact, Peer)
6. Matrix Language Frame (MLF) De-agglutination (Myers-Scotton Theory for Indic Code-Mixing)
7. Full Diagnostic Return Payload & Asynchronous Non-blocking Execution
"""

import os
import sys
import time

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from moderation import moderate_content, analyze_pragmatic_speech_act, BENIGN_ALLOWLIST, POLYSEMOUS_PATTERNS
from ml_moderation.unknown_word_agent import get_unknown_word_agent
from ml_moderation.corpus_engine import get_corpus_engine

def run_tests():
    print("=" * 75)
    print("KOINEXA FULL-FLEDGED MODERATION ENGINE VERIFICATION SUITE")
    print("Pragmatic Speech-Act (Austin & Searle) + MLF Code-Switching (Myers-Scotton)")
    print("=" * 75)
    passed = 0
    failed = 0

    # ---------------------------------------------------------
    # TEST 1: Anti-Scunthorpe Protection (Hard Negatives Must Pass)
    # ---------------------------------------------------------
    scunthorpe_samples = [
        "Please pass the assessment documents before the deadline.",
        "We use assembly language and assert statements in our code lab.",
        "Charles Dickens wrote David Copperfield and Great Expectations.",
        "The physics simulation uses the 4th-order Runge-Kutta numerical method.",
        "The patient was diagnosed with dengue fever after the monsoon.",
        "In our biology class we studied the peacock, woodcock, and canine genetics.",
        "The mechanical engineer inspected the stopcock and hexagonal nuts.",
        "He assumed the compass was pointing directly north on the grass field."
    ]

    print("\n[TEST 1] Anti-Scunthorpe Academic Hard-Negative Whitelist:")
    for sample in scunthorpe_samples:
        is_safe, reason = moderate_content(sample)
        if is_safe:
            print(f"  [PASS] '{sample[:50]}...' -> Clean")
            passed += 1
        else:
            print(f"  [FAIL] '{sample[:50]}...' -> Falsely blocked: {reason}")
            failed += 1

    # ---------------------------------------------------------
    # TEST 2: Polysemy Disambiguation (Academic Safe vs Abusive Flagged)
    # ---------------------------------------------------------
    polysemy_cases = [
        ("The pregnant bitch delivered six healthy puppies in the kennel.", True),
        ("You are such a miserable and whiny bitch.", False),
        ("Philip K. Dick wrote classic science fiction novels.", True),
        ("Shut up and suck my dick you idiot.", False),
        ("In badminton tournament the shuttlecock cleared the net cleanly.", True),
        ("He is a filthy cocksucker who cheated in the exam.", False),
        ("The wild ass is also known as Equus africanus in zoology.", True),
        ("I will kick your ass if you touch my laptop.", False)
    ]

    print("\n[TEST 2] Polysemy Disambiguation (Safe context vs Toxic attack):")
    for text, expected_safe in polysemy_cases:
        is_safe, reason = moderate_content(text)
        if is_safe == expected_safe:
            status = "PASS"
            passed += 1
        else:
            status = "FAIL"
            failed += 1
        print(f"  [{status}] Expected {expected_safe}, Got {is_safe}: '{text[:50]}...'")

    # ---------------------------------------------------------
    # TEST 3: Leetspeak & Elongation Normalization
    # ---------------------------------------------------------
    evasion_samples = [
        "f@ck this platform",
        "sh!t happens in tests",
        "fuuuuuck you all",
        "b!tch go away"
    ]

    print("\n[TEST 3] Obfuscation & Leetspeak Evasion Detection:")
    for text in evasion_samples:
        is_safe, reason = moderate_content(text)
        if not is_safe:
            print(f"  [PASS] Intercepted evasion: '{text}' -> {reason}")
            passed += 1
        else:
            print(f"  [FAIL] Missed evasion: '{text}'")
            failed += 1

    # ---------------------------------------------------------
    # TEST 4: Autonomous Unknown-Word Agent (Wiktionary REST API)
    # ---------------------------------------------------------
    print("\n[TEST 4] Autonomous Unknown-Word Agent Investigation:")
    agent = get_unknown_word_agent()

    res_academic = agent.investigate_word("quicksort")
    if not res_academic["is_toxic"]:
        print(f"  [PASS] 'quicksort' classified as benign: defn = {res_academic['definition'][:45]}...")
        passed += 1
    else:
        print(f"  [FAIL] 'quicksort' incorrectly flagged: {res_academic}")
        failed += 1

    res_slur = agent.investigate_word("chutiya")
    if res_slur["is_toxic"] and res_slur.get("confidence", 0) >= 0.88:
        print(f"  [PASS] 'chutiya' identified as slur via Wiktionary! Category: {res_slur['detected_category']}, Learned: {res_slur.get('learned', False)}")
        passed += 1
    else:
        print(f"  [FAIL] 'chutiya' not flagged properly: {res_slur}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 5: Pragmatic Speech-Act Target Directedness (Austin & Searle)
    # ---------------------------------------------------------
    print("\n[TEST 5] Pragmatic Speech-Act Directedness (Austin & Searle Theory):")
    speech_act_cases = [
        # Tier 1: Self-Deprecation -> MUST PASS (Help-seeking empathy)
        ("I feel like an idiot, my binary search is failing all test cases.", True, "SELF_DEPRECATION"),
        ("Why is my code so stupid and pathetic?", True, "SELF_DEPRECATION"),
        ("I am complete garbage at dynamic programming.", True, "SELF_DEPRECATION"),

        # Tier 2: System / Inanimate Venting -> MUST PASS (Technical venting)
        ("This compiler is complete garbage and throwing segmentation fault.", True, "SYSTEM_VENT"),
        ("This bug is annoying bullshit in production.", True, "SYSTEM_VENT"),

        # Tier 3: Technical Syntax Scoping -> MUST PASS (AST & POSIX signals)
        ("Use kill(pid, SIGKILL) to terminate child process in C.", True, "CODE_ARTIFACT"),
        ("Why does process.kill() throw an exception on Windows?", True, "CODE_ARTIFACT"),

        # Tier 4: Peer Interpersonal Attacks -> MUST BLOCK (Hostile harassment)
        ("You are an idiot, delete your submission immediately.", False, "PEER_ATTACK"),
        ("You are a pathetic loser, get out of our team.", False, "PEER_ATTACK"),
        ("Your code is complete garbage you retard.", False, "PEER_ATTACK")
    ]

    for text, exp_safe, exp_tier in speech_act_cases:
        details = moderate_content(text, return_details=True)
        is_safe = details["is_safe"]
        act_tier = details.get("pragmatic_tier", "")
        
        tier_ok = (act_tier == exp_tier)
        safe_ok = (is_safe == exp_safe)
        
        if tier_ok and safe_ok:
            print(f"  [PASS] Tier: {act_tier:16} | Safe: {is_safe} | '{text[:45]}...'")
            if act_tier == "SELF_DEPRECATION" and details.get("empathy_payload"):
                print(f"         -> Empathy Advice: {details['empathy_payload']['pedagogical_guidance'][:60]}...")
            passed += 1
        else:
            print(f"  [FAIL] Expected ({exp_safe}, {exp_tier}), Got ({is_safe}, {act_tier}): '{text[:45]}...'")
            failed += 1

    # ---------------------------------------------------------
    # TEST 6: Matrix Language Frame (MLF) Indic De-agglutination
    # ---------------------------------------------------------
    print("\n[TEST 6] Matrix Language Frame (MLF) De-agglutination (Myers-Scotton Theory):")
    mlf_cases = [
        # Agglutinated regional slurs (Embedded roots + Matrix suffixes) -> MUST BLOCK
        ("bro don't do dengadame in classroom", False, "TE"),
        ("why are you doing dengutha here", False, "TE"),
        ("tera code dekhke chudai ho gayi", False, "HI"),
        ("stop this chodna in chat", False, "HI"),
        ("avan oombu panran", False, "TA"),

        # Preserved STEM & Medical words with identical prefixes -> MUST PASS (Anti-Scunthorpe)
        ("The government reported 450 new dengue fever cases.", True, "STEM_ALLOWLIST"),
        ("The dense matrix multiplication algorithm has O(N^3) time complexity.", True, "STEM_ALLOWLIST"),
        ("The density of this copper sphere is 8.96 g/cm3.", True, "STEM_ALLOWLIST")
    ]

    for text, exp_safe, note in mlf_cases:
        is_safe, reason = moderate_content(text)
        if is_safe == exp_safe:
            print(f"  [PASS] Expected {exp_safe}, Got {is_safe} ({note}): '{text[:45]}...'")
            passed += 1
        else:
            print(f"  [FAIL] Expected {exp_safe}, Got {is_safe} ({note}): '{text[:45]}...' -> {reason}")
            failed += 1

    # ---------------------------------------------------------
    # TEST 7: Full Diagnostic Payload & Latency Verification
    # ---------------------------------------------------------
    print("\n[TEST 7] Diagnostic Payload & Microsecond Latency Benchmark:")
    t0 = time.perf_counter()
    diag = analyze_pragmatic_speech_act("I am an idiot and my loop has O(N^2) complexity")
    latency = diag.get("latency_ms", (time.perf_counter() - t0) * 1000)
    
    if diag["is_safe"] and diag["pragmatic_tier"] == "SELF_DEPRECATION" and latency < 3.0:
        print(f"  [PASS] Full diagnostic payload validated: tier={diag['pragmatic_tier']}, entity={diag['target_entity']}, latency={latency:.3f} ms")
        passed += 1
    else:
        print(f"  [FAIL] Diagnostic return anomaly: {diag}")
        failed += 1

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------
    print("\n" + "=" * 75)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED (Total Tests: {passed + failed})")
    print("=" * 75)
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
