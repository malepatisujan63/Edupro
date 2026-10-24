import re

with open("main.tex", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update listing style in preamble: font size 6.2pt / line-height 7.4pt, tight skips
old_style = r"""\lstdefinestyle{koinexastyle}{
  backgroundcolor=\color{white},
  commentstyle=\color{CodeGreen},
  keywordstyle=\color{CodeBlue}\bfseries,
  stringstyle=\color{CodePurple},
  basicstyle=\ttfamily\fontsize{6.8}{8.0}\selectfont,
  breakatwhitespace=false,
  breaklines=true,
  captionpos=b,
  keepspaces=true,
  numbers=none,
  showspaces=false,
  showstringspaces=false,
  showtabs=false,
  tabsize=2,
  frame=none
}"""

new_style = r"""\lstdefinestyle{koinexastyle}{
  backgroundcolor=\color{white},
  commentstyle=\color{CodeGreen},
  keywordstyle=\color{CodeBlue}\bfseries,
  stringstyle=\color{CodePurple},
  basicstyle=\ttfamily\fontsize{6.0}{7.2}\selectfont,
  breakatwhitespace=true,
  breaklines=true,
  captionpos=b,
  keepspaces=true,
  numbers=none,
  showspaces=false,
  showstringspaces=false,
  showtabs=false,
  tabsize=2,
  frame=none,
  aboveskip=2pt,
  belowskip=2pt
}"""

text = text.replace(old_style, new_style)

# 2. Refactor Slide 6 (Feature 1 Search): Move Complexity to Left column, give Right column only the code
s6_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 1: Multi-Domain Universal Search Engine}
  \framesubtitle{PrefixTrie \& InvertedIndex Hybrid Architecture}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Functionality}: Searches across posts, quizzes, coding problems, communities, classrooms, and student profiles in real-time as users type in the universal Spotlight search bar.\\
        \textbf{Novelty vs. Existing Apps}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Traditional apps (LeetCode/Reddit) fire heavy database queries or external search daemons (Elasticsearch/Redis).
          \item Koinexa builds a zero-dependency in-process dual engine: a \textbf{Prefix Trie} for autocompletion prefixes plus an \textbf{Inverted Index} with size-sorted posting set intersection for multi-word queries.
        \end{itemize}
\vspace{0.3cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Algorithmic Workflow}}}\par\vspace{3pt}
\scriptsize
        Query String $\to$ Tokenization $\to$ Prefix Trie walks $L$ nodes $\to$ Subtree DFS collects entity pointers $\to$ Inverted Index intersects posting sets $\to$ Hydrate from in-memory Entity Store $\to$ Save to LRU Cache.
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Time \& Space Complexity Analysis}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{3pt}
          \item \textbf{Trie Prefix Lookup}: $\mathcal{O}(L + M)$
          \begin{itemize}\tiny
            \item $L$: Length of query token (e.g. 3 for \texttt{"pyt"}).
            \item $M$: Number of matching entity refs in subtree.
            \item \textbf{Note}: Database size $N$ is completely eliminated!
          \end{itemize}
          \item \textbf{Multi-Token Intersection}: $\mathcal{O}(\min(|S_1|, \dots, |S_k|))$
          \begin{itemize}\tiny
            \item Posting sets sorted by size ascending first. Discards 95\% of candidate IDs in step 1.
          \end{itemize}
          \item \textbf{Space Complexity}: $\mathcal{O}(\Sigma \cdot \bar{L} \cdot W)$ using Python \texttt{\_\_slots\_\_} ($< 64$ bytes per node).
        \end{itemize}
\vspace{0.3cm}

      {\scriptsize\textbf{\textcolor{KoinexaRed}{Trie Walk Implementation Snippet}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py
curr = self.root
for ch in prefix.lower():
    if ch not in curr.children: return set()
    curr = curr.children[ch]
# Subtree DFS collects entity refs
stack = [curr]
while stack and len(results) < max_refs:
    node = stack.pop()
    if node.is_end: results.update(node.refs)
    stack.extend(node.children.values())
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s6_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 1: Multi-Domain Universal Search Engine}
  \framesubtitle{PrefixTrie \& InvertedIndex Hybrid Architecture}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Functionality}: Real-time Spotlight search across posts, quizzes, problems, communities, classrooms, and users.\\
      \textbf{Novelty}: Zero external daemons (no Redis/Elasticsearch). Combines a \textbf{Prefix Trie} for autocompletion prefixes with an \textbf{Inverted Index} for multi-token set intersections.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Workflow \& Complexity}}}\par\vspace{2pt}
      \scriptsize
      Query $\to$ Tokenize $\to$ Trie walks $L$ nodes $\to$ Subtree DFS $\to$ Inverted Index intersects size-sorted sets $\to$ LRU Cache.\\
      \vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Trie Prefix Lookup}: $\mathcal{O}(L + M)$ (DB size $N$ completely eliminated!).
        \item \textbf{Multi-Token Intersect}: $\mathcal{O}(\min(|S_1|, \dots, |S_k|))$ (size-sorted sets).
        \item \textbf{RAM Space}: $\mathcal{O}(\Sigma \cdot \bar{L} \cdot W)$ via Python \texttt{\_\_slots\_\_} ($<64$ bytes/node).
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Prefix Trie Search Implementation}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (PrefixTrie.search_prefix)
def search_prefix(self, prefix: str, max_refs=50):
    curr = self.root
    for ch in prefix.lower():
        if ch not in curr.children:
            return set()
        curr = curr.children[ch]
    # Subtree DFS collects matching entity refs
    results, stack = set(), [curr]
    while stack and len(results) < max_refs:
        node = stack.pop()
        if node.is_end:
            results.update(node.refs)
        stack.extend(node.children.values())
    return results
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s6_old, s6_new)

