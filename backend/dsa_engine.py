# -*- coding: utf-8 -*-
"""
Internal High-Performance Data Structures and Algorithms (DSA) Engine
Provides sub-millisecond in-memory indexing, search, caching, ranking, and social graph traversal.

Internal Components:
- PrefixTrie: O(L) prefix search & autocompletion
- InvertedIndex: Tokenized inverted index for multi-keyword queries with boolean intersection
- LRUCache: Thread-safe Doubly Linked List + Hash Map with O(1) get/put and TTL support
- PriorityFeedRanker: Bounded min-heap O(N log K) top-K ranker
- PeerGraph: In-memory adjacency list graph with BFS mutual peer exploration
"""

import time
import re
import heapq
import threading
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set, Tuple


# ────────────────────────────────────────────────────────────────────
# 1. PREFIX TRIE (O(L) Prefix Matching)
# ────────────────────────────────────────────────────────────────────

class TrieNode:
    __slots__ = ("children", "is_end", "refs")

    def __init__(self):
        self.children: Dict[str, "TrieNode"] = {}
        self.is_end: bool = False
        self.refs: Set[Tuple[str, str]] = set()  # set of (entity_type, entity_id)


class PrefixTrie:
    """
    Prefix Trie supporting O(L) prefix search where L is the length of the query token.
    Each terminal node stores entity references (entity_type, entity_id).
    """

    def __init__(self):
        self.root = TrieNode()
        self._lock = threading.RLock()

    def insert(self, word: str, entity_type: str, entity_id: str) -> None:
        if not word:
            return
        word = word.lower().strip()
        with self._lock:
            curr = self.root
            for ch in word:
                if ch not in curr.children:
                    curr.children[ch] = TrieNode()
                curr = curr.children[ch]
            curr.is_end = True
            curr.refs.add((entity_type, entity_id))

    def search_prefix(self, prefix: str, max_refs: int = 50) -> Set[Tuple[str, str]]:
        """
        Traverse to the node for the prefix in O(L) time, then collect
        all entity references in the subtree via Depth-First Search.
        """
        if not prefix:
            return set()
        prefix = prefix.lower().strip()
        results: Set[Tuple[str, str]] = set()

        with self._lock:
            curr = self.root
            for ch in prefix:
                if ch not in curr.children:
                    return results
                curr = curr.children[ch]

            # DFS / Stack to collect subtree refs
            stack = [curr]
            while stack and len(results) < max_refs:
                node = stack.pop()
                if node.is_end:
                    results.update(node.refs)
                    if len(results) >= max_refs:
                        break
                for child in node.children.values():
                    stack.append(child)

        return results

    def remove(self, word: str, entity_type: str, entity_id: str) -> None:
        """Removes an entity reference from the word in the Trie."""
        if not word:
            return
        word = word.lower().strip()
        ref = (entity_type, entity_id)
        with self._lock:
            curr = self.root
            for ch in word:
                if ch not in curr.children:
                    return
                curr = curr.children[ch]
            if ref in curr.refs:
                curr.refs.discard(ref)
                if not curr.refs:
                    curr.is_end = False


# ────────────────────────────────────────────────────────────────────
# 2. INVERTED INDEX (Multi-token In-Memory Index)
# ────────────────────────────────────────────────────────────────────

_TOKEN_RE = re.compile(r"[a-z0-9_]{2,}")


def tokenize(text: str) -> List[str]:
    """Tokenize string into normalized lowercase alphanumeric tokens."""
    if not text:
        return []
    return _TOKEN_RE.findall(text.lower())


