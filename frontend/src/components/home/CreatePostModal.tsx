import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Trophy, Sparkles, Link, Image as ImageIcon, Send, Film } from 'lucide-react';
import { YoutubeIcon } from '../icons/YoutubeIcon';
import { PostType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { validateTextInput } from '../../utils/inputValidator';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const extractYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const [postType, setPostType] = useState<PostType>('youtube_course');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [whyRecommend, setWhyRecommend] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractYouTubeVideoId(youtubeUrl) || extractYouTubeVideoId(content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    const textToCheck = [title, content, whyRecommend].filter(Boolean).join(' ');
    const valResult = validateTextInput(textToCheck);
    if (!valResult.isValid) {
      setError(valResult.error);
      return;
    }

    setIsSubmitting(true);

    const effectiveYoutubeUrl = youtubeUrl.trim() || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined);
    const effectiveImageUrl = imageUrl.trim() || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined);

    try {
      const res = await authFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: postType,
          title: title.trim() || undefined,
          content: content.trim(),
          why_recommend: whyRecommend.trim() || undefined,
          youtube_url: effectiveYoutubeUrl,
          course_url: courseUrl.trim() || undefined,
          image_url: effectiveImageUrl,
          tags: tags.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPostCreated();
        onClose();
        setTitle('');
        setContent('');
        setWhyRecommend('');
        setYoutubeUrl('');
        setCourseUrl('');
        setImageUrl('');
        setTags('');
      } else {
        setError(data.error || 'Failed to publish post');
      }
    } catch {
      setError('Unable to reach server. Please ensure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl max-sm:rounded-t-3xl sm:rounded-3xl overflow-hidden bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] shadow-2xl z-10 my-0 sm:my-auto max-sm:max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--x-border)] bg-[var(--x-surface)]">
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-lg text-[var(--x-text)] tracking-tight">
                  Compose Post
                </span>
              </div>
              <button
                onClick={onClose}
                className="x-icon-btn p-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Type Selector Pills */}
            <div className="px-5 pt-3 pb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPostType('youtube_course')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  postType === 'youtube_course'
                    ? 'bg-[#FF3B30] text-white shadow-md'
                    : 'bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                }`}
              >
                <YoutubeIcon className="w-3.5 h-3.5" />
                <span>Course</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('tweet')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  postType === 'tweet'
                    ? 'bg-[var(--x-accent)] text-black shadow-md'
                    : 'bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('hackathon')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  postType === 'hackathon'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Contest</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 space-y-3.5 overflow-y-auto max-h-[60vh]">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 font-medium">
                  {error}
                </div>
              )}

              {postType !== 'tweet' && (
                <div>
                  <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder={
                      postType === 'youtube_course'
                        ? "e.g. FreeCodeCamp Full Python & DSA Masterclass"
                        : "e.g. Smart India Hackathon 2026 Open for Applications"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                  />
                </div>
              )}

              {postType === 'youtube_course' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                      YouTube Video URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                    />

                    {videoId && (
                      <div className="mt-2 p-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] flex items-center gap-3">
                        <div className="relative aspect-video w-28 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-emerald-500 font-semibold block">✓ Video preview attached</span>
                          <p className="text-[11px] text-[var(--x-subtext)] truncate font-mono mt-0.5">ID: {videoId}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                      Curator's Note / Review
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Why is this video recommended for college students?"
                      value={whyRecommend}
                      onChange={(e) => setWhyRecommend(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                      Official Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={courseUrl}
                      onChange={(e) => setCourseUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                    />
                  </div>
                </>
              )}

              {postType === 'hackathon' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                      Registration Portal Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={courseUrl}
                      onChange={(e) => setCourseUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                      Poster Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or poster image"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                  {postType === 'tweet' ? "What is happening?!" : "Content / Description"}
                </label>
                <textarea
                  rows={4}
                  required={postType === 'tweet'}
                  placeholder={
                    postType === 'tweet'
                      ? "Share a study update, algorithmic question, or interview question..."
                      : "Provide details, prerequisites, eligibility, or roadmap..."
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                />
              </div>

              {postType === 'tweet' && (
                <div>
                  <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... attachment image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[var(--x-subtext)] uppercase tracking-wider block mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="DSA, MachineLearning, WebDev, Placements"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)] transition-colors"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--x-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="x-btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="x-btn-accent text-xs px-5 py-2 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
