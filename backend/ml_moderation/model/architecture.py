# -*- coding: utf-8 -*-
"""
KOINEXA Deep Neural Text Moderation Architecture
CharSubwordCNN: Multi-scale 1D Convolutional Neural Network with Adaptive Pooling.
High-speed CPU inference (< 5ms) for academic platform toxicity filtering.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class CharSubwordCNN(nn.Module):
    def __init__(
        self,
        vocab_size: int,
        embedding_dim: int = 64,
        num_filters: int = 64,
        filter_sizes: list = [2, 3, 4, 5],
        hidden_dim: int = 64,
        dropout_p: float = 0.3,
        num_categories: int = 4
    ):
        super(CharSubwordCNN, self).__init__()
        
        self.embedding = nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=embedding_dim,
            padding_idx=0
        )
        
        # Parallel 1D Convolutions with kernel sizes 2, 3, 4, 5
        self.convs = nn.ModuleList([
            nn.Conv1d(
                in_channels=embedding_dim,
                out_channels=num_filters,
                kernel_size=k,
                padding=k // 2
            )
            for k in filter_sizes
        ])
        
        total_conv_features = num_filters * len(filter_sizes)
        
        self.dropout = nn.Dropout(dropout_p)
        
        # Shared dense representation
        self.fc_shared = nn.Sequential(
            nn.Linear(total_conv_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout_p * 0.7)
        )
        
        # Primary head: Binary toxicity logit
        self.head_toxicity = nn.Linear(hidden_dim, 1)
        
        # Secondary head: Multi-category logits (profanity, harassment, hate_speech, evasion)
        self.head_categories = nn.Linear(hidden_dim, num_categories)
        
    def forward(self, x: torch.Tensor):
        """
        x shape: (batch_size, seq_len)
        Returns:
          toxicity_logits: (batch_size, 1)
          category_logits: (batch_size, num_categories)
        """
        # Embed: (batch_size, seq_len, emb_dim)
        emb = self.embedding(x)
        
        # Permute for 1D convolution: (batch_size, emb_dim, seq_len)
        emb_t = emb.permute(0, 2, 1)
        
        # Apply parallel convolutions and global max pooling
        pooled_outputs = []
        for conv in self.convs:
            conv_out = F.relu(conv(emb_t)) # (batch_size, num_filters, seq_len)
            pooled = F.adaptive_max_pool1d(conv_out, 1).squeeze(-1) # (batch_size, num_filters)
            pooled_outputs.append(pooled)
            
        # Concatenate: (batch_size, total_conv_features)
        feat = torch.cat(pooled_outputs, dim=1)
        feat = self.dropout(feat)
        
        # Shared representations: (batch_size, hidden_dim)
        rep = self.fc_shared(feat)
        
        # Outputs
        toxicity_logit = self.head_toxicity(rep)
        category_logits = self.head_categories(rep)
        
        return toxicity_logit, category_logits