class InvertedIndex:
    """
    Inverted Index mapping tokens to sets of entity references (entity_type, entity_id).
    Supports O(1) single-word lookups and set intersection for multi-term queries.
    """

    def __init__(self):
        self._index: Dict[str, Set[Tuple[str, str]]] = defaultdict(set)
        self._lock = threading.RLock()

    def add(self, token: str, entity_type: str, entity_id: str) -> None:
        with self._lock:
            self._index[token].add((entity_type, entity_id))

    def add_document(self, text: str, entity_type: str, entity_id: str) -> None:
        tokens = tokenize(text)
        ref = (entity_type, entity_id)
        with self._lock:
            for token in tokens:
                self._index[token].add(ref)

    def remove_document(self, text: str, entity_type: str, entity_id: str) -> None:
        tokens = tokenize(text)
        ref = (entity_type, entity_id)
        with self._lock:
            for token in tokens:
                if token in self._index:
                    self._index[token].discard(ref)
                    if not self._index[token]:
                        del self._index[token]

    def lookup(self, token: str) -> Set[Tuple[str, str]]:
        with self._lock:
            return set(self._index.get(token.lower(), set()))

    def query(self, query_str: str) -> Set[Tuple[str, str]]:
        """
        Tokenizes query string. Computes set intersection across tokens
        (or union if intersection is empty) to find relevant entities.
        """
        tokens = tokenize(query_str)
        if not tokens:
            return set()

        with self._lock:
            # Start with smallest posting list for optimal intersection efficiency
            token_sets = [self._index.get(t, set()) for t in tokens if t in self._index]
            if not token_sets:
                return set()

            # Sort by set size ascending for minimal intersection comparisons
            token_sets.sort(key=len)
            intersection = set(token_sets[0])
            for s in token_sets[1:]:
                intersection.intersection_update(s)
                if not intersection:
                    break

            # If strict intersection yields results, return them
            if intersection:
                return intersection

            # Otherwise return union of matches for fuzzy partial relevance
            union_set: Set[Tuple[str, str]] = set()
            for s in token_sets:
                union_set.update(s)
            return union_set


# ────────────────────────────────────────────────────────────────────
# 3. THREAD-SAFE LRU CACHE (Doubly Linked List + Hash Map)
# ────────────────────────────────────────────────────────────────────

class DListNode:
    __slots__ = ("key", "val", "expire_at", "prev", "next")

    def __init__(self, key: Any = None, val: Any = None, expire_at: float = 0.0):
        self.key = key
        self.val = val
        self.expire_at = expire_at
        self.prev: Optional["DListNode"] = None
        self.next: Optional["DListNode"] = None


class LRUCache:
    """
    Thread-safe Least Recently Used (LRU) Cache.
    Implemented with a Doubly Linked List and a Hash Map for strict O(1) get and put.
    Includes optional TTL (Time To Live) expiration.
    """

    def __init__(self, capacity: int = 256, default_ttl: Optional[float] = None):
        self.capacity = max(1, capacity)
        self.default_ttl = default_ttl
        self._map: Dict[Any, DListNode] = {}
        self._lock = threading.RLock()

        # Sentinel head and tail nodes
        self._head = DListNode()
        self._tail = DListNode()
        self._head.next = self._tail
        self._tail.prev = self._head

    def _add_to_front(self, node: DListNode) -> None:
        """Insert node right after head (most recently used position)."""
        node.prev = self._head
        node.next = self._head.next
        self._head.next.prev = node
        self._head.next = node

    def _remove_node(self, node: DListNode) -> None:
        """Unlink node from doubly linked list."""
        if node.prev and node.next:
            node.prev.next = node.next
            node.next.prev = node.prev
            node.prev = None
            node.next = None

    def _move_to_front(self, node: DListNode) -> None:
        """Move existing node to the most recently used position."""
        self._remove_node(node)
        self._add_to_front(node)

    def _pop_tail(self) -> Optional[DListNode]:
        """Evict the least recently used node (immediately before tail)."""
        res = self._tail.prev
        if res and res is not self._head:
            self._remove_node(res)
            return res
        return None

    def get(self, key: Any) -> Optional[Any]:
        """Fetch item by key in O(1). Returns None if absent or expired."""
        with self._lock:
            node = self._map.get(key)
            if not node:
                return None

            now = time.time()
            if node.expire_at and now > node.expire_at:
                # Expired: remove and return None
                self._remove_node(node)
                del self._map[key]
                return None

            self._move_to_front(node)
            return node.val

    def put(self, key: Any, val: Any, ttl: Optional[float] = None) -> None:
        """Insert or update item in O(1). Evicts LRU item if capacity is reached."""
        effective_ttl = ttl if ttl is not None else self.default_ttl
        expire_at = (time.time() + effective_ttl) if effective_ttl else 0.0

        with self._lock:
            node = self._map.get(key)
            if node:
                node.val = val
                node.expire_at = expire_at
                self._move_to_front(node)
            else:
                if len(self._map) >= self.capacity:
                    evicted = self._pop_tail()
                    if evicted and evicted.key in self._map:
                        del self._map[evicted.key]

                new_node = DListNode(key, val, expire_at)
                self._map[key] = new_node
                self._add_to_front(new_node)

    def invalidate(self, key: Any) -> None:
        """Remove a specific key in O(1)."""
        with self._lock:
            node = self._map.pop(key, None)
            if node:
                self._remove_node(node)

    def clear(self) -> None:
        """Clear all entries."""
        with self._lock:
            self._map.clear()
            self._head.next = self._tail
            self._tail.prev = self._head

    def __len__(self) -> int:
        with self._lock:
            return len(self._map)


