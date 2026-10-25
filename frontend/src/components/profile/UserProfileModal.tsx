import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  Sparkles,
  BookOpen,
  Trophy,
  CheckCircle2,
  Share2,
  Heart,
  MessageCircle,
  Repeat2,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserPublicProfile, User, Post } from '../../types';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDirectChat?: (targetUser: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onStartDirectChat
}) => {
  const { user: currentUser, authFetch, openAuthModal } = useAuth();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    'self' | 'none' | 'pending_sent' | 'pending_received' | 'accepted'
  >('none');

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile(userId);
    } else {
      setProfile(null);
    }
  }, [isOpen, userId]);

  const fetchProfile = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/users/${targetId}/profile`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile({
          user: data.profile,
          studymate_status: data.studymate_status || 'none',
          stats: data.stats || {
            quizzes_taken: 0,
            problems_solved: 0,
            posts_count: 0,
            studymates_count: 0
          },
          recent_posts: data.posts || []
        });
        setRequestStatus(data.studymate_status || 'none');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!userId) return;
    setActionLoading(true);
    try {
      const res = await authFetch('/api/studymates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.status === 'accepted') {
          setRequestStatus('accepted');
        } else {
          setRequestStatus('pending_sent');
        }
      }
    } catch (err) {
      console.error('Failed to send study mate request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondRequest = async (action: 'accept' | 'reject') => {
    if (!currentUser || !userId) return;
    setActionLoading(true);
    try {
      const res = await authFetch('/api/studymates/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: userId, action })
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus(action === 'accept' ? 'accepted' : 'none');
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[var(--x-surface)] border border-[var(--x-border)] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-[var(--x-text)]"
        >
          {/* Header Banner with Close Button */}
          <div className="relative h-28 bg-gradient-to-r from-emerald-600/30 via-teal-500/20 to-emerald-700/30 border-b border-[var(--x-border)] flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Content Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-5 no-scrollbar">
            {loading || !profile ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--x-subtext)]">Loading profile...</span>
              </div>
            ) : (
              <>
                {/* Avatar & Action Row */}
                <div className="flex items-end justify-between -mt-12 relative z-10">
                  <img
                    src={
                      profile.user.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user.name}`
                    }
                    alt={profile.user.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[var(--x-surface)] bg-[var(--x-surface)] object-cover shadow-lg"
                  />

                  {/* Contextual Action Button */}
                  <div className="flex items-center gap-2">
                    {requestStatus === 'self' && (
                      <span className="px-4 py-1.5 rounded-full bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-subtext)]">
                        Your Profile
                      </span>
                    )}

                    {requestStatus === 'none' && (
                      <button
                        onClick={handleSendRequest}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Request Study Mate</span>
                      </button>
                    )}

                    {requestStatus === 'pending_sent' && (
                      <div className="px-4 py-2 rounded-full bg-[var(--x-surface-hover)] border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1.5 select-none">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Requested</span>
                      </div>
                    )}

                    {requestStatus === 'pending_received' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondRequest('accept')}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRespondRequest('reject')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-full bg-[var(--x-surface-hover)] hover:bg-rose-500/20 text-[var(--x-subtext)] hover:text-rose-400 border border-[var(--x-border)] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {requestStatus === 'accepted' && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Study Mate</span>
                        </span>
                        {onStartDirectChat && (
                          <button
                            onClick={() => {
                              onStartDirectChat(profile.user);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity & Bio */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[var(--x-text)] tracking-tight">
                      {profile.user.name}
                    </h3>
                    <span className="text-xs text-[var(--x-subtext)]">
                      {profile.user.handle}
                    </span>
                    {profile.user.role === 'university' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Faculty</span>
                      </span>
                    )}
                  </div>

                  {profile.user.college && (
                    <p className="text-xs text-[var(--x-subtext)] mt-1 flex items-center gap-1">
                      <span>{profile.user.college}</span>
                    </p>
                  )}

                  {profile.user.bio && (
                    <p className="text-xs text-[var(--x-text)] mt-2.5 leading-relaxed whitespace-pre-wrap">
                      {profile.user.bio}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 py-3 px-4 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-center">
                  <div>
                    <div className="text-base font-bold text-[var(--x-text)]">
                      {profile.stats.studymates_count}
                    </div>
                    <div className="text-[10.5px] text-[var(--x-subtext)]">Study Mates</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--x-text)]">
                      {profile.stats.posts_count}
                    </div>
                    <div className="text-[10.5px] text-[var(--x-subtext)]">Posts</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--x-text)]">
                      {profile.stats.quizzes_taken}
                    </div>
                    <div className="text-[10.5px] text-[var(--x-subtext)]">Quizzes</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[var(--x-text)]">
                      {profile.stats.problems_solved}
                    </div>
                    <div className="text-[10.5px] text-[var(--x-subtext)]">Problems</div>
                  </div>
                </div>

                {/* Recent Posts Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--x-subtext)]">
                    Recent Activity ({profile.recent_posts.length})
                  </h4>

                  {profile.recent_posts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--x-subtext)] bg-[var(--x-surface)]/50 rounded-2xl border border-[var(--x-border)]">
                      No posts shared yet.
                    </div>
                  ) : (
                    profile.recent_posts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-2xl bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] border border-[var(--x-border)] transition-colors space-y-2"
                      >
                        {post.title && (
                          <p className="text-xs font-bold text-[var(--x-text)] truncate">
                            {post.title}
                          </p>
                        )}
                        <p className="text-xs text-[var(--x-subtext)] line-clamp-3 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[var(--x-subtext)] pt-1">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="w-3 h-3" />
                            {post.reposts_count}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
