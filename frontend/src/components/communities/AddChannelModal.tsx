import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Hash, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Channel } from '../../types';
import { validateTextInput } from '../../utils/inputValidator';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
  onChannelAdded: (channel: Channel) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  communityId,
  communityName,
  onChannelAdded,
}) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const [name, setName] = useState('');
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

    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/#/g, '');

    if (!cleanName) {
      setError('Channel name is required.');
      return;
    }

    const val = validateTextInput(cleanName);
    if (!val.isValid) {
      setError(val.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/communities/${communityId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          channel_type: 'general',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.channel) {
        onChannelAdded(data.channel);
        setName('');
        onClose();
      } else {
        setError(data.error || 'Failed to create channel.');
      }
    } catch {
      setError('Server unreachable. Please check your connection.');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3
                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                className="text-xl font-light tracking-wide text-black dark:text-white"
              >
                Add Extra Channel
              </h3>
              <p className="text-xs font-light text-neutral-500 dark:text-neutral-400">
                In #{communityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form - strictly no labels, placeholder only */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Channel Name input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-light text-sm">
              #
            </span>
            <input
              type="text"
              required
              autoFocus
              placeholder="Channel name (e.g. doubts, resources, announcements)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light"
            />
          </div>

          <p className="text-[11px] text-neutral-500 font-light">
            Channel names are lowercase with hyphens. Only community admins can add channels.
          </p>

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
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Channel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