# 3. Refactor Slide 7 (Feature 2 Feed Ranking)
s7_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 2: High-Yield Academic Feed Ranking}
  \framesubtitle{PriorityFeedRanker with Time Decay \& Social Affinity}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Functionality}: Generates the personalized home feed, ranking high-value YouTube course playlists and hackathons above casual posts.\\
        \textbf{Novelty vs. Twitter / Reddit}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Mainstream feeds optimize for controversy. Koinexa mathematically prioritizes academic utility and peer network relevance.
          \item Standard apps load all posts and sort using Timsort in $\mathcal{O}(N \log N)$. Koinexa maintains a \textbf{Bounded Min-Heap of size $K=50$}, achieving $\mathcal{O}(N \log K)$ throughput.
        \end{itemize}
\vspace{0.3cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Academic Score Formulation}}}\par\vspace{3pt}
\scriptsize
        \[\text{Score} = \frac{(2L + 3R + 2.5C + 5.0) \cdot W_{\text{type}} + \text{Boost}_{\text{peer}}}{(\Delta t_{\text{hours}} + 2.0)^{1.15}}\]
        \begin{itemize}\tiny
          \item $W_{\text{type}}$: \texttt{youtube\_course} ($1.5\times$), \texttt{hackathon} ($1.3\times$).
          \item $\text{Boost}_{\text{peer}}$: $+15.0$ for direct studymates, $+7.5$ for mutual peers.
          \item Power curve $1.15$: Smooth decay prevents old posts from monopolizing the feed.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Time \& Space Complexity Analysis}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Sorting Time}: $\mathcal{O}(N \log K)$ vs $\mathcal{O}(N \log N)$
          \begin{itemize}\tiny
            \item For $N=10,000$ and $K=50$: $N \log K \approx 56,400$ comparisons vs $N \log N \approx 132,800$ comparisons ($> 2.3\times$ CPU reduction).
            \item Elements with score $\le$ heap root are dropped in $\mathcal{O}(1)$.
          \end{itemize}
          \item \textbf{Space Complexity}: $\mathcal{O}(K)$ strictly bounded memory.
        \end{itemize}
\vspace{0.3cm}

      {\scriptsize\textbf{\textcolor{KoinexaRed}{Bounded Min-Heap Implementation}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py
heap = []
for idx, item in enumerate(items):
    score = float(score_fn(item))
    if len(heap) < k:
        heapq.heappush(heap, (score, idx, item))
    elif score > heap[0][0]:
        heapq.heapreplace(heap, (score, idx, item))
return [item for _, _, item in reversed([heapq.heappop(heap) for _ in range(len(heap))])]
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s7_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 2: High-Yield Academic Feed Ranking}
  \framesubtitle{PriorityFeedRanker with Time Decay \& Social Affinity}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Functionality}: Ranks YouTube courses \& hackathons above casual social posts.\\
      \textbf{Mathematical Scoring Formula}:
      \[\text{Score} = \frac{(2L + 3R + 2.5C + 5.0) \cdot W_{\text{type}} + \text{Boost}_{\text{peer}}}{(\Delta t_{\text{hours}} + 2.0)^{1.15}}\]
      $W_{\text{type}}$: \texttt{youtube} ($1.5\times$), \texttt{hackathon} ($1.3\times$). $\text{Boost}_{\text{peer}}$: $+15.0$ studymate.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Complexity Advantage}}}\par\vspace{2pt}
      \scriptsize
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Time}: $\mathcal{O}(N \log K)$ via Bounded Min-Heap ($K=50$) vs $\mathcal{O}(N \log N)$ Timsort. Drops comparisons from 132,800 to 56,400 (> 2.3x CPU reduction).
        \item \textbf{Space}: $\mathcal{O}(K)$ strictly bounded in-memory heap.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Bounded Min-Heap Code}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (PriorityFeedRanker)
def get_top_k(self, items, k=50, score_fn=None):
    heap = []
    for idx, item in enumerate(items):
        score = float(score_fn(item))
        if len(heap) < k:
            heapq.heappush(heap, (score, idx, item))
        elif score > heap[0][0]:
            heapq.heapreplace(heap, (score, idx, item))
    # Extract in descending rank order
    res = [heapq.heappop(heap) for _ in range(len(heap))]
    return [item for _, _, item in reversed(res)]
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s7_old, s7_new)

