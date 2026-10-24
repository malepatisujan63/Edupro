# -*- coding: utf-8 -*-
"""
KOINEXA Moderation Model Evaluator & Benchmarking Suite
Evaluates test set metrics (Accuracy, Precision, Recall, F1),
audits academic hard negatives for 0% False Positive Rate,
and benchmarks CPU inference latency.
"""

import json
import os
import sys
import time
import torch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from model.tokenizer import CharTokenizer
from model.architecture import CharSubwordCNN

DATA_DIR = os.path.join(CURRENT_DIR, "data")
MODEL_DIR = os.path.join(CURRENT_DIR, "model")

HARD_ACADEMIC_TESTCASES = [
    "In modern operating systems, memory paging and concurrency control avoid deadlocks.",
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
    "Concurrently running transactions require serializability to maintain consistency.",
    "Can you explain the difference between process and thread context switching overhead?"
]

def evaluate():
    print("=" * 65)
    print("      KOINEXA NEURAL MODERATOR EVALUATION & BENCHMARK      ")
    print("=" * 65)
    
    vocab_path = os.path.join(MODEL_DIR, "vocab.json")
    checkpoint_path = os.path.join(MODEL_DIR, "koinexa_moderator.pt")
    test_path = os.path.join(DATA_DIR, "test.jsonl")
    
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Model checkpoint not found at: {checkpoint_path}")
        
    tokenizer = CharTokenizer.load(vocab_path)
    model = CharSubwordCNN(
        vocab_size=tokenizer.vocab_size,
        embedding_dim=64,
        num_filters=64,
        filter_sizes=[2, 3, 4, 5],
        hidden_dim=64,
        dropout_p=0.0
    )
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # ── 1. TEST SET EVALUATION ──
    print("[1/3] Evaluating On Unseen Test Set (test.jsonl)...")
    test_samples = []
    with open(test_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                test_samples.append(json.loads(line))
                
    tp, fp, tn, fn = 0, 0, 0, 0
    with torch.no_grad():
        for s in test_samples:
            inp = tokenizer.encode_to_tensor([s["text"]])
            tox_logit, _ = model(inp)
            prob = torch.sigmoid(tox_logit).item()
            pred = 1 if prob >= 0.5 else 0
            label = int(s["label"])
            
            if pred == 1 and label == 1:
                tp += 1
            elif pred == 1 and label == 0:
                fp += 1
            elif pred == 0 and label == 0:
                tn += 1
            elif pred == 0 and label == 1:
                fn += 1
                
    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total
    precision = tp / (tp + fp + 1e-8)
    recall = tp / (tp + fn + 1e-8)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-8)
    fpr = fp / (fp + tn + 1e-8)
    
    print(f"  -> Total Test Samples : {total}")
    print(f"  -> True Positives (TP): {tp}")
    print(f"  -> True Negatives (TN): {tn}")
    print(f"  -> False Positives(FP): {fp}")
    print(f"  -> False Negatives(FN): {fn}")
    print(f"  -> Accuracy           : {accuracy * 100.0:.2f}%")
    print(f"  -> Precision          : {precision * 100.0:.2f}%")
    print(f"  -> Recall             : {recall * 100.0:.2f}%")
    print(f"  -> F1-Score           : {f1:.4f}")
    print(f"  -> False Positive Rate: {fpr * 100.0:.2f}%")
    
    # ── 2. HARD ACADEMIC NEGATIVES AUDIT ──
    print("\n[2/3] Auditing Academic Hard Negatives (Scunthorpe Resistance)...")
    hard_fps = 0
    with torch.no_grad():
        for i, text in enumerate(HARD_ACADEMIC_TESTCASES, 1):
            inp = tokenizer.encode_to_tensor([text])
            tox_logit, _ = model(inp)
            prob = torch.sigmoid(tox_logit).item()
            is_flagged = prob >= 0.5
            status = "FAIL (False Positive)" if is_flagged else "PASS (Clean)"
            if is_flagged:
                hard_fps += 1
                print(f"  [!] Case #{i}: {status} | Prob: {prob:.4f} | '{text}'")
            else:
                print(f"  [PASS] Case #{i:02d}: {status} | Prob: {prob:.4f} | '{text[:50]}...'")
                
    hard_fp_rate = (hard_fps / len(HARD_ACADEMIC_TESTCASES)) * 100.0
    print(f"  -> Academic False Positive Rate: {hard_fp_rate:.2f}% (Target: 0.00%)")
    
    # ── 3. LATENCY BENCHMARK ──
    print("\n[3/3] Benchmarking CPU Inference Latency across 500 queries...")
    latencies = []
    benchmark_texts = [
        "How does quicksort partition work in average case?",
        "Shut the fuck up you idiot.",
        "Can we use binary search on rotated sorted arrays?",
        "Tu bilkul chutiya hai kya, dhang se padh.",
        "Linear regression minimizes sum of squared residuals."
    ]
    
    with torch.no_grad():
        # Warmup
        for _ in range(20):
            inp = tokenizer.encode_to_tensor([benchmark_texts[0]])
            _ = model(inp)
            
        for i in range(500):
            t = benchmark_texts[i % len(benchmark_texts)]
            t0 = time.perf_counter()
            inp = tokenizer.encode_to_tensor([t])
            _ = model(inp)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000.0) # in ms
            
    latencies.sort()
    avg_lat = sum(latencies) / len(latencies)
    p50 = latencies[len(latencies) // 2]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    
    print(f"  -> Mean Latency : {avg_lat:.2f} ms")
    print(f"  -> P50 Latency  : {p50:.2f} ms")
    print(f"  -> P95 Latency  : {p95:.2f} ms")
    print(f"  -> P99 Latency  : {p99:.2f} ms")
    print(f"  -> Throughput   : {1000.0 / avg_lat:.0f} inferences/sec per CPU core")
    
    # Write report
    report = {
        "test_samples": total,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "false_positive_rate": fpr,
        "academic_hard_negative_fpr": hard_fp_rate / 100.0,
        "latency_ms": {
            "mean": avg_lat,
            "p50": p50,
            "p95": p95,
            "p99": p99
        }
    }
    report_path = os.path.join(CURRENT_DIR, "eval_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"\n[OK] Evaluation report saved to: {report_path}")
    print("=" * 65)

if __name__ == "__main__":
    evaluate()
