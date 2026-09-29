import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Maximize,
  Minimize,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Flag,
  Check,
  Plus,
  HelpCircle,
  Send,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion, QuizSubmissionResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { QuizUploadModal } from './QuizUploadModal';

type QuestionStatus = 'answered' | 'not_answered' | 'not_visited' | 'marked_review' | 'answered_marked';

interface JeeMainContestArenaProps {
  onExamStateChange?: (isWriting: boolean) => void;
  initialQuizId?: string | null;
  hideHeader?: boolean;
}

export const JeeMainContestArena: React.FC<JeeMainContestArenaProps> = ({
  onExamStateChange,
  initialQuizId,
  hideHeader = false,
}) => {
  const { authFetch, user, openAuthModal } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'todo' | 'solved'>('all');

  // Exam state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('Physics');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Result & Rating state
  const [examResult, setExamResult] = useState<QuizSubmissionResult | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const userAnswersRef = useRef(userAnswers);
  const selectedQuizRef = useRef(selectedQuiz);
  const secondsRemainingRef = useRef(secondsRemaining);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    selectedQuizRef.current = selectedQuiz;
  }, [selectedQuiz]);

  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  const fetchQuizzes = async () => {
    try {
      const res = await authFetch('/api/quizzes');
      const data = await res.json();
      if (data.success && data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  // If opened via Global Search with an initialQuizId, auto-launch it
  useEffect(() => {
    if (initialQuizId) {
      startQuiz(initialQuizId);
    }
  }, [initialQuizId]);

  // Sync contest writing state with parent (so navigation bar is hidden while writing)
  useEffect(() => {
    const isWriting = isExamMode && !examResult;
    onExamStateChange?.(isWriting);
    return () => {
      onExamStateChange?.(false);
    };
  }, [isExamMode, examResult, onExamStateChange]);

  // Listen for fullscreen exits during exam
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFull = !!document.fullscreenElement;
      setIsFullscreen(inFull);
      if (isExamMode && !inFull && !examResult) {
        setFullscreenWarning(true);
      } else {
        setFullscreenWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isExamMode, examResult]);

  // Countdown timer
  useEffect(() => {
    if (!isExamMode || examResult) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(userAnswersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamMode, examResult]);

  // Periodic exam autosave to localStorage (every 5 seconds)
  useEffect(() => {
    if (!isExamMode || examResult || !selectedQuiz) return;
    const saveTimer = setInterval(() => {
      try {
        localStorage.setItem(
          `koinexa_exam_${selectedQuiz.id}`,
          JSON.stringify({
            userAnswers,
            questionStatuses,
            secondsRemaining,
            currentQIndex,
            activeSection,
            savedAt: Date.now(),
          })
        );
      } catch {
        // ignore quota errors
      }
    }, 5000);
    return () => clearInterval(saveTimer);
  }, [isExamMode, examResult, selectedQuiz, userAnswers, questionStatuses, secondsRemaining, currentQIndex, activeSection]);

  const startQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      const data = await res.json();
      if (data.success && data.quiz) {
        const fullQuiz = data.quiz as Quiz;
        setSelectedQuiz(fullQuiz);

        // Initialize question statuses
        const initialStatus: Record<string, QuestionStatus> = {};
        fullQuiz.questions?.forEach((q, idx) => {
          initialStatus[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
        });

        // Check for active saved session in localStorage
        const savedSession = localStorage.getItem(`koinexa_exam_${quizId}`);
        let restored = false;
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && typeof parsed.secondsRemaining === 'number' && parsed.secondsRemaining > 5) {
              setUserAnswers(parsed.userAnswers || {});
              setQuestionStatuses(parsed.questionStatuses || initialStatus);
              setSecondsRemaining(parsed.secondsRemaining);
              setCurrentQIndex(parsed.currentQIndex || 0);
              setActiveSection(parsed.activeSection || fullQuiz.sections[0]?.name || 'Physics');
              restored = true;
            }
          } catch {
            // ignore JSON error
          }
        }

        if (!restored) {
          setQuestionStatuses(initialStatus);
          setUserAnswers({});
          setCurrentQIndex(0);
          setActiveSection(fullQuiz.sections[0]?.name || 'Physics');
          setSecondsRemaining(fullQuiz.duration_minutes * 60);
        }

        setExamResult(null);
        setRatingSubmitted(false);
        setIsExamMode(true);

        // Enter Fullscreen mode automatically
        try {
          if (arenaRef.current?.requestFullscreen) {
            await arenaRef.current.requestFullscreen();
          } else if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          console.warn('Fullscreen auto-request blocked by browser gesture rules');
        }
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const reEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setFullscreenWarning(false);
      }
    } catch (e) {
      console.error('Fullscreen request failed', e);
    }
  };

  const currentQuestions = selectedQuiz?.questions || [];
  const currentQuestion = currentQuestions[currentQIndex];

  const handleSelectOption = (optIdx: number) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }));
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const hasAnswer = userAnswers[currentQuestion.id] !== undefined;

    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? 'answered' : 'not_answered',
    }));

    if (currentQIndex < currentQuestions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = currentQuestions[nextIdx];
      if (questionStatuses[nextQ.id] === 'not_visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextQ.id]: 'not_answered' }));
      }
      if (nextQ.section !== activeSection) {
        setActiveSection(nextQ.section);
      }
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    const hasAnswer = userAnswers[currentQuestion.id] !== undefined;

    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: hasAnswer ? 'answered_marked' : 'marked_review',
    }));

    if (currentQIndex < currentQuestions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = currentQuestions[nextIdx];
      if (questionStatuses[nextQ.id] === 'not_visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextQ.id]: 'not_answered' }));
      }
      if (nextQ.section !== activeSection) {
        setActiveSection(nextQ.section);
      }
    }
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestion.id]: 'not_answered',
    }));
  };

  const jumpToQuestion = (idx: number) => {
    const targetQ = currentQuestions[idx];
    if (!targetQ) return;

    if (questionStatuses[targetQ.id] === 'not_visited') {
      setQuestionStatuses((prev) => ({ ...prev, [targetQ.id]: 'not_answered' }));
    }

    setCurrentQIndex(idx);
    if (targetQ.section !== activeSection) {
      setActiveSection(targetQ.section);
    }
  };

  const handleSubmitExam = async (overrideAnswers?: Record<string, number>) => {
    const quiz = selectedQuizRef.current || selectedQuiz;
    if (!quiz) return;
    setShowSubmitModal(false);

    try {
      const answersToSend = overrideAnswers !== undefined ? overrideAnswers : (userAnswersRef.current || userAnswers);
      const rem = secondsRemainingRef.current !== undefined ? secondsRemainingRef.current : secondsRemaining;
      const totalSecondsTaken = quiz.duration_minutes * 60 - rem;
      const res = await authFetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersToSend,
          time_taken_seconds: Math.max(0, totalSecondsTaken),
        }),
      });

      const data = await res.json();
      if (data.success) {
        try {
          localStorage.removeItem(`koinexa_exam_${selectedQuiz.id}`);
        } catch {}
        setExamResult(data);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === quiz.id ? { ...q, is_solved: true } : q))
        );
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
        // Exit full screen
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch {}
        }
      }
    } catch (err) {
      console.error('Submit quiz failed:', err);
    }
  };

  const handleRateQuiz = async () => {
    if (!selectedQuiz) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsSubmittingRating(true);
    try {
      const res = await authFetch(`/api/quizzes/${selectedQuiz.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: starRating,
          feedback: ratingFeedback.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRatingSubmitted(true);
        setIsRatingModalOpen(false);
        fetchQuizzes();
      }
    } catch (err) {
      console.error('Rate quiz failed:', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Status counts for legend
  const statusCounts = {
    answered: Object.values(questionStatuses).filter((s) => s === 'answered').length,
    not_answered: Object.values(questionStatuses).filter((s) => s === 'not_answered').length,
    not_visited: Object.values(questionStatuses).filter((s) => s === 'not_visited').length,
    marked_review: Object.values(questionStatuses).filter((s) => s === 'marked_review').length,
    answered_marked: Object.values(questionStatuses).filter((s) => s === 'answered_marked').length,
  };

  // ──────────────────────────────────────────────────────────────────
  // VIEW 1: RESULTS & DETAILED REVIEW VIEW (Glossy Apple Card)
  // ──────────────────────────────────────────────────────────────────
  if (examResult && selectedQuiz) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Result Score Banner */}
        <div className="ios-glass p-7 sm:p-9 rounded-[32px] border border-[var(--x-border)] bg-[var(--x-surface)] text-[var(--x-text)] shadow-glass-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="px-3.5 py-1 rounded-full bg-[#30D158]/20 text-[#30D158] text-xs font-extrabold uppercase tracking-wider border border-[#30D158]/35 shadow-[0_0_12px_rgba(48,209,88,0.2)]">
                Evaluation Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--x-text)] tracking-tight">
                {selectedQuiz.title}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--x-subtext)]">
                Official NTA grading (+4 correct, -1 wrong, 0 unattempted)
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[var(--x-surface-hover)] backdrop-blur-xl p-4 sm:p-5 rounded-[22px] border border-[var(--x-border)] shadow-inner">
              <div className="text-center px-4 border-r border-[var(--x-border)]">
                <span className="text-xs text-[var(--x-subtext)] block font-medium">Final Score</span>
                <span className={`text-4xl font-black tracking-tight ${examResult.score >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                  {examResult.score}
                </span>
                <span className="text-[10px] text-[var(--x-subtext)] block font-mono">/ {examResult.max_marks}</span>
              </div>
              <div className="text-center px-4">
                <span className="text-xs text-[var(--x-subtext)] block font-medium">Accuracy</span>
                <span className="text-4xl font-black text-[#0A84FF] tracking-tight">
                  {examResult.accuracy}%
                </span>
                <span className="text-[10px] text-[var(--x-subtext)] block font-mono">
                  {examResult.correct_count} / {examResult.total_questions}
                </span>
              </div>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[var(--x-border)]">
            <div className="p-3.5 rounded-[16px] bg-[#30D158]/10 border border-[#30D158]/25 text-center">
              <span className="text-xs text-[#30D158] font-bold block">Correct (+4)</span>
              <span className="text-2xl font-black text-[var(--x-text)]">{examResult.correct_count}</span>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[#FF453A]/10 border border-[#FF453A]/25 text-center">
              <span className="text-xs text-[#FF453A] font-bold block">Incorrect (-1)</span>
              <span className="text-2xl font-black text-[var(--x-text)]">{examResult.incorrect_count}</span>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-center">
              <span className="text-xs text-[var(--x-subtext)] font-bold block">Unattempted</span>
              <span className="text-2xl font-black text-[var(--x-text)]">{examResult.unattempted_count}</span>
            </div>
            <div className="p-3.5 rounded-[16px] bg-[#0A84FF]/10 border border-[#0A84FF]/25 text-center">
              <span className="text-xs text-[#0A84FF] font-bold block">Time Taken</span>
              <span className="text-2xl font-black text-[var(--x-text)] font-mono">{formatTimer(examResult.time_taken_seconds)}</span>
            </div>
          </div>

          {/* Rate Quiz Prompt */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-[20px] bg-white/[0.04] border border-[#FF9F0A]/30 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[14px] bg-[#FF9F0A]/20 text-[#FF9F0A] flex items-center justify-center border border-[#FF9F0A]/30 flex-shrink-0">
                <Star className="w-5 h-5 fill-[#FF9F0A]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--x-text)] tracking-tight">Rate This Quiz & Questions Quality</h4>
                <p className="text-xs text-[var(--x-subtext)]">How realistic was the difficulty, formulas, and knowledge tested?</p>
              </div>
            </div>
            <button
              onClick={() => setIsRatingModalOpen(true)}
              disabled={ratingSubmitted}
              className="px-5 py-2.5 rounded-[14px] bg-[#FF9F0A] hover:bg-[#ffad2a] disabled:bg-slate-700 text-black font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              {ratingSubmitted ? 'Rating Submitted ✓' : 'Rate Quiz (1 - 5 Stars)'}
            </button>
          </div>
        </div>

        {/* Detailed Solutions & Explanations Key */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-[var(--x-text)] flex items-center gap-2 tracking-tight">
            <BookOpen className="w-5 h-5 text-[#0A84FF]" />
            Detailed Solutions & Step-by-Step Derivations
          </h3>

          {examResult.detailed_results.map((q) => (
            <div
              key={q.id}
              className={`p-6 rounded-[24px] border transition-all ${
                q.status === 'correct'
                  ? 'border-[#30D158]/35 bg-[#30D158]/[0.04]'
                  : q.status === 'incorrect'
                  ? 'border-[#FF453A]/35 bg-[#FF453A]/[0.04]'
                  : 'border-[var(--x-border)] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[var(--x-surface-hover)] text-xs font-mono font-bold text-[var(--x-text)]">
                    Q{q.question_num}
                  </span>
                  <span className="text-xs font-bold text-[#0A84FF]">
                    {q.section}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {q.status === 'correct' && (
                    <span className="px-3 py-1 rounded-full bg-[#30D158]/20 text-[#30D158] text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+4)
                    </span>
                  )}
                  {q.status === 'incorrect' && (
                    <span className="px-3 py-1 rounded-full bg-[#FF453A]/20 text-[#FF453A] text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect (-1)
                    </span>
                  )}
                  {q.status === 'unattempted' && (
                    <span className="px-3 py-1 rounded-full bg-slate-500/20 text-[var(--x-subtext)] text-xs font-bold">
                      Unattempted (0)
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-[var(--x-text)] mb-4 leading-relaxed">
                {q.question}
              </p>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {q.options.map((opt, optIdx) => {
                  const isUserPick = q.user_choice === optIdx;
                  const isCorrect = q.correct_index === optIdx;

                  let optClass = 'border-[var(--x-border)] bg-white/[0.02] text-[var(--x-subtext)]';
                  if (isCorrect) {
                    optClass = 'border-[#30D158]/70 bg-[#30D158]/20 text-[#30D158] font-bold shadow-sm';
                  } else if (isUserPick && !isCorrect) {
                    optClass = 'border-[#FF453A]/70 bg-[#FF453A]/20 text-[#FF453A] line-through';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3.5 rounded-[16px] border text-xs flex items-start gap-2.5 ${optClass}`}
                    >
                      <span className="font-mono font-bold">({String.fromCharCode(65 + optIdx)})</span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                      {isCorrect && <Check className="w-4 h-4 text-[#30D158] flex-shrink-0" />}
                      {isUserPick && !isCorrect && <XCircle className="w-4 h-4 text-[#FF453A] flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Solution Formula Explanation */}
              <div className="p-4 rounded-[18px] bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs text-[var(--x-text)] leading-relaxed">
                <span className="font-bold text-[#30D158] block mb-1">
                  💡 Explanation & Formulation:
                </span>
                {q.explanation}
              </div>
            </div>
          ))}
        </div>

        {/* Back to Quizzes button */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setExamResult(null);
              setIsExamMode(false);
              setSelectedQuiz(null);
            }}
            className="ios-btn-glass px-6 py-2.5 rounded-[16px] text-xs font-bold text-[var(--x-text)] transition-all cursor-pointer"
          >
            ← Return to Contest Hub
          </button>
        </div>

        {/* ── 1 TO 5 STAR RATING MODAL (iOS Sheet) ── */}
        <AnimatePresence>
          {isRatingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] rounded-[30px] p-6 shadow-glass-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-base text-[var(--x-text)] flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#FF9F0A] fill-[#FF9F0A]" />
                    Rate This Quiz
                  </h4>
                  <button onClick={() => setIsRatingModalOpen(false)} className="text-[var(--x-subtext)] hover:text-[var(--x-text)]">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-[var(--x-subtext)] leading-relaxed">
                  How was the difficulty, depth of concepts, and accuracy of questions tested?
                </p>

                {/* Stars selector */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStarRating(s)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          s <= starRating ? 'text-[#FF9F0A] fill-[#FF9F0A] drop-shadow-md' : 'text-slate-500/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Share constructive feedback for questions, formulas, or difficulty..."
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[14px] bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#FF9F0A] shadow-inner"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsRatingModalOpen(false)}
                    className="ios-btn-glass px-3.5 py-2 rounded-[12px] text-xs text-[var(--x-subtext)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRateQuiz}
                    disabled={isSubmittingRating}
                    className="px-5 py-2 rounded-[12px] bg-[#FF9F0A] hover:bg-[#ffad2a] text-black text-xs font-black shadow-lg transition-colors cursor-pointer"
                  >
                    {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // VIEW 2: FULL-SCREEN JEE MAIN CBT EXAM ARENA
  // ──────────────────────────────────────────────────────────────────
  if (isExamMode && selectedQuiz && currentQuestion) {
    return (
      <div
        ref={arenaRef}
        className="fixed inset-0 z-50 bg-[var(--x-bg)] text-[var(--x-text)] flex flex-col select-none overflow-hidden"
      >
        {/* Fullscreen Warning Modal if student exited */}
        {fullscreenWarning && (
          <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="max-w-md w-full p-7 rounded-[28px] bg-[var(--x-surface)] border border-[#FF453A]/40 text-[var(--x-text)] text-center space-y-4 shadow-glass-card">
              <div className="w-12 h-12 rounded-full bg-[#FF453A]/20 text-[#FF453A] flex items-center justify-center mx-auto shadow-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--x-text)] tracking-tight">Full Screen Lockdown Required</h3>
              <p className="text-xs text-[var(--x-subtext)] leading-relaxed">
                Contest examination security requires persistent full-screen mode. Please re-enter full-screen immediately to continue your examination.
              </p>
              <button
                onClick={reEnterFullscreen}
                className="w-full py-3 rounded-[16px] bg-[#FF453A] hover:bg-[#ff5b52] text-white text-xs font-black shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Maximize className="w-4 h-4" />
                Re-enter Full Screen Mode
              </button>
            </div>
          </div>
        )}

        {/* ── TOP CBT HEADER BAR (iOS Frosted Glass) ── */}
        <header className="h-16 bg-[var(--x-surface)]/95 backdrop-blur-2xl border-b border-[var(--x-border)] px-3 sm:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#0A84FF] flex items-center justify-center text-white font-black text-[10px] sm:text-[11px] shadow-sm flex-shrink-0 btn-keep-white">
              {selectedQuiz.exam_type ? selectedQuiz.exam_type.replace('_', ' ').slice(0, 4).toUpperCase() : 'CBT'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-extrabold text-[var(--x-text)] truncate max-w-[160px] xs:max-w-[220px] sm:max-w-md tracking-tight">
                {selectedQuiz.title}
              </h2>
              <span className="text-[9.5px] sm:text-[10.5px] text-[var(--x-subtext)] font-medium truncate block">
                {selectedQuiz.exam_type ? `${selectedQuiz.exam_type.replace('_', ' ').toUpperCase()} • Timed Simulation` : 'Timed Simulation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Mobile Palette Button */}
            <button
              onClick={() => setShowMobilePalette(true)}
              className="lg:hidden px-2.5 py-1.5 rounded-xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)] border border-[var(--x-border)] text-[var(--x-text)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Open Question Palette"
            >
              <span>Q: {currentQIndex + 1}/{currentQuestions.length}</span>
            </button>

            {/* Live Countdown Timer (Glossy Capsule) */}
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border font-mono text-xs sm:text-sm font-extrabold shadow-sm ${
              secondsRemaining < 300
                ? 'bg-[#FF453A]/20 border-[#FF453A]/40 text-[#FF453A] animate-pulse'
                : 'bg-[var(--x-surface-hover)] border-[var(--x-border)] text-[#30D158]'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Submit Exam Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-[12px] sm:rounded-[14px] bg-[#30D158] hover:bg-[#3ce267] text-black text-xs font-black shadow-lg shadow-[#30D158]/30 transition-all cursor-pointer"
            >
              Submit
            </button>
          </div>
        </header>

        {/* ── SECTION TABS BAR ── */}
        <div className="h-12 bg-[var(--x-surface-hover)] border-b border-[var(--x-border)] px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--x-subtext)] uppercase tracking-wider mr-1">Sections:</span>
            {selectedQuiz.sections.map((sec) => (
              <button
                key={sec.name}
                onClick={() => {
                  setActiveSection(sec.name);
                  const firstInSec = currentQuestions.findIndex((q) => q.section === sec.name);
                  if (firstInSec !== -1) jumpToQuestion(firstInSec);
                }}
                className={`px-4 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                  activeSection === sec.name
                    ? 'bg-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/30 border border-white/20'
                    : 'text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-white/[0.04]'
                }`}
              >
                {sec.name} ({sec.total_questions})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#30D158] font-black">+4.0</span> / <span className="text-[#FF453A] font-black">-1.0</span>
          </div>
        </div>

        {/* ── MAIN EXAM AREA: SPLIT PANE ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: QUESTION VIEWER & CONTROLS */}
          <main className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto border-r border-[var(--x-border)]">
            <div className="space-y-6 max-w-4xl">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[var(--x-border)] pb-3">
                <span className="text-base font-extrabold text-[var(--x-text)] tracking-tight">
                  Question No. {currentQuestion.question_num}
                </span>
                <span className="text-xs font-bold text-[#0A84FF] px-3 py-1 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/25">
                  {currentQuestion.section} • Single Choice
                </span>
              </div>

              {/* Question Statement */}
              <div className="text-base font-medium text-[var(--x-text)] leading-relaxed">
                {currentQuestion.question}
              </div>

              {/* Options (iOS Radio Cards) */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`flex items-start gap-3.5 p-4 rounded-[18px] border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#0A84FF] bg-[#0A84FF]/15 shadow-[0_4px_20px_rgba(10,132,255,0.25)]'
                          : 'border-[var(--x-border)] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`opt_${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(optIdx)}
                        className="mt-1 accent-[#0A84FF] cursor-pointer"
                      />
                      <span className="font-mono font-bold text-xs text-[var(--x-subtext)] pt-0.5">
                        ({String.fromCharCode(65 + optIdx)})
                      </span>
                      <span className="text-sm text-[var(--x-text)] flex-1 leading-relaxed">
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Controls */}
            <div className="pt-6 border-t border-[var(--x-border)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSaveAndNext}
                  className="ios-btn-primary px-6 py-2.5 rounded-[14px] text-xs font-black shadow-glass-button transition-all cursor-pointer"
                >
                  Save & Next
                </button>
                <button
                  onClick={handleMarkForReviewAndNext}
                  className="px-4 py-2.5 rounded-[14px] bg-[#BF5AF2]/85 hover:bg-[#BF5AF2] text-[var(--x-text)] text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Mark for Review & Next
                </button>
                <button
                  onClick={handleClearResponse}
                  className="ios-btn-glass px-4 py-2.5 rounded-[14px] text-[var(--x-subtext)] text-xs font-bold transition-all cursor-pointer"
                >
                  Clear Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => jumpToQuestion(currentQIndex - 1)}
                  className="ios-btn-glass px-3.5 py-2.5 rounded-[14px] disabled:opacity-30 text-[var(--x-text)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  disabled={currentQIndex === currentQuestions.length - 1}
                  onClick={() => jumpToQuestion(currentQIndex + 1)}
                  className="ios-btn-glass px-3.5 py-2.5 rounded-[14px] disabled:opacity-30 text-[var(--x-text)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>

          {/* RIGHT: QUESTION PALETTE GRID (DESKTOP & LARGE SCREENS) */}
          <aside className="hidden lg:flex w-80 bg-[var(--x-surface)] p-5 flex-col justify-between overflow-y-auto select-none border-l border-[var(--x-border)] flex-shrink-0">
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--x-subtext)]">
                Question Palette
              </h3>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11.5px] text-[var(--x-subtext)]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[8px] bg-[#30D158] text-black flex items-center justify-center font-bold text-[10px]">
                    {statusCounts.answered}
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[8px] bg-[#FF453A] text-white flex items-center justify-center font-bold text-[10px]">
                    {statusCounts.not_answered}
                  </span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[8px] bg-slate-700 text-[var(--x-subtext)] flex items-center justify-center font-bold text-[10px]">
                    {statusCounts.not_visited}
                  </span>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[8px] bg-[#BF5AF2] text-white flex items-center justify-center font-bold text-[10px]">
                    {statusCounts.marked_review}
                  </span>
                  <span>Review</span>
                </div>
              </div>

              {/* Numbered Grid (iOS Squircles) */}
              <div className="pt-3 border-t border-[var(--x-border)]">
                <h4 className="text-xs font-bold text-[var(--x-text)] mb-2.5">
                  {activeSection} Questions:
                </h4>
                <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                  {currentQuestions.map((q, idx) => {
                    const st = questionStatuses[q.id] || 'not_visited';
                    const isCurrent = idx === currentQIndex;

                    let bgClass = 'bg-[var(--x-surface-hover)] text-[var(--x-text)]';
                    if (st === 'answered') bgClass = 'bg-[#30D158] text-black font-extrabold shadow-sm';
                    else if (st === 'not_answered') bgClass = 'bg-[#FF453A] text-white font-extrabold shadow-sm';
                    else if (st === 'marked_review') bgClass = 'bg-[#BF5AF2] text-white font-extrabold shadow-sm';
                    else if (st === 'answered_marked') bgClass = 'bg-[#BF5AF2] text-white font-extrabold ring-2 ring-[#30D158]';

                    return (
                      <button
                        key={q.id}
                        onClick={() => jumpToQuestion(idx)}
                        className={`w-10 h-10 rounded-[12px] font-bold font-mono text-xs flex items-center justify-center transition-all cursor-pointer relative ${bgClass} ${
                          isCurrent ? 'ring-2 ring-white scale-105 shadow-md' : 'hover:opacity-90'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--x-border)]">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 rounded-[16px] bg-[#30D158] hover:bg-[#38db63] text-black text-xs font-black shadow-lg shadow-[#30D158]/30 transition-all cursor-pointer"
              >
                Finish & Submit Exam
              </button>
            </div>
          </aside>
        </div>

        {/* MOBILE QUESTION PALETTE DRAWER SHEET */}
        <AnimatePresence>
          {showMobilePalette && (
            <div className="fixed inset-0 z-[100] lg:hidden bg-black/60 dark:bg-black/80 backdrop-blur-md flex flex-col justify-end">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-[var(--x-surface)] text-[var(--x-text)] border-t border-[var(--x-border)] p-5 rounded-t-[28px] max-h-[82vh] flex flex-col space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--x-text)] uppercase tracking-wider">
                    Question Palette ({activeSection})
                  </h3>
                  <button
                    onClick={() => setShowMobilePalette(false)}
                    className="p-1.5 px-3 rounded-xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)] border border-[var(--x-border)] text-[var(--x-text)] text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Status Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--x-subtext)] py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[8px] bg-[#30D158] text-black flex items-center justify-center font-bold text-[10px]">
                      {statusCounts.answered}
                    </span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[8px] bg-[#FF453A] text-white flex items-center justify-center font-bold text-[10px]">
                      {statusCounts.not_answered}
                    </span>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[8px] bg-slate-700 text-[var(--x-subtext)] flex items-center justify-center font-bold text-[10px]">
                      {statusCounts.not_visited}
                    </span>
                    <span>Not Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[8px] bg-[#BF5AF2] text-white flex items-center justify-center font-bold text-[10px]">
                      {statusCounts.marked_review}
                    </span>
                    <span>Review</span>
                  </div>
                </div>

                {/* Numbered Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 overflow-y-auto max-h-60 p-1">
                  {currentQuestions.map((q, idx) => {
                    const st = questionStatuses[q.id] || 'not_visited';
                    const isCurrent = idx === currentQIndex;

                    let bgClass = 'bg-[var(--x-surface-hover)] text-[var(--x-text)]';
                    if (st === 'answered') bgClass = 'bg-[#30D158] text-black font-extrabold shadow-sm';
                    else if (st === 'not_answered') bgClass = 'bg-[#FF453A] text-white font-extrabold shadow-sm';
                    else if (st === 'marked_review') bgClass = 'bg-[#BF5AF2] text-white font-extrabold shadow-sm';
                    else if (st === 'answered_marked') bgClass = 'bg-[#BF5AF2] text-white font-extrabold ring-2 ring-[#30D158]';

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          jumpToQuestion(idx);
                          setShowMobilePalette(false);
                        }}
                        className={`h-11 rounded-[14px] font-bold font-mono text-sm flex items-center justify-center transition-all cursor-pointer relative ${bgClass} ${
                          isCurrent ? 'ring-2 ring-blue-500 scale-105 shadow-md' : 'hover:opacity-90'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CONFIRMATION MODAL BEFORE FINAL SUBMIT */}
        <AnimatePresence>
          {showSubmitModal && (
            <div className="fixed inset-0 z-[110] bg-black/60 dark:bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[var(--x-surface)] border border-[var(--x-border)] rounded-[28px] p-6 text-[var(--x-text)] shadow-glass-card space-y-4"
              >
                <h3 className="text-lg font-extrabold text-[var(--x-text)] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FF9F0A]" />
                  Confirm Exam Submission
                </h3>

                <p className="text-xs text-[var(--x-subtext)] leading-relaxed">
                  Are you sure you want to submit your test? Once submitted, answers will be evaluated immediately.
                </p>

                <div className="p-4 rounded-[16px] bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--x-subtext)]">Total Questions:</span>
                    <span className="text-[var(--x-text)] font-bold">{currentQuestions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#30D158]">Answered:</span>
                    <span className="text-[#30D158] font-bold">{statusCounts.answered + statusCounts.answered_marked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--x-subtext)]">Unanswered / Review:</span>
                    <span className="text-[#FF9F0A] font-bold">{currentQuestions.length - (statusCounts.answered + statusCounts.answered_marked)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="ios-btn-glass px-4 py-2 rounded-[12px] text-xs text-[var(--x-subtext)]"
                  >
                    Resume Test
                  </button>
                  <button
                    onClick={() => handleSubmitExam()}
                    className="px-5 py-2 rounded-[12px] bg-[#30D158] hover:bg-[#3de268] text-black text-xs font-black shadow-lg shadow-[#30D158]/30 transition-all cursor-pointer"
                  >
                    Yes, Submit Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // VIEW 3: QUIZZES & CONTESTS HUB (ORDERED LIST & STATUS FILTERS)
  // ──────────────────────────────────────────────────────────────────
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (activeFilter === 'solved') return !!quiz.is_solved;
    if (activeFilter === 'todo') return !quiz.is_solved;
    return true;
  });

  const todoCount = quizzes.filter((q) => !q.is_solved).length;
  const solvedCount = quizzes.filter((q) => !!q.is_solved).length;

  return (
    <div className={`w-full min-h-screen ${hideHeader ? 'py-2 sm:py-4 px-2 sm:px-4 lg:pl-0 lg:pr-0 xl:pl-0 xl:pr-0' : 'py-8 sm:py-10 px-3.5 sm:px-6 lg:pl-[88px] lg:pr-8 xl:pl-[104px] xl:pr-12'} pb-28 lg:pb-12 max-w-[1200px] 2xl:max-w-[1400px] mx-auto`}>
      {/* ── TOP HERO BANNER & UPLOAD ACTION ── */}
      {!hideHeader && (
        <div className="bg-[var(--x-surface)] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[var(--x-border)] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#0A84FF] text-xs font-bold tracking-wide">
              <Award className="w-3.5 h-3.5" />
              <span>NTA JEE MAIN • GATE • NEET CBT ARENA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--x-text)] tracking-tight">
              Quizzes & Contests Hub
            </h1>
            <p className="text-xs sm:text-sm text-[var(--x-subtext)] max-w-2xl leading-relaxed">
              Take timed simulated examinations with real-time countdown, section-wise navigation, negative marking, and instant solution analytics.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 flex-shrink-0">
            <button
              onClick={() => (user ? setIsUploadOpen(true) : openAuthModal('login'))}
              className="ios-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/30 cursor-pointer btn-keep-white"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTERS: ALL, TO DO, SOLVED ── */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            activeFilter === 'all'
              ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm shadow-blue-500/30 btn-keep-white'
              : 'bg-[var(--x-surface)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border-[var(--x-border)]'
          }`}
        >
          All ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveFilter('todo')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            activeFilter === 'todo'
              ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm shadow-blue-500/30 btn-keep-white'
              : 'bg-[var(--x-surface)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border-[var(--x-border)]'
          }`}
        >
          To Do ({todoCount})
        </button>
        <button
          onClick={() => setActiveFilter('solved')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            activeFilter === 'solved'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm shadow-emerald-500/30 btn-keep-white'
              : 'bg-[var(--x-surface)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border-[var(--x-border)]'
          }`}
        >
          Solved ({solvedCount})
        </button>
      </div>

      {/* ── ORDERED TESTS LIST ── */}
      {isLoading ? (
        <div className="text-center py-20 text-[var(--x-subtext)] text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
          <span>Loading Tests...</span>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-subtext)] text-xs p-8 max-w-xl mx-auto space-y-4">
          <p>No tests found matching your criteria.</p>
          <div>
            <button
              onClick={() => (user ? setIsUploadOpen(true) : openAuthModal('login'))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors btn-keep-white cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New Quiz</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredQuizzes.map((quiz, index) => (
            <div
              key={quiz.id}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] hover:border-[var(--x-border-subtle)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-[var(--x-subtext)] font-bold">
                    #{index + 1}
                  </span>
                  {quiz.is_solved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/25">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      Solved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--x-surface-hover)] text-[var(--x-subtext)] text-[11px] font-bold border border-[var(--x-border)]">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--x-surface-hover)] text-[var(--x-subtext)] text-[11px] font-medium border border-[var(--x-border)]">
                    {quiz.exam_type || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-[var(--x-surface-hover)] px-2 py-0.5 rounded-lg border border-[var(--x-border)] ml-auto sm:ml-0">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{quiz.rating_avg}</span>
                  </div>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-[var(--x-text)] tracking-tight truncate">
                  {quiz.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-[var(--x-subtext)] font-mono flex-wrap">
                  <span>⏱ {quiz.duration_minutes}m</span>
                  <span>•</span>
                  <span>{quiz.questions_count} Questions</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{quiz.positive_marks} / -{quiz.negative_marks}</span>
                </div>
              </div>

              <div className="flex items-center sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--x-border)]">
                <button
                  onClick={() => startQuiz(quiz.id)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 btn-keep-white"
                >
                  <span>Open</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── QUIZ UPLOAD MODAL ── */}
      <QuizUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onQuizUploaded={fetchQuizzes}
      />
    </div>
  );
};