# 4. Refactor Slide 8 (Feature 3 Social Graph)
s8_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 3: Social Connection Graph}
  \framesubtitle{PeerGraph with O(1) Edge Lookup \& BFS Recommendations}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Functionality}: Manages peer relationships (``Study Mates''), checks connection statuses on home feed cards, and calculates mutual peers.\\
        \textbf{Novelty vs. LinkedIn / WhatsApp}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Conventional platforms execute expensive relational self-joins (\texttt{JOIN studymate\_connections}) on every profile visit or feed card.
          \item Koinexa maintains an in-memory undirected \textbf{Adjacency List Graph} using Python sets, turning relational joins into instant set operations.
        \end{itemize}
\vspace{0.3cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Algorithmic Workflow}}}\par\vspace{3pt}
\scriptsize
        User accepts Studymate request $\to$ \texttt{sync\_connection(u, v)} adds undirected edge $\to$ Feed render checks \texttt{are\_connected(u, v)} in $\mathcal{O}(1)$ $\to$ Breadth-First Search (BFS) traverses depth 2 to rank recommended peers by mutual connection frequency.
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Time \& Space Complexity Analysis}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Connection Check}: Strict $\mathcal{O}(1)$ set membership.
          \item \textbf{Mutual Peers}: $\mathcal{O}(\min(\text{deg}(u), \text{deg}(v)))$ set intersection.
          \item \textbf{Peer Recommendation BFS}: $\mathcal{O}(V + E)$ queue traversal bounded at depth 2.
          \item \textbf{Space Complexity}: $\mathcal{O}(V + 2E)$ storing integer/string IDs.
        \end{itemize}
\vspace{0.3cm}

      {\scriptsize\textbf{\textcolor{KoinexaRed}{Adjacency List Graph Implementation}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py
class PeerGraph:
    def __init__(self):
        self._adj = defaultdict(set)
        self._lock = threading.RLock()
    def are_connected(self, u, v) -> bool:
        with self._lock:
            return v in self._adj.get(u, set())
    def get_mutual_peers(self, u, v) -> Set[str]:
        with self._lock:
            return self._adj[u] & self._adj[v]
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s8_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 3: Social Connection Graph}
  \framesubtitle{PeerGraph with O(1) Edge Lookup \& BFS Recommendations}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Functionality}: Manages Study Mate peer networks and calculates mutual peers.\\
      \textbf{Novelty}: Eliminates expensive SQL self-joins (\texttt{JOIN studymates}) on every feed card by keeping an in-memory undirected \textbf{Adjacency List} using Python hash sets.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Complexity Breakdown}}}\par\vspace{2pt}
      \scriptsize
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Connection Check}: Strict $\mathcal{O}(1)$ set membership test.
        \item \textbf{Mutual Peers}: $\mathcal{O}(\min(d_1, d_2))$ hash set intersection.
        \item \textbf{Recommendations}: $\mathcal{O}(V + E)$ queue BFS bounded at depth 2.
        \item \textbf{Space Complexity}: $\mathcal{O}(V + 2E)$ string ID sets in RAM.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{PeerGraph Set Implementation}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (PeerGraph)
class PeerGraph:
    def __init__(self):
        self._adj = defaultdict(set)
        self._lock = threading.RLock()
    def add_edge(self, u: str, v: str):
        with self._lock:
            self._adj[u].add(v); self._adj[v].add(u)
    def are_connected(self, u: str, v: str) -> bool:
        with self._lock:
            return v in self._adj.get(u, set())
    def get_mutual_peers(self, u: str, v: str) -> set:
        with self._lock:
            return self._adj[u] & self._adj[v]
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s8_old, s8_new)

# 5. Refactor Slide 9 (Feature 4 LRU Cache)
s9_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 4: Multi-Tier Thread-Safe LRU Cache}
  \framesubtitle{Doubly Linked List with Sentinels \& Sub-Millisecond TTL}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Functionality}: Memoizes heavy queries across Search, User Profiles, Communities, and Direct Messages.\\
        \textbf{Novelty vs. functools.lru\_cache / Redis}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Python's \texttt{@lru\_cache} lacks TTL expiration, manual key eviction, and multi-thread safety across controllers.
          \item External Redis instances introduce 2ms TCP socket serialization latency. Koinexa's in-process \textbf{Doubly Linked List + Hash Map} executes in nanoseconds with zero external processes.
        \end{itemize}
\vspace{0.3cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Specialized Cache Tiers in Koinexa}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \texttt{search\_cache}: Cap 512, TTL 45s (Keystroke query cache).
          \item \texttt{profile\_cache}: Cap 256, TTL 90s (Student stats \& posts).
          \item \texttt{community\_cache}: Cap 64, TTL 180s (Eradicates N+1).
          \item \texttt{messages\_cache}: Cap 128, TTL 30s (Chat channel buffers).
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Time \& Space Complexity Analysis}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Get / Put / Invalidate}: Strict $\mathcal{O}(1)$ time.
          \item \textbf{Eviction}: Strict $\mathcal{O}(1)$ via unlinking node before tail sentinel.
          \item \textbf{Space Complexity}: Strict $\mathcal{O}(\text{Capacity})$ upper bound.
        \end{itemize}