# ────────────────────────────────────────────────────────────────────
# 4. BOUNDED PRIORITY QUEUE / MIN-HEAP (O(N log K) Top-K Ranking)
# ────────────────────────────────────────────────────────────────────

class PriorityFeedRanker:
    """
    Maintains a bounded min-heap of size K to efficiently extract top-K items
    in O(N log K) time and O(K) space, avoiding full O(N log N) sorts.
    """

    @staticmethod
    def top_k(items: List[Dict[str, Any]], k: int, score_fn) -> List[Dict[str, Any]]:
        """
        Returns the top k items ordered by score descending.
        Uses Python's heapq algorithm with a bounded min-heap.
        """
        if not items or k <= 0:
            return []
        if len(items) <= k:
            return sorted(items, key=score_fn, reverse=True)

        # Min-heap of tuples: (score, tie_breaker_id, item)
        # Using item index or id as secondary element for deterministic comparison
        heap: List[Tuple[float, int, Dict[str, Any]]] = []

        for idx, item in enumerate(items):
            score = float(score_fn(item))
            if len(heap) < k:
                heapq.heappush(heap, (score, idx, item))
            else:
                if score > heap[0][0]:
                    heapq.heapreplace(heap, (score, idx, item))

        # Extract and sort in descending order
        result = []
        while heap:
            _, _, item = heapq.heappop(heap)
            result.append(item)
        result.reverse()
        return result


    @staticmethod

    def compute_academic_score(
        post: Dict[str, Any],
        viewer_id: Optional[str] = None,
        peer_graph: Optional["PeerGraph"] = None
    ) -> float:
        """
        Computes high-yield academic ranking score based on:
        - Content type weights: youtube_course (1.5x), hackathon (1.3x), tweet/notes (1.0x)
        - Peer engagement: likes * 2.0 + reposts * 3.0 + comments * 2.5
        - 1st-degree studymate author boost (+15.0) and 2nd-degree mutual boost (+7.5)
        - Classic time-decay curve: base_score / ((hours_since_creation + 2) ** 1.15)
        """
        post_type = str(post.get("post_type", "tweet"))
        type_weight = 1.5 if post_type == "youtube_course" else (1.3 if post_type == "hackathon" else 1.0)

        likes = float(post.get("likes_count", 0) or 0)
        reposts = float(post.get("reposts_count", 0) or 0)
        comments = float(post.get("comments_count", 0) or 0)

        raw_engagement = (likes * 2.0) + (reposts * 3.0) + (comments * 2.5) + 5.0  # base 5.0
        weighted_score = raw_engagement * type_weight

        # Peer network social boost
        author_id = str(post.get("user_id", ""))
        if viewer_id and author_id and peer_graph:
            if peer_graph.are_connected(viewer_id, author_id):
                weighted_score += 15.0
            elif len(peer_graph.get_mutual_peers(viewer_id, author_id)) > 0:
                weighted_score += 7.5

        # Time decay
        try:
            created_at = float(post.get("created_at", time.time()))
        except Exception:
            created_at = time.time()

        elapsed_hours = max(0.0, (time.time() - created_at) / 3600.0)
        decayed_score = weighted_score / ((elapsed_hours + 2.0) ** 1.15)

        return round(decayed_score, 4)




# ────────────────────────────────────────────────────────────────────
# 5. SOCIAL CONNECTION GRAPH (Adjacency List & BFS)
# ────────────────────────────────────────────────────────────────────

