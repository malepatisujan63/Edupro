import sys

tex_content = r"""\documentclass[aspectratio=169,10pt]{beamer}

% -----------------------------------------------------------------------------
% KOINEXA PRESENTATION SLIDES (Simple English & Clean Whitespace)
% Theme: Century Gothic Typography, Pure White Canvas, Red & Orange Headings, Black Text
% -----------------------------------------------------------------------------

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb}
\usepackage{listings}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{iftex}

% -- Typography: Century Gothic (with safe fallbacks) --
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
\definecolor{KoinexaGray}{HTML}{6B7280}       % Neutral Gray
\definecolor{CodeGreen}{HTML}{2E7D32}         % Syntax Comment Green
\definecolor{CodeBlue}{HTML}{1565C0}          % Syntax Keyword Blue
\definecolor{CodePurple}{HTML}{6A1B9A}        % Syntax String Purple

% -- Beamer Theme Configuration --
\setbeamercolor{background canvas}{bg=white}
\setbeamercolor{normal text}{fg=KoinexaBlack,bg=white}
\setbeamercolor{structure}{fg=KoinexaRed}
\setbeamercolor{title}{fg=KoinexaRed,bg=white}
\setbeamercolor{subtitle}{fg=KoinexaOrange,bg=white}
\setbeamercolor{frametitle}{fg=KoinexaRed,bg=white}
\setbeamercolor{item}{fg=KoinexaOrange}
\setbeamercolor{subitem}{fg=KoinexaRed}

\setbeamertemplate{navigation symbols}{}

% -- Clean Unboxed Frametitle Template --
\makeatletter
\setbeamertemplate{frametitle}{%
  \vspace{0.25cm}%
  \noindent{\fontsize{13.5}{16.5}\selectfont\textbf{\textcolor{KoinexaRed}{\insertframetitle}}}%
  \ifx\insertframesubtitle\@empty\else
    \hfill{\fontsize{9.5}{12}\selectfont\textbf{\textcolor{KoinexaOrange}{\insertframesubtitle}}}%
  \fi
  \par\vspace{5pt}%
}
\makeatother

% -- Clean Footline with Page Numbers --
\setbeamertemplate{footline}{%
  \leavevmode\noindent%
  \hspace{0.8cm}%
  {\tiny\textcolor{KoinexaGray}{\textbf{KOINEXA} $|$ Internal DSA Architecture \& System Engineering}}%
  \hfill%
  {\tiny\textcolor{KoinexaOrange}{\textbf{\insertframenumber{} / \inserttotalframenumber}}}%
  \hspace{0.8cm}%
  \vskip 6pt%
}

% -- Clean Unboxed Code Listing Style (With Generous Margins) --
\lstdefinestyle{koinexastyle}{
  backgroundcolor=\color{white},
  commentstyle=\color{CodeGreen},
  keywordstyle=\color{CodeBlue}\bfseries,
  stringstyle=\color{CodePurple},
  basicstyle=\ttfamily\fontsize{6.2}{7.6}\selectfont,
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
  aboveskip=3pt,
  belowskip=3pt
}
\lstset{style=koinexastyle}

% -----------------------------------------------------------------------------
\begin{document}

% =============================================================================
% SLIDE 1: TITLE SLIDE
% =============================================================================
\begin{frame}[plain]
  \vspace{1.3cm}
  \begin{center}
    {\fontsize{36}{42}\selectfont\textbf{\textcolor{KoinexaRed}{KOINEXA}}}\\[0.25cm]
    {\fontsize{15}{18}\selectfont\textbf{\textcolor{KoinexaOrange}{A Fast Social Learning \& Competitive Coding Platform}}}\\[0.6cm]

    \small\textbf{\textcolor{KoinexaBlack}{Powered by High-Speed In-Memory Data Structures (DSA) \& Cheat-Proof Exam Security}}\\[0.2cm]
    \footnotesize\textcolor{KoinexaGray}{Multi-Language Code Runner $\cdot$ AI Teacher Verification $\cdot$ Smart Anti-Abuse Moderation}\\[1.0cm]

    {\small\textbf{\textcolor{KoinexaRed}{Final Engineering Project Defense}} \quad$|$\quad \textcolor{KoinexaGray}{Academic Year 2026}}
  \end{center}
\end{frame}

% =============================================================================
% SLIDE 2: TABLE OF CONTENTS
% =============================================================================
\begin{frame}
  \frametitle{Table of Contents}
  \framesubtitle{Project Presentation Overview}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Problem Statement \& Goals}}}\par\vspace{4pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item Why standard educational platforms slow down.
        \item Real-world bottlenecks: search lag, cheating, and code safety.
        \item Our 3 strict project design rules.
      \end{itemize}
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Fast In-Memory DSA Engine}}}\par\vspace{4pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item \textbf{Trie \& Index}: Instant multi-category search.
        \item \textbf{Min-Heap}: Top-50 academic feed ranking.
        \item \textbf{Social Graph}: Instant friend checks and suggestions.
        \item \textbf{LRU Cache \& Limiter}: Zero repeated database calls.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Real-World Features \& AI}}}\par\vspace{4pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item \textbf{JEE Exam Arena}: Authentic NTA 5-color palette test.
        \item \textbf{Cheat Prevention}: Answer key stripper and timer guard.
        \item \textbf{Safe Code Runner}: Multi-language editor without Docker lag.
        \item \textbf{Veritas-AI}: Autonomous teacher credential checking.
      \end{itemize}
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Results \& Performance}}}\par\vspace{4pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item Mathematical Big-O complexity comparison proofs.
        \item Measured benchmark speedups (up to 40.7x faster).
        \item Real end-to-end network latency tests.
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

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Problem 1: Search Freezes the Database}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Standard apps use slow SQL queries (\texttt{LIKE '\%search\%'}).
        \item The database must read every row from disk on every keystroke.
        \item When 50 students type at once, the database locks up.
      \end{itemize}
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaRed}{Problem 2: Communities Load Slowly ($N+1$)}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Showing 30 study groups requires 31 separate database calls.
        \item Every group forces an extra query for channels, causing lag.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Problem 3: Easy to Cheat in Online Tests}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Many apps send answers inside the web data payload.
        \item Students open browser DevTools to read answers or freeze timers.
      \end{itemize}
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{Problem 4: Dangerous Code \& AI Spoilers}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Running student code directly can crash or hack the server.
        \item Docker containers are safe, but take 400ms to start up.
        \item Generic AI chatbots give full code instead of teaching hints.
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

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Three Strict Project Rules}}}\par\vspace{4pt}
      \small
      \begin{enumerate}\setlength{\itemsep}{6pt}
        \item \textbf{Invisible to Users}: Students never see technical buzzwords like ``Powered by Trie''.
        \item \textbf{Zero Website Code Changes}: The React frontend interface received **0 file edits**.
        \item \textbf{Zero API Breaking Changes}: All backend data contracts remained 100\% identical.
      \end{enumerate}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Our Engineering Goals}}}\par\vspace{4pt}
      \small
      \begin{itemize}\setlength{\itemsep}{6pt}
        \item \textbf{No Heavy External Tools}: Use pure Python memory structures instead of expensive Redis or Elasticsearch clusters.
        \item \textbf{Sub-Millisecond Search}: Reduce search times to under 0.005 milliseconds.
        \item \textbf{Cheat-Proof Exams}: Strip answers on the server and use server-only countdown clocks.
        \item \textbf{Safe Code Sandbox}: Inspect code safely in under 50 milliseconds without Docker delays.
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

  \begin{columns}[T]
    \begin{column}{0.32\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Website (Frontend)}}}\par\vspace{4pt}
      \small
      \textbf{React 18 \& TypeScript}
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item Quick Spotlight search
        \item Authentic JEE exam arena
        \item Multi-language code runner
        \item Study groups \& chats
      \end{itemize}
    \end{column}

    \begin{column}{0.34\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Fast DSA Engine (RAM)}}}\par\vspace{4pt}
      \small
      \textbf{Pure In-Memory Python}
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Prefix Trie}: Instant text search
        \item \textbf{Min-Heap}: Top-50 feed ranking
        \item \textbf{Graph}: Fast friend lookups
        \item \textbf{LRU Cache}: Stops repeat calls
      \end{itemize}
    \end{column}

    \begin{column}{0.32\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Security \& Database}}}\par\vspace{4pt}
      \small
      \textbf{Protection \& Storage}
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item \textbf{Answer Stripper}: Stops cheating
        \item \textbf{AST Sandbox}: Safe code checks
        \item \textbf{Veritas-AI}: Teacher verification
        \item \textbf{SQLite WAL}: Permanent disk store
      \end{itemize}
    \end{column}
  \end{columns}

  \vspace{0.7cm}
  \centering
  \small\textbf{\textcolor{KoinexaBlack}{Simple Data Pipeline:}} Student Action $\longrightarrow$ Flask REST Route $\longrightarrow$ Fast RAM DSA Engine $\longrightarrow$ Security Check $\longrightarrow$ SQLite Database
\end{frame}

% =============================================================================
% SLIDE 6: FEATURE 1 - PREFIX TRIE SEARCH
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 1: Fast Universal Search Engine}
  \framesubtitle{Finding Items in Milliseconds Without Scanning the Database}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Instantly searches posts, quizzes, coding problems, study groups, and users as you type.\\
      \vspace{0.2cm}
      \textbf{Why It Is Better}: Other apps search slow database disks or require expensive search clusters. Koinexa stores words in a **Prefix Trie** and **Inverted Index** right in RAM.\\
      \vspace{0.3cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Speed & Complexity}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Search Speed}: $\mathcal{O}(L + M)$ ($L$ = word length, $M$ = matches). Database size $N$ does not slow it down!
        \item \textbf{Multi-Word}: Intersects sorted sets in microseconds.
        \item \textbf{Memory}: Tiny footprint ($< 64$ bytes per letter).
      \end{itemize}
    \end{column}

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
    # Collect matching results using a stack
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Ranks helpful courses and hackathons higher than casual social chats.\\
      \vspace{0.15cm}
      \textbf{Simple Scoring Formula}:
      \[\text{Score} = \frac{\text{Engagement} \times \text{Post Multiplier} + \text{Friend Boost}}{(\text{Hours Old} + 2.0)^{1.15}}\]
      Courses get a $1.5\times$ boost. Study friends get $+15.0$ points.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Why It Is Faster}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Sorting Speed}: $\mathcal{O}(N \log K)$ using a **Min-Heap of size 50** instead of slow $\mathcal{O}(N \log N)$ sorting.
        \item Cuts CPU work by more than half ($2.3\times$ faster).
      \end{itemize}
    \end{column}

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
    # Return items sorted from highest to lowest score
    res = [heapq.heappop(heap) for _ in range(len(heap))]
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Tracks study friends and finds mutual friends.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Standard apps run slow database joins on every card. Koinexa keeps an **Adjacency List** using Python hash sets in RAM.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Speed Breakdown}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Are We Friends?}: Instant $\mathcal{O}(1)$ check.
        \item \textbf{Mutual Friends}: Fast $\mathcal{O}(\min(d_1, d_2))$ set intersection.
        \item \textbf{Suggestions}: Breadth-First Search (BFS) bounded at depth 2.
      \end{itemize}
    \end{column}

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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Remembers recently used data in memory so we never query the database twice.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Built using a **Doubly Linked List + Hash Map** in RAM. Instant lookups without setting up a separate Redis server.\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Our 4 Cache Tiers}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \texttt{search\_cache} (512 items / 45s): Saves search queries.
        \item \texttt{community\_cache} (64 items / 180s): Completely kills the 31-query delay!
        \item \textbf{Speed}: Save, fetch, and remove all run in strict $\mathcal{O}(1)$ time.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Doubly Linked List Code}}}\par\vspace{2pt}
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Stops password guessing, test submission bots, and code execution spam.\\
      \vspace{0.15cm}
      \textbf{Why It Is Better}: Simple minute counters let attackers double-spam at 0:59 and 1:00. Koinexa tracks rolling timestamps in a double-ended queue (\texttt{deque}).\\
      \vspace{0.25cm}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Active Limits & Speed}}}\par\vspace{2pt}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item \textbf{Login}: Max 15 tries per minute.
        \item \textbf{Quiz Submit}: Max 4 submissions per 15 seconds.
        \item \textbf{Speed}: Removing old timestamps runs in $\mathcal{O}(1)$ time.
      \end{itemize}
    \end{column}

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
                q.popleft() # Remove old requests in O(1)
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Split-screen chat rooms for study topics (DSA, Web Dev, JEE 2026) with sub-channels (Announcements, Doubts).\\
      \vspace{0.2cm}
      \textbf{Novel Features}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item **Code in Chat**: Send runnable, highlighted code cards.
        \item **1-Click Share**: Send home feed courses into multiple groups and DMs at once.
        \item **Instant Loading**: Cached in RAM; loads instantly without 31 SQL calls.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1-Click Post Sharing Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/app.py (/api/posts/share)
@app.route("/api/posts/share", methods=["POST"])
def share_post_to_chats():
    # 1. Send to direct message chats
    for mate_id in target_studymate_ids:
        conn.execute("INSERT INTO direct_messages ...")
    # 2. Send to community channels
    for ch in target_channels:
        conn.execute("INSERT INTO messages ...")
    # 3. Update repost counter
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Authentic Exam Experience}}}\par\vspace{3pt}
      \small
      \textbf{Functionality}: Replicates the real computer-based JEE exam.\\
      \vspace{0.2cm}
      \textbf{Security \& Layout}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item **Full-Screen Lockdown**: Pressing Escape or switching tabs triggers auto-disqualification.
        \item **5-Color Question Palette**:
          \begin{itemize}\small
            \item \textbf{\textcolor{CodeGreen}{$\bullet$} Green}: Answered
            \item \textbf{\textcolor{KoinexaRed}{$\bullet$} Red}: Not Answered
            \item \textbf{\textcolor{KoinexaGray}{$\circ$} Gray}: Not Visited
            \item \textbf{\textcolor{CodePurple}{$\bullet$} Purple}: Marked for Review
          \end{itemize}
        \item **Subject Tabs**: Easy switches between Physics, Chemistry, Math.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Official Rules & Timing}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{4pt}
        \item **Real JEE Marking**: $+4$ points for correct, $-1$ penalty for wrong, $0$ for skipped.
        \item **Live Countdown**: Submits test automatically when timer reaches zero.
        \item **Instant Explanations**: Shows step-by-step solutions right after submission.
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 13: FEATURE 8 - CBT SECURITY
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 8: CBT Exam Security Engine}
  \framesubtitle{Stopping Answer Leaks and Bot Cheating}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{How We Stop Cheating}}}\par\vspace{2pt}
      \small
      \textbf{Security Suite} (\texttt{backend/cbt\_engine.py}):
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item **Answer Stripper**: Removes correct answers and explanations before sending the test to the student's browser.
        \item **Server-Only Clock**: The timer runs on our server. Changing your computer clock has zero effect.
        \item **Bot Speed Trap**: Answering questions in under 2.2 seconds automatically flags the user as an automated bot.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Answer Stripper & Speed Trap Code}}}\par\vspace{2pt}
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

# Speed Trap: flags bot solvers answering < 2.2s/question
speed = auth_time / max(1, answered_count)
if answered_count >= 5 and speed < 2.2:
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does & Novelty}}}\par\vspace{3pt}
      \small
      \textbf{Functionality}: A competitive coding arena supporting Python, JavaScript, C++, and Java.\\
      \vspace{0.2cm}
      \textbf{Key Highlights}:
      \begin{itemize}\setlength{\itemsep}{3pt}
        \item **Run Code**: Tests against 3 visible sample cases in under 50 ms for quick debugging.
        \item **Submit Solution**: Evaluates against **20+ hidden test cases** to stop hardcoded cheat answers.
        \item **Clear Verdicts**: Accepted, Wrong Answer, Time Limit Exceeded (5s), Compile Error.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{Execution Flow}}}\par\vspace{3pt}
      \small
      \begin{enumerate}\setlength{\itemsep}{3pt}
        \item Student writes code in Monaco Editor.
        \item AST Security Gate checks for dangerous calls.
        \item SHA-256 cache skips duplicate runs.
        \item Code runs in a subprocess with a 5.0s watchdog.
        \item Evaluator checks output line-by-line.
      \end{enumerate}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 15: FEATURE 10 - COMPILER SANDBOX
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 10: Compiler Sandbox & AST Security}
  \framesubtitle{Inspecting Code Safety in 2 Milliseconds Without Slow Docker}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Safe Execution Without Docker Lag}}}\par\vspace{2pt}
      \small
      \textbf{Why Not Docker?}: Docker takes 400 ms to start. Koinexa instead inspects the code's **Abstract Syntax Tree (AST)** before running it:\\
      \vspace{0.15cm}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Blocks dangerous libraries: \texttt{os, subprocess, socket}.
        \item Blocks dangerous calls: \texttt{eval, exec, open, compile}.
        \item Blocks reflection: \texttt{\_\_subclasses\_\_, \_\_builtins\_\_}.
        \item A 5.0-second watchdog stops infinite loops.
      \end{itemize}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Pre-Flight Inspector Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/compiler_sandbox.py
def check_code_safety_ast(code: str) -> Optional[str]:
    try: tree = ast.parse(code)
    except SyntaxError as e: return f"Syntax Error: {e.msg}"
    for node in ast.walk(tree):
        # 1. Prohibited module imports
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [a.name.split('.')[0] for a in getattr(node, 'names', [])]
            if any(n in DISALLOWED_MODULES for n in names):
                return "Security violation: Prohibited import."
        # 2. Dynamic execution calls
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in {"eval", "exec", "__import__", "open"}:
                return f"Security violation: Prohibited call {node.func.id}()."
        elif isinstance(node, ast.Attribute) and node.attr in DANGEROUS_DUNDERS:
            return "Security violation: Reflection prohibited."
    return None
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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does & Novelty}}}\par\vspace{2pt}
      \small
      \textbf{Automated Agent} (\texttt{backend/veritas\_agent.py}):\\
      Replaces weeks of manual paper checks with a 4-step automatic verification:
      \begin{enumerate}\setlength{\itemsep}{2pt}
        \item **College Email**: Confirms official domains (\texttt{.edu, .ac.in}).
        \item **Staff Directory**: Scrapes university website rosters.
        \item **Research Papers**: Checks Google Scholar & IEEE profiles.
        \item **Prompt Injection Trap**: Catches trick prompts in applications.
      \end{enumerate}
    \end{column}

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

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Teaching Without Spoiling}}}\par\vspace{2pt}
      \small
      \textbf{Code Helper} (\texttt{backend/ai\_engine.py}):\\
      Regular AI tools give away full answers. Koinexa gives **smart hints** so students actually learn:\\
      \vspace{0.15cm}
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item **Detects Slow Loops**: Finds nested loops and advises using Hash Maps instead.
        \item **Edge-Case Generator**: Tests tricky boundary cases like 0, negative numbers, and empty lists.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Loop Detection Snippet}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 18: FEATURE 13 - PLAGIARISM ENGINE
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 13: AST Plagiarism Detection Engine}
  \framesubtitle{Catching Copied Code Even When Variables Are Renamed}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Outsmarting Naive Copying}}}\par\vspace{2pt}
      \small
      \textbf{Functionality}: Catches copied code submissions.\\
      \vspace{0.15cm}
      \textbf{Why Simple Diffs Fail}: Students rename variables or reorder functions to fool basic tools.\\
      \vspace{0.15cm}
      \textbf{Our Solution}:
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Renames all variables to generic symbols (\texttt{v\_1, v\_2}).
        \item Removes comments and formatting spaces.
        \item Computes 16-gram overlap (flags if $\ge 82\%$).
      \end{itemize}
    \end{column}

    \begin{column}{0.5\textwidth}
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
        return ast.copy_location(ast.Name(id=new_id, ctx=node.ctx), node)

# 16-Gram Winnowing Jaccard Index
inter = len(ngrams_a & ngrams_b)
union = max(1, len(ngrams_a | ngrams_b))
is_flagged = (inter / union) >= 0.82 # 82% threshold
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 19: FEATURE 14 - MULTILINGUAL MODERATION
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 14: Context-Aware Multilingual Moderation}
  \framesubtitle{Filtering Bad Words Without Banning Medical or Math Terms}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Smart Abuse Protection}}}\par\vspace{2pt}
      \small
      \textbf{Engine} (\texttt{backend/moderation.py}):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item Filters abuse across 10 Indian languages.
        \item **Protects Academic Words**: Never blocks medical biology terms (\texttt{"penis"}) or math terms (\texttt{"dickson"}).
        \item **Cleans Trick Text**: Unmasks leetspeak (\texttt{@} $\to$ \texttt{a}, \texttt{\$} $\to$ \texttt{s}).
        \item Evaluates entire posts in $< 0.12$ ms.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Academic Whitelist Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/moderation.py (MultilingualFilter)
POLYSEMY_WHITELISTS = {
    "dick": {"dickson", "charles dickens", "mobydick"},
    "ass": {"assembly", "assert", "assignment", "passive"},
    "cock": {"shuttlecock", "stopcock", "cockpit"}
}
# Normalize trick characters and symbols
clean_text = normalize_leetspeak(input_text)
if is_severe_violent_threat(clean_text):
    enforce_immediate_account_suspension(user_id)
\end{lstlisting}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 20: FEATURE 15 - NEURAL CNN MODERATION
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 15: Neural Content Moderation CNN}
  \framesubtitle{Catching Hidden Toxicity in Under 5 Milliseconds on CPU}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Neural Subword Protection}}}\par\vspace{2pt}
      \small
      \textbf{Model} (\texttt{backend/ml\_moderation/}):\\
      Catches deliberate misspellings that fool keyword lists:
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item **Character-Level Network**: Reads raw letter sequences so misspellings cannot bypass it.
        \item **Multiple Filter Sizes**: Kernels (sizes 2, 3, 4, 5) detect harmful word stems.
        \item **Fast on CPU**: Runs in under 5 ms without needing an expensive GPU.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{PyTorch CNN Code}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 21: FEATURE 16 - STEM WHITELIST & YOUTUBE CHECK
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 16: STEM Whitelist & Safe Link Defense}
  \framesubtitle{Allowing Math Symbols While Blocking Phishing and Viruses}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Safe Math & Link Verification}}}\par\vspace{2pt}
      \small
      \textbf{Sanitizer} (\texttt{backend/sanitizer.py}):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item **Allows Math Notation**: Permits symbols like $\le, \ge, \pm, \sqrt{}, \sum, \int, \alpha, \beta$ while stripping harmful virus scripts.
        \item **Blocks Suspicious Links**: Rejects masked short links (\texttt{bit.ly, tinyurl}).
        \item **Checks YouTube Links**: Verifies in real-time that videos exist and have clean titles.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{YouTube Verification Code}}}\par\vspace{2pt}
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
\end{frame}

% =============================================================================
% SLIDE 22: FEATURE 17 - CLASSROOM SYSTEM
% =============================================================================
\begin{frame}[fragile]
  \frametitle{Feature 17: University Classroom System}
  \framesubtitle{Secure Course Codes with Live Push Notifications}

  \begin{columns}[T]
    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Organized Academic Courses}}}\par\vspace{2pt}
      \small
      \textbf{Classrooms} (\texttt{backend/app.py}):
      \begin{itemize}\setlength{\itemsep}{2pt}
        \item **Secure Course IDs**: Random 32-character hexadecimal codes.
        \item **Teacher Approval Gate**: Professors review student requests before granting course access.
        \item **Live Updates (SSE)**: Students receive instant push alerts when new tests or slides are posted.
      \end{itemize}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Classroom Creation Code}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/app.py (create_classroom)
classroom_id = secrets.token_hex(16) # 32-char crypto ID
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

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Huffman Compression}}}\par\vspace{2pt}
      \small
      Compresses text payloads by up to 55\% before sending, saving mobile data.
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Disjoint Set Union-Find}}}\par\vspace{2pt}
      \small
      Groups students into study teams in nearly instant $\mathcal{O}(\alpha(N)) \approx \mathcal{O}(1)$ time.
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Subject Taxonomy BST}}}\par\vspace{2pt}
      \small
      Binary search tree that keeps course topics sorted alphabetically in $\mathcal{O}(N)$ time.
      \vspace{0.4cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Canvas WebP Downscaler}}}\par\vspace{2pt}
      \small
      Shrinks user images in the browser before upload, saving over 70\% bandwidth.
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
  \small
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
  \vspace{0.4cm}

  \footnotesize\textcolor{KoinexaGray}{Where $N$: total records, $L$: search word length, $K$: top items shown (50).}
\end{frame}

% =============================================================================
% SLIDE 25: RESULTS 2 - EMPIRICAL BENCHMARKS
% =============================================================================
\begin{frame}
  \frametitle{Results: Measured Benchmark Speedups}
  \framesubtitle{Real Performance Numbers from backend/benchmark\_dsa.py}

  \begin{columns}[T]
    \begin{column}{0.55\textwidth}
      \centering
      \small
      \begin{tabular}{@{}lrrr@{}}
        \toprule
        \textbf{Operation} & \textbf{Old Way} & \textbf{With DSA} & \textbf{\textcolor{KoinexaRed}{Speedup}} \\ \midrule
        \textbf{Universal Search} & 0.051 ms & \textbf{0.001 ms} & \textbf{\textcolor{KoinexaRed}{40.7x faster}} \\
        \textbf{Community Channels} & 0.012 ms & \textbf{$<$ 0.001 ms} & \textbf{\textcolor{KoinexaRed}{37.9x faster}} \\
        \textbf{Top-50 Feed Ranking} & 0.167 ms & \textbf{0.134 ms} & \textbf{1.2x faster} \\
        \textbf{10,000 Friend Checks} & $\sim$120.0 ms & \textbf{1.19 ms} & \textbf{\textcolor{KoinexaRed}{100.8x faster}} \\
        \textbf{Mutual Friends} & 18.5 ms & \textbf{0.25 ms} & \textbf{\textcolor{KoinexaRed}{74.0x faster}} \\ \bottomrule
      \end{tabular}
      \vspace{0.4cm}

      \par\raggedright
      \footnotesize\textbf{\textcolor{KoinexaOrange}{Friend Graph Test}}: 10,000 connection checks completed in **1.19 ms** (an average of **0.119 microseconds per check**).
    \end{column}

    \begin{column}{0.43\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Speedup Highlights}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item **40.7x Faster Search**: The Prefix Trie walks memory directly; disk reads are eliminated.
        \item **37.9x Faster Communities**: The 31-query loop is completely eliminated by the LRU cache.
        \item **Instant Friend Checks**: Checking 10,000 friends takes single-digit microseconds.
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 26: RESULTS 3 - LIVE NETWORK LATENCIES
% =============================================================================
\begin{frame}
  \frametitle{Results: Live HTTP Network Latencies}
  \framesubtitle{Real End-to-End Speed Measurements & 100\% Test Pass Status}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Live HTTP Request Speed}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{4pt}
        \item \texttt{GET /api/search?q=python}: \textbf{6.59 ms avg}
        \item \texttt{GET /api/communities}: \textbf{4.02 ms avg}
        \item \texttt{GET /api/feed}: \textbf{7.12 ms avg}
        \item \texttt{GET /api/health}: \textbf{5.27 ms avg}
      \end{itemize}
      \vspace{0.3cm}
      \footnotesize\textit{Note: Network socket handshakes take 3--4ms. The internal DSA execution completes in under a single millisecond!}
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaOrange}{100\% Automated Test Suite Pass}}}\par\vspace{3pt}
      \small
      \begin{itemize}\setlength{\itemsep}{5pt}
        \item **DSA Engine Suite** (\texttt{test\_dsa\_engine.py}):\\
          \textbf{\textcolor{CodeGreen}{8/8 PASS}} (Trie, Index, LRU, Heap, Graph, Limiter).
        \item **CBT Exam Suite** (\texttt{test\_cbt\_engine.py}):\\
          \textbf{\textcolor{CodeGreen}{6/6 PASS}} (Scrubber, Clocks, Speed Trap, Scoring).
        \item **AI & Sandbox Suite** (\texttt{test\_ai\_and\_sandbox.py}):\\
          \textbf{\textcolor{CodeGreen}{6/6 PASS}} (AST Visitor, Mentor, Synthesizer).
      \end{itemize}
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 27: SUMMARY & LESSONS LEARNED
% =============================================================================
\begin{frame}
  \frametitle{Project Summary & Key Takeaways}
  \framesubtitle{What We Learned Building Koinexa}

  \begin{columns}[T]
    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{1. Smart Algorithms Beat Heavy Servers}}}\par\vspace{3pt}
      \small
      Instead of paying for expensive cloud servers (Redis, Elasticsearch), using classic computer science data structures gave us a **40x speedup** for free.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{2. Completely Transparent to Users}}}\par\vspace{3pt}
      \small
      All optimizations work silently in the background. The React frontend received **0 file changes**, and API responses kept their exact format.
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{3. Strong Security From Day 1}}}\par\vspace{3pt}
      \small
      Removing exam answers before sending data, inspecting code ASTs, and catching bot solvers ensures students cannot cheat.
      \vspace{0.45cm}

      {\normalsize\textbf{\textcolor{KoinexaOrange}{4. Ready for Production}}}\par\vspace{3pt}
      \small
      Includes background memory warmup threads and 1-click startup scripts (\texttt{quick\_launch.sh}, \texttt{run.sh}).
    \end{column}
  \end{columns}
\end{frame}

% =============================================================================
% SLIDE 28: CONCLUSION & THANK YOU
% =============================================================================
\begin{frame}[plain]
  \vspace{1.5cm}
  \begin{center}
    {\fontsize{34}{40}\selectfont\textbf{\textcolor{KoinexaRed}{Thank You!}}}\\[0.3cm]
    {\fontsize{15}{18}\selectfont\textbf{\textcolor{KoinexaOrange}{Questions & Discussion Welcome}}}\\[0.8cm]

    \small\textbf{\textcolor{KoinexaBlack}{KOINEXA: High-Performance Social Learning & Competitive Coding Ecosystem}}\\[0.2cm]
    \footnotesize\textcolor{KoinexaGray}{In-Memory DSA Acceleration $\cdot$ Cheat-Proof CBT Testing $\cdot$ Veritas-AI Faculty Verification}\\[0.9cm]

    {\normalsize\textbf{\textcolor{KoinexaRed}{Live Platform:}} \texttt{http://localhost:5174} \qquad \textbf{\textcolor{KoinexaOrange}{API Gateway:}} \texttt{http://127.0.0.1:5001}}
  \end{center}
\end{frame}

\end{document}
"""

with open("main.tex", "w", encoding="utf-8") as f:
    f.write(tex_content)

with open("koinexa_presentation.tex", "w", encoding="utf-8") as f:
    f.write(tex_content)

print("Generated clean, simple-English, 20% more whitespace version for both main.tex and koinexa_presentation.tex!")