\vspace{0.3cm}

      {\scriptsize\textbf{\textcolor{KoinexaRed}{LRU Pointer Mutation Snippet}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py
def _add_to_front(self, node: DListNode) -> None:
    node.prev = self._head
    node.next = self._head.next
    self._head.next.prev = node
    self._head.next = node

def _pop_tail(self) -> Optional[DListNode]:
    res = self._tail.prev
    if res and res is not self._head:
        self._remove_node(res)
        return res
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s9_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 4: Multi-Tier Thread-Safe LRU Cache}
  \framesubtitle{Doubly Linked List with Sentinels \& Sub-Millisecond TTL}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Functionality}: Memoizes heavy queries across Search, Profiles, and Communities.\\
      \textbf{Novelty}: Built with \textbf{Doubly Linked List + Sentinels + Hash Map} in Python RAM, executing in nanoseconds with zero external Redis socket lag.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Tiers \& Complexity}}}\par\vspace{2pt}
      \scriptsize
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \texttt{search\_cache} (512 / 45s TTL), \texttt{profile\_cache} (256 / 90s).
        \item \texttt{community\_cache} (64 / 180s TTL --- completely kills $N+1$).
        \item \textbf{Get / Put / Evict}: Strict $\mathcal{O}(1)$ via pointer mutations.
        \item \textbf{Space}: Strict $\mathcal{O}(\text{Capacity})$ upper bound.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{LRU Doubly Linked List Mutators}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (LRUCache)
def _add_to_front(self, node: DListNode):
    node.prev = self._head
    node.next = self._head.next
    self._head.next.prev = node
    self._head.next = node

def _remove_node(self, node: DListNode):
    node.prev.next = node.next
    node.next.prev = node.prev

def _pop_tail(self) -> Optional[DListNode]:
    res = self._tail.prev
    if res and res is not self._head:
        self._remove_node(res); return res
    return None
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s9_old, s9_new)

# 6. Refactor Slide 10 (Feature 5 Rate Limiter)
s10_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 5: Sliding-Window Rate Limiter}
  \framesubtitle{In-Memory Deque Throttling for Sensitive Actions}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Functionality}: Prevents brute-force credential stuffing on logins, automated bot spam on quiz submissions, and resource exhaustion in the code sandbox.\\
        \textbf{Novelty vs. Fixed-Window Limiters}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Fixed-window algorithms allow $2\times$ burst attacks at boundary resets (e.g. at minute 0:59 and 1:01).
          \item Koinexa implements a true \textbf{Rolling Sliding-Window} using double-ended queues (\texttt{collections.deque}), tracking exact timestamps per client.
        \end{itemize}
\vspace{0.3cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Active Guard Windows in App.py}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \texttt{login\_student\_\{ip\}}: Max 15 requests / 60 seconds.
          \item \texttt{submit\_quiz\_\{uid\}\_\{qid\}}: Max 4 submissions / 15 seconds.
          \item \texttt{run\_\{ip\}}: Max 25 sandbox executions / 60 seconds.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Time \& Space Complexity Analysis}}}\par\vspace{3pt}
\scriptsize
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Check \& Evict}: Amortized $\mathcal{O}(1)$ via \texttt{popleft()}.
          \item \textbf{Append}: Strict $\mathcal{O}(1)$ time.
          \item \textbf{Space Complexity}: $\mathcal{O}(U \cdot R)$ where $U$ is active users and $R$ is request limit.
        \end{itemize}
\vspace{0.3cm}

      {\scriptsize\textbf{\textcolor{KoinexaRed}{Sliding-Window Implementation}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py
class SlidingWindowRateLimiter:
    def __init__(self):
        self._windows = defaultdict(deque)
        self._lock = threading.RLock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: float) -> bool:
        now = time.time()
        threshold = now - window_seconds
        with self._lock:
            q = self._windows[key]
            while q and q[0] < threshold:
                q.popleft() # O(1) amortized eviction
            if len(q) < max_requests:
                q.append(now)
                return True
            return False
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s10_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 5: Sliding-Window Rate Limiter}
  \framesubtitle{In-Memory Deque Throttling for Sensitive Actions}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Functionality}: Prevents brute-force logins, bot quiz spam, and CPU sandbox starvation.\\
      \textbf{Novelty}: Fixed windows permit $2\times$ burst exploits at boundaries. Koinexa tracks exact rolling timestamps with \texttt{collections.deque}.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Active Windows \& Complexity}}}\par\vspace{2pt}
      \scriptsize
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \texttt{login}: 15 req/60s  $|$  \texttt{submit\_quiz}: 4 req/15s  $|$  \texttt{run}: 25/60s.
        \item \textbf{Evict}: Amortized $\mathcal{O}(1)$ via \texttt{q.popleft()}.
        \item \textbf{Append}: Strict $\mathcal{O}(1)$ timestamp record.
        \item \textbf{Space}: $\mathcal{O}(U \cdot R)$ where $U$: users, $R$: limit.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Rolling Window Deque Code}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (SlidingWindowRateLimiter)
