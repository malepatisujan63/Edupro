import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  Maximize,
  Minimize,
  Lock,
  AlertTriangle,
  Trophy,
  Zap,
  Cpu,
  BarChart3
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
  onExamStateChange?: (isExam: boolean) => void;
  onBackToChallenges?: () => void;
  hideHeader?: boolean;
}

export const CodeLabArena: React.FC<CodeLabArenaProps> = ({
  initialProblemSlug,
  onSolvingStateChange,
  onExamStateChange,
  onBackToChallenges,
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

  // ── STRICT CBT EXAMINATION PROCTORING STATE (ZERO-TOLERANCE) ──
  const [isExamMode, setIsExamMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState<string | null>(null);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(true);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const proctorLogsRef = useRef<string[]>([]);
  const violationTriggeredRef = useRef<boolean>(false);
  const codeRef = useRef<string>(code);
  const languageRef = useRef<string>(language);
  const selectedProblemRef = useRef<CodingProblem | null>(selectedProblem);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    selectedProblemRef.current = selectedProblem;
  }, [selectedProblem]);

  // Sync solving and exam state with parent navigation
  useEffect(() => {
    onSolvingStateChange?.(!!selectedProblem);
    const isInArena = !!selectedProblem;
    onExamStateChange?.(isInArena);
    return () => {
      onExamStateChange?.(false);
    };
  }, [selectedProblem, onSolvingStateChange, onExamStateChange]);

  useEffect(() => {
    if (initialProblemSlug && problems.length > 0) {
      const match = problems.find((p) => p.slug === initialProblemSlug || p.id === initialProblemSlug);
      if (match) {
        loadProblemDetails(match.slug);
      }
    }
  }, [initialProblemSlug, problems]);

  // Exam Mode Timer (45:00 minutes standard)
  const [examSecondsLeft, setExamSecondsLeft] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Format countdown
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
  const [activeExampleIdx, setActiveExampleIdx] = useState(0);

  // 15-second Auto-exit countdown for Code Lab post-submission
  const [autoExitSeconds, setAutoExitSeconds] = useState<number | null>(null);
  const [autoExitCancelled, setAutoExitCancelled] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Handle Return to Challenges Hub (Clean Reset)
  const handleReturnToChallenges = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    setAutoExitSeconds(null);
    setAutoExitCancelled(false);
    setShowLeaderboardModal(false);
    setSelectedProblem(null);
    setExamSubmitted(false);
    setShowResultModal(false);
    setSubmitResult(null);
    setRunResult(null);
    setExecError(null);
    setLastViolationReason(null);
    violationTriggeredRef.current = false;
    onExamStateChange?.(false);
    onSolvingStateChange?.(false);
    onBackToChallenges?.();
  };

  useEffect(() => {
    if (!examSubmitted || autoExitCancelled) {
      setAutoExitSeconds(null);
      return;
    }
    setAutoExitSeconds(15);
    const timer = setInterval(() => {
      setAutoExitSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handleReturnToChallenges();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examSubmitted, autoExitCancelled]);

  // Request Fullscreen helper
  const requestFullscreenLock = async () => {
    try {
      if (arenaRef.current?.requestFullscreen) {
        await arenaRef.current.requestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      console.warn('Fullscreen request blocked by browser gesture rules');
    }
  };

  // ── STRICT ZERO-TOLERANCE PROCTORING: IMMEDIATE AUTO-SUBMIT (NO WARNINGS) ──
  const triggerAutoSubmit = (reason: string) => {
    if (examSubmitted || isSubmitting || violationTriggeredRef.current) return;
    violationTriggeredRef.current = true;
    setIsTimerRunning(false);
    setLastViolationReason(reason);

    const timestamp = new Date().toLocaleTimeString();
    proctorLogsRef.current.push(`[${timestamp}] 🚨 ZERO-TOLERANCE AUTO-SUBMIT: ${reason}`);

    const termReason = `Terminated & Auto-Submitted: ${reason}`;
    handleSubmitCode(termReason);
  };

  // ── FULLSCREEN CHANGE LISTENER ──
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFull = !!document.fullscreenElement;
      setIsFullscreen(inFull);
      if (selectedProblem && isExamMode && !inFull && !examSubmitted && !violationTriggeredRef.current) {
        triggerAutoSubmit('Fullscreen Exit Violation: Fullscreen mode was interrupted or exited.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [selectedProblem, isExamMode, examSubmitted]);

  // ── TAB SWITCH & WINDOW BLUR DETECTOR (ZERO-TOLERANCE CBT) ──
  useEffect(() => {
    if (!selectedProblem || !isExamMode || examSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !examSubmitted && !violationTriggeredRef.current) {
        triggerAutoSubmit('Tab Switch Violation: Candidate navigated away to another tab, website, or application.');
      }
    };

    const handleWindowBlur = () => {
      if (!examSubmitted && !violationTriggeredRef.current) {
        triggerAutoSubmit('Window Focus Lost: Candidate switched focus away from the examination window.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [selectedProblem, isExamMode, examSubmitted]);

  // ── KEYBOARD PROHIBITED COMBOS & DEVTOOLS DETECTOR ──
  useEffect(() => {
    if (!selectedProblem || !isExamMode || examSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isEscape = e.key === 'Escape' || e.keyCode === 27;
      const isDevTools =
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'));
      const isCopy = (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C');
      const isPaste = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V');

      if (isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        triggerAutoSubmit('DevTools Violation: Candidate attempted to open browser developer tools inspection.');
        return;
      }

      if (isEscape) {
        e.preventDefault();
        e.stopPropagation();
        triggerAutoSubmit('Escape Key Violation: Escape key is prohibited during examination mode.');
        return;
      }

      if (isCopy) {
        e.preventDefault();
        e.stopPropagation();
        triggerAutoSubmit('Copy Violation (Ctrl/Cmd+C): Copying exam content is strictly prohibited.');
        return;
      }

      if (isPaste) {
        e.preventDefault();
        e.stopPropagation();
        triggerAutoSubmit('Paste Violation (Ctrl/Cmd+V): External pasting is strictly prohibited.');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedProblem, isExamMode, examSubmitted]);

  // ── CLIPBOARD PASTE INTERCEPTION ──
  useEffect(() => {
    if (!selectedProblem || !isExamMode || examSubmitted) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerAutoSubmit('Clipboard Paste Violation: External clipboard paste intercepted.');
    };

    window.addEventListener('paste', handlePaste, true);
    return () => window.removeEventListener('paste', handlePaste, true);
  }, [selectedProblem, isExamMode, examSubmitted]);

  // ── TIMER COUNTDOWN & AUTO-SUBMIT ON 00:00 ──
  useEffect(() => {
    if (!selectedProblem || !isTimerRunning || examSecondsLeft <= 0 || examSubmitted) return;
    const interval = setInterval(() => {
      setExamSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitCode('Time Expired: 45:00 examination countdown reached zero.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedProblem, isTimerRunning, examSecondsLeft, examSubmitted]);

  // Fetch Problems catalog
  const fetchProblems = async () => {
    try {
      const res = await authFetch('/api/problems');
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

  const getDefaultStarterTemplate = (lang: string, problemTitle?: string) => {
    const title = problemTitle || 'Solution';
    switch (lang) {
      case 'java':
        return `// ${title} in Java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here
        
    }
}
`;
      case 'cpp':
        return `// ${title} in C++ (G++ 17)
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    
    return 0;
}
`;
      case 'javascript':
        return `// ${title} in JavaScript (Node.js)
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    // Write your solution here
    
}

solve();
`;
      case 'python':
      default:
        return `# ${title} in Python 3
import sys

def solve():
    input_data = sys.stdin.read().strip()
    # Write your solution here
    pass

if __name__ == '__main__':
    solve()
`;
    }
  };

  const loadProblemDetails = async (slug: string) => {
    // Eagerly request fullscreen right on user click gesture if not already fullscreen
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Initial fullscreen gesture request blocked:', e);
    }

    try {
      const res = await authFetch(`/api/problems/${slug}`);
      const data = await res.json();
      if (data.success && data.problem) {
        const prob = data.problem as CodingProblem;
        setSelectedProblem(prob);

        // Check if candidate already attempted this problem (cannot be re-given)
        if (prob.already_attempted && prob.latest_submission) {
          setCode(prob.latest_submission.code);
          setLanguage((prob.latest_submission.language || 'python') as any);
          setRunResult(null);
          setSubmitResult({
            verdict: prob.latest_submission.verdict,
            all_passed: prob.latest_submission.verdict === 'Accepted',
            passed_count: prob.latest_submission.passed_count,
            total_count: prob.total_test_cases || 20,
            avg_time_ms: prob.latest_submission.execution_time_ms,
            results: [],
            complexity: prob.complexity || prob.latest_submission.complexity,
            leaderboard: prob.leaderboard,
          });
          setExamSubmitted(true);
          setShowResultModal(false);
          setIsTimerRunning(false);
          setAutoExitCancelled(false);
          setAutoExitSeconds(15);
          setTimeout(() => {
            requestFullscreenLock();
          }, 50);
          return;
        }

        const draftKey = `koinexa_code_${prob.id}_${language}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && savedDraft.trim()) {
          setCode(savedDraft);
        } else if (prob.starter_templates?.[language]) {
          setCode(prob.starter_templates[language]);
        } else {
          setCode(getDefaultStarterTemplate(language, prob.title));
        }

        setRunResult(null);
        setSubmitResult(null);
        setExecError(null);
        setSelectedCaseIdx(0);
        const durationSec = prob.duration_minutes ? prob.duration_minutes * 60 : 45 * 60;
        setExamSecondsLeft(durationSec);
        setIsTimerRunning(true);
        setLastViolationReason(null);
        setExamSubmitted(false);
        setShowResultModal(true);
        violationTriggeredRef.current = false;

        proctorLogsRef.current = [
          `[${new Date().toLocaleTimeString()}] CBT Examination Mode Initialized. Fullscreen & Zero-Tab-Switching Enforced.`
        ];

        // Trigger fullscreen on entrance
        setTimeout(() => {
          requestFullscreenLock();
        }, 150);
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
      } else {
        setCode(getDefaultStarterTemplate(newLang, selectedProblem.title));
      }
    }
  };

  const handleCodeChange = (newVal: string) => {
    if (examSubmitted) return;
    setCode(newVal);
    if (selectedProblem) {
      try {
        localStorage.setItem(`koinexa_code_${selectedProblem.id}_${language}`, newVal);
      } catch {}
    }
  };

  const handleResetCode = () => {
    if (examSubmitted) return;
    if (selectedProblem) {
      const draftKey = `koinexa_code_${selectedProblem.id}_${language}`;
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      if (selectedProblem.starter_templates?.[language]) {
        setCode(selectedProblem.starter_templates[language]);
      } else {
        setCode(getDefaultStarterTemplate(language, selectedProblem.title));
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

  // Run Code against Sample Cases
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

  // Submit Code across ALL Test Cases (with CBT Proctor Audit)
  const handleSubmitCode = async (overrideViolationReason?: string) => {
    const prob = selectedProblemRef.current || selectedProblem;
    if (!prob) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsSubmitting(true);
    setExecError(null);
    setActiveTab('output');
    setShowSubmitConfirmModal(false);

    const finalCode = codeRef.current || code;
    const finalLang = languageRef.current || language;

    const logCopy = [...proctorLogsRef.current];
    if (overrideViolationReason) {
      logCopy.push(`[${new Date().toLocaleTimeString()}] 🚨 EXAM TERMINATED: ${overrideViolationReason}`);
    } else {
      logCopy.push(`[${new Date().toLocaleTimeString()}] Solution submitted by candidate for final evaluation.`);
    }

    try {
      const res = await authFetch(`/api/problems/${prob.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: finalCode,
          language: finalLang,
          proctor_notepad: logCopy.join('\n'),
          violation_reason: overrideViolationReason || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult(data.result);
        setExamSubmitted(true);
        setShowResultModal(true);
        setIsTimerRunning(false);
        setAutoExitCancelled(false);
        setAutoExitSeconds(15);
        if (data.result.verdict === 'Accepted' && !overrideViolationReason) {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        }
      } else {
        setExecError(data.error || 'Failed to submit solution.');
      }
      if (overrideViolationReason) {
        setExamSubmitted(true);
        setShowResultModal(true);
        setIsTimerRunning(false);
        setAutoExitCancelled(false);
        setAutoExitSeconds(15);
      }
      // Keep fullscreen active post-submission for leaderboard & code review
    } catch (err: any) {
      console.error('Submit error:', err);
      setExecError(err.message || 'Network error occurred during code submission.');
      if (overrideViolationReason) {
        setExamSubmitted(true);
        setShowResultModal(true);
        setIsTimerRunning(false);
        setAutoExitCancelled(false);
        setAutoExitSeconds(15);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const diffColors: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    Medium: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    Hard: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
  };

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

  const problemLeaderboardList: any[] = Array.isArray(submitResult?.leaderboard)
    ? submitResult.leaderboard
    : submitResult?.leaderboard?.leaderboard || [];

  if (selectedProblem) {
    return (
      <div
        ref={arenaRef}
        onContextMenu={(e) => {
          if (isExamMode) {
            e.preventDefault();
          }
        }}
        className="fixed inset-0 z-[70] bg-[var(--x-bg)] text-[var(--x-text)] flex flex-col select-none overflow-hidden"
      >
      {/* ── PASTE BLOCKED ALERT TOAST ── */}
      <AnimatePresence>
        {pasteWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>External copy-paste is blocked in Examination Mode. Write code directly.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[28px] bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl space-y-4 text-[var(--x-text)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-[#0A84FF] flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--x-text)]">Submit Examination Solution?</h3>
                  <p className="text-xs text-[var(--x-subtext)]">Your code will be evaluated across all hidden test cases.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--x-subtext)]">Problem:</span>
                  <span className="font-bold text-[var(--x-text)]">{selectedProblem?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--x-subtext)]">Language:</span>
                  <span className="font-mono text-[#0A84FF] uppercase">{language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--x-subtext)]">Time Remaining:</span>
                  <span className="font-mono font-bold text-amber-500">{formatExamTime(examSecondsLeft)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--x-subtext)]">Proctoring Mode:</span>
                  <span className="text-emerald-500 font-bold">Strict CBT Zero-Tolerance Active</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--x-subtext)] hover:text-[var(--x-text)]"
                >
                  Continue Coding
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitCode()}
                  className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold shadow-lg shadow-blue-500/30 btn-keep-white cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── POST-SUBMISSION & DISQUALIFICATION OVERLAY MODAL ── */}
      <AnimatePresence>
        {examSubmitted && showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-lg p-6 sm:p-7 rounded-[32px] bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl space-y-5 text-[var(--x-text)] relative overflow-hidden"
            >
              {/* Disqualification / Malpractice Mode */}
              {submitResult?.verdict === 'Integrity Violation' || lastViolationReason ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        Zero-Tolerance Security Notice
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-rose-500">
                        Exam Auto-Submitted & Disqualified
                      </h3>
                      <p className="text-xs text-[var(--x-subtext)] leading-relaxed">
                        {submitResult?.violation_reason || lastViolationReason || 'Proctor security violation triggered zero-tolerance auto-submit.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--x-subtext)]">Evaluation Status:</span>
                      <span className="font-bold text-rose-500">Disqualified (Proctor Violation)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--x-subtext)]">Test Cases Passed:</span>
                      <span className="font-bold text-[var(--x-text)]">
                        {submitResult?.passed_count || 0} / {submitResult?.total_count || selectedProblem?.total_test_cases || 20} Cases
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReturnToChallenges}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer btn-keep-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Challenges Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResultModal(false)}
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-subtext)] hover:text-[var(--x-text)] cursor-pointer"
                    >
                      Review Code
                    </button>
                  </div>
                </>
              ) : (
                /* Normal Submission Result */
                <>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      submitResult?.verdict === 'Accepted'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-rose-500/20 text-rose-500'
                    }`}>
                      {submitResult?.verdict === 'Accepted' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        submitResult?.verdict === 'Accepted'
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        Official Evaluation Result
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-[var(--x-text)]">
                        {submitResult ? submitResult.verdict : 'Evaluating Solution...'}
                      </h3>
                      <p className="text-xs text-[var(--x-subtext)]">
                        {submitResult?.verdict === 'Accepted'
                          ? 'Congratulations! Your solution passed all test cases with optimal performance.'
                          : 'Your solution was tested across all hidden test cases in the polyglot sandbox.'}
                      </p>
                    </div>
                  </div>

                  {/* AUTO-EXIT COUNTDOWN BANNER (15s) */}
                  {!autoExitCancelled && autoExitSeconds !== null && autoExitSeconds > 0 && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0A84FF] text-white font-mono font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          {autoExitSeconds}s
                        </span>
                        <span className="text-[var(--x-text)] font-semibold text-[11px]">
                          Auto-exiting in {autoExitSeconds}s...
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoExitCancelled(true)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-[11px] font-bold text-[var(--x-text)] cursor-pointer"
                      >
                        Stay & Review
                      </button>
                    </div>
                  )}

                  {submitResult && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[var(--x-subtext)]">Test Cases:</span>
                          <span className="font-bold text-[var(--x-text)]">
                            {submitResult.passed_count} / {submitResult.total_count} Passed
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--x-subtext)]">Average Runtime:</span>
                          <span className="text-emerald-500 font-bold">{submitResult.avg_time_ms} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--x-subtext)]">Language:</span>
                          <span className="text-[#0A84FF] uppercase font-bold">{language}</span>
                        </div>
                      </div>

                      {/* Time & Space Complexity Card */}
                      {submitResult.complexity && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-500" />
                              <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--x-text)]">
                                Complexity Analysis
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              submitResult.complexity.is_optimal
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                            }`}>
                              {submitResult.complexity.is_optimal ? 'Optimal Solution' : 'Acceptable'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                              <span className="text-[10px] text-[var(--x-subtext)] block font-sans uppercase">Time Complexity</span>
                              <span className="text-sm font-black text-[#0A84FF]">{submitResult.complexity.time_complexity}</span>
                              <span className="text-[10px] text-emerald-500 block mt-0.5 font-sans font-bold">
                                Beats {submitResult.complexity.beats_runtime_pct}% runtime
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                              <span className="text-[10px] text-[var(--x-subtext)] block font-sans uppercase">Space Complexity</span>
                              <span className="text-sm font-black text-purple-400">{submitResult.complexity.space_complexity}</span>
                              <span className="text-[10px] text-purple-400 block mt-0.5 font-sans font-bold">
                                Beats {submitResult.complexity.beats_memory_pct}% memory
                              </span>
                            </div>
                          </div>

                          {submitResult.complexity.explanation && (
                            <p className="text-[11px] text-[var(--x-subtext)] leading-relaxed pt-1 border-t border-[var(--x-border)]/50">
                              {submitResult.complexity.explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* View Problem Leaderboard Button */}
                      <button
                        type="button"
                        onClick={() => setShowLeaderboardModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-500 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Trophy className="w-4 h-4 fill-amber-500" />
                        <span>View Problem Leaderboard ({problemLeaderboardList.length} Submissions)</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReturnToChallenges}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer btn-keep-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Challenges Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResultModal(false)}
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-subtext)] hover:text-[var(--x-text)] cursor-pointer"
                    >
                      Review Code
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PROBLEM LEADERBOARD MODAL ── */}
      <AnimatePresence>
        {showLeaderboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-2xl p-6 sm:p-7 rounded-[32px] bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl space-y-5 text-[var(--x-text)] relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--x-border)] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-[var(--x-text)] tracking-tight">
                      {selectedProblem.title} • Leaderboard
                    </h3>
                    <p className="text-xs text-[var(--x-subtext)]">Top ranked solutions by test pass count and runtime efficiency.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaderboardModal(false)}
                  className="p-2 rounded-xl text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <div className="overflow-x-auto rounded-2xl border border-[var(--x-border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--x-surface-hover)] text-[var(--x-subtext)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--x-border)]">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4 text-center">Language</th>
                        <th className="py-3 px-4 text-center">Passed Cases</th>
                        <th className="py-3 px-4 text-right">Runtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--x-border)]">
                      {problemLeaderboardList.length > 0 ? (
                        problemLeaderboardList.map((entry) => (
                          <tr
                            key={entry.rank + entry.user_id}
                            className={`transition-colors ${
                              entry.is_current_user
                                ? 'bg-blue-500/10 font-bold border-l-4 border-l-[#0A84FF]'
                                : 'hover:bg-[var(--x-surface-hover)]/60'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold">
                              {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : entry.rank === 3 ? '🥉 #3' : `#${entry.rank}`}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--x-text)]">{entry.user_name}</span>
                                {entry.is_current_user && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#0A84FF] text-white text-[10px] font-black">You</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono uppercase text-[#0A84FF]">
                              {entry.language}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-emerald-500">
                              {entry.passed_count} / {entry.total_count}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[var(--x-subtext)]">
                              {entry.execution_time_ms} ms
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[var(--x-subtext)]">
                            No leaderboard entries recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--x-border)] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLeaderboardModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-bold text-[var(--x-text)] hover:bg-[var(--x-surface)] transition-all cursor-pointer"
                >
                  Close Leaderboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 15-SECOND AUTO-EXIT BANNER ── */}
      {!autoExitCancelled && autoExitSeconds !== null && autoExitSeconds > 0 && examSubmitted && (
        <div className="w-full bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-b border-blue-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#0A84FF] text-white font-mono font-black flex items-center justify-center shadow-sm flex-shrink-0">
              {autoExitSeconds}s
            </span>
            <div>
              <span className="text-[var(--x-text)] font-bold block">
                Automatically returning to Challenges Hub in {autoExitSeconds} seconds
              </span>
              <span className="text-[11px] text-[var(--x-subtext)]">
                Review your submitted code, complexity insights, and leaderboard standings below.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setAutoExitCancelled(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-bold text-[var(--x-text)] transition-all cursor-pointer"
            >
              Stay & Review
            </button>
            <button
              type="button"
              onClick={handleReturnToChallenges}
              className="px-4 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold transition-all cursor-pointer shadow-sm btn-keep-white flex items-center gap-1"
            >
              <span>Exit Now</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ── ARENA TOP ACTION BAR & CBT STRICT PROCTORING HUD ── */}
      <header className="h-14 bg-[var(--x-surface)]/95 backdrop-blur-2xl border-b border-[var(--x-border)] px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {/* Exit to Problems button ONLY visible AFTER submission */}
            {examSubmitted && (
              <button
                onClick={handleReturnToChallenges}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold transition-all cursor-pointer shadow-md group btn-keep-white"
                title="Return to Challenges Hub"
              >
                <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Challenges</span>
              </button>
            )}

            {/* Problem Title Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-extrabold text-xs sm:text-sm text-[var(--x-text)] truncate max-w-[150px] sm:max-w-xs">
                {selectedProblem.title}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border backdrop-blur-md shadow-sm ${diffColors[selectedProblem.difficulty] || ''}`}>
                {selectedProblem.difficulty}
              </span>
            </div>

            {/* STRICT CBT PROCTORING BADGE */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-[11px] font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>🔒 STRICT CBT • ZERO TOLERANCE</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* FULLSCREEN LOCK INDICATOR (NO MANUAL EXIT ALLOWED DURING EXAM) */}
            {isFullscreen ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm"
                title="Fullscreen Locked - Exit only after submission"
              >
                <Minimize className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen Locked</span>
              </div>
            ) : !examSubmitted ? (
              <button
                type="button"
                onClick={requestFullscreenLock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-rose-500/15 border-rose-500/30 text-rose-500 dark:text-rose-300 animate-pulse cursor-pointer shadow-sm"
                title="Click to enter fullscreen examination mode"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Lock Fullscreen</span>
              </button>
            ) : null}

            {/* EXAM TIMER HUD */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full border font-mono text-xs sm:text-sm font-bold shadow-sm ${
                examSubmitted
                  ? 'bg-blue-500/20 border-blue-500/40 text-[#0A84FF]'
                  : examSecondsLeft < 300
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 dark:text-rose-300 animate-pulse'
                  : examSecondsLeft < 600
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
                  : 'bg-[var(--x-surface-hover)] border-[var(--x-border)] text-[var(--x-text)]'
              }`}
              title={examSubmitted ? 'Exam Finished' : 'Authoritative Exam Countdown Timer'}
            >
              <Clock className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>{examSubmitted ? 'COMPLETED' : formatExamTime(examSecondsLeft)}</span>
            </div>

            {/* PROBLEM LEADERBOARD BUTTON */}
            {examSubmitted && (
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold bg-amber-500/15 border-amber-500/35 text-amber-500 dark:text-amber-400 cursor-pointer shadow-sm hover:bg-amber-500/25 transition-all"
                title="View Problem Leaderboard"
              >
                <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        </header>

        {/* ── MAIN LEETCODE SPLIT ARENA ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3 sm:p-4 overflow-hidden">
            {/* ── LEFT PANE: PROBLEM STATEMENT (SELECT-NONE TO PREVENT COPY-LEAK) ── */}
            <div className="lg:col-span-5 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-6 max-h-[520px] lg:max-h-none shadow-xl select-none">
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
                    <span className="text-[var(--x-subtext)]">•</span>
                    <span className="text-xs text-[var(--x-subtext)] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0A84FF]" />
                      {selectedProblem.duration_minutes || 45} mins
                    </span>
                    <span className="text-[var(--x-subtext)]">•</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-semibold border border-rose-500/20">
                      Copying Blocked
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="text-xs sm:text-sm text-[var(--x-text)] leading-relaxed whitespace-pre-wrap font-normal select-none">
                  {selectedProblem.description}
                </div>

                {/* Constraints */}
                <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-1.5 shadow-inner">
                  <span className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block">
                    Constraints
                  </span>
                  <pre className="text-xs font-mono text-[#0A84FF] dark:text-purple-300 whitespace-pre-wrap leading-relaxed select-none">
                    {selectedProblem.constraints}
                  </pre>
                </div>

                {/* SAMPLE CASES */}
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
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold font-mono transition-all cursor-pointer ${
                            activeExampleIdx === i
                              ? 'bg-[#0A84FF] text-white shadow-sm btn-keep-white'
                              : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                          }`}
                        >
                          <span>Ex {i + 1}</span>
                          {runResult?.results?.[i] && (
                            (runResult.results[i].passed || runResult.results[i].status === 'Accepted') ? (
                              <span className="text-emerald-300 text-[10px] font-black">✓</span>
                            ) : (
                              <span className="text-rose-300 text-[10px] font-black">✗</span>
                            )
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RUNNING INDICATOR */}
                  {isRunning && (
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-[#0A84FF] text-xs font-mono flex items-center gap-2.5 animate-pulse">
                      <div className="w-4 h-4 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span>Executing solution in polyglot sandbox...</span>
                    </div>
                  )}

                  {/* RUN RESULT SUMMARY STATUS PILL */}
                  {runResult && !isRunning && (
                    <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono shadow-sm ${
                      runResult.verdict === 'Accepted'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        {runResult.verdict === 'Accepted' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        )}
                        <span className="font-bold">
                          {runResult.verdict === 'Accepted' ? 'All Sample Cases Passed' : runResult.verdict}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold">
                        {runResult.passed_count} / {runResult.total_count} Passed ({runResult.avg_time_ms} ms)
                      </span>
                    </div>
                  )}

                  {selectedProblem.sample_cases[activeExampleIdx] && (
                    <div className="p-4 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2.5 text-xs shadow-sm select-none">
                      <div className="space-y-2 font-mono text-[11.5px]">
                        <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                          <span className="text-[var(--x-subtext)] block text-[10px] uppercase font-bold mb-0.5 font-sans">Input</span>
                          <span className="text-[var(--x-text)] whitespace-pre-wrap">{selectedProblem.sample_cases[activeExampleIdx].input.replace(/\n/g, ' ')}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                          <span className="text-[var(--x-subtext)] block text-[10px] uppercase font-bold mb-0.5 font-sans">Expected Output</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedProblem.sample_cases[activeExampleIdx].output}</span>
                        </div>

                        {/* YOUR OUTPUT (FROM RUN TEST CASES) */}
                        {runResult?.results?.[activeExampleIdx] && (
                          <div className={`p-2.5 rounded-xl border ${
                            (runResult.results[activeExampleIdx].passed || runResult.results[activeExampleIdx].status === 'Accepted')
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          }`}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="block text-[10px] uppercase font-bold font-sans">
                                Your Output ({runResult.results[activeExampleIdx].status})
                              </span>
                              <span className="text-[10px] font-mono">
                                {runResult.results[activeExampleIdx].execution_time_ms} ms
                              </span>
                            </div>
                            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                              {runResult.results[activeExampleIdx].actual_output || '(No output produced)'}
                            </pre>
                          </div>
                        )}

                        {/* EXECUTION DIAGNOSTICS / ERROR */}
                        {(runResult?.error || runResult?.results?.[activeExampleIdx]?.error_message || execError) && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-xs whitespace-pre-wrap">
                            <span className="block text-[10px] uppercase font-bold font-sans text-rose-500 mb-1">
                              Execution Diagnostics / Error:
                            </span>
                            {runResult?.error || runResult?.results?.[activeExampleIdx]?.error_message || execError}
                          </div>
                        )}
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
                      disabled={examSubmitted}
                      onChange={(e) => handleLanguageChange(e.target.value as any)}
                      className="bg-transparent text-xs font-semibold text-[var(--x-text)] focus:outline-none cursor-pointer disabled:opacity-50"
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
                  <span>Proctored Editor • Anti-Cheat Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetCode}
                    disabled={examSubmitted}
                    title="Reset to Starter Function"
                    className="p-1.5 rounded-xl text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer disabled:opacity-40"
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
                    readOnly: examSubmitted,
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

              {/* ── BOTTOM ACTION BAR (DURING EXAM: RUN TESTCASES & SUBMIT; POST-EXAM: VERDICT & RETURN) ── */}
              {!examSubmitted ? (
                <div className="h-16 px-4 sm:px-5 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-2xl flex items-center justify-between flex-shrink-0 shadow-lg gap-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--x-subtext)] min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="hidden md:inline font-mono truncate">Strict CBT Proctoring Active • Mouse-Only Mode</span>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                    {/* RUN TEST CASES BUTTON */}
                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={isRunning || isSubmitting || examSubmitted}
                      className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-600/25 btn-keep-white"
                      title="Run your code against sample test cases"
                    >
                      {isRunning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Running Samples...</span>
                          <span className="sm:hidden">Running...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Run Test Cases</span>
                        </>
                      )}
                    </button>

                    {/* SUBMIT EXAMINATION BUTTON */}
                    <button
                      type="button"
                      onClick={() => setShowSubmitConfirmModal(true)}
                      disabled={isSubmitting || examSubmitted}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0A84FF] hover:bg-[#0071e3] transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-blue-500/30 btn-keep-white"
                      title="Final examination submission across all hidden test cases"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Evaluating Solution...</span>
                          <span className="sm:hidden">Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Examination</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[var(--x-surface)] border border-[var(--x-border)] rounded-2xl flex flex-col gap-3 flex-shrink-0 shadow-xl">
                  {/* Security Disqualification or Final Verdict */}
                  {submitResult?.verdict === 'Integrity Violation' || lastViolationReason ? (
                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <div>
                          <div className="font-extrabold uppercase tracking-wide">🚨 Examination Terminated & Disqualified</div>
                          <div className="text-[11px] text-[var(--x-subtext)] font-mono mt-0.5">
                            {submitResult?.violation_reason || lastViolationReason || 'Security violation triggered zero-tolerance auto-submit.'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-rose-400">
                        Passed: {submitResult?.passed_count || 0} / {submitResult?.total_count || 0} Cases
                      </div>
                    </div>
                  ) : submitResult ? (
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs shadow-md ${
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
                        <div>
                          <span className="font-black text-sm uppercase tracking-wider">{submitResult.verdict}</span>
                          <div className="text-[11px] text-[var(--x-subtext)]">Official CBT evaluation across all test cases.</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] font-bold">
                          {submitResult.passed_count} / {submitResult.total_count} Passed
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)]">
                          {submitResult.avg_time_ms} ms
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Complexity Analysis Insight Card */}
                  {submitResult?.complexity && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20 text-[#0A84FF] flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[var(--x-text)]">
                              Time: <span className="text-[#0A84FF] font-mono">{submitResult.complexity.time_complexity}</span>
                            </span>
                            <span className="text-[var(--x-subtext)]">•</span>
                            <span className="font-extrabold text-[var(--x-text)]">
                              Space: <span className="text-purple-400 font-mono">{submitResult.complexity.space_complexity}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                              {submitResult.complexity.is_optimal ? 'Optimal' : 'Standard'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--x-subtext)] font-mono mt-0.5">
                            Beats {submitResult.complexity.beats_runtime_pct}% runtime • Beats {submitResult.complexity.beats_memory_pct}% memory
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowLeaderboardModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-500 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all self-start sm:self-auto"
                      >
                        <Trophy className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Leaderboard</span>
                      </button>
                    </div>
                  )}

                  {/* Return to Challenges Hub Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--x-subtext)] font-medium">
                      Examination submitted. Fullscreen lock released.
                    </span>
                    <button
                      onClick={handleReturnToChallenges}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer transition-all btn-keep-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Challenges Hub</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="w-full flex flex-col p-2.5 sm:p-5 max-w-[1800px] 2xl:max-w-[2400px] mx-auto space-y-4 overflow-y-auto pb-28 lg:pb-12">
      {/* ── PROBLEM SET LIST VIEW (QUESTIONS DISPLAYED IN A LINE) ── */}
      <div className="flex-1 flex flex-col space-y-4">
          {/* ── TOP HERO BANNER & UPLOAD ACTION ── */}
          {!hideHeader && (
            <div className="bg-[var(--x-surface)] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[var(--x-border)] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-1.5 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#0A84FF] text-xs font-bold tracking-wide">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>LEETCODE ARENA • CBT PROCTORED EXAMINATION</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--x-text)] tracking-tight">
                  Code Lab Challenges
                </h1>
                <p className="text-xs sm:text-sm text-[var(--x-subtext)] max-w-2xl leading-relaxed">
                  Select any challenge below to enter the strict CBT examination mode. Features fullscreen lockdown, zero-tab-switch detection, and automated test case judging.
                </p>
              </div>

              <div className="flex items-center gap-3 z-10 flex-shrink-0">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="ios-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/30 cursor-pointer btn-keep-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Problem (+ Cases)</span>
                </button>
              </div>
            </div>
          )}

          {/* ── DIFFICULTY FILTERS ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
            <div className="hidden lg:flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--x-subtext)] border-b border-[var(--x-border)]">
              <div className="w-14">#</div>
              <div className="flex-1">Title & Overview</div>
              <div className="w-44">Category</div>
              <div className="w-24">Difficulty</div>
              <div className="w-24">Duration</div>
              <div className="w-28">Test Cases</div>
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
                  {/* MOBILE & TABLET VIEW (< lg) */}
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
                        <span className="text-[11px] font-mono text-[var(--x-subtext)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#0A84FF]" />
                          {p.duration_minutes || 45}m
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProblemDetails(p.slug);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-sm btn-keep-white cursor-pointer ${
                          p.is_solved
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                            : 'bg-blue-500/15 group-hover:bg-[#0A84FF] text-[#0A84FF] group-hover:text-white border border-blue-500/30 group-hover:border-transparent'
                        }`}
                      >
                        {p.is_solved ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{p.is_solved ? 'Review Solution' : 'Start Exam'}</span>
                      </button>
                    </div>
                  </div>

                  {/* WIDESCREEN & DESKTOP ROW VIEW (>= lg) */}
                  <div className="hidden lg:flex items-center justify-between w-full">
                    <div className="w-14 text-xs font-mono font-bold text-[var(--x-subtext)] group-hover:text-[#0A84FF] transition-colors flex items-center">
                      <span className="w-7 h-7 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)] flex items-center justify-center text-[11px] group-hover:border-blue-400/40 group-hover:text-[var(--x-text)] transition-all">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--x-text)] text-base group-hover:text-[#0A84FF] transition-colors">
                          {p.title}
                        </span>
                        {p.is_solved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            Solved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--x-subtext)] truncate mt-0.5 max-w-xl">
                        {p.description ? p.description.split('\n')[0] : 'Algorithmic challenge'}
                      </p>
                    </div>

                    <div className="w-44 flex items-center pr-4">
                      <span className="px-2.5 py-1 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)] text-xs text-[var(--x-subtext)] font-medium truncate">
                        {p.category}
                      </span>
                    </div>

                    <div className="w-24 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${diffColors[p.difficulty] || ''}`}>
                        {p.difficulty}
                      </span>
                    </div>

                    <div className="w-24 flex items-center gap-1.5 text-xs font-mono text-[var(--x-subtext)]">
                      <Clock className="w-3.5 h-3.5 text-[#0A84FF]" />
                      <span>{p.duration_minutes || 45}m</span>
                    </div>

                    <div className="w-28 flex items-center gap-1.5 text-xs font-mono text-[var(--x-subtext)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{p.total_test_cases || 21} Cases</span>
                    </div>

                    <div className="w-36 flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProblemDetails(p.slug);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer btn-keep-white ${
                          p.is_solved
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                            : 'bg-blue-500/15 group-hover:bg-[#0A84FF] text-[#0A84FF] group-hover:text-white border border-blue-500/30 group-hover:border-transparent'
                        }`}
                      >
                        {p.is_solved ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                        <span>{p.is_solved ? 'Review & Rank' : 'Exam'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      <ProblemUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProblemUploaded={fetchProblems}
      />
    </div>
  );
};
