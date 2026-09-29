import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Code2,
  Award,
  Plus,
  ArrowLeft,
  Search,
  Check,
  Clock,
  ChevronRight,
  Star,
  Sparkles,
  Layers,
  Terminal,
  FileCode,
  X,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Quiz, CodingProblem } from '../../types';
import { JeeMainContestArena } from '../contests/JeeMainContestArena';
import { CodeLabArena } from '../codelab/CodeLabArena';
import { QuizUploadModal } from '../contests/QuizUploadModal';
import { ProblemUploadModal } from '../codelab/ProblemUploadModal';

export type ChallengeSubTab = 'all' | 'codelab' | 'quizzes';

interface ChallengesHubProps {
  onExamStateChange?: (isWriting: boolean) => void;
  initialTab?: ChallengeSubTab;
  initialQuizId?: string | null;
  initialProblemSlug?: string | null;
}

export const ChallengesHub: React.FC<ChallengesHubProps> = ({
  onExamStateChange,
  initialTab = 'all',
  initialQuizId = null,
  initialProblemSlug = null
}) => {
  const { user, authFetch, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<ChallengeSubTab>(
    initialProblemSlug ? 'codelab' : initialQuizId ? 'quizzes' : initialTab
  );

  const [selectedProblemSlug, setSelectedProblemSlug] = useState<string | null>(initialProblemSlug);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(initialQuizId);
  const [isActiveSolving, setIsActiveSolving] = useState(false);
  const [isActiveExam, setIsActiveExam] = useState(false);

  // Upload Modals
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isQuizUploadOpen, setIsQuizUploadOpen] = useState(false);
  const [isProblemUploadOpen, setIsProblemUploadOpen] = useState(false);

  // Data for "All Challenges" mixed showcase
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'quiz'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMixedData = async () => {
    setIsLoadingAll(true);
    try {
      const [pRes, qRes] = await Promise.all([
        fetch('/api/problems').catch(() => null),
        authFetch('/api/quizzes').catch(() => null)
      ]);

      if (pRes) {
        const pData = await pRes.json();
        if (pData.success && pData.problems) setProblems(pData.problems);
      }
      if (qRes) {
        const qData = await qRes.json();
        if (qData.success && qData.quizzes) setQuizzes(qData.quizzes);
      }
    } catch (e) {
      console.error('Failed to load challenges data', e);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchMixedData();
  }, [user]);

  useEffect(() => {
    if (initialQuizId) {
      setSelectedQuizId(initialQuizId);
      setActiveTab('quizzes');
    }
  }, [initialQuizId]);

  useEffect(() => {
    if (initialProblemSlug) {
      setSelectedProblemSlug(initialProblemSlug);
      setActiveTab('codelab');
    }
  }, [initialProblemSlug]);

  const handleExamStateChange = (isExam: boolean) => {
    setIsActiveExam(isExam);
    onExamStateChange?.(isExam);
  };

  const handleBackToCatalog = () => {
    setSelectedProblemSlug(null);
    setSelectedQuizId(null);
    setIsActiveSolving(false);
    setIsActiveExam(false);
    onExamStateChange?.(false);
  };

  // Mixed filtered items
  const combinedItems = [
    ...problems.map((p) => ({
      type: 'code' as const,
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      difficulty: p.difficulty,
      metric: `${p.acceptance_rate || 75}% acceptance`,
      raw: p
    })),
    ...quizzes.map((q) => ({
      type: 'quiz' as const,
      id: q.id,
      slug: q.id,
      title: q.title,
      category: q.exam_type || 'General',
      difficulty: (q.duration_minutes >= 60 ? 'Hard' : q.duration_minutes >= 30 ? 'Medium' : 'Easy') as 'Easy' | 'Medium' | 'Hard',
      metric: `${q.questions_count || 30} questions • ${q.duration_minutes}m`,
      raw: q
    }))
  ].filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterDifficulty !== 'All' && item.difficulty !== filterDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const diffColors: Record<string, string> = {
    Easy: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
  };

  const isSolvingOrExam = isActiveSolving || isActiveExam || !!selectedProblemSlug || !!selectedQuizId;

  return (
    <div className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] pl-0 lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] pb-24 lg:pb-0 flex flex-col selection:bg-[#0A84FF]/30 selection:text-white transition-colors duration-200">
      {/* ── FULL-WIDTH VIEWPORT HEADER (BORDERLESS, SLEEK & CLEAN) ── */}
      <header className="w-full sticky top-0 z-30 bg-[var(--x-bg)]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        {/* Top Left: Sleek & Stylish Challenges in Times New Roman */}
        <div className="flex items-center gap-3">
          {isSolvingOrExam && (
            <button
              onClick={handleBackToCatalog}
              title="Back to all challenges"
              className="p-1.5 -ml-1 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1
            className="text-3xl sm:text-4xl font-light tracking-wide text-[var(--x-text)] select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
            onClick={handleBackToCatalog}
          >
            Challenges
          </h1>
        </div>

        {/* Top Right of Viewport: Upload / New Challenge Action */}
        <div>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                setIsChoiceModalOpen(true);
              }
            }}
            className="x-btn-accent text-xs sm:text-sm px-5 py-2 font-bold cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Challenge</span>
          </button>
        </div>
      </header>

      {/* ── CENTRAL SUB-TAB SELECTOR (SHOWN WHEN NOT IN FULL WORKBENCH) ── */}
      {!isSolvingOrExam && (
        <div className="w-full flex justify-center px-4 pt-2 pb-4">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] shadow-sm max-w-md w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#0A84FF] text-white shadow-md btn-keep-white'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>All Challenges</span>
            </button>

            <button
              onClick={() => setActiveTab('codelab')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'codelab'
                  ? 'bg-[#0A84FF] text-white shadow-md btn-keep-white'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'quizzes'
                  ? 'bg-[#0A84FF] text-white shadow-md btn-keep-white'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Quizzes</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT SWITCHER ── */}
      <main className="flex-1 w-full">
        {activeTab === 'codelab' ? (
          <CodeLabArena
            hideHeader={true}
            initialProblemSlug={selectedProblemSlug}
            onSolvingStateChange={(isSolving) => setIsActiveSolving(isSolving)}
          />
        ) : activeTab === 'quizzes' ? (
          <JeeMainContestArena
            hideHeader={true}
            initialQuizId={selectedQuizId}
            onExamStateChange={handleExamStateChange}
          />
        ) : (
          /* ── MIXED "ALL CHALLENGES" SHOWCASE ── */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 space-y-6 pb-20">
            {/* Quick Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--x-surface)] p-3 sm:p-4 rounded-2xl border border-[var(--x-border)] shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--x-subtext)] mr-1">Type:</span>
                {(['all', 'code', 'quiz'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      filterType === t
                        ? 'bg-[#0A84FF] text-white btn-keep-white shadow-sm'
                        : 'bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'code' ? 'Code Lab' : 'Quizzes'}
                  </button>
                ))}

                <div className="h-4 w-px bg-[var(--x-border)] mx-1 hidden sm:block" />

                <span className="text-xs font-semibold text-[var(--x-subtext)] mr-1">Level:</span>
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setFilterDifficulty(diff)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterDifficulty === diff
                        ? 'bg-[#0A84FF] text-white btn-keep-white shadow-sm'
                        : 'bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative flex items-center min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--x-subtext)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter challenges..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>
            </div>

            {/* Combined Challenges Grid */}
            {isLoadingAll ? (
              <div className="py-24 text-center text-xs text-[var(--x-subtext)] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
                <span>Loading challenges...</span>
              </div>
            ) : combinedItems.length === 0 ? (
              <div className="py-20 text-center space-y-3 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                <Trophy className="w-8 h-8 text-[#0A84FF]/40 mx-auto" />
                <p className="text-xs text-[var(--x-subtext)]">No challenges found matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {combinedItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-5 sm:p-6 rounded-[28px] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 shadow-md group cursor-pointer"
                    onClick={() => {
                      if (item.type === 'code') {
                        setSelectedProblemSlug(item.slug);
                        setActiveTab('codelab');
                      } else {
                        setSelectedQuizId(item.id);
                        setActiveTab('quizzes');
                      }
                    }}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                              item.type === 'code'
                                ? 'bg-blue-500/15 text-[#38a6ff] border-blue-500/30'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {item.type === 'code' ? 'Code Lab' : 'Quiz & Contest'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${diffColors[item.difficulty]}`}>
                            {item.difficulty}
                          </span>
                        </div>

                        <span className="text-[11px] text-[var(--x-subtext)] truncate font-medium">
                          {item.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-[var(--x-text)] tracking-tight line-clamp-2 group-hover:text-[#0A84FF] transition-colors">
                        {item.title}
                      </h3>

                      {/* Metric info */}
                      <p className="text-xs text-[var(--x-subtext)] font-mono flex items-center gap-1.5">
                        {item.type === 'code' ? (
                          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                        )}
                        <span>{item.metric}</span>
                      </p>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-[var(--x-border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--x-subtext)] font-semibold">
                        {item.type === 'code' ? 'Interactive Sandbox' : 'Simulated CBT Exam'}
                      </span>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-xl bg-[#0A84FF] group-hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm btn-keep-white"
                      >
                        <span>{item.type === 'code' ? 'Solve' : 'Start'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── UPLOAD MODAL CHOICE POPUP ── */}
      <AnimatePresence>
        {isChoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChoiceModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md rounded-[28px] p-6 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl z-10 space-y-4 text-[var(--x-text)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--x-text)]">Create New Challenge</h3>
                <button
                  onClick={() => setIsChoiceModalOpen(false)}
                  className="p-1 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--x-subtext)] leading-relaxed">
                Choose the challenge type you would like to publish to students and the community:
              </p>

              <div className="space-y-3 pt-1">
                <button
                  onClick={() => {
                    setIsChoiceModalOpen(false);
                    setIsProblemUploadOpen(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-[var(--x-bg)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] hover:border-[#0A84FF]/50 transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#0A84FF] flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--x-text)] group-hover:text-[#0A84FF] transition-colors">
                      Coding Problem (LeetCode style)
                    </h4>
                    <p className="text-[11px] text-[var(--x-subtext)]">
                      Algorithms & Data Structures with 20+ automated test cases
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsChoiceModalOpen(false);
                    setIsQuizUploadOpen(true);
                  }}
                  className="w-full p-4 rounded-2xl bg-[var(--x-bg)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] hover:border-purple-500/50 transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--x-text)] group-hover:text-purple-400 transition-colors">
                      Quiz / CBT Test
                    </h4>
                    <p className="text-[11px] text-[var(--x-subtext)]">
                      Simulated MCQ test with sections, timer, and negative marking
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── QUIZ UPLOAD MODAL ── */}
      <QuizUploadModal
        isOpen={isQuizUploadOpen}
        onClose={() => setIsQuizUploadOpen(false)}
        onQuizUploaded={fetchMixedData}
      />

      {/* ── PROBLEM UPLOAD MODAL ── */}
      <ProblemUploadModal
        isOpen={isProblemUploadOpen}
        onClose={() => setIsProblemUploadOpen(false)}
        onProblemUploaded={fetchMixedData}
      />
    </div>
  );
};
