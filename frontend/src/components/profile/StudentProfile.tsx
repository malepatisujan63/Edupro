import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Users,
  Award,
  Code2,
  Sparkles,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Repeat2,
  CheckCircle2,
  ExternalLink,
  LogOut,
  LogIn,
  UserPlus,
  Zap,
  GraduationCap,
  Edit3,
  Settings,
  Sun,
  Moon,
  Check,
  X
} from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EditProfileModal } from './EditProfileModal';

export const StudentProfile: React.FC = () => {
  const { user, logout, openAuthModal, authFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'stats'>('posts');

  const fetchProfile = async () => {
    if (!user) {
      setProfileData(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await authFetch('/api/profile');
      const data = await res.json();
      if (data.success) {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="w-full min-h-screen lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] flex justify-center bg-[var(--x-bg)] text-[var(--x-text)] py-10 px-4 transition-colors duration-200">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-[var(--x-accent-light)] border border-[var(--x-accent)]/30 flex items-center justify-center mx-auto text-[var(--x-accent)]">
            <UserIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[var(--x-text)] tracking-tight">
              Sign In to Your Profile
            </h2>
            <p className="text-sm text-[var(--x-subtext)] leading-relaxed">
              Sign in or register your student account to track solved Code Lab challenges, exam percentiles, published notes, and connect with studymates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="x-btn-primary w-full sm:w-auto px-6 py-2.5"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="x-btn-secondary w-full sm:w-auto px-6 py-2.5"
            >
              <UserPlus className="w-4 h-4 text-[var(--x-accent)]" />
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !profileData) {
    return (
      <div className="w-full min-h-screen lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] flex flex-col items-center justify-center py-24 gap-3 text-xs text-[var(--x-subtext)] bg-[var(--x-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--x-accent)] border-t-transparent rounded-full animate-spin" />
        <span>Loading Profile...</span>
      </div>
    );
  }

  const profile = profileData?.profile || user;
  const stats = profileData?.stats || {};
  const posts: Post[] = profileData?.posts || [];

  return (
    <div className="w-full min-h-screen lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] flex justify-center bg-[var(--x-bg)] text-[var(--x-text)] pb-28 lg:pb-12 transition-colors duration-200">
      <main className="w-full max-w-[650px] min-h-screen border-x border-[var(--x-border)] flex flex-col">
        {/* ── STICKY TOP PROFILE HEADER ── */}
        <header className="sticky top-0 z-40 bg-[var(--x-header-bg)] backdrop-blur-md border-b border-[var(--x-border)] px-4 py-2.5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--x-text)] leading-tight">{profile.name}</h2>
            <span className="text-xs text-[var(--x-subtext)]">{posts.length} Posts</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
            title="Settings & Appearance"
          >
            <Settings className="w-4 h-4" />
          </button>
        </header>

        {/* ── BANNER IMAGE ── */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-sky-900/50 via-indigo-950/60 to-purple-900/50 border-b border-[var(--x-border)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#12BEF9_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* ── PROFILE INFO BAR ── */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-end -mt-12 sm:-mt-14 mb-3">
            <div className="relative">
              <img
                src={profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username || 'student'}`}
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--x-surface)] p-1 border-4 border-[var(--x-bg)] shadow-xl object-cover"
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--x-bg)] flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="x-btn-secondary text-xs px-4 py-1.5 flex items-center gap-1.5"
                title="Edit Profile"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="x-btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                title="Settings & Appearance"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => logout()}
                className="rounded-full border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-[var(--x-text)] tracking-tight">{profile.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                profile.role === 'university'
                  ? 'bg-blue-500/15 border-blue-400/30 text-[#38a6ff]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                {profile.role === 'university' ? 'Faculty' : 'Student'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--x-subtext)] font-mono">
              {profile.handle || `@${profile.username}`}
            </p>
          </div>

          <p className="text-[14px] text-[var(--x-text)] leading-relaxed mt-2.5">
            {profile.bio || 'Passionate learner exploring algorithms, full-stack systems, and academic mastery.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--x-subtext)] mt-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--x-accent)]" />
              {profile.college || 'Engineering Student'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--x-accent)]" />
              Joined KOINEXA
            </span>
          </div>

          <div className="flex items-center gap-5 text-sm mt-3 pt-3 border-t border-[var(--x-border)]">
            <div className="flex items-center gap-1">
              <strong className="text-[var(--x-text)] font-bold">{stats.studymates_count || 0}</strong>
              <span className="text-[var(--x-subtext)]">Studymates</span>
            </div>
            <div className="flex items-center gap-1">
              <strong className="text-[var(--x-text)] font-bold">{stats.problems_solved || 0}</strong>
              <span className="text-[var(--x-subtext)]">Solved</span>
            </div>
            <div className="flex items-center gap-1">
              <strong className="text-[var(--x-text)] font-bold">{stats.quizzes_taken || 0}</strong>
              <span className="text-[var(--x-subtext)]">Quizzes</span>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="grid grid-cols-2 border-y border-[var(--x-border)]">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 text-sm font-bold flex flex-col items-center justify-center relative hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer ${
              activeTab === 'posts' ? 'text-[var(--x-text)]' : 'text-[var(--x-subtext)]'
            }`}
          >
            <span>Posts</span>
            {activeTab === 'posts' && (
              <div className="absolute bottom-0 h-1 w-12 bg-[var(--x-accent)] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 text-sm font-bold flex flex-col items-center justify-center relative hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer ${
              activeTab === 'stats' ? 'text-[var(--x-text)]' : 'text-[var(--x-subtext)]'
            }`}
          >
            <span>Performance</span>
            {activeTab === 'stats' && (
              <div className="absolute bottom-0 h-1 w-20 bg-[var(--x-accent)] rounded-full" />
            )}
          </button>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="flex-1">
          {activeTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--x-subtext)]">
                You haven't posted any learning resources or notes yet.
              </div>
            ) : (
              posts.map((p) => (
                <article
                  key={p.id}
                  className="p-4 border-b border-[var(--x-border)] hover:bg-[var(--x-surface-hover)] transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--x-accent)] uppercase tracking-wider">
                      {p.post_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[var(--x-subtext)]">
                      {new Date(parseFloat(p.created_at) * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  {p.title && <h3 className="text-[15px] font-bold text-[var(--x-text)]">{p.title}</h3>}
                  <p className="text-[14px] text-[var(--x-text)] leading-relaxed whitespace-pre-line">{p.content}</p>

                  <div className="flex items-center gap-6 pt-2 text-xs text-[var(--x-subtext)]">
                    <span className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer">
                      <Heart className="w-4 h-4 text-rose-500" />
                      {p.likes_count}
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-[var(--x-accent)] transition-colors cursor-pointer">
                      <MessageCircle className="w-4 h-4 text-[var(--x-accent)]" />
                      {p.comments_count}
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer">
                      <Repeat2 className="w-4 h-4 text-emerald-400" />
                      {p.reposts_count}
                    </span>
                  </div>
                </article>
              ))
            )
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-center space-y-1">
                <span className="text-xs text-[var(--x-subtext)] font-medium block">Problems Solved</span>
                <span className="text-2xl font-extrabold text-[var(--x-accent)] font-mono">
                  {stats.problems_solved || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-center space-y-1">
                <span className="text-xs text-[var(--x-subtext)] font-medium block">JEE Quizzes Taken</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {stats.quizzes_taken || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-center space-y-1">
                <span className="text-xs text-[var(--x-subtext)] font-medium block">Avg Quiz Score</span>
                <span className="text-2xl font-extrabold text-amber-400 font-mono">
                  {stats.avg_quiz_score || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-center space-y-1">
                <span className="text-xs text-[var(--x-subtext)] font-medium block">Published Posts</span>
                <span className="text-2xl font-extrabold text-purple-400 font-mono">
                  {stats.posts_count || posts.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={fetchProfile}
      />

      {/* ── SETTINGS & THEME PREFERENCES MODAL ── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl p-6 space-y-6 z-10 text-[var(--x-text)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--x-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-[#0A84FF]">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--x-text)] leading-tight">Settings & Preferences</h3>
                    <p className="text-[11px] text-[var(--x-subtext)]">Customize your display and platform experience</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme & Display Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--x-text)]">Interface Appearance</h4>
                    <p className="text-xs text-[var(--x-subtext)] mt-0.5">Toggle between Light and Dark mode</p>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] hover:border-[#0A84FF] text-xs font-bold text-[var(--x-text)] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-blue-500" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Visual Theme Cards */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      theme === 'light'
                        ? 'bg-neutral-100 border-[#0A84FF] ring-2 ring-blue-500/20 text-neutral-900 shadow-md'
                        : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sun className="w-5 h-5 text-amber-500" />
                      {theme === 'light' && <Check className="w-4 h-4 text-[#0A84FF]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-neutral-900 dark:text-neutral-200">Light Theme</span>
                      <span className="text-[10px] text-neutral-500">Soft daylight workspace</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      theme === 'dark'
                        ? 'bg-[#0f141c] border-[#0A84FF] ring-2 ring-blue-500/20 text-white shadow-md'
                        : 'bg-neutral-100/60 border-neutral-200 text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Moon className="w-5 h-5 text-[#38a6ff]" />
                      {theme === 'dark' && <Check className="w-4 h-4 text-[#0A84FF]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-neutral-900 dark:text-white">Dark Theme</span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Deep OLED contrast</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Quick Info */}
              <div className="p-3.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2 text-xs">
                <span className="font-bold uppercase text-[10px] text-[var(--x-subtext)] tracking-wider block">Session Details</span>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--x-subtext)]">Account</span>
                  <span className="font-semibold text-[var(--x-text)]">{user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--x-subtext)]">Platform Email</span>
                  <span className="font-mono text-[var(--x-text)]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--x-subtext)]">Role</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize bg-blue-500/10 text-[#0A84FF] border border-blue-500/20">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-[var(--x-border)]">
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    logout();
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer transition-transform active:scale-95 shadow-md shadow-blue-500/20 btn-keep-white"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
