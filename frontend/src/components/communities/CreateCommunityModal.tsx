import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Community } from '../../types';
import { validateTextInput } from '../../utils/inputValidator';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: (comm: Community) => void;
}

const EMOJI_OPTIONS = ['💬', '🎓', '⚡', '💻', '🚀', '🔬', '🧠', '🌐', '📚', '🎯'];

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCommunityCreated,
}) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(EMOJI_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    const checkText = `${name} ${domain} ${description}`.trim();
    const val = validateTextInput(checkText);
    if (!val.isValid) {
      setError(val.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category: domain.trim() || 'General Discussion',
          avatar: avatar || '💬',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.community) {
        onCommunityCreated(data.community);
        onClose();
      } else {
        setError(data.error || 'Failed to create community.');
      }
    } catch {
      setError('Server unreachable. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-md rounded-2xl overflow-hidden bg-white dark:bg-[#0b141a] border border-neutral-200 dark:border-neutral-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
              {avatar}
            </div>
            <div>
              <h3
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                className="text-xl font-light tracking-wide text-black dark:text-white"
              >
                Create Community
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - strictly no labels, all hints in placeholders */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Emoji Avatar Selector (no label) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setAvatar(em)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                  avatar === em
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40 scale-105'
                    : 'bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Group Name input */}
          <input
            type="text"
            required
            placeholder="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light"
          />

          {/* Domain input */}
          <input
            type="text"
            placeholder="Domain (e.g. AI, Web Dev, DSA, Engineering)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light"
          />

          {/* Description input */}
          <textarea
            rows={3}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-light"
          />

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-light text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Community</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