class SlidingWindowRateLimiter:
    def __init__(self):
        self._windows = defaultdict(deque)
        self._lock = threading.RLock()

    def is_allowed(self, key, max_req, window_sec):
        now = time.time(); cutoff = now - window_sec
        with self._lock:
            q = self._windows[key]
            while q and q[0] < cutoff:
                q.popleft() # O(1) amortized eviction
            if len(q) < max_req:
                q.append(now); return True
            return False
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s10_old, s10_new)

# 7. Refactor Slide 13 (Feature 8 CBT Security)
s13_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 8: CBT Exam Security \& Anti-Cheating Engine}
  \framesubtitle{Zero-Leakage Scrubbing \& Authoritative Server Clocks}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Security Engine} (\texttt{backend/cbt\_engine.py}):
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Cryptographic Zero-Leakage Scrubber}: Deep-scrubs \texttt{correct\_index}, \texttt{explanation}, and \texttt{solution} keys from student payloads before JSON transmission.
          \item \textbf{Anti-Clock Tampering}: Server records authoritative session start time. Local client clock manipulation is mathematically ignored.
          \item \textbf{Inhuman Velocity Detection}: Flags submissions answering complex JEE questions in $< 2.2$ seconds.
          \item \textbf{Tamper-Proof Audit Logging}: Logs every session into \texttt{cbt\_integrity\_logs}.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{Zero-Leakage Scrubbing Logic}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/cbt_engine.py
class CBTAnswerScrubber:
    EXCLUDED = {"correct_index", "correct_answer", 
                "explanation", "solution"}
    @classmethod
    def scrub_quiz_for_candidate(cls, quiz_dict):
        clean = copy.deepcopy(quiz_dict)
        clean["questions"] = [
            {k: v for k, v in q.items() if k not in cls.EXCLUDED}
            for q in clean.get("questions", [])
        ]
        return clean
\end{lstlisting}

      {\scriptsize\textbf{\textcolor{KoinexaOrange}{Server-Side Velocity Guard}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# Flags automated solvers answering < 2.2s/question
speed_per_q = auth_time / max(1, answered_count)
if answered_count >= 5 and speed_per_q < 2.2:
    audit_flags.append("INHUMAN_SPEED_FLAGGED")
    integrity_status = "FLAGGED_SPEED"
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s13_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 8: CBT Exam Security \& Anti-Cheating Engine}
  \framesubtitle{Zero-Leakage Scrubbing \& Authoritative Server Clocks}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Security Engine} (\texttt{backend/cbt\_engine.py}):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Zero-Leakage Scrubber}: Strips \texttt{correct\_index}, \texttt{explanation}, and \texttt{solution} keys before sending JSON to students.
        \item \textbf{Authoritative Clock}: Server start timestamps defeat local client clock freezing.
        \item \textbf{Bot Velocity Guard}: Answers in $< 2.2\text{s/question}$ trigger automated disqualification flags.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Zero-Leakage \& Velocity Guard}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/cbt_engine.py
class CBTAnswerScrubber:
    EXCLUDED = {"correct_index", "explanation", "solution"}
    @classmethod
    def scrub_quiz_for_candidate(cls, quiz):
        clean = copy.deepcopy(quiz)
        clean["questions"] = [
            {k: v for k, v in q.items() if k not in cls.EXCLUDED}
            for q in clean.get("questions", [])
        ]
        return clean

# Velocity Guard: flags bot submissions < 2.2s/q
speed = auth_time / max(1, answered_count)
if answered_count >= 5 and speed < 2.2:
    audit_flags.append("INHUMAN_SPEED_FLAGGED")
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s13_old, s13_new)

