import re

with open("main.tex", "r", encoding="utf-8") as f:
    text = f.read()

# Refactor Slide 18 (Feature 13 Plagiarism)
s18_old = r"""    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{AST Identifier Normalizer}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/ai_engine.py
class Renamer(ast.NodeTransformer):
    def __init__(self):
        self.mapping = {}
        self.counter = 0
    def visit_Name(self, node):
        if node.id not in self.mapping:
            self.counter += 1
            self.mapping[node.id] = f"v_{self.counter}"
        return ast.copy_location(ast.Name(id=self.mapping[node.id], ctx=node.ctx), node)

# Compute 16-gram Winnowing Jaccard Index
sim = len(ngrams_a & ngrams_b) / max(1, len(ngrams_a | ngrams_b))
is_flagged = sim >= 0.82 # 82% threshold flags plagiarism
\end{lstlisting}
    \end{column}"""

s18_new = r"""    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{AST Identifier Normalizer}}}\par\vspace{3pt}
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
    \end{column}"""

text = text.replace(s18_old, s18_new)

# Refactor Slide 19 (Feature 14 Moderation): Move sub-ms speed note to left column
s19_old = r"""    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{3pt}
\scriptsize
        \textbf{Engine} (\texttt{backend/moderation.py}):\\
        Filters vulgarity, abusive attacks, and severe harassment across \textbf{English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Spanish, French}.\\
        \textbf{Novelty vs. Naive Word Blockers}:
        \begin{itemize}\setlength{\itemsep}{2pt}
          \item \textbf{Anti-Scunthorpe Disambiguator}: Prevents false positive bans on legitimate academic terms (e.g. biological terms like \texttt{"penis"}, literature like \texttt{"assassin"}, mathematics like \texttt{"dickson polynomial"}).
          \item \textbf{Anti-Obfuscation}: Normalizes leetspeak (\texttt{@} $\to$ \texttt{a}, \texttt{\$} $\to$ \texttt{s}, \texttt{1} $\to$ \texttt{i}) and collapses spaced letters (\texttt{f u c k}).
        \end{itemize}
\vspace{0.3cm}
    \end{column}

    \begin{column}{0.5\textwidth}
      {\scriptsize\textbf{\textcolor{KoinexaRed}{Polysemy Context Guard}}}\par\vspace{2pt}
\begin{lstlisting}[language=Python]
# backend/moderation.py
POLYSEMY_WHITELISTS = {
    "dick": {"dickson", "charles dickens", "mobydick"},
    "ass": {"assembly", "assert", "assignment", "passive"},
    "cock": {"shuttlecock", "stopcock", "cockpit"}
}
# Checks leetspeak & multi-symbol asterisk masking
clean_text = normalize_leetspeak(input_text)
if is_severe_violent_threat(clean_text):
    enforce_immediate_account_suspension(user_id)
\end{lstlisting}
      \vspace{0.2cm}
      \vspace{0.25cm}
\par\noindent \scriptsize\textbf{Sub-Millisecond Speed}: Evaluates entire posts in $< 0.12$ ms using compiled regular expressions.
    \end{column}"""

s19_new = r"""    \begin{column}{0.5\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{What It Does \& Novelty}}}\par\vspace{2pt}
      \scriptsize
      \textbf{Engine} (\texttt{backend/moderation.py}): Filters abuse across 10 languages (English, Hindi, Telugu, Tamil, Kannada, etc.).\\
      \vspace{0.15cm}
      \textbf{Anti-Scunthorpe Disambiguator}: Protects academic terms (\texttt{"penis"}, \texttt{"assassin"}, \texttt{"dickson"}).\\
      \textbf{Anti-Obfuscation}: Normalizes leetspeak (\texttt{@} $\to$ \texttt{a}, \texttt{\$} $\to$ \texttt{s}).\\
      \vspace{0.15cm}
      \textbf{Performance}: Evaluates entire posts in $< 0.12$ ms using compiled regex patterns.
    \end{column}

    \begin{column}{0.48\textwidth}
      {\normalsize\textbf{\textcolor{KoinexaRed}{Polysemy Context Guard}}}\par\vspace{3pt}
\begin{lstlisting}[language=Python]
# backend/moderation.py (MultilingualFilter)
POLYSEMY_WHITELISTS = {
    "dick": {"dickson", "charles dickens", "mobydick"},
    "ass": {"assembly", "assert", "assignment", "passive"},
    "cock": {"shuttlecock", "stopcock", "cockpit"}
}
# Normalize leetspeak and symbols
clean_text = normalize_leetspeak(input_text)
if is_severe_violent_threat(clean_text):
    enforce_immediate_account_suspension(user_id)
\end{lstlisting}
    \end{column}"""

text = text.replace(s19_old, s19_new)

with open("main.tex", "w", encoding="utf-8") as f:
    f.write(text)

with open("koinexa_presentation.tex", "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully polished all listings!")
