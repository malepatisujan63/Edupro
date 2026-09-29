import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Users,
  MessageSquare,
  Search,
  Check,
  CheckCircle2,
  Hash,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Post, StudyMate, Community } from '../../types';

interface SharePostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess?: () => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  post,
  isOpen,
  onClose,
  onShareSuccess
}) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const [studyMates, setStudyMates] = useState<StudyMate[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMates, setSelectedMates] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<{ community_id: string; channel_id: string }[]>([]);
  const [note, setNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setSelectedMates([]);
      setSelectedChannels([]);
      setNote('');
      setShareSuccess(false);
      loadTargets();
    }
  }, [isOpen, post]);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const [matesRes, commsRes] = await Promise.all([
        authFetch('/api/studymates/list'),
        authFetch('/api/communities')
      ]);
      const [matesData, commsData] = await Promise.all([
        matesRes.json(),
        commsRes.json()
      ]);

      if (matesData.success && matesData.studymates) {
        setStudyMates(matesData.studymates);
      }
      if (commsData.success && commsData.communities) {
        setCommunities(commsData.communities);
      }
    } catch (err) {
      console.error('Failed to load share targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMate = (mateId: string) => {
    setSelectedMates((prev) =>
      prev.includes(mateId) ? prev.filter((id) => id !== mateId) : [...prev, mateId]
    );
  };

  const toggleChannel = (commId: string, chanId: string) => {
    setSelectedChannels((prev) => {
      const exists = prev.some((c) => c.community_id === commId && c.channel_id === chanId);
      if (exists) {
        return prev.filter((c) => !(c.community_id === commId && c.channel_id === chanId));
      } else {
        return [...prev, { community_id: commId, channel_id: chanId }];
      }
    });
  };

  const handleShare = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!post) return;
    if (selectedMates.length === 0 && selectedChannels.length === 0) return;

    setIsSharing(true);
    try {
      const res = await authFetch('/api/posts/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          studymate_ids: selectedMates,
          channels: selectedChannels,
          note: note.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setShareSuccess(true);
        if (onShareSuccess) onShareSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to share post:', err);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen || !post) return null;

  const totalSelected = selectedMates.length + selectedChannels.length;

  const filteredMates = studyMates.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommunities = communities
    .map((c) => ({
      ...c,
      channels: (c.channels || []).filter(
        (ch) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter((c) => c.channels.length > 0 || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[var(--x-surface)] border border-[var(--x-border)] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] text-[var(--x-text)]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--x-border)] flex items-center justify-between bg-[var(--x-surface)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[var(--x-text)]">
                Share Post to Chats
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Post Snippet Card */}
          <div className="p-4 border-b border-[var(--x-border)] bg-[var(--x-surface-hover)]/50 flex gap-3 items-center">
            <img
              src={
                post.user_avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_name}`
              }
              alt={post.user_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-[var(--x-surface)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[var(--x-text)] truncate">
                  {post.user_name}
                </span>
                <span className="text-[11px] text-[var(--x-subtext)] truncate">
                  {post.user_handle}
                </span>
              </div>
              <p className="text-xs text-[var(--x-subtext)] truncate mt-0.5">
                {post.title || post.content}
              </p>
            </div>
          </div>

          {/* Optional Note / Search Input */}
          <div className="p-4 border-b border-[var(--x-border)] space-y-2.5">
            <input
              type="text"
              placeholder="Write a message with this post..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-emerald-500 transition-colors"
            />

            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--x-subtext)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search study mates or community channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Recipients List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--x-subtext)]">Loading chats...</span>
              </div>
            ) : (
              <>
                {/* 1. Study Mates (1-on-1 chats) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--x-subtext)] px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      Study Mates ({filteredMates.length})
                    </span>
                  </div>

                  {filteredMates.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[var(--x-subtext)] bg-[var(--x-surface-hover)] rounded-xl border border-[var(--x-border)]">
                      {studyMates.length === 0
                        ? 'No Study Mates yet. Connect with peers from the home feed!'
                        : 'No study mates match your search.'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMates.map((mate) => {
                        const isSelected = selectedMates.includes(mate.id);
                        return (
                          <div
                            key={mate.id}
                            onClick={() => toggleMate(mate.id)}
                            className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/15 border border-emerald-500/40'
                                : 'hover:bg-[var(--x-surface-hover)] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={
                                  mate.avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${mate.name}`
                                }
                                alt={mate.name}
                                className="w-8 h-8 rounded-full object-cover bg-[var(--x-surface)]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--x-text)] truncate">
                                  {mate.name}
                                </p>
                                <span className="text-[11px] text-[var(--x-subtext)] truncate block">
                                  {mate.handle}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-[var(--x-border)] bg-[var(--x-surface)]'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Community Channels */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--x-subtext)] px-1">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Community Channels
                    </span>
                  </div>

                  {filteredCommunities.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[var(--x-subtext)] bg-[var(--x-surface-hover)] rounded-xl border border-[var(--x-border)]">
                      No community channels found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCommunities.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-2.5 rounded-2xl bg-[var(--x-surface-hover)]/40 border border-[var(--x-border)] space-y-1.5"
                        >
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-base">{comm.avatar}</span>
                            <span className="text-xs font-bold text-[var(--x-text)] truncate">
                              {comm.name}
                            </span>
                          </div>

                          <div className="space-y-1 pl-2">
                            {(comm.channels || []).map((chan) => {
                              const isSelected = selectedChannels.some(
                                (c) => c.community_id === comm.id && c.channel_id === chan.id
                              );
                              return (
                                <div
                                  key={chan.id}
                                  onClick={() => toggleChannel(comm.id, chan.id)}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-500/15 border border-emerald-500/40'
                                      : 'hover:bg-[var(--x-surface-hover)] border border-transparent'
                                  }`}
                                >
                                  <span className="text-xs text-[var(--x-subtext)] flex items-center gap-1.5 truncate">
                                    <Hash className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="truncate">{chan.name}</span>
                                  </span>

                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-[var(--x-border)] bg-[var(--x-surface)]'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer with Send Button */}
          <div className="p-4 border-t border-[var(--x-border)] bg-[var(--x-surface)] flex items-center justify-between">
            <span className="text-xs text-[var(--x-subtext)]">
              {totalSelected === 0 ? 'Select recipients' : `${totalSelected} selected`}
            </span>

            {shareSuccess ? (
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shared successfully!</span>
              </div>
            ) : (
              <button
                onClick={handleShare}
                disabled={isSharing || totalSelected === 0}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSharing ? 'Sharing...' : 'Send in Chat'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
