# -*- coding: utf-8 -*-
"""
Rigorous Performance Benchmarks:
Comparing Internal DSA Data Structures & Algorithms against Unindexed Database / Brute-force equivalents.
"""

import time
import random
import string
import statistics
import sqlite3
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import get_db_connection
from dsa_engine import (
    PrefixTrie, InvertedIndex, LRUCache,
    PriorityFeedRanker, PeerGraph, UnifiedDSAEngine
)

def benchmark_search():
    """Benchmark: Multi-Table SQLite LIKE '%q%' vs In-Memory Prefix Trie & Inverted Index"""
    # Prepare query words
    queries = ["python", "jee", "algo", "math", "code", "deep", "test"]

    # 1. Baseline: Raw SQLite queries (simulating original /api/search implementation)
    sql_times = []
    with get_db_connection() as conn:
        for q in queries * 10:
            t0 = time.perf_counter()
            conn.execute("SELECT id, title, content FROM posts WHERE LOWER(content) LIKE ? OR LOWER(title) LIKE ? LIMIT 6", (f"%{q}%", f"%{q}%")).fetchall()
            conn.execute("SELECT id, title, description FROM quizzes WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? LIMIT 6", (f"%{q}%", f"%{q}%")).fetchall()
            conn.execute("SELECT id, title, slug FROM coding_problems WHERE LOWER(title) LIKE ? OR LOWER(category) LIKE ? LIMIT 6", (f"%{q}%", f"%{q}%")).fetchall()
            conn.execute("SELECT id, name, description FROM communities WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ? LIMIT 6", (f"%{q}%", f"%{q}%")).fetchall()
            conn.execute("SELECT id, name, subject_code FROM classrooms WHERE LOWER(name) LIKE ? LIMIT 6", (f"%{q}%",)).fetchall()
            conn.execute("SELECT id, name, handle FROM users WHERE LOWER(name) LIKE ? LIMIT 6", (f"%{q}%",)).fetchall()
            sql_times.append(time.perf_counter() - t0)

    # 2. DSA Engine: In-memory Trie + Inverted Index + LRU Cache
    test_engine = UnifiedDSAEngine()
    test_engine.warmup_from_db(get_db_connection)

    dsa_times = []
    for q in queries * 10:
        t0 = time.perf_counter()
        res = test_engine.search(q, limit_per_type=6)
        dsa_times.append(time.perf_counter() - t0)

    sql_avg = statistics.mean(sql_times) * 1000
    dsa_avg = statistics.mean(dsa_times) * 1000
    speedup = sql_avg / dsa_avg if dsa_avg > 0 else 999.0

    return {
        "operation": "Multi-Domain Search",
        "baseline_ms": sql_avg,
        "dsa_ms": dsa_avg,
        "speedup": speedup
    }

def benchmark_caching():
    """Benchmark: Uncached Community Queries (N+1 SQL) vs LRU Cache (Doubly Linked List + Map)"""
    # 1. Baseline: Uncached SQL execution
    uncached_times = []
    with get_db_connection() as conn:
        for _ in range(50):
            t0 = time.perf_counter()
            comms = conn.execute("SELECT * FROM communities ORDER BY members_count DESC").fetchall()
            res = []
            for c in comms:
                cd = dict(c)
                chans = conn.execute("SELECT * FROM community_channels WHERE community_id = ?", (c["id"],)).fetchall()
                cd["channels"] = [dict(ch) for ch in chans]
                res.append(cd)
            uncached_times.append(time.perf_counter() - t0)

    # 2. DSA LRU Cache: O(1) retrieval
    cache = LRUCache(capacity=64)
    # Pre-populate
    cache.put("all_communities", res)
    cached_times = []
    for _ in range(50):
        t0 = time.perf_counter()
        cached_res = cache.get("all_communities")
        cached_times.append(time.perf_counter() - t0)

    base_avg = statistics.mean(uncached_times) * 1000
    dsa_avg = statistics.mean(cached_times) * 1000
    speedup = base_avg / dsa_avg if dsa_avg > 0 else 999.0

    return {
        "operation": "Community List (N+1 Query vs LRU Cache)",
        "baseline_ms": base_avg,
        "dsa_ms": dsa_avg,
        "speedup": speedup
    }