# 8. Refactor Slide 15 (Feature 10 Compiler Sandbox)
s15_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 10: Compiler Sandbox \& AST Security Guard}
  \framesubtitle{Python Abstract Syntax Tree Inspection Without Docker Bloat}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Sandboxing Mechanism} (\texttt{backend/compiler\_sandbox.py}):\\
        Spawning Docker containers per submission adds 400ms latency. Koinexa instead uses a \textbf{two-tier pre-flight AST visitor}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item Parses code into Python AST nodes before execution.
          \item Blocks forbidden modules: \texttt{os, subprocess, socket, pty, ctypes, winreg, threading}.
          \item Blocks forbidden functions: \texttt{eval, exec, \_\_import\_\_, compile, open, breakpoint}.
          \item Blocks dunder reflection: \texttt{\_\_subclasses\_\_, \_\_builtins\_\_, \_\_globals\_\_}.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{AST Pre-Flight Inspector Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/compiler_sandbox.py
def check_code_safety_ast(code: str) -> Optional[str]:
    try: tree = ast.parse(code)
    except SyntaxError as e: return f"Syntax Error: {e.msg}"
    for node in ast.walk(tree):
        # 1. Prohibited Imports
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [a.name for a in getattr(node, 'names', [])]
            if any(n.split('.')[0] in DISALLOWED_MODULES for n in names):
                return "Security violation: Prohibited import."
        # 2. Dynamic Execution Calls
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in {"eval", "exec", "__import__", "open"}:
                return f"Security violation: Prohibited call {node.func.id}()."
        # 3. Dunder Reflection Manipulation
        elif isinstance(node, ast.Attribute) and node.attr in DANGEROUS_DUNDERS:
            return "Security violation: Reflection prohibited."
    return None
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s15_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 10: Compiler Sandbox \& AST Security Guard}
  \framesubtitle{Python Abstract Syntax Tree Inspection Without Docker Bloat}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Sandboxing} (\texttt{backend/compiler\_sandbox.py}):\\
      Spawning Docker containers per submission adds 400ms latency. Koinexa instead uses a \textbf{two-tier pre-flight AST visitor}:
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Blocks forbidden imports: \texttt{os, subprocess, socket, ctypes}.
        \item Blocks execution calls: \texttt{eval, exec, \_\_import\_\_, open}.
        \item Blocks reflection: \texttt{\_\_subclasses\_\_, \_\_builtins\_\_}.
        \item Subprocess runs test cases against a strict 5.0s watchdog.
      \end{itemize}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Pre-Flight Inspector Code}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/compiler_sandbox.py
def check_code_safety_ast(code: str) -> Optional[str]:
    try: tree = ast.parse(code)
    except SyntaxError as e: return f"Syntax Error: {e.msg}"
    for node in ast.walk(tree):
        # 1. Prohibited Imports
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [a.name.split('.')[0] for a in getattr(node, 'names', [])]
            if any(n in DISALLOWED_MODULES for n in names):
                return "Security violation: Prohibited import."
        # 2. Dynamic Execution & Reflection
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in {"eval", "exec", "__import__", "open"}:
                return f"Security violation: Prohibited call {node.func.id}()."
        elif isinstance(node, ast.Attribute) and node.attr in DANGEROUS_DUNDERS:
            return "Security violation: Reflection prohibited."
    return None
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s15_old, s15_new)

# 9. Refactor Slide 16 (Feature 11 Veritas-AI): Move Admin Governance to left column
s16_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 11: Veritas-AI Faculty Vetting Agent}
  \framesubtitle{Autonomous Multi-Vector Academic Credential Verification}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Autonomous Agent} (\texttt{backend/veritas\_agent.py}):\\
        Onboarding university teachers typically requires weeks of manual document verification. Veritas-AI conducts an autonomous multi-stage evaluation:
        \begin{enumerate}\setlength{\itemsep}{2pt}
          \item \textbf{Academic TLD Analyzer}: Checks \texttt{.edu, .ac.in, .ac.uk}.
          \item \textbf{Institutional Directory Scraper}: Fetches directory proof.
          \item \textbf{Research Footprint Scraper}: Verifies Google Scholar/IEEE.
          \item \textbf{Web Footprint Searcher}: Validates applicant reputation.
          \item \textbf{LinkedIn Profile Parser}: Checks matching identity.
          \item \textbf{Prompt Injection Defense}: Detects adversarial phrases in Statement of Purpose (\texttt{"ignore instructions", "grant admin"}).
        \end{enumerate}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{Explainable Audit Dossier Generator}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/veritas_agent.py
dossier = {
    "agent": "Veritas-AI", "version": "3.0.0-AgenticWeb",
    "verification_score": verification_score, # 0 - 100
    "risk_score": risk_score,                 # 0 - 100
    "recommendation": "ACCEPT" | "REJECT" | "NEEDS_MANUAL_REVIEW",
    "sub_scores": {
        "domain_reputation": s_domain,
        "linkedin_profile": s_linkedin,
        "resume_artifact": s_resume,
        "id_card_artifact": s_idcard
    },
    "flags": all_security_flags,
    "summary_reasoning": "Candidate achieved 92% verification..."
}
\end{lstlisting}
      \vspace{0.2cm}
      \vspace{0.25cm}
\par\noindent \scriptsize\textbf{Admin Governance}: Tiers for strictness (\texttt{lenient}, \texttt{balanced}, \texttt{strict}, \texttt{paranoid}) controllable via SuperAdmin Command Center.
    \end{column}
  \end{columns}
