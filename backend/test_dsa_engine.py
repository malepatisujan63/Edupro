# -*- coding: utf-8 -*-
"""
Verification tests for internal DSA Engine.
"""

import sys
import time
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dsa_engine import (
    PrefixTrie, InvertedIndex, LRUCache,
    PriorityFeedRanker, PeerGraph, UnifiedDSAEngine, engine
)


def test_prefix_trie():
    trie = PrefixTrie()
    trie.insert("python", "problems", "prob_1")
    trie.insert("pytorch", "problems", "prob_2")
    trie.insert("algorithms", "posts", "post_1")

    # Prefix 'pyt' matches both
    res_pyt = trie.search_prefix("pyt")
    assert ("problems", "prob_1") in res_pyt, "Expected prob_1 in prefix search"
    assert ("problems", "prob_2") in res_pyt, "Expected prob_2 in prefix search"
    assert ("posts", "post_1") not in res_pyt

    # Prefix 'algo'
    res_algo = trie.search_prefix("algo")
    assert ("posts", "post_1") in res_algo

    # Non-existent prefix
    assert len(trie.search_prefix("xyz")) == 0
    print("[PASS] PrefixTrie tests succeeded.")


def test_inverted_index():
    index = InvertedIndex()
    index.add_document("Machine Learning and Deep Neural Networks", "posts", "post_10")
    index.add_document("Deep Learning Algorithms in Python", "posts", "post_20")

    # Single token query
    res_neural = index.query("neural")
    assert ("posts", "post_10") in res_neural

    # Multi-token intersection: 'deep learning' matches both
    res_deep = index.query("deep learning")
    assert ("posts", "post_10") in res_deep
    assert ("posts", "post_20") in res_deep

    # Multi-token with one unique: 'neural learning' matches post_10
    res_neural_deep = index.query("neural learning")
    assert ("posts", "post_10") in res_neural_deep

    print("[PASS] InvertedIndex tests succeeded.")


def test_lru_cache():
    cache = LRUCache(capacity=3)
    cache.put("a", 1)
    cache.put("b", 2)
    cache.put("c", 3)

    assert cache.get("a") == 1  # 'a' now most recently used: order b, c, a
    cache.put("d", 4)           # evicts 'b' (least recently used)

    assert cache.get("b") is None, "Expected 'b' to be evicted"
    assert cache.get("a") == 1
    assert cache.get("c") == 3
    assert cache.get("d") == 4

    # Test TTL
    ttl_cache = LRUCache(capacity=5, default_ttl=0.1)
    ttl_cache.put("expire_soon", "val")
    assert ttl_cache.get("expire_soon") == "val"
    time.sleep(0.15)
    assert ttl_cache.get("expire_soon") is None, "Expected expired entry to return None"

    # Test concurrent access
    def worker():
        for i in range(100):
            cache.put(f"key_{i}", i)
            cache.get(f"key_{i}")

    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert len(cache) <= 3, f"LRUCache exceeded capacity: {len(cache)}"

    print("[PASS] LRUCache tests succeeded.")


def test_priority_feed_ranker():
    posts = [
        {"id": "p1", "likes": 5, "created_at": 100},
        {"id": "p2", "likes": 50, "created_at": 200},
        {"id": "p3", "likes": 12, "created_at": 150},
        {"id": "p4", "likes": 99, "created_at": 300},
        {"id": "p5", "likes": 2, "created_at": 50},
    ]

    # Top 3 by likes
    top3 = PriorityFeedRanker.top_k(posts, 3, score_fn=lambda x: x["likes"])
    assert len(top3) == 3
    assert [p["id"] for p in top3] == ["p4", "p2", "p3"]

    print("[PASS] PriorityFeedRanker tests succeeded.")


def test_peer_graph():
    graph = PeerGraph()
    # User 1 connected to 2 and 3
    graph.add_edge("u1", "u2")
    graph.add_edge("u1", "u3")
    # User 2 connected to 4
    graph.add_edge("u2", "u4")
    # User 3 connected to 4
    graph.add_edge("u3", "u4")

    assert graph.are_connected("u1", "u2") is True
    assert graph.are_connected("u1", "u4") is False

    # Mutual peers between u1 and u4 (both connect to u2 and u3)
    mutuals = graph.get_mutual_peers("u1", "u4")
    assert mutuals == {"u2", "u3"}

    # BFS recommendations for u1 should prioritize u4 (has 2 mutual friends)
    recs = graph.bfs_recommendations("u1", max_depth=2)
    assert "u4" in recs

    # Disconnect
    graph.remove_edge("u1", "u2")
    assert graph.are_connected("u1", "u2") is False

    print("[PASS] PeerGraph tests succeeded.")


def test_unified_dsa_engine():
    test_engine = UnifiedDSAEngine()
    test_engine.index_entity("problems", {"id": "two-sum", "title": "Two Sum Problem", "category": "Arrays"}, ["title", "category"])
    test_engine.index_entity("communities", {"id": "comm_py", "name": "Python Enthusiasts", "category": "Tech"}, ["name", "category"])
    test_engine.index_entity("people", {"id": "u_dev", "name": "Alex Mercer", "handle": "alex_dev"}, ["name", "handle"])

    # Search for "two"
    res1 = test_engine.search("two")
    assert len(res1["problems"]) == 1
    assert res1["problems"][0]["id"] == "two-sum"

    # Search for "python"
    res2 = test_engine.search("python")
    assert len(res2["communities"]) == 1
    assert res2["communities"][0]["id"] == "comm_py"

    # Search for "alex"
    res3 = test_engine.search("alex")
    assert len(res3["people"]) == 1
    assert res3["people"][0]["handle"] == "alex_dev"

    # Verify cached output is identical
    res_cached = test_engine.search("alex")
    assert res_cached == res3

    print("[PASS] UnifiedDSAEngine integration tests succeeded.")


if __name__ == "__main__":
    test_prefix_trie()
    test_inverted_index()
    test_lru_cache()
    test_priority_feed_ranker()
    test_peer_graph()
    test_unified_dsa_engine()
    print("\nALL INTERNAL DSA ENGINE TESTS PASSED PERFECTLY!")