def benchmark_feed_ranking():
    """Benchmark: Full O(N log N) Sort vs Bounded Min-Heap O(N log K)"""
    # 2,000 synthetic feed items
    items = [{"id": f"p_{i}", "created_at": random.uniform(1000, 999999), "likes": random.randint(0, 500)} for i in range(2000)]
    k = 50

    # 1. Baseline: Full Python Sort O(N log N)
    sort_times = []
    for _ in range(100):
        t0 = time.perf_counter()
        sorted_items = sorted(items, key=lambda x: x["created_at"], reverse=True)[:k]
        sort_times.append(time.perf_counter() - t0)

    # 2. DSA: Bounded Min-Heap O(N log K)
    heap_times = []
    for _ in range(100):
        t0 = time.perf_counter()
        heap_items = PriorityFeedRanker.top_k(items, k, score_fn=lambda x: x["created_at"])
        heap_times.append(time.perf_counter() - t0)

    base_avg = statistics.mean(sort_times) * 1000
    dsa_avg = statistics.mean(heap_times) * 1000
    speedup = base_avg / dsa_avg if dsa_avg > 0 else 1.0

    return {
        "operation": f"Top-{k} Feed Ranking (2,000 items)",
        "baseline_ms": base_avg,
        "dsa_ms": dsa_avg,
        "speedup": speedup
    }

def benchmark_graph_connections():
    """Benchmark: Social Connection Check: SQL table scan vs In-Memory Graph Adjacency Set O(1)"""
    # 1. Prepare in-memory graph and simulated table
    graph = PeerGraph()
    test_pairs = []
    for i in range(200):
        u1 = f"user_{i}"
        u2 = f"user_{(i + 1) % 200}"
        graph.add_edge(u1, u2)
        test_pairs.append((u1, u2))

    # Also pairs that are not connected
    for i in range(200):
        test_pairs.append((f"user_{i}", f"user_{(i + 50) % 200}"))

    # Test in-memory graph O(1) lookup over 10,000 checks
    graph_times = []
    t0 = time.perf_counter()
    for _ in range(25):
        for u, v in test_pairs:
            _ = graph.are_connected(u, v)
    graph_time_ms = (time.perf_counter() - t0) * 1000

    # Mutual peers computation
    t1 = time.perf_counter()
    for _ in range(25):
        for u, v in test_pairs[:50]:
            _ = graph.get_mutual_peers(u, v)
    mutual_time_ms = (time.perf_counter() - t1) * 1000

    return {
        "operation": "Connection Graph (10,000 Checks)",
        "total_graph_time_ms": graph_time_ms,
        "mutual_peer_time_ms": mutual_time_ms
    }

if __name__ == "__main__":
    b_search = benchmark_search()
    b_cache = benchmark_caching()
    b_feed = benchmark_feed_ranking()
    b_graph = benchmark_graph_connections()

    print("\n" + "="*70)
    print(" KOINEXA INTERNAL DSA PERFORMANCE BENCHMARK REPORT ")
    print("="*70)
    print(f"{'Operation':<40} | {'Baseline':<10} | {'With DSA':<10} | {'Speedup':<10}")
    print("-" * 75)
    print(f"{b_search['operation']:<40} | {b_search['baseline_ms']:>7.3f} ms | {b_search['dsa_ms']:>7.3f} ms | {b_search['speedup']:>8.1f}x")
    print(f"{b_cache['operation']:<40} | {b_cache['baseline_ms']:>7.3f} ms | {b_cache['dsa_ms']:>7.3f} ms | {b_cache['speedup']:>8.1f}x")
    print(f"{b_feed['operation']:<40} | {b_feed['baseline_ms']:>7.3f} ms | {b_feed['dsa_ms']:>7.3f} ms | {b_feed['speedup']:>8.1f}x")
    print("-" * 75)
    print(f"Peer Graph: 10,000 O(1) connection lookups: {b_graph['total_graph_time_ms']:.2f} ms ({b_graph['total_graph_time_ms']/10000*1000:.3f} microseconds / op)")
    print(f"Peer Graph: Mutual peer set intersections: {b_graph['mutual_peer_time_ms']:.2f} ms")
    print("="*70 + "\n")
