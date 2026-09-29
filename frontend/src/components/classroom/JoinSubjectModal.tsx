import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  GraduationCap,
  ClipboardPaste,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Classroom } from '../../types';
import confetti from 'canvas-confetti';

interface JoinSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClassroom?: (classroom: Classroom) => void;
  onJoinSuccess?: () => void;
}

export const JoinSubjectModal: React.FC<JoinSubjectModalProps> = ({
  isOpen,
  onClose,
  onSelectClassroom,
  onJoinSuccess
}) => {
  const { user, authFetch, openAuthModal } = useAuth();

  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Classroom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchId('');
    setSearchResult(null);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSearchResult(null);

    const cleanId = searchId.trim();
    if (!cleanId) {
      setError('Please enter a 32-character subject ID.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await authFetch(`/api/classrooms/lookup/${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (data.success && data.classroom) {
        setSearchResult(data.classroom);
      } else {
        setError(data.error || 'No subject found matching this 32-character ID. Please check with your faculty.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search for subject. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!searchResult) return;

    setIsJoining(true);
    setError(null);
    try {
      const res = await authFetch(`/api/classrooms/${searchResult.id}/join`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
        setSearchResult({
          ...searchResult,
          member_status: data.status === 'accepted' ? 'accepted' : 'pending'
        });
        setSuccessMessage(
          data.status === 'accepted'
            ? 'You are already enrolled in this subject!'
            : 'Join request sent to faculty! Waiting for review and acceptance.'
        );
        onJoinSuccess?.();
      } else {
        setError(data.error || 'Failed to submit join request');
      }
    } catch (err: any) {
      setError(err.message || 'Network error sending join request');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSearchId(text.trim());
      }
    } catch (err) {
      // Clipboard permission denied or unavailable
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl z-10 space-y-5 overflow-hidden text-[var(--x-text)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#38a6ff]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--x-text)] tracking-tight">
                  Join Subject
                </h3>
                <p className="text-[11px] text-[var(--x-subtext)]">
                  Enter the 32-digit / character ID provided by your faculty
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-medium text-[var(--x-subtext)]">Subject 32-Character Key</span>
                {searchId.trim().length > 0 && (
                  <span className={`font-mono text-[11px] ${searchId.trim().length === 32 ? 'text-emerald-500 font-bold' : 'text-[var(--x-subtext)]'}`}>
                    {searchId.trim().length} / 32 characters
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  autoFocus
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 7c32bfd12e8749a0bc4572ef91089ad4"
                  className="w-full pl-3.5 pr-20 py-3 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] font-mono text-xs sm:text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
                />

                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="absolute right-2 px-2 py-1 rounded-lg text-[11px] font-semibold text-[var(--x-subtext)] hover:text-[#38a6ff] hover:bg-[var(--x-surface-hover)] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchId.trim()}
              className="w-full py-2.5 rounded-2xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/30 disabled:opacity-50 active:scale-95 btn-keep-white"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching Database...' : 'Find Subject'}</span>
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Subject Result Preview Card */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#0A84FF]/20 text-[#38a6ff] text-xs font-mono font-bold">
                  {searchResult.subject_code}
                </span>
                <span className="text-xs text-[var(--x-subtext)] font-medium">
                  {searchResult.university}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-[var(--x-text)]">{searchResult.name}</h4>
                {searchResult.description && (
                  <p className="text-xs text-[var(--x-subtext)] line-clamp-2 mt-1 leading-relaxed">
                    {searchResult.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-[var(--x-border)]">
                <img
                  src={searchResult.faculty_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${searchResult.faculty_name}`}
                  alt="Faculty"
                  className="w-7 h-7 rounded-full bg-[var(--x-surface-hover)] border border-[var(--x-border)] object-cover"
                />
                <div className="text-xs">
                  <span className="text-[var(--x-subtext)]">Course Instructor: </span>
                  <span className="font-semibold text-[var(--x-text)]">Prof. {searchResult.faculty_name}</span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="pt-2 border-t border-[var(--x-border)] flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--x-subtext)]">
                  Enrollment: <strong className="text-[var(--x-text)] capitalize">{searchResult.member_status || 'Not Enrolled'}</strong>
                </span>

                {searchResult.member_status === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectClassroom) {
                        onSelectClassroom(searchResult);
                      }
                      handleClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 btn-keep-white"
                  >
                    <span>Enter Subject Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : searchResult.member_status === 'pending' ? (
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Request Pending Faculty Review</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/30 disabled:opacity-50 active:scale-95 transition-all btn-keep-white"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{isJoining ? 'Sending Request...' : 'Send Join Request'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
