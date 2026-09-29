import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Award,
  Code2,
  Users,
  FileText,
  ChevronRight,
  GraduationCap,
  Sparkles,
  User,
  ArrowRight
} from 'lucide-react';
import { NavTab } from '../../types';
import { FlowingBorderGlow } from '../common/FlowingBorderGlow';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectClassroom?: (classroomId: string) => void;
  onSelectQuiz?: (quizId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectClassroom,
  onSelectQuiz,
}) => {
  const [query, setQuery] = useState('');
  const [isGlowing, setIsGlowing] = useState(false);
  const [results, setResults] = useState<{
    posts: any[];
    quizzes: any[];
    problems: any[];
    communities: any[];
    classrooms: any[];
    people: any[];
  }>({
    posts: [],
    quizzes: [],
    problems: [],
    communities: [],
    classrooms: [],
    people: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const glowTimeoutRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerGlow = () => {
    setIsGlowing(true);
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = setTimeout(() => {
      setIsGlowing(false);
    }, 3200);
  };

  const executeSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setResults({ posts: [], quizzes: [], problems: [], communities: [], classrooms: [], people: [] });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success && data.results) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Universal search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced auto-search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults({ posts: [], quizzes: [], problems: [], communities: [], classrooms: [], people: [] });
      return;
    }

    triggerGlow();
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerGlow();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleManualSearch = () => {
    triggerGlow();
    executeSearch(query);
  };

  if (!isOpen) return null;

  const totalResultsCount =
    (results.quizzes?.length || 0) +
    (results.classrooms?.length || 0) +
    (results.problems?.length || 0) +
    (results.communities?.length || 0) +
    (results.posts?.length || 0) +
    (results.people?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:pt-16 md:pt-20 bg-black/80 backdrop-blur-2xl animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl relative"
      >
        {/* ── 8PX FLOWING GLOW OF EXACT 4 KOINEXA LOGO COLORS (CIRCULAR, NO BREAKS) ── */}
        <FlowingBorderGlow isActive={isGlowing} borderRadius="rounded-[28px]" />

        {/* ── CRYSTAL GLASS SEARCH CONTAINER ── */}
        <div className="relative z-10 rounded-[28px] bg-[var(--x-surface)] backdrop-blur-2xl border border-[var(--x-border)] shadow-2xl overflow-hidden text-[var(--x-text)]">
          {/* Universal Search Header Bar */}
          <div className="p-3.5 sm:p-4.5 border-b border-[var(--x-border)] flex items-center gap-3 bg-[var(--x-surface)]">
            <Search className="w-5 h-5 text-[#12BEF9] flex-shrink-0 ml-1.5" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Universal Search: subjects, contests, classrooms, coding challenges, communities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={triggerGlow}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSearch();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full bg-transparent text-sm sm:text-base text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none font-medium selection:bg-[#1A75F2]/40"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults({ posts: [], quizzes: [], problems: [], communities: [], classrooms: [], people: [] });
                }}
                className="w-6 h-6 rounded-full bg-[var(--x-surface-hover)] flex items-center justify-center text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Glowing Action Button */}
            <button
              onClick={handleManualSearch}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#12BEF9] via-[#1A75F2] to-[#7544EC] hover:brightness-110 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 flex-shrink-0 btn-keep-white"
            >
              <span>Search</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-[11px] font-mono text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer flex-shrink-0"
            >
              ESC
            </button>
          </div>

          {/* Results Stream */}
          <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
            {isLoading && (
              <div className="text-center py-12 text-xs text-[var(--x-subtext)] flex items-center justify-center gap-2.5">
                <div className="w-4 h-4 border-2 border-[#12BEF9] border-t-transparent rounded-full animate-spin" />
                <span>Searching across platform domains...</span>
              </div>
            )}

            {!isLoading && query && totalResultsCount === 0 && (
              <div className="text-center py-12 text-xs text-[var(--x-subtext)] space-y-1.5">
                <p>No results found matching "{query}".</p>
                <p className="text-[11px] text-[var(--x-subtext)]">
                  Try searching by subject name, quiz title, university, problem category, or faculty name.
                </p>
              </div>
            )}

            {!query && (
              <div className="py-8 px-2 text-center text-xs text-[var(--x-subtext)] space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--x-text)]">
                  <Sparkles className="w-4 h-4 text-[#12BEF9]" />
                  <span>Universal Platform Search</span>
                </div>
                <p className="text-[11px] text-[var(--x-subtext)] max-w-md mx-auto">
                  Type any subject code (e.g. CS401), JEE Main test title, LeetCode problem, WhatsApp group, or mentor name to search platform-wide.
                </p>
              </div>
            )}

            {/* ── DOMAIN 1: JEE MAIN QUIZZES & CONTESTS ── */}
            {results.quizzes?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>JEE Main Quizzes & Contests ({results.quizzes.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.quizzes.map((qz) => (
                    <div
                      key={qz.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Award className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] block truncate">{qz.title}</span>
                          <span className="text-[10px] text-[var(--x-subtext)] font-mono">
                            {qz.duration_minutes || 60} Mins • {qz.exam_type?.toUpperCase() || 'JEE MAIN'} CBT
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectQuiz) {
                            onSelectQuiz(qz.id);
                          } else {
                            onNavigate('challenges');
                          }
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-sm shadow-emerald-500/20"
                      >
                        <span>Open Quiz</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOMAIN 2: UNIVERSITY CLASSROOMS & SUBJECTS ── */}
            {results.classrooms?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-[#12BEF9] uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>University Classrooms & Subjects ({results.classrooms.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.classrooms.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-blue-400/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-[#12BEF9] flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-[#12BEF9] text-[10px] font-mono font-bold">
                              {c.subject_code}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] text-[var(--x-subtext)] block truncate">
                            {c.university} • {c.department}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectClassroom) {
                            onSelectClassroom(c.id);
                          } else {
                            onNavigate('classroom');
                          }
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 text-blue-700 dark:text-[#38a6ff] border border-blue-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-sm shadow-blue-500/20"
                      >
                        <span>Enter Subject</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOMAIN 3: CODING CONTEST CHALLENGES ── */}
            {results.problems?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-[#BC5AFC] uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code Lab Challenges ({results.problems.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.problems.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-purple-400/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-[#BC5AFC] flex items-center justify-center flex-shrink-0">
                          <Code2 className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] truncate">{p.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                p.difficulty === 'Easy'
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : p.difficulty === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {p.difficulty}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--x-subtext)] font-mono">{p.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('challenges');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95"
                      >
                        <span>Solve Challenge</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOMAIN 4: STUDY COMMUNITIES ── */}
            {results.communities?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Study Communities ({results.communities.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.communities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-amber-400/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-lg flex items-center justify-center flex-shrink-0">
                          {c.avatar || '💬'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] block truncate">{c.name}</span>
                          <span className="text-[10px] text-[var(--x-subtext)]">{c.members_count} active members</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('communities');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95"
                      >
                        <span>Join Group</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOMAIN 5: POSTS & RECOMMENDATIONS ── */}
            {results.posts?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Feed Posts & Videos ({results.posts.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-sky-400/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] block truncate">
                            {post.title || post.content}
                          </span>
                          <span className="text-[10px] text-[var(--x-subtext)]">Posted by {post.user_name || 'Community'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('home');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95"
                      >
                        <span>View Post</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DOMAIN 6: ACADEMIC PEOPLE & MENTORS ── */}
            {results.people?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-extrabold text-[#7544EC] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Academic Peers & Mentors ({results.people.length})</span>
                  </span>
                </div>
                <div className="grid gap-2">
                  {results.people.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)]/40 border border-[var(--x-border)] hover:border-indigo-400/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-[#7544EC] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[var(--x-text)] truncate">{u.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-semibold capitalize">
                              {u.role === 'university' ? 'Mentor' : u.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--x-subtext)]">@{u.handle} • {u.college || 'Koinexa'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
