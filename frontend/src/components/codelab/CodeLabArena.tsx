import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Check,
  Layers,
  BookOpen,
  Filter,
  ShieldAlert
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { CodingProblem, CodeEvalResult } from '../../types';
import { ProblemUploadModal } from './ProblemUploadModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export interface CodeLabArenaProps {
  initialProblemSlug?: string | null;
  onSolvingStateChange?: (isSolving: boolean) => void;
  hideHeader?: boolean;
}

export const CodeLabArena: React.FC<CodeLabArenaProps> = ({
  initialProblemSlug,
  onSolvingStateChange,
  hideHeader = false,
}) => {
  const { authFetch, user, openAuthModal } = useAuth();
  const { theme } = useTheme();
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onSolvingStateChange?.(!!selectedProblem);
  }, [selectedProblem]);

  useEffect(() => {
    if (initialProblemSlug && problems.length > 0) {
      const match = problems.find((p) => p.slug === initialProblemSlug || p.id === initialProblemSlug);
      if (match) {
        loadProblemDetails(match.slug);
      }
    }
  }, [initialProblemSlug, problems]);

  // Exam Mode Timer (45:00 minutes)
  const [examSecondsLeft, setExamSecondsLeft] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!selectedProblem || !isTimerRunning || examSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setExamSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedProblem, isTimerRunning, examSecondsLeft]);

  const formatExamTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Problem Set Filters
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Execution & Testing states
  const [activeTab, setActiveTab] = useState<'testcases' | 'output' | 'submissions'>('testcases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodeEvalResult | null>(null);
  const [submitResult, setSubmitResult] = useState<CodeEvalResult | null>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const fetchProblems = async () => {
    try {
      const res = await fetch('/api/problems');
      const data = await res.json();
      if (data.success && data.problems?.length > 0) {
        setProblems(data.problems);
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProblemDetails = async (slug: string) => {
    try {
      const res = await fetch(`/api/problems/${slug}`);
      const data = await res.json();
      if (data.success && data.problem) {
        const prob = data.problem as CodingProblem;
        setSelectedProblem(prob);

        // Restore draft from localStorage if present, else use starter template
        const draftKey = `koinexa_code_${prob.id}_${language}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && savedDraft.trim()) {
          setCode(savedDraft);
        } else {
          const template = prob.starter_templates?.[language] || '# Write your solution here\n';
          setCode(template);
        }

        setRunResult(null);
        setSubmitResult(null);
        setExecError(null);
        setSelectedCaseIdx(0);
        setExamSecondsLeft(45 * 60);
        setIsTimerRunning(true);
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'cpp' | 'java') => {
    setLanguage(newLang);
    if (selectedProblem) {
      const draftKey = `koinexa_code_${selectedProblem.id}_${newLang}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && savedDraft.trim()) {
        setCode(savedDraft);
      } else if (selectedProblem.starter_templates?.[newLang]) {
        setCode(selectedProblem.starter_templates[newLang]);
      }
    }
  };

  const handleCodeChange = (newVal: string) => {
    setCode(newVal);
    if (selectedProblem) {
      try {
        localStorage.setItem(`koinexa_code_${selectedProblem.id}_${language}`, newVal);
      } catch {
        // ignore
      }
    }
  };

  const handleResetCode = () => {
    if (selectedProblem) {
      const draftKey = `koinexa_code_${selectedProblem.id}_${language}`;
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      if (selectedProblem.starter_templates?.[language]) {
        setCode(selectedProblem.starter_templates[language]);
      }
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedProblem) return;
    if (!user) {
      setPastSubmissions([]);
      return;
    }
    setIsLoadingSubmissions(true);
    try {
      const res = await authFetch(`/api/problems/${selectedProblem.id}/submissions`);
      const data = await res.json();
      if (data.success && data.submissions) {
        setPastSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleRunCode = async () => {
    if (!selectedProblem) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsRunning(true);
    setExecError(null);
    setActiveTab('output');
    try {
      const res = await authFetch(`/api/problems/${selectedProblem.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setRunResult(data.result);
      } else {
        setExecError(data.error || 'Failed to run code.');
      }
    } catch (err: any) {
      console.error('Run code error:', err);
      setExecError(err.message || 'Network error occurred during code run.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedProblem) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsSubmitting(true);
    setExecError(null);
    setActiveTab('output');
    try {
      const res = await authFetch(`/api/problems/${selectedProblem.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult(data.result);
        if (data.result.verdict === 'Accepted') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        setExecError(data.error || 'Failed to submit solution.');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setExecError(err.message || 'Network error occurred during code submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const diffColors: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Hard: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
  };

  const [activeExampleIdx, setActiveExampleIdx] = useState(0);

  // Filtered problems list calculation
  const filteredProblems = problems.filter((p) => {
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesDiff && matchesCat;
  });

  const categories = ['All', ...Array.from(new Set(problems.map((p) => p.category)))];

  const counts = {
    all: problems.length,
    easy: problems.filter((p) => p.difficulty === 'Easy').length,
    medium: problems.filter((p) => p.difficulty === 'Medium').length,
    hard: problems.filter((p) => p.difficulty === 'Hard').length,
  };

  return (
    <div className={`w-full ${hideHeader ? 'min-h-0' : 'min-h-[calc(100vh-2rem)]'} flex flex-col p-2.5 sm:p-6 ${hideHeader ? 'lg:pl-0' : 'lg:pl-[88px] xl:pl-[104px] 2xl:pl-[112px]'} max-w-[1700px] 2xl:max-w-[2200px] mx-auto space-y-3.5 ${
      selectedProblem ? 'lg:h-[calc(100vh-2rem)] overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0' : 'overflow-y-auto pb-28 lg:pb-12'
    }`}>
      {selectedProblem ? (
        <>
          {/* ── ARENA TOP ACTION BAR & PROBLEM SWITCHER ── */}
          <div className="h-12 flex items-center justify-between px-1 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back to Questions List Button */}
              <button
                onClick={() => setSelectedProblem(null)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-text)] transition-all cursor-pointer shadow-sm group"
                title="Return to Problem Set List"
              >
                <ArrowLeft className="w-4 h-4 text-[#0A84FF] group-hover:-translate-x-0.5 transition-transform" />
                <span>All Problems</span>
              </button>

              <div className="h-4 w-px bg-[var(--x-border)] hidden sm:block" />

              {/* Problem Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedProblem?.slug || ''}
                  onChange={(e) => {
                    loadProblemDetails(e.target.value);
                    setActiveExampleIdx(0);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-xs sm:text-sm font-bold text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 cursor-pointer shadow-sm transition-all max-w-[170px] sm:max-w-none truncate"
                >
                  {problems.map((p) => (
                    <option key={p.id} value={p.slug} className="bg-[var(--x-surface)] text-[var(--x-text)] font-sans">
                      {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border backdrop-blur-md shadow-sm ${diffColors[selectedProblem.difficulty] || ''}`}>
                {selectedProblem.difficulty}
              </span>

              {/* EXAM MODE BADGE */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-[11px] font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                EXAM MODE
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* EXAM TIMER HUD */}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl border font-mono text-xs font-bold transition-all shadow-sm ${
                  examSecondsLeft < 300
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 dark:text-rose-300 animate-pulse'
                    : examSecondsLeft < 600
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
                    : 'bg-[var(--x-surface)] border-[var(--x-border)] text-[var(--x-text)]'
                }`}
                title="Exam Countdown Timer"
              >
                <Clock className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>{formatExamTime(examSecondsLeft)}</span>
                <span className="hidden md:inline text-[10px] text-[var(--x-subtext)] font-sans font-normal">
                  Remaining
                </span>
              </div>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-semibold text-[var(--x-text)] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0A84FF]" />
                <span className="hidden sm:inline">Upload Problem (20+ Cases)</span>
                <span className="sm:hidden">Upload</span>
              </button>
            </div>
          </div>

          {/* ── MAIN LEETCODE SPLIT ARENA ── */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-visible lg:overflow-hidden">
            {/* ── LEFT PANE: PROBLEM STATEMENT & TABBED SAMPLE CASES (5 cols) ── */}
            <div className="lg:col-span-5 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-6 max-h-[520px] lg:max-h-none shadow-xl">
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--x-text)] tracking-tight">
                  {selectedProblem.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#0A84FF] font-medium">
                    {selectedProblem.category}
                  </span>
                  <span className="text-[var(--x-subtext)]">•</span>
                  <span className="text-xs text-[var(--x-subtext)] font-mono">
                    {selectedProblem.total_test_cases || 20} Test Cases
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs sm:text-sm text-[var(--x-text)] leading-relaxed whitespace-pre-wrap font-normal">
                {selectedProblem.description}
              </div>

              {/* Constraints */}
              <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-1.5 shadow-inner">
                <span className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block">
                  Constraints
                </span>
                <pre className="text-xs font-mono text-[#0A84FF] dark:text-purple-300 whitespace-pre-wrap leading-relaxed">
                  {selectedProblem.constraints}
                </pre>
              </div>

              {/* 3 SAMPLE CASES (Crisp Tabbed Navigation) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--x-text)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Sample Cases
                  </h3>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs">
                    {selectedProblem.sample_cases.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveExampleIdx(i)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold font-mono transition-all cursor-pointer ${
                          activeExampleIdx === i
                            ? 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                            : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                        }`}
                      >
                        Ex {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedProblem.sample_cases[activeExampleIdx] && (
                  <div className="p-4 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2.5 text-xs shadow-sm">
                    <div className="space-y-2 font-mono text-[11.5px]">
                      <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                        <span className="text-[var(--x-subtext)] block text-[10px] uppercase font-bold mb-0.5 font-sans">Input</span>
                        <span className="text-[var(--x-text)] whitespace-pre-wrap">{selectedProblem.sample_cases[activeExampleIdx].input.replace(/\n/g, ' ')}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                        <span className="text-[var(--x-subtext)] block text-[10px] uppercase font-bold mb-0.5 font-sans">Expected Output</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedProblem.sample_cases[activeExampleIdx].output}</span>
                      </div>
                    </div>
                    <div className="pt-2 text-[var(--x-subtext)] text-xs leading-relaxed border-t border-[var(--x-border)]">
                      <span className="text-[#0A84FF] font-semibold block text-[11px] uppercase tracking-wider mb-0.5">Explanation</span>
                      {selectedProblem.sample_cases[activeExampleIdx].explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANE: MONACO CODE EDITOR & TEST RUNNER (7 cols) ── */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 overflow-visible lg:overflow-hidden min-h-[460px]">
            {/* Editor Toolbar (macOS Style Bar) */}
            <div className="h-11 px-4 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-2xl flex items-center justify-between flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
                </div>
                <div className="h-4 w-px bg-[var(--x-border)] mx-1" />
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#0A84FF]" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-[var(--x-text)] focus:outline-none cursor-pointer"
                  >
                    <option value="python" className="bg-[var(--x-surface)] text-[var(--x-text)]">Python 3</option>
                    <option value="javascript" className="bg-[var(--x-surface)] text-[var(--x-text)]">JavaScript (Node.js)</option>
                    <option value="cpp" className="bg-[var(--x-surface)] text-[var(--x-text)]">C++ (G++ 17)</option>
                    <option value="java" className="bg-[var(--x-surface)] text-[var(--x-text)]">Java (OpenJDK 17)</option>
                  </select>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-[11px] font-mono text-[var(--x-subtext)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Skeleton Starter Function</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  title="Reset to Starter Function"
                  className="p-1.5 rounded-xl text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 rounded-[24px] overflow-hidden border border-[var(--x-border)] shadow-2xl bg-[var(--x-surface)] min-h-[300px]">
              <Editor
                height="100%"
                language={language}
                theme={theme === 'light' ? 'vs' : 'vs-dark'}
                value={code}
                onChange={(val) => handleCodeChange(val || '')}
                options={{
                  fontSize: 13.5,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 4,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  renderLineHighlight: 'all',
                }}
              />
            </div>

            {/* Bottom Panel: Testcases & Output Runner */}
            <div className="h-60 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-[24px] p-4 flex flex-col justify-between flex-shrink-0 text-[var(--x-text)] shadow-xl">
              {/* Tab Selector & Actions */}
              <div className="flex items-center justify-between border-b border-[var(--x-border)] pb-3 flex-shrink-0">
                {/* iOS Segmented Pill */}
                <div className="flex items-center p-1 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs">
                  <button
                    onClick={() => setActiveTab('testcases')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'testcases'
                        ? 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                        : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    Sample Cases
                  </button>
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'output'
                        ? 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                        : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    Console Output & Results
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('submissions');
                      fetchSubmissions();
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'submissions'
                        ? 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                        : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    Past Submissions
                  </button>
                </div>

                {/* Submit / Run Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-40 shadow-md btn-keep-white"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    onClick={handleSubmitCode}
                    disabled={isRunning || isSubmitting}
                    className="flex items-center gap-2 px-5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0071e3] transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-blue-500/30 btn-keep-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Judging (20+ cases)...' : 'Submit Solution'}</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto py-2">
                {activeTab === 'testcases' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {selectedProblem.sample_cases.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedCaseIdx(i)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                            selectedCaseIdx === i
                              ? 'bg-blue-500/20 text-[#0A84FF] border border-blue-500/40 shadow-sm'
                              : 'bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border border-[var(--x-border)]'
                          }`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] font-mono text-xs space-y-1.5">
                      <div className="text-[var(--x-subtext)]">
                        Input:{' '}
                        <span className="text-[var(--x-text)] font-medium">
                          {selectedProblem.sample_cases[selectedCaseIdx]?.input.replace(/\n/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[var(--x-subtext)]">
                        Expected Output:{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {selectedProblem.sample_cases[selectedCaseIdx]?.output}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'output' ? (
                  <div className="space-y-2 font-mono text-xs">
                    {execError && (
                      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                        <span>{execError}</span>
                      </div>
                    )}
                    {/* Submission Verdict Banner */}
                    {submitResult && (
                      <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-lg ${
                        submitResult.verdict === 'Accepted'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          {submitResult.verdict === 'Accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                          <span className="font-extrabold text-sm uppercase tracking-wider">
                            {submitResult.verdict}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)]">
                            Passed: {submitResult.passed_count} / {submitResult.total_count} Cases
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)]">
                            Latency: {submitResult.avg_time_ms} ms
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Run result (sample cases) */}
                    {runResult && !submitResult && (
                      <div className="p-3 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={runResult.all_passed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                            {runResult.all_passed ? '✓ All 3 Sample Cases Passed' : '✗ Sample Testcases Failed'}
                          </span>
                          <span className="text-[var(--x-subtext)]">{runResult.passed_count} / {runResult.total_count} Passed</span>
                        </div>

                        <div className="space-y-1">
                          {runResult.results.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] text-[var(--x-text)] px-2 py-1 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)]">
                              <span>Case {i + 1}: {r.status}</span>
                              <span className="text-[var(--x-subtext)]">{r.execution_time_ms} ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!runResult && !submitResult && (
                      <div className="text-[var(--x-subtext)] text-xs py-3 text-center">
                        Click "Run Code" to test on 3 sample cases or "Submit Solution" to judge across all 20+ test cases.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Past Submissions View */
                  <div className="space-y-2 overflow-y-auto max-h-48 pr-1">
                    {isLoadingSubmissions ? (
                      <div className="py-6 text-center text-xs text-[var(--x-subtext)] flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
                        <span>Loading past submissions...</span>
                      </div>
                    ) : pastSubmissions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[var(--x-subtext)]">
                        No submissions recorded for this problem yet. Write code and hit "Submit Solution"!
                      </div>
                    ) : (
                      pastSubmissions.map((sub, i) => (
                        <div
                          key={sub.id || i}
                          className="p-2.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.verdict === 'Accepted'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                                  : sub.verdict === 'Time Limit Exceeded'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                                  : sub.verdict === 'Compilation Error'
                                  ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {sub.verdict}
                            </span>
                            <span className="text-[var(--x-text)] font-semibold">{sub.language}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[var(--x-subtext)] text-[11px]">
                            <span>{sub.passed_count} / {sub.total_count} cases</span>
                            <span>{sub.execution_time_ms} ms</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    ) : (
        /* ── PROBLEM SET LIST VIEW (QUESTIONS DISPLAYED IN A LINE) ── */
        <div className="flex-1 flex flex-col space-y-4">
          {/* ── TOP HERO BANNER & UPLOAD ACTION ── */}
          {!hideHeader && (
            <div className="bg-[var(--x-surface)] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[var(--x-border)] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-1.5 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#0A84FF] text-xs font-bold tracking-wide">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>LEETCODE ARENA • PROBLEM SET</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--x-text)] tracking-tight">
                  Code Lab Challenges
                </h1>
                <p className="text-xs sm:text-sm text-[var(--x-subtext)] max-w-2xl leading-relaxed">
                  Select any challenge below to enter the interactive solving arena. Code in Python 3 or JavaScript (Node.js) with instant automated evaluation against 20+ hidden test cases.
                </p>
              </div>

              <div className="flex items-center gap-3 z-10 flex-shrink-0">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="ios-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/30 cursor-pointer btn-keep-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Problem (20+ Cases)</span>
                </button>
              </div>
            </div>
          )}

          {/* ── DIFFICULTY FILTERS ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Difficulty Filter Segmented Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] overflow-x-auto">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
                const count =
                  diff === 'All'
                    ? counts.all
                    : diff === 'Easy'
                    ? counts.easy
                    : diff === 'Medium'
                    ? counts.medium
                    : counts.hard;
                const isActive = difficultyFilter === diff;

                return (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? diff === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : diff === 'Medium'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 shadow-sm'
                          : diff === 'Hard'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 shadow-sm'
                          : 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                        : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    <span>{diff}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[var(--x-surface)] text-[var(--x-subtext)] border border-[var(--x-border)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TOPIC / CATEGORY CHIPS ── */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--x-subtext)] flex items-center gap-1 pl-1">
                <Layers className="w-3 h-3 text-[#0A84FF]" />
                Topics:
              </span>
              {categories.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A84FF] text-white border border-[#0A84FF] shadow-sm btn-keep-white'
                        : 'bg-[var(--x-surface)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border border-[var(--x-border)]'
                    }`}
                  >
                    {cat === 'All' ? 'All Topics' : cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── QUESTION LIST / TABLE (QUESTIONS DISPLAYED IN A LINE) ── */}
          <div className="bg-[var(--x-surface)] rounded-[28px] sm:rounded-[32px] p-3 sm:p-5 border border-[var(--x-border)] shadow-xl flex flex-col space-y-2.5">
            {/* Table Header (Desktop & Large screens >= 1024px) */}
            <div className="hidden lg:flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--x-subtext)] border-b border-[var(--x-border)]">
              <div className="w-14">#</div>
              <div className="flex-1">Title & Overview</div>
              <div className="w-48">Category</div>
              <div className="w-28">Difficulty</div>
              <div className="w-32">Test Cases</div>
              <div className="w-24 text-right">Action</div>
            </div>

            {/* Problem Rows */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[var(--x-subtext)]">
                <div className="w-8 h-8 rounded-full border-2 border-[#0A84FF] border-t-transparent animate-spin" />
                <span className="text-xs font-medium">Loading challenges...</span>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-[var(--x-subtext)] text-sm">No challenges match your filter.</p>
                <button
                  onClick={() => {
                    setDifficultyFilter('All');
                    setCategoryFilter('All');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-text)] transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredProblems.map((p, idx) => (
                <motion.div
                  key={p.id}
                  onClick={() => loadProblemDetails(p.slug)}
                  whileHover={{ scale: 1.002 }}
                  transition={{ duration: 0.15 }}
                  className="group relative rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-blue-400/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-blue-500/10 p-3.5 sm:px-4.5 sm:py-3.5"
                >
                  {/* ── MOBILE & TABLET VIEW (< lg) ── */}
                  <div className="flex flex-col gap-2.5 lg:hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] flex items-center justify-center text-[11px] font-mono font-bold text-[var(--x-subtext)] group-hover:border-blue-400/40 group-hover:text-[var(--x-text)] transition-all flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[var(--x-text)] text-sm sm:text-base group-hover:text-[#0A84FF] transition-colors truncate">
                          {p.title}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm flex-shrink-0 ${diffColors[p.difficulty] || ''}`}>
                        {p.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--x-subtext)] line-clamp-1">
                      {p.description ? p.description.split('\n')[0] : 'Algorithmic challenge'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--x-border)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] text-[11px] text-[var(--x-subtext)] font-medium">
                          {p.category}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--x-subtext)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {p.total_test_cases || 21} Cases
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProblemDetails(p.slug);
                        }}
                        className="px-3 py-1 rounded-xl bg-blue-500/15 group-hover:bg-[#0A84FF] text-[#0A84FF] group-hover:text-white border border-blue-500/30 group-hover:border-transparent text-xs font-semibold transition-all flex items-center gap-1 shadow-sm btn-keep-white"
                      >
                        <span>Solve</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* ── WIDESCREEN & DESKTOP ROW VIEW (>= lg) ── */}
                  <div className="hidden lg:flex items-center justify-between w-full">
                    {/* Index */}
                    <div className="w-14 text-xs font-mono font-bold text-[var(--x-subtext)] group-hover:text-[#0A84FF] transition-colors flex items-center">
                      <span className="w-7 h-7 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)] flex items-center justify-center text-[11px] group-hover:border-blue-400/40 group-hover:text-[var(--x-text)] transition-all">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Title & Preview */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="font-semibold text-[var(--x-text)] text-base group-hover:text-[#0A84FF] transition-colors">
                        {p.title}
                      </div>
                      <p className="text-xs text-[var(--x-subtext)] truncate mt-0.5 max-w-xl">
                        {p.description ? p.description.split('\n')[0] : 'Algorithmic challenge'}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="w-48 flex items-center pr-4">
                      <span className="px-2.5 py-1 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)] text-xs text-[var(--x-subtext)] font-medium truncate">
                        {p.category}
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div className="w-28 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${diffColors[p.difficulty] || ''}`}>
                        {p.difficulty}
                      </span>
                    </div>

                    {/* Test Cases */}
                    <div className="w-32 flex items-center gap-1.5 text-xs font-mono text-[var(--x-subtext)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{p.total_test_cases || 21} Cases</span>
                    </div>

                    {/* Action */}
                    <div className="w-24 flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProblemDetails(p.slug);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-500/15 group-hover:bg-[#0A84FF] text-[#0A84FF] group-hover:text-white border border-blue-500/30 group-hover:border-transparent text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer btn-keep-white"
                      >
                        <span>Solve</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      <ProblemUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProblemUploaded={fetchProblems}
      />
    </div>
  );
};
