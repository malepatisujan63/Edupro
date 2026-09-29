# -*- coding: utf-8 -*-
"""
KOINEXA Production Neural Moderation Inference Engine
Thread-safe, singleton predictor for sub-5ms content evaluation.
"""

import os
import sys
import time
import threading
from typing import Dict, Any, List, Optional
import torch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from model.tokenizer import CharTokenizer
from model.architecture import CharSubwordCNN

MODEL_DIR = os.path.join(CURRENT_DIR, "model")

CATEGORY_NAMES = ["academic_clean", "toxic_insult", "adversarial_leetspeak", "adversarial_spaced"]

class ModerationInferenceEngine:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModerationInferenceEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
            
    def __init__(self, threshold: float = 0.60):
        if self._initialized:
            return
            
        self.threshold = threshold
        self.vocab_path = os.path.join(MODEL_DIR, "vocab.json")
        self.checkpoint_path = os.path.join(MODEL_DIR, "koinexa_moderator.pt")
        
        self.device = torch.device("cpu")
        
        # Load tokenizer
        if not os.path.exists(self.vocab_path):
            raise FileNotFoundError(f"Vocabulary not found at {self.vocab_path}")
        self.tokenizer = CharTokenizer.load(self.vocab_path)
        
        # Load model
        self.model = CharSubwordCNN(
            vocab_size=self.tokenizer.vocab_size,
            embedding_dim=64,
            num_filters=64,
            filter_sizes=[2, 3, 4, 5],
            hidden_dim=64,
            dropout_p=0.0,
            num_categories=4
        ).to(self.device)
        
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"Model weights not found at {self.checkpoint_path}")
            
        checkpoint = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()
        
        # Warm up
        with torch.no_grad():
            dummy = self.tokenizer.encode_to_tensor(["warmup query"])
            _ = self.model(dummy)
            
        self._initialized = True
        
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Evaluates input text for toxicity, harassment, and adversarial evasions.
        Returns:
            is_toxic (bool): True if probability >= threshold
            toxicity_score (float): Probability in [0.0, 1.0]
            top_category (str): Detected category
            latency_ms (float): Execution time in milliseconds
        """
        if not text or not text.strip():
            return {
                "is_toxic": False,
                "toxicity_score": 0.0,
                "top_category": "academic_clean",
                "latency_ms": 0.0
            }
            
        t0 = time.perf_counter()
        with torch.no_grad():
            inp = self.tokenizer.encode_to_tensor([text]).to(self.device)
            tox_logit, cat_logits = self.model(inp)
            
            prob = torch.sigmoid(tox_logit).item()
            is_toxic = prob >= self.threshold
            
            cat_idx = torch.argmax(cat_logits, dim=-1).item()
            top_cat = CATEGORY_NAMES[cat_idx] if cat_idx < len(CATEGORY_NAMES) else "unknown"
            
        latency = (time.perf_counter() - t0) * 1000.0
        
        return {
            "is_toxic": is_toxic,
            "toxicity_score": round(prob, 4),
            "top_category": top_cat if is_toxic else "academic_clean",
            "latency_ms": round(latency, 2)
        }

# Global singleton accessor
_engine = None

def get_engine() -> ModerationInferenceEngine:
    global _engine
    if _engine is None:
        _engine = ModerationInferenceEngine()
    return _engine