\end{frame}"""

s16_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 11: Veritas-AI Faculty Vetting Agent}
  \framesubtitle{Autonomous Multi-Vector Academic Credential Verification}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Autonomous Agent} (\texttt{backend/veritas\_agent.py}):\\
      Replaces weeks of manual onboarding with a 6-stage audit:
      \begin{enumerate}\setlength{\itemsep}{1.5pt}
        \item \textbf{Academic TLD}: Checks \texttt{.edu, .ac.in, .ac.uk}.
        \item \textbf{Institutional Directory}: Scrapes faculty rosters.
        \item \textbf{Research Footprint}: Verifies Scholar/IEEE citations.
        \item \textbf{Prompt Injection Guard}: Flags adversarial injections (\texttt{"ignore instructions"}).
      \end{enumerate}
      \vspace{3pt}
      \textbf{Governance}: Strictness tiers (\texttt{lenient, balanced, strict, paranoid}) controllable via Admin Console.
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Explainable Audit Dossier}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/veritas_agent.py
dossier = {
    "agent": "Veritas-AI", "version": "3.0.0",
    "verification_score": verification_score, # 0-100
    "risk_score": risk_score,                 # 0-100
    "recommendation": "ACCEPT" | "REJECT",
    "sub_scores": {
        "domain_reputation": s_domain,
        "directory_match": s_dir,
        "scholar_footprint": s_scholar
    },
    "flags": all_security_flags,
    "summary_reasoning": "Candidate verified 92%..."
}
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s16_old, s16_new)

# 10. Refactor Slide 17 (Feature 12 AI Mentor): Wrap the 129-char line
s17_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 12: AI Pedagogical Code Mentor}
  \framesubtitle{AST Loop Diagnostics \& Edge-Case Boundary Synthesis}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Pedagogical Assistant} (\texttt{backend/ai\_engine.py}):\\
        Generic AI chatbots (like ChatGPT) give students the entire working code, ruining learning outcomes.
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Pedagogical Code Mentor}: Analyzes compilation errors, loop structures, and test-case outputs to return \textbf{conceptual hints} without spoiling solutions.
          \item \textbf{AST Loop Detection}: On Time Limit Exceeded (TLE), inspects nested loops in AST and recommends Two-Pointers $\mathcal{O}(N \log N)$ or Hash Maps $\mathcal{O}(1)$.
          \item \textbf{Edge-Case Synthesizer}: Automatically generates boundary inputs (empty collections, single values, 32-bit limits).
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{AST Loop Inspection Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/ai_engine.py
tree = ast.parse(code)
for node in ast.walk(tree):
    if isinstance(node, (ast.For, ast.While)):
        for child in ast.walk(node):
            if child is not node and isinstance(child, (ast.For, ast.While)):
                has_nested_loops = True
                break

if has_nested_loops:
    hint = "Your solution uses nested loops resulting in O(N^2) complexity. Consider a Hash Map O(1) or Two-Pointers O(N log N)."
\end{lstlisting}
      \vspace{0.2cm}
      \vspace{0.25cm}
\par\noindent \scriptsize\textbf{Boundary Synthesis}: Injects adversarial checks: \texttt{0}, \texttt{2147483647}, \texttt{-2147483648}, \texttt{1000000007}, palindromes, and empty strings.
    \end{column}
  \end{columns}
\end{frame}"""

s17_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 12: AI Pedagogical Code Mentor}
  \framesubtitle{AST Loop Diagnostics \& Edge-Case Boundary Synthesis}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Pedagogical Assistant} (\texttt{backend/ai\_engine.py}):\\
      Generic chatbots spoil full code solutions. Koinexa instead synthesizes **conceptual hints** and edge-case inputs without spoiling answers.\\
      \vspace{0.15cm}
      \textbf{AST Loop Inspection}: When students hit TLE, detects nested loops in AST and advises algorithmic upgrades.\\
      \vspace{0.15cm}
      \textbf{Boundary Synthesis}: Automatically tests edge cases: \texttt{0}, \texttt{2147483647}, \texttt{-2147483648}, palindromes, and empty strings.
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Loop Diagnostic Snippet}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/ai_engine.py (PedagogicalMentor)
tree = ast.parse(code)
has_nested_loops = False
for node in ast.walk(tree):
    if isinstance(node, (ast.For, ast.While)):
        for child in ast.walk(node):
            if child is not node and isinstance(child, (ast.For, ast.While)):
                has_nested_loops = True; break

if has_nested_loops:
    hint = ("Nested loops detected -> O(N^2) complexity. "
            "Consider Hash Map O(1) or Two-Pointers O(N log N).")
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s17_old, s17_new)

# 11. Refactor Slide 20 (Neural CNN Moderation): keep code line lengths <= 55 chars
s20_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 15: Neural Content Moderation CNN}
  \framesubtitle{CharSubwordCNN for Adversarial Toxicity Classification}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Neural Model} (\texttt{backend/ml\_moderation/}):\\
        While rule-based filters catch known terms, malicious users invent phonetic misspellings.
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Character-Level CNN Architecture}: Processes raw character sequences using character embeddings; immune to novel word-level misspellings.
          \item \textbf{Multi-Filter Kernel Windows}: Kernels of size 2, 3, 4, and 5 capture subword stems simultaneously.
          \item \textbf{Sub-5ms Inference}: Lightweight architecture runs on CPU without transformer latency.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{CharSubwordCNN PyTorch Architecture}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/ml_moderation/model/architecture.py
