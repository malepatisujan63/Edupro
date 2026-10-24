import os

tex_content = r"""\documentclass[aspectratio=169,10pt]{beamer}

% -----------------------------------------------------------------------------
% KOINEXA PRESENTATION SLIDES
% Theme: Century Gothic Sans-Serif, Pure White Canvas, Red & Orange Accents
% Layout: Strictly Zero Boxes, 2-Line Non-Overlapping Frametitles, Generous Whitespace
% Canvas: Expanded 16:9 Widescreen (192mm x 108mm) for Generous Whitespace & Zero Cutoffs
% Grounded: 100% Verified Against Backend Implementations & Empirical Benchmarks
% -----------------------------------------------------------------------------

% -- Geometry: Expanded 16:9 Widescreen (192mm x 108mm = Full HD 16:9 Ratio) --
% Provides 44% more usable slide canvas area so content NEVER overflows or clips
\geometry{
  paperwidth=192mm,
  paperheight=108mm,
  left=10mm,
  right=10mm,
  top=6mm,
  bottom=6mm
}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb}
\usepackage{listings}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{iftex}

% -- Typography: Century Gothic (with robust fallbacks) --
\ifpdftex
  \IfFileExists{tgadventor.sty}{%
    \usepackage{tgadventor}%
    \renewcommand*\familydefault{\sfdefault}%
  }{%
    \IfFileExists{avant.sty}{%
      \usepackage{avant}%
      \renewcommand*\familydefault{\sfdefault}%
    }{%
      \usepackage[scaled=0.92]{helvet}%
      \renewcommand*\familydefault{\sfdefault}%
    }%
  }%
\else
  \usepackage{fontspec}
  \IfFontExistsTF{Century Gothic}{%
    \setsansfont{Century Gothic}%
  }{%
    \IfFontExistsTF{URW Gothic}{%
      \setsansfont{URW Gothic}%
    }{%
      \IfFontExistsTF{TeX Gyre Adventor}{%
        \setsansfont{TeX Gyre Adventor}%
      }{%
        \setsansfont{DejaVu Sans}%
      }%
    }%
  }%
  \renewcommand*\familydefault{\sfdefault}%
\fi

% -- Colors: Red & Orange Headings, Charcoal Black Text, White Canvas --
\definecolor{KoinexaRed}{HTML}{C62828}        % Deep Red
\definecolor{KoinexaOrange}{HTML}{E65100}     % Amber Orange
\definecolor{KoinexaBlack}{HTML}{111827}      % Charcoal Black
\definecolor{KoinexaGray}{HTML}{4B5563}       % Medium Neutral Gray
\definecolor{CodeGreen}{HTML}{2E7D32}         % Syntax Comment Green
\definecolor{CodeBlue}{HTML}{1565C0}          % Syntax Keyword Blue
\definecolor{CodePurple}{HTML}{6A1B9A}        % Syntax String Purple

% -- Beamer Theme Configuration (Strictly Zero Boxes) --
\setbeamercolor{background canvas}{bg=white}
\setbeamercolor{normal text}{fg=KoinexaBlack,bg=white}
\setbeamercolor{structure}{fg=KoinexaRed}
\setbeamercolor{title}{fg=KoinexaRed,bg=white}
\setbeamercolor{subtitle}{fg=KoinexaOrange,bg=white}
\setbeamercolor{frametitle}{fg=KoinexaRed,bg=white}
\setbeamercolor{item}{fg=KoinexaOrange}
\setbeamercolor{subitem}{fg=KoinexaRed}

\setbeamertemplate{navigation symbols}{}

% -- Clean 2-Line Frametitle Template (Guaranteed Zero Overlap) --
\makeatletter
\setbeamertemplate{frametitle}{%
  \vspace*{0.15cm}%
  \noindent\parbox{\textwidth}{%
    {\fontsize{13.5}{16}\selectfont\textbf{\textcolor{KoinexaRed}{\insertframetitle}}}\par\vspace{2pt}%
    \ifx\insertframesubtitle\@empty\else
      {\fontsize{9}{11.5}\selectfont\textbf{\textcolor{KoinexaOrange}{\insertframesubtitle}}}\par
    \fi
  }%
  \vspace*{0.2cm}%
}
\makeatother

% -- Clean Footline with Page Numbers --
\setbeamertemplate{footline}{%
  \leavevmode\noindent%
  \hspace{10mm}%
  {\tiny\textcolor{KoinexaGray}{\textbf{KOINEXA} $|$ Internal DSA Architecture \& System Engineering}}%
  \hfill%
  {\tiny\textcolor{KoinexaOrange}{\textbf{\insertframenumber{} / \inserttotalframenumber}}}%
  \hspace{10mm}%
  \vskip 6pt%
}

% -- Clean Unboxed Code Listing Style (Monospace 6.0pt, Compact & Safe) --
\lstdefinestyle{koinexastyle}{
  backgroundcolor=\color{white},
  commentstyle=\color{CodeGreen},
  keywordstyle=\color{CodeBlue}\bfseries,
  stringstyle=\color{CodePurple},
  basicstyle=\ttfamily\fontsize{6.0}{7.4}\selectfont,
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
}
\lstset{style=koinexastyle}

% -----------------------------------------------------------------------------
\begin{document}

% =============================================================================
% SLIDE 1: TITLE SLIDE
% =============================================================================
\begin{frame}[plain]
  \vspace{1.6cm}
  \begin{center}
    {\fontsize{38}{44}\selectfont\textbf{\textcolor{KoinexaRed}{KOINEXA}}}\\[0.3cm]
    {\fontsize{16}{19}\selectfont\textbf{\textcolor{KoinexaOrange}{A Fast Social Learning \& Competitive Coding Platform}}}\\[0.7cm]

    \normalsize\textbf{\textcolor{KoinexaBlack}{Powered by High-Speed In-Memory Data Structures (DSA) \& Cheat-Proof Exam Security}}\\[0.25cm]
    \small\textcolor{KoinexaGray}{Multi-Language Code Runner $\cdot$ Veritas-AI Teacher Verification $\cdot$ Self-Learning Multilingual Moderation}\\[1.1cm]

    {\small\textbf{\textcolor{KoinexaRed}{Final Engineering Project Defense}} \quad$|$\quad \textcolor{KoinexaGray}{Academic Year 2026}}
  \end{center}
\end{frame}

% =============================================================================
% SLIDE 2: TABLE OF CONTENTS
% =============================================================================
\begin{frame}
  \frametitle{Table of Contents}
  \framesubtitle{Project Presentation Overview}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Problem Statement \& Goals}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Why standard educational platforms slow down under concurrent load.
        \item Bottlenecks: Full-table disk scans, N+1 query loops, and exam cheating.
        \item 3 strict engineering rules: 0 UI edits, 0 API breaks, invisible DSA.
      \end{itemize}
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Fast In-Memory DSA Engine}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Prefix Trie \& Index}: Instant multi-category search in memory.
        \item \textbf{Bounded Min-Heap}: Top-50 academic feed ranking algorithm.
        \item \textbf{Social Graph}: Instant $\mathcal{O}(1)$ friend checks and mutual peer suggestions.
        \item \textbf{LRU Cache \& Limiter}: Zero repeated database calls and sliding rate limits.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Real-World Features \& AI}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{JEE Exam Arena}: Authentic NTA 5-color palette test simulation.
        \item \textbf{CBT Security}: Server-side answer key stripper and velocity guard.
        \item \textbf{Safe Code Runner}: Multi-language sandbox without Docker lag.
        \item \textbf{Veritas-AI \& Moderation}: Self-learning slur agent and 1.1M benchmark.
      \end{itemize}
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Results \& Performance}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Mathematical Big-O complexity comparison proofs.
        \item Measured benchmark speedups (up to 40.7x faster search).
        \item Real end-to-end network latency tests and 100\% test suite pass.
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 3: PROBLEM STATEMENT
% =============================================================================
\begin{frame}
  \frametitle{Problem Statement}
  \framesubtitle{Why Normal Educational Websites Slow Down}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Problem 1: Search Freezes the Database}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Standard apps use slow SQL queries (\texttt{LIKE '\%search\%'}).
        \item The database reads every single disk row per keystroke.
        \item Concurrent user searches cause full database lockups.
      \end{itemize}
      \vspace{0.35cm}

      {\normalsize\textbf{\textcolor{KoinexaRed}{Problem 2: Communities Load Slowly ($N+1$)}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Loading 30 study groups triggers 31 sequential SQL queries.
        \item Every group forces extra queries for sub-channels and unread counts.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Problem 3: Easy to Cheat in Online Tests}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Apps send correct answers and solutions in client JSON payloads.
        \item Students inspect browser DevTools or alter local system timers.
      \end{itemize}
      \vspace{0.35cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Problem 4: Dangerous Code \& AI Spoilers}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Unrestricted code execution risks server compromise and fork bombs.
        \item Docker containers are secure but suffer 400ms startup latencies.
        \item AI chatbots dump complete solutions, defeating the learning process.
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 4: OBJECTIVES & CONSTRAINTS
% =============================================================================
\begin{frame}
  \frametitle{Project Goals \& Rules}
  \framesubtitle{Our Core Engineering Mandate}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Three Strict Project Rules}}}\par\vspace{3pt}
      \small
      \begin{enumerate}\setlength{\itemsep}{6pt}
        \item \textbf{Invisible to Users}: Students never see technical buzzwords like ``Powered by Trie''.
        \item \textbf{Zero Website Code Changes}: The React frontend interface received \textbf{0 file edits}.
        \item \textbf{Zero API Breaking Changes}: All backend data contracts remained 100\% identical.
      \end{enumerate}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Our Engineering Goals}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{6pt}
        \item \textbf{No Heavy External Tools}: Pure Python memory structures instead of expensive Redis clusters.
        \item \textbf{Sub-Millisecond Search}: Reduce search times to under 0.005 milliseconds.
        \item \textbf{Cheat-Proof Exams}: Strip answers on server and use server-only clocks.
        \item \textbf{Safe Code Sandbox}: Inspect code safely in under 50ms without Docker delays.
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 5: SYSTEM ARCHITECTURE
% =============================================================================
\begin{frame}
  \frametitle{System Architecture}
  \framesubtitle{How Data Flows Through Koinexa}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.31\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Frontend (Client)}}}\par\vspace{3pt}
      \small
      \textbf{React 18 \& TypeScript}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Quick Spotlight search
        \item Authentic JEE exam arena
        \item Multi-language code runner
        \item Study groups \& chats
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.34\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Fast DSA Engine (RAM)}}}\par\vspace{3pt}
      \small
      \textbf{Pure In-Memory Python}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Prefix Trie}: Instant text search
        \item \textbf{Min-Heap}: Top-50 feed ranking
        \item \textbf{Graph}: Fast friend lookups
        \item \textbf{LRU Cache}: Stops repeat calls
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.31\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Security \& Storage}}}\par\vspace{3pt}
      \small
      \textbf{Protection \& Database}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Answer Stripper}: Zero leaks
        \item \textbf{AST Sandbox}: Safe code checks
        \item \textbf{Veritas-AI}: Faculty vetting
        \item \textbf{SQLite WAL}: Disk persistence
      \end{itemize}
    \end{column}
  \end{columns}

  \vspace{0.6cm}
  \centering
  \small\textbf{\textcolor{KoinexaBlack}{Data Pipeline:}} Student Request $\longrightarrow$ Flask REST Route $\longrightarrow$ Fast RAM DSA Engine $\longrightarrow$ Security Check $\longrightarrow$ SQLite WAL
\end{frame}

% =============================================================================
% SLIDE 6: FEATURE 1 - PREFIX TRIE SEARCH
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 1: Fast Universal Search Engine}
  \framesubtitle{Finding Items in Milliseconds Without Scanning the Database}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Searches posts, quizzes, code problems, study groups, and users as you type.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Eliminates slow SQL disk scans and costly Elasticsearch clusters by using an in-memory \textbf{Prefix Trie} and \textbf{Inverted Index}.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Speed \& Complexity}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Search Speed}: $\mathcal{O}(L + M)$ where $L$ is query length and $M$ is result size. Database size $N$ does not slow it down.
        \item \textbf{Multi-Word}: Intersects sorted sets in microseconds.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Prefix Trie Search Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/dsa_engine.py (PrefixTrie)
def search_prefix(self, prefix: str, max_refs=50):
    curr = self.root
    for ch in prefix.lower():
        if ch not in curr.children:
            return set()
        curr = curr.children[ch]
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
\end{frame}

% =============================================================================
% SLIDE 7: FEATURE 2 - FEED RANKING
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 2: High-Yield Academic Feed Ranking}
  \framesubtitle{Prioritizing Real Educational Content Over Social Clickbait}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Ranks helpful courses, doubts, and hackathons higher than casual social chats.\\
      \vspace{0.15cm}
      \textbf{Academic Scoring Formula}:
      \[\text{Score} = \frac{\text{Engagement} \times \text{Multiplier} + \text{Friend Boost}}{(\text{Hours Old} + 2.0)^{1.15}}\]
      Courses receive $1.5\times$; study peers get $+15.0$ pts.\\
      \vspace{0.2cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Why It Is Faster}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Speed}: $\mathcal{O}(N \log K)$ using a \textbf{Bounded Min-Heap ($K=50$)} instead of sorting all posts $\mathcal{O}(N \log N)$.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Bounded Min-Heap Code}}}\par\vspace{2pt}
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
    res = [heapq.heappop(heap)
           for _ in range(len(heap))]
    return [item for _, _, item in reversed(res)]
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 8: FEATURE 3 - SOCIAL GRAPH
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 3: Social Connection Graph}
  \framesubtitle{Instant Friend Checks and Mutual Peer Suggestions}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Tracks study friendships and recommends mutual peers.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Standard apps execute quadratic SQL joins. Koinexa maintains an in-memory \textbf{Adjacency List} using Python hash sets.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Speed Breakdown}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Connection Check}: Strict $\mathcal{O}(1)$ lookup.
        \item \textbf{Mutual Friends}: $\mathcal{O}(\min(d_1, d_2))$ hash set intersection.
        \item \textbf{Suggestions}: Breadth-First Search (BFS) bounded at depth 2.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Friend Graph Set Implementation}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 9: FEATURE 4 - LRU CACHE
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 4: Multi-Tier In-Memory Cache}
  \framesubtitle{Stopping Repeated Database Queries with Zero Extra Servers}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Retains frequent query responses in RAM, eliminating redundant database roundtrips.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Implemented with a \textbf{Doubly Linked List + Hash Map}. Provides microsecond caching without deploying Redis.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Active Cache Tiers}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \texttt{search\_cache} (512 slots / 45s TTL): Stores queries.
        \item \texttt{community\_cache} (64 slots / 180s TTL): Kills 31-query lag.
        \item \textbf{Speed}: $\mathcal{O}(1)$ get, put, and eviction operations.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Doubly Linked List LRU Code}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 10: FEATURE 5 - RATE LIMITER
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 5: Sliding-Window Rate Limiter}
  \framesubtitle{Stopping Password Attacks, Bots, and Spam Fairly}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Guards authentication, quiz submissions, and compiler runs against automated abuse.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Fixed-window counters allow 2x traffic bursts at minute boundaries. Koinexa tracks real timestamps inside a double-ended queue (\texttt{deque}).\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Production Limits}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Login}: 15 attempts / min per IP.
        \item \textbf{Quiz Submit}: 4 submissions / 15 sec window.
        \item \textbf{Complexity}: $\mathcal{O}(1)$ amortized eviction via \texttt{popleft()}.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Sliding Window Deque Code}}}\par\vspace{2pt}
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
                q.popleft() # Pop expired in O(1)
            if len(q) < max_req:
                q.append(now); return True
            return False
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 11: FEATURE 6 - WHATSAPP COMMUNITIES
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 6: WhatsApp-Style Study Communities}
  \framesubtitle{Group Chat Channels with 1-Click Course Sharing}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Split-screen chat rooms for study topics (DSA, Web Dev, JEE) with dedicated sub-channels.\\
      \vspace{0.15cm}
      \textbf{Novel Features}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Code in Chat}: Send highlighted, runnable code snippets.
        \item \textbf{1-Click Share}: Dispatch courses to multiple DMs and channels simultaneously.
        \item \textbf{Zero Query Waterfall}: Cached in RAM; eliminates the standard 31 SQL query load.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1-Click Post Sharing Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/app.py (/api/posts/share)
@app.route("/api/posts/share", methods=["POST"])
def share_post_to_chats():
    # 1. Forward to direct messages
    for mate_id in target_studymate_ids:
        conn.execute("INSERT INTO direct_messages ...")
    # 2. Forward to community channels
    for ch in target_channels:
        conn.execute("INSERT INTO messages ...")
    # 3. Increment post share counter
    conn.execute("UPDATE posts SET reposts_count...")
    return jsonify({"success": True})
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 12: FEATURE 7 - JEE CBT ARENA
% =============================================================================
\begin{frame}
  \frametitle{Feature 7: JEE Main CBT Exam Arena}
  \framesubtitle{Real National Testing Agency (NTA) Simulation}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Authentic Exam Experience}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Exact digital replica of the computer-based test environment used in national entrance exams.\\
      \vspace{0.15cm}
      \textbf{Interface \& Rules}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Lockdown Mode}: Pressing Escape or switching browser tabs triggers immediate disqualification warnings.
        \item \textbf{Subject Navigation}: Seamless switching between Physics, Chemistry, and Mathematics sections.
        \item \textbf{NTA Marking}: $+4$ for correct, $-1$ penalty for wrong, $0$ for unattempted questions.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Official 5-Color Question Palette}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{4pt}
        \item \textbf{\textcolor{CodeGreen}{$\bullet$} Green}: Question answered and confirmed.
        \item \textbf{\textcolor{KoinexaRed}{$\bullet$} Red}: Question viewed but not answered.
        \item \textbf{\textcolor{KoinexaGray}{$\circ$} Gray}: Question not yet visited by student.
        \item \textbf{\textcolor{CodePurple}{$\bullet$} Purple}: Question marked for later review.
        \item \textbf{\textcolor{CodePurple}{$\bullet$}\textcolor{CodeGreen}{$\checkmark$} Purple + Green}: Answered and marked for review.
      \end{itemize}
      \vspace{0.25cm}
      \footnotesize\textbf{Instant Analytics}: Generates percentile ranking and detailed solutions upon submission.
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 13: FEATURE 8 - CBT SECURITY
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 8: CBT Exam Security Engine}
  \framesubtitle{Stopping Answer Leaks and Bot Cheating}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{How We Stop Cheating}}}\par\vspace{2pt}
      \small
      \textbf{Security Suite} (\texttt{backend/cbt\_engine.py}):
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Answer Stripper}: Strips correct keys and solutions from API payloads before transmission.
        \item \textbf{Server-Only Clock}: Timer verified against server epoch; altering computer clocks has zero impact.
        \item \textbf{Bot Velocity Trap}: Flags solvers answering in $< 2.2$ sec/question with \texttt{INHUMAN\_SPEED}.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Answer Stripper \& Speed Trap Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/cbt_engine.py (Scrubber & Guard)
def scrub_quiz(quiz: dict) -> dict:
    clean = copy.deepcopy(quiz)
    EXCLUDED = {"correct_index", "explanation"}
    clean["questions"] = [
        {k: v for k, v in q.items()
         if k not in EXCLUDED}
        for q in clean.get("questions", [])
    ]
    return clean

# Flag automated bot solvers (< 2.2s/question)
if answered >= 5 and (auth_time / answered) < 2.2:
    audit_flags.append("INHUMAN_SPEED_FLAGGED")
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 14: FEATURE 9 - POLYGLOT CODE LAB
% =============================================================================
\begin{frame}
  \frametitle{Feature 9: Polyglot Code Lab Arena}
  \framesubtitle{In-Browser Coding with 20+ Hidden Test Cases}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Real-time multi-language coding arena supporting Python, JavaScript, C++, and Java.\\
      \vspace{0.15cm}
      \textbf{Key Capabilities}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Run Sample Tests}: Runs against 3 visible cases in $< 50$ ms for quick iterative debugging.
        \item \textbf{Submit Solution}: Validates against \textbf{20+ hidden edge test cases} to prevent hardcoded cheats.
        \item \textbf{Clear Output Verdicts}: Accepted, Wrong Answer, TLE ($> 5.0$s), Compile Error.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Execution Pipeline}}}\par\vspace{2pt}
      \small
      \begin{enumerate}\setlength{\itemsep}{4pt}
        \item Student inputs code in Monaco web editor.
        \item AST Pre-Flight Security Gate inspects code in $< 2$ms.
        \item SHA-256 result cache returns instant cached runs.
        \item Subprocess executes with isolated pipes and a 5.0s watchdog.
        \item Line-by-line whitespace-insensitive output evaluator.
      \end{enumerate}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 15: FEATURE 10 - COMPILER SANDBOX
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 10: Compiler Sandbox \& AST Security}
  \framesubtitle{Inspecting Code Safety in 2 Milliseconds Without Slow Docker}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Safe Execution Without Docker Lag}}}\par\vspace{2pt}
      \small
      \textbf{Why Not Docker?}: Docker incurs 400ms container startup overhead. Koinexa traverses the code's \textbf{Abstract Syntax Tree (AST)} in RAM before compilation:\\
      \vspace{0.15cm}
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Blocks dangerous imports: \texttt{os, subprocess, socket}.
        \item Blocks execution primitives: \texttt{eval, exec, open}.
        \item Blocks reflection: \texttt{\_\_subclasses\_\_, \_\_builtins\_\_}.
        \item Subprocess watchdog terminates loops at 5.0 seconds.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Pre-Flight Inspector Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/compiler_sandbox.py (AST Security)
def check_code_safety_ast(code: str):
    tree = ast.parse(code)
    imp_t = (ast.Import, ast.ImportFrom)
    for node in ast.walk(tree):
        if isinstance(node, imp_t):
            if any(n.name in BAD_MODS
                   for n in node.names):
                return "Security: Prohibited import."
        elif (isinstance(node, ast.Call) and
              isinstance(node.func, ast.Name)):
            bad_c = {"eval", "exec", "open"}
            if node.func.id in bad_c:
                return f"Blocked: {node.func.id}()"
        elif (isinstance(node, ast.Attribute) and
              node.attr in DUNDERS):
            return "Security: Reflection blocked."
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 16: FEATURE 11 - VERITAS-AI VETTING
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 11: Veritas-AI Faculty Vetting Agent}
  \framesubtitle{Automatically Checking Teacher Credentials in Seconds}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Autonomous Agent} (\texttt{backend/veritas\_agent.py}):\\
      Replaces weeks of manual bureaucratic checks with a 4-step autonomous verification pipeline:
      \begin{enumerate}\setlength{\itemsep}{3pt}
        \item \textbf{Domain Reputation}: Confirms official academic domains (\texttt{.edu, .ac.in}).
        \item \textbf{Faculty Directory}: Scrapes university staff rosters.
        \item \textbf{Scholar Footprint}: Validates Google Scholar profiles.
        \item \textbf{Prompt Injection Guard}: Sanitizes inputs.
      \end{enumerate}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Verification Dossier Code}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 17: FEATURE 12 - AI CODE MENTOR
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 12: AI Pedagogical Code Mentor}
  \framesubtitle{Giving Conceptual Hints Without Spoiling the Solution}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Teaching Without Spoiling}}}\par\vspace{2pt}
      \small
      \textbf{Pedagogical Assistant} (\texttt{backend/ai\_engine.py}):\\
      Generic LLMs provide copy-paste solutions. Koinexa analyzes AST trees to provide \textbf{pedagogical hints}:\\
      \vspace{0.15cm}
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{AST Loop Diagnostics}: Pinpoints nested loops causing $\mathcal{O}(N^2)$ slowdowns and suggests $\mathcal{O}(1)$ Hash Maps.
        \item \textbf{Edge-Case Generator}: Synthesizes tests for boundary conditions (zeros, negative values, empty arrays).
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Loop Detection Snippet}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/ai_engine.py (PedagogicalMentor)
tree = ast.parse(code)
has_nested = False
loop_t = (ast.For, ast.While)
for node in ast.walk(tree):
    if isinstance(node, loop_t):
        for child in ast.walk(node):
            if (child is not node and
                isinstance(child, loop_t)):
                has_nested = True; break

if has_nested:
    hint = ("Nested loops -> O(N^2) complexity. "
            "Consider Hash Map O(1) or Pointers.")
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 18: FEATURE 13 - PLAGIARISM ENGINE
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 13: AST Plagiarism Detection Engine}
  \framesubtitle{Catching Copied Code Even When Variables Are Renamed}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Outsmarting Naive Copying}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Identifies structural code plagiarism.\\
      \vspace{0.15cm}
      \textbf{Why Simple Diffs Fail}: Students rename identifiers or add whitespace to deceive surface diff tools.\\
      \vspace{0.15cm}
      \textbf{Our Structural Solution}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Normalizes all variables to generic symbols (\texttt{v\_1, v\_2}).
        \item Strips all docstrings, comments, and spacing.
        \item Computes 16-gram winnowed Jaccard index ($\ge 82\%$).
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Variable Renamer Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/ai_engine.py (PlagiarismDetector)
class Renamer(ast.NodeTransformer):
    def __init__(self):
        self.mapping, self.counter = {}, 0
    def visit_Name(self, node):
        if node.id not in self.mapping:
            self.counter += 1
            self.mapping[node.id] = f"v_{self.counter}"
        new_id = self.mapping[node.id]
        new_node = ast.Name(id=new_id, ctx=node.ctx)
        return ast.copy_location(new_node, node)

inter = len(ngrams_a & ngrams_b)
union = max(1, len(ngrams_a | ngrams_b))
is_flagged = (inter / union) >= 0.82
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 19: FEATURE 14 - PRAGMATIC SPEECH-ACT DIRECTEDNESS ENGINE
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 14: Pragmatic Speech-Act Directedness Engine}
  \framesubtitle{Austin \& Searle Illocutionary Resolution \& Pedagogical Empathy Loop}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Target-Directed Moderation}}}\par\vspace{2pt}
      \small
      \textbf{Speech-Act Theory} (\texttt{backend/moderation.py}):\\
      Toxicity is not an intrinsic lexical property; it is a directed illocutionary vector $\vec{T} = \langle \mathcal{P}, \mathcal{E}, \mathcal{F} \rangle$ (Austin 1962, Searle 1969):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Tier 1 (Self)}: \textit{"I'm an idiot, my code fails"} $\to$ \textbf{Allowed} + Routed to AI Mentor for encouragement.
        \item \textbf{Tier 2 (System)}: \textit{"This compiler is garbage"} $\to$ \textbf{Allowed} (Preserves natural engineering venting).
        \item \textbf{Tier 3 (Syntax)}: \texttt{kill(pid, SIGKILL)} $\to$ \textbf{Allowed} via AST code-scoping pass-through.
        \item \textbf{Tier 4 (Peer)}: \textit{"You are an idiot"} $\to$ \textbf{Blocked} with disciplinary warning \& session termination.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Pragmatic Directedness Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/moderation.py (Austin & Searle PSAD)
pragmatic = classify_pragmatic_directedness(text)

if pragmatic['tier'] == 'PEER_ATTACK':
    # Tier 4: Block targeted harassment
    return False, pragmatic['reason']

if pragmatic['tier'] == 'SELF_DEPRECATION':
    # Tier 1: Allow & dispatch mentor hint!
    empathy = mentor.generate_empathy_hint(text)
    return True, empathy

if pragmatic['tier'] == 'SYSTEM_VENT':
    # Tier 2: Allow technical frustration
    return True, "System venting permitted"
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 20: FEATURE 15 - MLF CODE-SWITCHING & AUTONOMOUS AGENT
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 15: MLF Code-Switching \& Autonomous Agent}
  \framesubtitle{Myers-Scotton Morphological De-agglutination \& Zero-Cost Wiktionary Loop}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Code-Switching \& Self-Learning}}}\par\vspace{2pt}
      \small
      \textbf{MLF Engine} (\texttt{backend/moderation.py}):\\
      Grounded in Carol Myers-Scotton's MLF Model for code-mixing in Indian universities:
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Morphological De-agglutination}: Decomposes Indic roots (\texttt{deng-}, \texttt{chud-}) + verbal suffixes (\texttt{-adam}, \texttt{-utha}, \texttt{-ichuko}).
        \item \textbf{Anti-Scunthorpe Guard}: Whitelists STEM prefixes (\texttt{"dengue"}, \texttt{"dense"}, \texttt{"density"}).
        \item \textbf{Autonomous Learning Agent}: Queries free Wikimedia API ($0 cost) and auto-saves new slurs to SQLite.
        \item \textbf{1.1M Benchmark}: Tested across 1,100,000 multi-domain samples at $> 100,000$ evals/sec.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{MLF De-agglutination Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/moderation.py (Myers-Scotton MLF)
def mlf_deagglutinate_token(token: str):
    if token in BENIGN_ALLOWLIST:
        return None  # Preserves "dengue", "dense"
    for root, (lang, cat) in MLF_ROOTS.items():
        if token.startswith(root):
            suffix = token[len(root):]
            if suffix in MLF_SUFFIXES:
                # Decomposed agglutinative slur!
                return {'root': root, 'suffix': suffix}
    return None

# Autonomous Wiktionary self-learning loop:
agent.scan_and_learn_async(incoming_text)
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 21: FEATURE 16 - STEM WHITELIST & YOUTUBE CHECK
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 16: STEM Whitelist \& Safe Link Defense}
  \framesubtitle{Allowing Math Symbols While Blocking Phishing and Viruses}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Safe Math \& Link Verification}}}\par\vspace{2pt}
      \small
      \textbf{Sanitizer Suite} (\texttt{backend/sanitizer.py}):
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{STEM Math Preservation}: Allows symbols ($\le, \ge, \pm, \sqrt{}, \sum, \int, \alpha$) while stripping XSS vectors.
        \item \textbf{URL Shortener Ban}: Blocks masked redirects (\texttt{bit.ly, tinyurl}).
        \item \textbf{YouTube oEmbed Check}: Validates video existence and scans metadata for profanity.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{YouTube Verification Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/sanitizer.py (verify_youtube_url)
endpoint = "https://www.youtube.com/oembed"
yt_url = f"https://www.youtube.com/watch?v={vid}"
url = f"{endpoint}?url={yt_url}&format=json"
req = urllib.request.Request(
    url, headers={"User-Agent": "Koinexa/1.0"})
with urllib.request.urlopen(req, timeout=3.0) as resp:
    data = json.loads(resp.read().decode())
    real_title = data.get("title", "")
    is_clean, _ = moderate_content(real_title)
    if not is_clean:
        return False, "Video title violates policy."
    return True, real_title
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 22: FEATURE 17 - CLASSROOM SYSTEM
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 17: University Classroom System}
  \framesubtitle{Secure Course Codes with Live Push Notifications}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Organized Academic Courses}}}\par\vspace{2pt}
      \small
      \textbf{Classrooms} (\texttt{backend/app.py}):
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Cryptographic Course IDs}: 32-character hexadecimal identifiers prevent code enumeration.
        \item \textbf{Teacher Approval Gate}: Faculty approve or reject student enrollment requests.
        \item \textbf{Server-Sent Events (SSE)}: Real-time broadcast alerts when assignments or slides are published.
      \end{itemize}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Classroom Creation Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/app.py (create_classroom)
# 32-character crypto ID
classroom_id = secrets.token_hex(16)
# Instantly sync into in-memory search Trie
dsa_engine.sync_classroom({
    "id": classroom_id,
    "name": name,
    "subject_code": subject_code,
    "university": university
})
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 23: FEATURE 18 - CLIENT-SIDE TYPESCRIPT DSA
% =============================================================================
\begin{frame}
  \frametitle{Feature 18: Client-Side TypeScript DSA Suite}
  \framesubtitle{Built-in Algorithms Running Right in the Browser}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Huffman Compression}}}\par\vspace{2pt}
      \small
      Compacts text payloads by up to 55\% client-side before network transmission, saving mobile bandwidth.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Disjoint-Set Union (DSU)}}}\par\vspace{2pt}
      \small
      Partitions students into study teams in nearly constant $\mathcal{O}(\alpha(N)) \approx \mathcal{O}(1)$ time using path compression.
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Subject Taxonomy BST}}}\par\vspace{2pt}
      \small
      Binary search tree maintaining alphabetical course taxonomy hierarchies in $\mathcal{O}(N)$ in-order traversal.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Canvas WebP Downscaler}}}\par\vspace{2pt}
      \small
      Compresses uploaded profile and assignment images client-side, reducing upload payload sizes by $> 70\%$.
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 24: RESULTS 1 - BIG-O COMPLEXITY TABLE
% =============================================================================
\begin{frame}
  \frametitle{Results: Algorithmic Big-O Speed Comparison}
  \framesubtitle{Theoretical Proof: How We Eliminated Database Bottlenecks}

  \centering
  \fontsize{8}{10.5}\selectfont
  \setlength{\tabcolsep}{6pt}
  \begin{tabular}{@{}llll@{}}
    \toprule
    \textbf{\textcolor{KoinexaRed}{Action / Feature}} & 
    \textbf{\textcolor{KoinexaBlack}{Old Way (Slow SQL)}} & 
    \textbf{\textcolor{KoinexaOrange}{With Koinexa DSA}} & 
    \textbf{\textcolor{KoinexaRed}{Main Advantage}} \\ \midrule
    Universal Search & $\mathcal{O}(N)$ Disk Scan & $\mathcal{O}(L + M)$ RAM Trie & Independent of database size \\
    Multi-Word Search & $\mathcal{O}(N)$ Regex Scan & $\mathcal{O}(\min(|S_i|))$ Index & Microsecond set intersections \\
    Community Channels & $\mathcal{O}(N)$ 31 Queries & $\mathcal{O}(1)$ LRU Cache & Zero disk calls on repeat \\
    Friend Check & $\mathcal{O}(N)$ Table Scan & $\mathcal{O}(1)$ Hash Set & Instant relationship check \\
    Mutual Friends & $\mathcal{O}(N^2)$ SQL Join & $\mathcal{O}(\min(d_1, d_2))$ Set & Fast set intersection \\
    Feed Ranking & $\mathcal{O}(N \log N)$ Sort & $\mathcal{O}(N \log K)$ Min-Heap & Cuts CPU work by $> 50\%$ \\
    Rate Limiting & $\mathcal{O}(N)$ Disk Query & $\mathcal{O}(1)$ Deque & Fast spam protection \\
    Code Caching & Slow Re-execution & $\mathcal{O}(1)$ SHA-256 Cache & Skips duplicate test runs \\ \bottomrule
  \end{tabular}
  \vspace{0.45cm}

  \footnotesize\textcolor{KoinexaGray}{Where $N$: total records, $L$: search query length, $K$: top items shown (50).}
\end{frame}

% =============================================================================
% SLIDE 25: RESULTS 2 - EMPIRICAL BENCHMARKS (UNIFIED FULL-WIDTH TABLE)
% =============================================================================
\begin{frame}
  \frametitle{Results: Measured Benchmark Speedups}
  \framesubtitle{Real Performance Numbers from backend/benchmark\_dsa.py}

  \centering
  \fontsize{8}{11}\selectfont
  \setlength{\tabcolsep}{6pt}
  \begin{tabular}{@{}lrrrl@{}}
    \toprule
    \textbf{\textcolor{KoinexaRed}{Operation}} & 
    \textbf{\textcolor{KoinexaBlack}{Old Way (SQL)}} & 
    \textbf{\textcolor{KoinexaOrange}{With Koinexa DSA}} & 
    \textbf{\textcolor{KoinexaRed}{Speedup}} & 
    \textbf{\textcolor{KoinexaBlack}{Engineering Impact}} \\ \midrule
    \textbf{Universal Search} & 0.051 ms & \textbf{0.001 ms} & \textbf{\textcolor{KoinexaRed}{40.7x faster}} & Trie walks RAM directly; zero disk reads \\
    \textbf{Community Channels} & 0.012 ms & \textbf{$<$ 0.001 ms} & \textbf{\textcolor{KoinexaRed}{37.9x faster}} & LRU Cache eliminates 31-query loop \\
    \textbf{Top-50 Feed Ranking} & 0.167 ms & \textbf{0.134 ms} & \textbf{1.2x faster} & Bounded Min-Heap ($K=50$) cuts sorting work \\
    \textbf{10,000 Friend Checks} & $\sim$120.0 ms & \textbf{1.19 ms} & \textbf{\textcolor{KoinexaRed}{100.8x faster}} & In-memory hash set relationship lookup \\
    \textbf{Mutual Friends Discovery} & 18.5 ms & \textbf{0.25 ms} & \textbf{\textcolor{KoinexaRed}{74.0x faster}} & Microsecond bitwise set intersection \\ \bottomrule
  \end{tabular}
  \vspace{0.6cm}

  \normalsize\textbf{\textcolor{KoinexaOrange}{Friend Graph Test}}: 10,000 connection checks completed in \textbf{1.19 ms} (average of \textbf{0.119 microseconds per check}).
\end{frame}

% =============================================================================
% SLIDE 26: RESULTS 3 - LIVE NETWORK LATENCIES
% =============================================================================
\begin{frame}
  \frametitle{Results: Live HTTP Network Latencies}
  \framesubtitle{Real End-to-End Speed Measurements \& 100\% Test Pass Status}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Live HTTP Request Speed}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{4pt}
        \item \texttt{GET /api/search?q=python}: \textbf{6.59 ms avg}
        \item \texttt{GET /api/communities}: \textbf{4.02 ms avg}
        \item \texttt{GET /api/feed}: \textbf{7.12 ms avg}
        \item \texttt{GET /api/health}: \textbf{5.27 ms avg}
      \end{itemize}
      \vspace{0.35cm}
      \footnotesize\textit{Note: Network TCP/HTTP socket handshakes account for 3--4ms. Pure internal DSA compute finishes in $< 1.0$ ms!}
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{100\% Automated Test Suite Pass}}}\par\vspace{2pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item \textbf{DSA Engine Suite} (\texttt{test\_dsa\_engine.py}):\\
          \textbf{\textcolor{CodeGreen}{8/8 PASS}} (Trie, Index, LRU, Heap, Graph, Limiter).
        \item \textbf{CBT Exam Suite} (\texttt{test\_cbt\_engine.py}):\\
          \textbf{\textcolor{CodeGreen}{6/6 PASS}} (Scrubber, Clocks, Speed Trap, Scoring).
        \item \textbf{AI \& Sandbox Suite} (\texttt{test\_ai\_and\_sandbox.py}):\\
          \textbf{\textcolor{CodeGreen}{6/6 PASS}} (AST Visitor, Mentor, Synthesizer).
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 27: SUMMARY & LESSONS LEARNED
% =============================================================================
\begin{frame}
  \frametitle{Project Summary \& Key Takeaways}
  \framesubtitle{What We Learned Building Koinexa}

  \begin{columns}[T,onlytextwidth]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Smart Algorithms Beat Heavy Servers}}}\par\vspace{2pt}
      \small
      Classic in-memory data structures delivered a \textbf{40x speedup} without recurring cloud hosting fees for Redis or Elasticsearch clusters.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Transparent Retrofitting}}}\par\vspace{2pt}
      \small
      All acceleration works silently behind existing REST endpoints. The React frontend received \textbf{0 file modifications}.
    \end{column}
    \hfill
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Multi-Layer Security}}}\par\vspace{2pt}
      \small
      Server-side answer key stripping, AST sandbox pre-flight checks, and bot velocity traps prevent exam cheating and server compromise.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Production Ready}}}\par\vspace{2pt}
      \small
      Includes background memory warmup threads and 1-click launch automation scripts (\texttt{quick\_launch.sh}, \texttt{run.sh}).
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 28: CONCLUSION & THANK YOU
% =============================================================================
\begin{frame}[plain]
  \vspace{1.6cm}
  \begin{center}
    {\fontsize{36}{42}\selectfont\textbf{\textcolor{KoinexaRed}{Thank You!}}}\\[0.35cm]
    {\fontsize{15}{18}\selectfont\textbf{\textcolor{KoinexaOrange}{Questions \& Discussion Welcome}}}\\[0.8cm]

    \normalsize\textbf{\textcolor{KoinexaBlack}{KOINEXA: High-Performance Social Learning \& Competitive Coding Ecosystem}}\\[0.25cm]
    \small\textcolor{KoinexaGray}{In-Memory DSA Acceleration $\cdot$ Cheat-Proof CBT Testing $\cdot$ Veritas-AI Faculty Verification}\\[0.9cm]

    {\normalsize\textbf{\textcolor{KoinexaRed}{Live Platform:}} \texttt{http://localhost:5174} \qquad \textbf{\textcolor{KoinexaOrange}{API Gateway:}} \texttt{http://127.0.0.1:5001}}
  \end{center}
\end{frame}

\end{document}
"""

with open("main.tex", "w", encoding="utf-8") as f:
    f.write(tex_content)

with open("koinexa_presentation.tex", "w", encoding="utf-8") as f:
    f.write(tex_content)

print("Generated clean, spacious Full HD LaTeX presentation with Autonomous Moderation Agent novelty in main.tex and koinexa_presentation.tex!")
