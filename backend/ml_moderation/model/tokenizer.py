# -*- coding: utf-8 -*-
"""
KOINEXA Character & Subword Tokenizer
Extracts character-level n-grams and vocabulary indices for deep neural moderation.
"""

import json
import os
from typing import List, Dict, Optional
import torch

SPECIAL_TOKENS = {
    "<PAD>": 0,
    "<UNK>": 1,
    "<START>": 2,
    "<END>": 3
}

class CharTokenizer:
    def __init__(self, max_length: int = 256):
        self.max_length = max_length
        self.char2idx: Dict[str, int] = dict(SPECIAL_TOKENS)
        self.idx2char: Dict[int, str] = {v: k for k, v in SPECIAL_TOKENS.items()}
        
    def fit_on_texts(self, texts: List[str]):
        """Builds character vocabulary from a list of training texts."""
        char_counts = {}
        for text in texts:
            for ch in text.lower():
                char_counts[ch] = char_counts.get(ch, 0) + 1
                
        # Sort characters by frequency
        sorted_chars = sorted(char_counts.keys(), key=lambda c: -char_counts[c])
        for ch in sorted_chars:
            if ch not in self.char2idx:
                idx = len(self.char2idx)
                self.char2idx[ch] = idx
                self.idx2char[idx] = ch
                
    def encode(self, text: str) -> List[int]:
        """Encodes a string into a padded integer token list."""
        if not text:
            return [SPECIAL_TOKENS["<PAD>"]] * self.max_length
            
        lowered = text.lower()
        indices = [SPECIAL_TOKENS["<START>"]]
        
        for ch in lowered[:self.max_length - 2]:
            indices.append(self.char2idx.get(ch, SPECIAL_TOKENS["<UNK>"]))
            
        indices.append(SPECIAL_TOKENS["<END>"])
        
        # Pad to max_length
        if len(indices) < self.max_length:
            indices += [SPECIAL_TOKENS["<PAD>"]] * (self.max_length - len(indices))
            
        return indices[:self.max_length]
        
    def encode_to_tensor(self, texts: List[str]) -> torch.Tensor:
        """Batch encodes a list of strings directly into a PyTorch LongTensor."""
        batch_indices = [self.encode(t) for t in texts]
        return torch.tensor(batch_indices, dtype=torch.long)
        
    def save(self, filepath: str):
        """Saves vocabulary dictionary to JSON."""
        data = {
            "max_length": self.max_length,
            "char2idx": self.char2idx
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    @classmethod
    def load(cls, filepath: str) -> "CharTokenizer":
        """Loads tokenizer from vocabulary JSON."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        tokenizer = cls(max_length=data.get("max_length", 256))
        tokenizer.char2idx = data["char2idx"]
        tokenizer.idx2char = {int(v): k for k, v in data["char2idx"].items()}
        return tokenizer
        
    @property
    def vocab_size(self) -> int:
        return len(self.char2idx)
