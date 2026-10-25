import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Lock, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateTextInput } from '../../utils/inputValidator';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const AVATAR_SEEDS = ['Felix', 'Luna', 'Alex', 'Nova', 'Leo', 'Maya', 'Aria', 'Ethan'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user, authFetch, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [college, setCollege] = useState(user?.college || '');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(user?.username || 'student');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }

    const checkText = `${name} ${bio} ${college}`.trim();
    const val = validateTextInput(checkText);
    if (!val.isValid) {
      setError(val.error);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          college: college.trim(),
          avatar: currentAvatar,
          new_password: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          onProfileUpdated();
          onClose();
        }, 600);
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch {
      setError('Server unreachable. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg rounded-[32px] overflow-hidden text-[var(--x-text)] bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--x-border)] bg-[var(--x-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#38a6ff] to-[#0A84FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--x-text)] tracking-tight">Edit Profile</h3>
              <p className="text-xs text-[var(--x-subtext)]">Update personal bio, institute, and avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-2">
              Choose Avatar
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
              {AVATAR_SEEDS.map((seed) => {
                const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                const isSelected = selectedAvatarSeed === seed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatarSeed(seed)}
                    className={`relative p-1 rounded-2xl border transition-all cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? 'border-[#0A84FF] ring-2 ring-[#0A84FF]/40 bg-blue-500/20 scale-105'
                        : 'border-[var(--x-border)] hover:border-[var(--x-border-subtle)] bg-[var(--x-surface-hover)]'
                    }`}
                  >
                    <img src={avatarUrl} alt={seed} className="w-10 h-10 rounded-xl object-cover" />
                    {isSelected && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-[9px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">College / Institute</label>
              <input
                type="text"
                value={college}
                placeholder="e.g. IIT Madras, BITS Pilani"
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Bio / Headline</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you are learning, your interests or projects..."
              className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all"
            />
          </div>

          {/* New Password (Optional) */}
          <div>
            <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Change Password (Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--x-surface-hover)] hover:bg-[var(--x-border)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50 btn-keep-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
