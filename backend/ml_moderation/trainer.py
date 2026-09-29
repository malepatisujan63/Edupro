# -*- coding: utf-8 -*-
"""
KOINEXA Deep Neural Model Trainer
Trains CharSubwordCNN on the synthesized multi-lingual moderation dataset.
Saves vocabulary and model weights checkpoint for production inference.
"""

import json
import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Ensure package imports work
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from model.tokenizer import CharTokenizer
from model.architecture import CharSubwordCNN

DATA_DIR = os.path.join(CURRENT_DIR, "data")
MODEL_DIR = os.path.join(CURRENT_DIR, "model")

CATEGORY_MAP = {
    "academic_clean": 0,
    "academic_hard_negative": 0,
    "toxic_direct": 1,
    "toxic_templated": 1,
    "adversarial_leetspeak": 2,
    "adversarial_repeated": 2,
    "adversarial_spaced": 3
}

class ModerationDataset(Dataset):
    def __init__(self, jsonl_path: str, tokenizer: CharTokenizer):
        self.samples = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.samples.append(json.loads(line))
        self.tokenizer = tokenizer
        
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx):
        item = self.samples[idx]
        text = item["text"]
        label = float(item["label"]) # 0.0 or 1.0
        
        category_name = item.get("category", "academic_clean")
        cat_id = CATEGORY_MAP.get(category_name, 0)
        
        token_indices = self.tokenizer.encode(text)
        
        return {
            "input_ids": torch.tensor(token_indices, dtype=torch.long),
            "label": torch.tensor([label], dtype=torch.float32),
            "category_id": torch.tensor(cat_id, dtype=torch.long)
        }

def train():
    print("=" * 65)
    print("        KOINEXA NEURAL MODERATOR TRAINING PIPELINE        ")
    print("=" * 65)
    
    train_path = os.path.join(DATA_DIR, "train.jsonl")
    val_path = os.path.join(DATA_DIR, "val.jsonl")
    
    if not os.path.exists(train_path):
        raise FileNotFoundError(f"Training data not found at: {train_path}. Please run dataset_builder.py first.")
        
    # 1. Build & fit tokenizer
    print("[1/5] Building Character & Subword Vocabulary...")
    all_train_texts = []
    with open(train_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                all_train_texts.append(json.loads(line)["text"])
                
    tokenizer = CharTokenizer(max_length=256)
    tokenizer.fit_on_texts(all_train_texts)
    
    vocab_save_path = os.path.join(MODEL_DIR, "vocab.json")
    tokenizer.save(vocab_save_path)
    print(f"  -> Vocabulary Size: {tokenizer.vocab_size} distinct characters/subwords")
    print(f"  -> Saved vocabulary to: {vocab_save_path}")
    
    # 2. Datasets and Loaders
    print("[2/5] Initializing PyTorch DataLoaders...")
    train_dataset = ModerationDataset(train_path, tokenizer)
    val_dataset = ModerationDataset(val_path, tokenizer)
    
    batch_size = 32
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    print(f"  -> Train samples: {len(train_dataset)} | Batches: {len(train_loader)}")
    print(f"  -> Val samples  : {len(val_dataset)} | Batches: {len(val_loader)}")
    
    # 3. Model instantiation
    print("[3/5] Instantiating CharSubwordCNN Neural Architecture...")
    device = torch.device("cpu") # Optimized for instant CPU inference
    model = CharSubwordCNN(
        vocab_size=tokenizer.vocab_size,
        embedding_dim=64,
        num_filters=64,
        filter_sizes=[2, 3, 4, 5],
        hidden_dim=64,
        dropout_p=0.3,
        num_categories=4
    ).to(device)
    
    criterion_tox = nn.BCEWithLogitsLoss()
    criterion_cat = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1.5e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=15)
    
    num_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  -> Trainable Parameters: {num_params:,} (Ultra-compact ~{num_params * 4 / 1024:.1f} KB)")
    
    # 4. Training Loop
    print("[4/5] Executing Neural Network Optimization Loop...")
    epochs = 16
    best_val_f1 = 0.0
    checkpoint_path = os.path.join(MODEL_DIR, "koinexa_moderator.pt")
    
    start_time = time.time()
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        
        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            labels = batch["label"].to(device)
            cat_ids = batch["category_id"].to(device)
            
            optimizer.zero_grad()
            tox_logits, cat_logits = model(input_ids)
            
            loss_tox = criterion_tox(tox_logits, labels)
            loss_cat = criterion_cat(cat_logits, cat_ids)
            loss = loss_tox + 0.3 * loss_cat
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()
            
            total_loss += loss.item()
            
        scheduler.step()
        avg_train_loss = total_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        true_positives = 0
        false_positives = 0
        false_negatives = 0
        
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                labels = batch["label"].to(device)
                
                tox_logits, _ = model(input_ids)
                preds = (torch.sigmoid(tox_logits) >= 0.5).float()
                
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)
                
                # F1 components
                p_flat = preds.view(-1)
                l_flat = labels.view(-1)
                true_positives += ((p_flat == 1) & (l_flat == 1)).sum().item()
                false_positives += ((p_flat == 1) & (l_flat == 0)).sum().item()
                false_negatives += ((p_flat == 0) & (l_flat == 1)).sum().item()
                
        val_acc = (val_correct / val_total) * 100.0
        prec = true_positives / (true_positives + false_positives + 1e-8)
        rec = true_positives / (true_positives + false_negatives + 1e-8)
        val_f1 = 2 * (prec * rec) / (prec + rec + 1e-8)
        
        print(f"  Epoch {epoch:02d}/{epochs:02d} | Train Loss: {avg_train_loss:.4f} | Val Acc: {val_acc:.2f}% | Val F1: {val_f1:.4f} | Val Prec: {prec:.4f} | Val Rec: {rec:.4f}")
        
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "val_f1": val_f1,
                "vocab_size": tokenizer.vocab_size
            }, checkpoint_path)
            
    elapsed = time.time() - start_time
    print(f"\n[5/5] Training Complete in {elapsed:.2f}s!")
    print(f"  -> Best Validation F1: {best_val_f1:.4f}")
    print(f"  -> Saved Model Weights to: {checkpoint_path}")
    print("=" * 65)

if __name__ == "__main__":
    train()