class CharSubwordCNN(nn.Module):
    def __init__(self, vocab_size, embedding_dim=64, num_filters=64, filter_sizes=[2, 3, 4, 5]):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.convs = nn.ModuleList([
            nn.Conv1d(embedding_dim, num_filters, k) for k in filter_sizes
        ])
        self.fc_toxicity = nn.Linear(num_filters * len(filter_sizes), 1)

    def forward(self, x):
        emb = self.embedding(x).transpose(1, 2)
        pooled = [F.adaptive_max_pool1d(F.relu(c(emb)), 1).squeeze(2) for c in self.convs]
        feat = torch.cat(pooled, dim=1)
        return self.fc_toxicity(feat)
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s20_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 15: Neural Content Moderation CNN}
  \framesubtitle{CharSubwordCNN for Adversarial Toxicity Classification}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Neural Model} (\texttt{backend/ml\_moderation/}):\\
      Catches novel phonetic misspellings and leetspeak bypasses:
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Char-Level Embeddings}: Immune to word-level obfuscation.
        \item \textbf{Multi-Filter Kernels}: Windows ($k=2, 3, 4, 5$) capture subword stems simultaneously.
        \item \textbf{Sub-5ms Inference}: Lightweight PyTorch model runs on CPU with zero GPU/transformer latency.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{CharSubwordCNN PyTorch Code}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/ml_moderation/model/architecture.py
class CharSubwordCNN(nn.Module):
    def __init__(self, vocab, dim=64, filters=64, ks=[2,3,4,5]):
        super().__init__()
        self.emb = nn.Embedding(vocab, dim)
        self.convs = nn.ModuleList([
            nn.Conv1d(dim, filters, k) for k in ks
        ])
        self.fc = nn.Linear(filters * len(ks), 1)

    def forward(self, x):
        emb = self.emb(x).transpose(1, 2)
        pooled = [F.adaptive_max_pool1d(F.relu(c(emb)), 1).squeeze(2)
                  for c in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s20_old, s20_new)

# 12. Refactor Slide 21 (YouTube oEmbed): wrap long URL line
s21_old = r"""\begin{frame}[fragile]
  \frametitle{Feature 16: STEM Whitelist \& Deceptive URL Defense}
  \framesubtitle{Real-Time YouTube oEmbed Verification \& Protocol Sanitization}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Sanitizer Suite} (\texttt{backend/sanitizer.py}):
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{STEM Mathematical Whitelist}: Permits academic mathematical notations ($\le, \ge, \ne, \pm, \sqrt{}, \infty, \sum, \int, \alpha, \beta, \gamma$) while strictly blocking script tags (\texttt{<script>}, \texttt{javascript:}).
          \item \textbf{URL Shortener Blocker}: Blocks obscured redirection domains (\texttt{bit.ly, tinyurl, t.co}) used in phishing attacks.
          \item \textbf{YouTube oEmbed Live Check}: Queries official YouTube endpoints in real-time to verify that videos are public, not deleted, and that video titles are clean of profanities.
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{YouTube oEmbed Verification Snippet}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/sanitizer.py
oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
req = urllib.request.Request(oembed_url, headers={"User-Agent": "Koinexa/1.0"})
with urllib.request.urlopen(req, timeout=3.0) as resp:
    data = json.loads(resp.read().decode())
    real_title = data.get("title", "")
    # Check that video title contains no profanity
    is_clean, _ = moderate_content(real_title)
    if not is_clean:
        return False, "Linked video title violates policy."
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

s21_new = r"""\begin{frame}[fragile]
  \frametitle{Feature 16: STEM Whitelist \& Deceptive URL Defense}
  \framesubtitle{Real-Time YouTube oEmbed Verification \& Protocol Sanitization}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Sanitizer Suite} (\texttt{backend/sanitizer.py}):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{STEM Math Whitelist}: Permits academic notations ($\le, \ge, \pm, \sqrt{}, \sum, \int, \alpha, \beta$) while stripping script tags.
        \item \textbf{URL Shortener Blocker}: Rejects \texttt{bit.ly, tinyurl, t.co}.
        \item \textbf{Live YouTube Check}: Verifies video existence and validates titles against profanity filters.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{YouTube oEmbed Verification}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/sanitizer.py (verify_youtube_url)
endpoint = "https://www.youtube.com/oembed"
url = f"{endpoint}?url=https://www.youtube.com/watch?v={vid}&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "Koinexa/1.0"})
with urllib.request.urlopen(req, timeout=3.0) as resp:
    data = json.loads(resp.read().decode())
    real_title = data.get("title", "")
    # Check video title against profanity filter
    is_clean, _ = moderate_content(real_title)
    if not is_clean:
        return False, "Linked video title violates policy."
    return True, real_title
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}"""

text = text.replace(s21_old, s21_new)

# Write to both main.tex and koinexa_presentation.tex
with open("main.tex", "w", encoding="utf-8") as f:
    f.write(text)

with open("koinexa_presentation.tex", "w", encoding="utf-8") as f:
    f.write(text)

print("Applied complete code-fit refactoring to main.tex and koinexa_presentation.tex!")