class PeerGraph:
    """
    In-memory graph with adjacency list representation for user connections.
    Provides:
    - O(1) connection check
    - O(1) neighbor retrieval
    - O(min(deg(u), deg(v))) mutual peer calculation
    - O(V + E) BFS traversal for peer recommendations
    """

    def __init__(self):
        self._adj: Dict[str, Set[str]] = defaultdict(set)
        self._lock = threading.RLock()

    def add_edge(self, u: str, v: str) -> None:
        """Add undirected connection between u and v."""
        if not u or not v or u == v:
            return
        with self._lock:
            self._adj[u].add(v)
            self._adj[v].add(u)

    def remove_edge(self, u: str, v: str) -> None:
        """Remove connection between u and v."""
        with self._lock:
            self._adj[u].discard(v)
            self._adj[v].discard(u)

    def are_connected(self, u: str, v: str) -> bool:
        """O(1) check if u and v are connected."""
        with self._lock:
            return v in self._adj.get(u, set())

    def get_peers(self, u: str) -> Set[str]:
        """O(1) returns copy of user u's connected peers."""
        with self._lock:
            return set(self._adj.get(u, set()))

    def get_neighbors(self, u: str) -> Set[str]:
        """Alias for get_peers in standard graph traversal."""
        return self.get_peers(u)

    def get_mutual_peers(self, u: str, v: str) -> Set[str]:
        """Compute intersection of peers in O(min(deg(u), deg(v)))."""
        with self._lock:
            peers_u = self._adj.get(u, set())
            peers_v = self._adj.get(v, set())
            return peers_u.intersection(peers_v)

    def bfs_recommendations(self, start_user: str, max_depth: int = 2, limit: int = 10) -> List[str]:
        """
        Breadth-First Search (BFS) to discover second-degree connections (friends-of-friends).
        Ranks candidates by number of mutual connections.
        """
        if not start_user:
            return []

        with self._lock:
            direct_peers = self._adj.get(start_user, set())
            visited = {start_user} | direct_peers
            candidate_counts: Dict[str, int] = defaultdict(int)

            # Queue: (user_id, depth)
            queue = [(p, 1) for p in direct_peers]

            while queue:
                curr_user, depth = queue.pop(0)
                if depth >= max_depth:
                    continue

                for neighbor in self._adj.get(curr_user, set()):
                    if neighbor not in visited:
                        candidate_counts[neighbor] += 1

            # Sort candidate recommendations by highest mutual peer count
            sorted_candidates = sorted(candidate_counts.items(), key=lambda x: x[1], reverse=True)
            return [uid for uid, _ in sorted_candidates[:limit]]

    def clear(self) -> None:
        with self._lock:
            self._adj.clear()


# ────────────────────────────────────────────────────────────────────
# 6. UNIFIED INTERNAL DSA ENGINE (Facade Singleton)
# ────────────────────────────────────────────────────────────────────

