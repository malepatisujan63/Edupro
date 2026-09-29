import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeftNavigation } from './components/layout/LeftNavigation';
import { HomeFeed } from './components/home/HomeFeed';
import { ChallengesHub } from './components/challenges/ChallengesHub';
import { WhatsAppCommunities } from './components/communities/WhatsAppCommunities';
import { StudentProfile } from './components/profile/StudentProfile';
import { ClassroomHub } from './components/classroom/ClassroomHub';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { CreatePostModal } from './components/home/CreatePostModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NavTab } from './types';

const parseHash = (): { tab: NavTab; classroomId: string | null } => {
  const rawHash = window.location.hash.replace(/^[#/]+/, '').trim();
  if (!rawHash) return { tab: 'home', classroomId: null };
  const cleanHash = rawHash.split('?')[0];
  const parts = cleanHash.split('/').filter(Boolean);
  if (parts.length === 0) return { tab: 'home', classroomId: null };
  const tab = parts[0].toLowerCase() as NavTab;
  const validTabs: NavTab[] = ['home', 'challenges', 'classroom', 'contests', 'communities', 'codelab', 'profile', 'admin'];
  if (validTabs.includes(tab)) {
    const mappedTab = (tab === 'contests' || tab === 'codelab') ? 'challenges' : tab;
    return { tab: mappedTab, classroomId: parts[1] || null };
  }
  return { tab: 'home', classroomId: null };
};

function MainLayout() {
  const { user, authFetch } = useAuth();
  const initialRoute = parseHash();
  const [activeTab, setActiveTab] = useState<NavTab>(initialRoute.tab);
  const [targetClassroomId, setTargetClassroomId] = useState<string | null>(initialRoute.classroomId);
  const [targetQuizId, setTargetQuizId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWritingContest, setIsWritingContest] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSelectTab = (tab: NavTab, classroomId?: string | null) => {
    setActiveTab(tab);
    if (classroomId) {
      setTargetClassroomId(classroomId);
      window.location.hash = `#/classroom/${classroomId}`;
    } else {
      setTargetClassroomId(null);
      window.location.hash = `#/${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const { tab, classroomId } = parseHash();
      setActiveTab(tab);
      setTargetClassroomId(classroomId);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Ctrl+K / Cmd+K Spotlight Search Shortcut & Post Creator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    const handleOpenCreatePost = () => setIsCreatePostOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-create-post', handleOpenCreatePost);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-create-post', handleOpenCreatePost);
    };
  }, []);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await authFetch('/api/notifications/unread-count');
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] flex relative selection:bg-[#12BEF9]/30 selection:text-white transition-colors duration-200">
      {/* ── LEFT DOCKED EXPANDING SIDEBAR (HIDDEN WHILE WRITING CONTEST OR FULL AUTH PAGE) ── */}
      {!isWritingContest && activeTab !== 'auth' && (
        <LeftNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => handleSelectTab(tab)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          unreadNotificationsCount={unreadCount}
        />
      )}

      {/* ── MAIN CONTENT OUTLET (Navigation is an Overlay) ── */}
      <div className="flex-1 w-full min-h-screen flex flex-col relative z-10">
        <main className="flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {activeTab === 'home' && <HomeFeed key={feedRefreshKey} />}
              {activeTab === 'classroom' && <ClassroomHub initialClassroomId={targetClassroomId} />}
              {(activeTab === 'challenges' || activeTab === 'contests' || activeTab === 'codelab') && (
                <ChallengesHub
                  onExamStateChange={setIsWritingContest}
                  initialQuizId={targetQuizId}
                />
              )}
              {activeTab === 'communities' && <WhatsAppCommunities />}
              {activeTab === 'profile' && <StudentProfile />}
              {activeTab === 'admin' && <AdminDashboard />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── GLOBAL CREATE POST MODAL ── */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => setFeedRefreshKey((k) => k + 1)}
      />

      {/* ── GLOBAL NOTIFICATION DRAWER ── */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onRefreshUnread={fetchUnreadCount}
        onSelectClassroom={(cid) => {
          handleSelectTab('classroom', cid);
          setIsNotifDrawerOpen(false);
        }}
      />

      {/* ── UNIVERSAL GLOBAL SEARCH BAR MODAL ── */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => {
          handleSelectTab(tab);
          setIsSearchOpen(false);
        }}
        onSelectClassroom={(cid) => {
          handleSelectTab('classroom', cid);
          setIsSearchOpen(false);
        }}
        onSelectQuiz={(quizId) => {
          setTargetQuizId(quizId);
          handleSelectTab('challenges');
          setIsSearchOpen(false);
        }}
      />

      {/* ── AUTHENTICATION MODAL (LOGIN / REGISTER) ── */}
      <AuthModal />
    </div>
  );
}

function AppRoot() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--x-bg)] flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#12BEF9]/20 border-t-[#12BEF9] rounded-full animate-spin" />
          <p className="text-[var(--x-subtext)] text-xs font-medium tracking-wide">Loading KOINEXA platform...</p>
        </div>
      </div>
    );
  }

  // Strict Auth Wall: If user is not logged in, display ONLY the AuthPage with smooth home transition
  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="auth-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] flex items-center justify-center transition-colors duration-200"
        >
          <AuthPage
            onSuccessRedirect={() => {
              window.location.hash = '#/home';
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="main-view"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen bg-[var(--x-bg)] transition-colors duration-200"
        >
          <MainLayout />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ThemeProvider>
  );
}