class UnifiedDSAEngine:
    """
    Internal high-performance engine integrating Trie, Inverted Index,
    LRU Caches, Priority Queue Ranker, and Peer Graph.
    Operates strictly internally with zero frontend exposure and zero API schema change.
    """

    def __init__(self):
        self.trie = PrefixTrie()
        self.inverted_index = InvertedIndex()
        self.peer_graph = PeerGraph()

        # Entity store: (entity_type, entity_id) -> dict representation
        self.entity_store: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self._store_lock = threading.RLock()

        # Internal LRU Caches with tuned capacities and TTLs
        self.search_cache = LRUCache(capacity=512, default_ttl=45.0)       # 45s query cache
        self.profile_cache = LRUCache(capacity=256, default_ttl=90.0)      # 90s profile cache
        self.community_cache = LRUCache(capacity=64, default_ttl=180.0)    # 3m community cache
        self.messages_cache = LRUCache(capacity=128, default_ttl=30.0)     # 30s messages cache

        self._warmed = False

    # ── Indexing Methods ──

    def index_entity(self, entity_type: str, item: Dict[str, Any], text_fields: List[str]) -> None:
        """Index a single entity into the Trie and Inverted Index, and store in entity_store."""
        entity_id = str(item.get("id", ""))
        if not entity_id:
            return

        ref = (entity_type, entity_id)
        with self._store_lock:
            self.entity_store[ref] = item

        # Build full searchable text
        tokens_to_add: Set[str] = set()
        for field in text_fields:
            val = str(item.get(field, "") or "")
            if val:
                # Add to trie
                words = val.lower().split()
                for w in words:
                    clean = re.sub(r"[^\w]", "", w)
                    if len(clean) >= 2:
                        self.trie.insert(clean, entity_type, entity_id)
                # Collect tokens for inverted index
                for t in tokenize(val):
                    tokens_to_add.add(t)

        for t in tokens_to_add:
            self.inverted_index.add(t, entity_type, entity_id)

    def remove_entity(self, entity_type: str, entity_id: str) -> None:
        """Remove entity from local store and invalidate associated search caches."""
        ref = (entity_type, entity_id)
        with self._store_lock:
            self.entity_store.pop(ref, None)
        self.search_cache.clear()

    # ── High-Performance Search ──

    def search(self, query: str, limit_per_type: int = 6) -> Dict[str, List[Dict[str, Any]]]:
        """
        High-performance multi-domain search using:
        1. O(1) LRU Cache lookup
        2. O(L) Prefix Trie + Inverted Index multi-token search
        3. O(1) entity store reconstruction
        Returns exact schema matching API expectations.
        """
        q = query.strip().lower()
        if not q:
            return {
                "posts": [],
                "quizzes": [],
                "problems": [],
                "communities": [],
                "classrooms": [],
                "people": []
            }

        # 1. Check LRU Cache
        cached = self.search_cache.get(q)
        if cached is not None:
            return cached

        # 2. Query Prefix Trie and Inverted Index
        matching_refs: Set[Tuple[str, str]] = set()

        # Try prefix trie on each word of query
        words = q.split()
        for w in words:
            clean = re.sub(r"[^\w]", "", w)
            if clean:
                trie_matches = self.trie.search_prefix(clean, max_refs=100)
                matching_refs.update(trie_matches)

        # Inverted index query for full query string
        inv_matches = self.inverted_index.query(q)
        matching_refs.update(inv_matches)

        # 3. Categorize results by entity_type up to limit_per_type
        categorized: Dict[str, List[Dict[str, Any]]] = {
            "posts": [],
            "quizzes": [],
            "problems": [],
            "communities": [],
            "classrooms": [],
            "people": []
        }

        with self._store_lock:
            seen_people_ids: Set[str] = set()
            for entity_type, entity_id in matching_refs:
                item = self.entity_store.get((entity_type, entity_id))
                if item and entity_type in categorized:
                    if entity_type == "people":
                        pid = str(item.get("id", ""))
                        if pid in seen_people_ids:
                            continue
                        seen_people_ids.add(pid)
                    if len(categorized[entity_type]) < limit_per_type:
                        categorized[entity_type].append(item)

        # Save to LRU Cache
        self.search_cache.put(q, categorized)
        return categorized

    # ── Warmup from SQLite Database ──

    def warmup_from_db(self, db_conn_factory) -> None:
        """Populate in-memory Trie, Inverted Index, Entity Store, and Peer Graph from DB."""
        try:
            with db_conn_factory() as conn:
                # 1. Posts
                posts = conn.execute("SELECT id, post_type, title, content, user_name FROM posts").fetchall()
                for p in posts:
                    self.index_entity("posts", dict(p), ["title", "content", "user_name"])

                # 2. Quizzes
                quizzes = conn.execute("SELECT id, title, description, exam_type, duration_minutes, rating_avg FROM quizzes").fetchall()
                for qz in quizzes:
                    self.index_entity("quizzes", dict(qz), ["title", "description", "exam_type"])

                # 3. Coding Problems
                problems = conn.execute("SELECT id, title, slug, difficulty, category FROM coding_problems").fetchall()
                for pr in problems:
                    self.index_entity("problems", dict(pr), ["title", "category", "slug"])

                # 4. Communities
                communities = conn.execute("SELECT id, name, description, avatar, members_count, category FROM communities").fetchall()
                for c in communities:
                    self.index_entity("communities", dict(c), ["name", "description", "category"])

                # 5. Classrooms
                classrooms = conn.execute(
                    "SELECT id, name, subject_code, department, university, description, cover_gradient FROM classrooms"
                ).fetchall()
                for cr in classrooms:
                    self.index_entity("classrooms", dict(cr), ["name", "subject_code", "department", "university", "description"])

                # 6. People / Users (Excluding admin accounts)
                people = conn.execute("SELECT id, name, username, handle, avatar, role, college, bio FROM users WHERE role != 'admin' AND banned = 0").fetchall()
                seen_uids: Set[str] = set()
                for u in people:
                    u_dict = dict(u)
                    if u_dict.get("handle") and not u_dict["handle"].startswith("@"):
                        u_dict["handle"] = "@" + u_dict["handle"]
                    if u_dict["id"] not in seen_uids:
                        seen_uids.add(u_dict["id"])
                        self.index_entity("people", u_dict, ["name", "username", "handle", "college", "role", "bio"])

                # 7. Studymate Connection Graph
                try:
                    connections = conn.execute("SELECT user_id, target_user_id FROM studymate_connections").fetchall()
                    for conn_row in connections:
                        self.peer_graph.add_edge(conn_row["user_id"], conn_row["target_user_id"])
                except Exception:
                    pass

            self._warmed = True
        except Exception as e:
            # Safe non-fatal fallback
            pass

    # ── Real-Time Synchronization Helpers ──

    def sync_user(self, user_dict: Dict[str, Any]) -> None:
        """Indexes or updates a user in in-memory search trie and invalidates search/profile caches."""
        if user_dict.get("role") != "admin":
            clean_u = dict(user_dict)
            if clean_u.get("handle") and not clean_u["handle"].startswith("@"):
                clean_u["handle"] = "@" + clean_u["handle"]
            self.index_entity("people", clean_u, ["name", "username", "handle", "college", "role", "bio"])
        self.search_cache.clear()
        uid = user_dict.get("id")
        if uid:
            self.profile_cache.invalidate(f"profile_base_{uid}")

    def sync_post(self, post_dict: Dict[str, Any]) -> None:
        """Indexes or updates a post in the in-memory search trie and clears search cache."""
        self.index_entity("posts", post_dict, ["title", "content", "user_name"])
        self.search_cache.clear()

    def sync_delete_post(self, post_id: str) -> None:
        """Removes a post from in-memory engine and clears search cache."""
        self.remove_entity("posts", post_id)

    def sync_quiz(self, quiz_dict: Dict[str, Any]) -> None:
        self.index_entity("quizzes", quiz_dict, ["title", "description", "exam_type"])
        self.search_cache.clear()

    def sync_problem(self, problem_dict: Dict[str, Any]) -> None:
        self.index_entity("problems", problem_dict, ["title", "category", "slug"])
        self.search_cache.clear()

    def sync_community(self, comm_dict: Dict[str, Any]) -> None:
        self.index_entity("communities", comm_dict, ["name", "description", "category"])
        self.search_cache.clear()

    def sync_classroom(self, class_dict: Dict[str, Any]) -> None:
        self.index_entity("classrooms", class_dict, ["name", "subject_code", "department", "university", "description"])
        self.search_cache.clear()

    def sync_connection(self, user_a: str, user_b: str) -> None:
        self.peer_graph.add_edge(user_a, user_b)
        self.profile_cache.invalidate(user_a)
        self.profile_cache.invalidate(user_b)

    def sync_disconnection(self, user_a: str, user_b: str) -> None:
        self.peer_graph.remove_edge(user_a, user_b)
        self.profile_cache.invalidate(user_a)
        self.profile_cache.invalidate(user_b)


# ────────────────────────────────────────────────────────────────────
# 7. SLIDING-WINDOW IN-MEMORY RATE LIMITER
# ────────────────────────────────────────────────────────────────────

from collections import deque

class SlidingWindowRateLimiter:
    """
    Thread-safe, sub-millisecond in-memory sliding window rate limiter.
    Maintains timestamp deques per client identifier (IP or user ID).
    """

    def __init__(self):
        self._windows: Dict[str, deque] = defaultdict(deque)
        self._lock = threading.RLock()

    def is_allowed(self, key: str, max_requests: int = 30, window_seconds: float = 60.0) -> bool:
        """
        Returns True if the request is permitted within the rate window, False otherwise.
        Automatically evicts expired timestamps in O(1) amortized time.
        """
        now = time.time()
        threshold = now - window_seconds
        with self._lock:
            q = self._windows[key]
            while q and q[0] < threshold:
                q.popleft()
            if len(q) < max_requests:
                q.append(now)
                return True
            return False

    def reset(self, key: str) -> None:
        with self._lock:
            self._windows.pop(key, None)


# Singleton instances
engine = UnifiedDSAEngine()
rate_limiter = SlidingWindowRateLimiter()

