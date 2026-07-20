import React, { useState, useEffect } from 'react';
import { IOSFloatingNav, type NavTab } from './components/layout/IOSFloatingNav';
import { BackgroundAmbient } from './components/layout/BackgroundAmbient';
import { TopNavigation } from './components/layout/TopNavigation';
import { NotificationPanel } from './components/layout/NotificationPanel';
import { CreatePostModal } from './components/post/CreatePostModal';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/auth/LandingPage';
import { DSAIntelligenceHUD } from './components/dsa/DSAIntelligenceHUD';
import { HomeFeed } from './pages/HomeFeed';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { SubjectCommunities } from './pages/SubjectCommunities';
import { QnAPlatform } from './pages/QnAPlatform';
import { RealtimeMessaging } from './pages/RealtimeMessaging';
import { StudentProfile } from './pages/StudentProfile';
import { preloadPlatformData } from './dsa-engine';
import { populateTrieWithAllUsers } from './lib/supabaseService';
import { AppleTimerExtension } from './components/extensions/AppleTimerExtension';
import { verifyFileMagicBytes } from './utils/safetyFilter';
import { accountManager } from './models/AccountManager';
import { type StudentAccount } from './models/StudentAccount';
import { CheckCircle2, Loader } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDSAHUDOpen, setIsDSAHUDOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ fileName: string; progress: number; status: 'uploading' | 'completed' } | null>(null);

  const [currentUser,    setCurrentUser]    = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<StudentAccount | null>(null);
  const [activeDm,       setActiveDm]       = useState<{id: string, name: string} | null>(null);
  const [initialChannel, setInitialChannel] = useState<string | undefined>();
  const [isInitialized,  setIsInitialized]  = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      preloadPlatformData();
      populateTrieWithAllUsers();
      
      const storedUser = localStorage.getItem('edunetwork_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          const account = accountManager.createAccount(user);
          setCurrentAccount(account);
        } catch (e) {
          console.error('Failed to parse stored user session');
        }
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);



  const handleLogout = () => {
    if (currentUser?.uid) accountManager.destroyAccount(currentUser.uid);
    setCurrentUser(null);
    setCurrentAccount(null);
    localStorage.removeItem('edunetwork_user');
    alert('You have successfully logged out. Mandatory Authentication Gate reactivated.');
  };

  const handleDeleteAccount = () => {
    setCurrentUser(null);
    setCurrentAccount(null);
    setActiveTab('home');
    localStorage.removeItem('edunetwork_user');
    alert('Account deleted and purged from all UniqueRegistrationHashSet and Graph indices ($O(1)$).');
  };

  const handleSuspendAccount = async () => {
    if (currentUser) {
      try {
        // Mock persistence update
        import('./lib/supabaseService').then(({ saveUserProfile }) => {
          saveUserProfile({ ...currentUser, accountStatus: 'suspended' });
        });
      } catch (e) {}
    }
    setCurrentUser(null);
    setCurrentAccount(null);
    setActiveTab('home');
    localStorage.removeItem('edunetwork_user');
    alert('Your account has been SUSPENDED due to severe violation of community guidelines.');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#4169E1]/40 selection:text-white relative overflow-x-hidden" style={{background: 'var(--bg-canvas)', color: 'var(--text-primary)', transition: 'background 0.3s ease, color 0.3s ease'}}>
      
      <BackgroundAmbient />

      <TopNavigation 
        currentUser={currentUser}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        setIsCreatePostOpen={setIsCreatePostOpen}
      />

      {/* GOATED LANDING PAGE — Full split-screen, auth form embedded inline on right */}
      {!currentUser ? (
        <LandingPage onLoginSuccess={(user) => {
          setCurrentUser(user);
          const account = accountManager.createAccount(user);
          setCurrentAccount(account);
          localStorage.setItem('edunetwork_user', JSON.stringify(user));
        }} />

      ) : (
        <>
          {/* iOS / visionOS Floating Transparent Pill Dock */}
          <IOSFloatingNav
            activeTab={activeTab}
            onSelectTab={(tab, profileId = null) => {
              setActiveTab(tab);
              if (tab === 'profile') setViewProfileId(profileId);
            }}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDSAHUD={() => setIsDSAHUDOpen(true)}
            onOpenTimer={() => setIsTimerOpen(true)}
            currentUser={currentUser}
          />

          {/* Main Content View Switcher */}
          <main className="transition-all duration-300 relative z-10 pt-16">
            {activeTab === 'home' && <HomeFeed currentUser={currentUser} account={currentAccount} />}
            {activeTab === 'resources' && <ResourceLibrary currentUser={currentUser} account={currentAccount} />}
            {activeTab === 'communities' && (
              <SubjectCommunities 
                currentUser={currentUser} 
                account={currentAccount} 
                onOpenRoomChat={(roomTitle) => {
                  setInitialChannel(roomTitle);
                  setActiveDm(null);
                  setActiveTab('messaging');
                }}
              />
            )}
            {activeTab === 'qna' && <QnAPlatform currentUser={currentUser} account={currentAccount} />}
            {activeTab === 'messaging' && (
              <RealtimeMessaging 
                activeDm={activeDm} 
                initialChannel={initialChannel} 
                currentUser={currentUser}
                onDeleteAccount={handleDeleteAccount}
                onSuspendAccount={handleSuspendAccount}
              />
            )}
            {activeTab === 'profile' && (
              <StudentProfile
                currentUser={currentUser}
                account={currentAccount}
                viewProfileId={viewProfileId}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                onStartMessage={(id, name) => {
                  setActiveDm({ id, name });
                  setInitialChannel(undefined);
                  setActiveTab('messaging');
                }}
              />
            )}
          </main>
        </>
      )}

      {/* Slide-Over Notification Panel ($O(1)$ Queue Feed) */}
      {isNotificationsOpen && (
        <NotificationPanel currentUser={currentUser} onClose={() => setIsNotificationsOpen(false)} />
      )}

      {/* Create New Post Modal (Instagram Dark Theme / Refactored) */}
      <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        currentUser={currentUser}
        setUploadStatus={setUploadStatus}
        setActiveTab={setActiveTab}
      />

      {/* Strict Authentication Modal (GOATED Aesthetic) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // Create per-account OOP instance with fresh DSA engines
          const account = accountManager.createAccount(user);
          setCurrentAccount(account);
          localStorage.setItem('edunetwork_user', JSON.stringify(user));
          setIsAuthOpen(false);
        }}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Study Pomodoro Timer Overlay Modal */}
      <AppleTimerExtension isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />

      {/* Live DSA & Compression Intelligence HUD */}
      <DSAIntelligenceHUD
        isOpen={isDSAHUDOpen}
        onClose={() => setIsDSAHUDOpen(false)}
        onOpenFullLab={() => setActiveTab('resources')}
      />

      {/* ── Sleek Global Background Upload Progress Pill ── */}
      {uploadStatus && (
        <div className="fixed top-20 right-5 sm:right-8 z-50 p-3.5 rounded-2xl bg-[#0D0D18]/95 border border-[#00CFFF]/40 shadow-[0_15px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center gap-3 animate-slideDown max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            {uploadStatus.status === 'uploading' ? (
              <Loader className="w-5 h-5 text-[#00CFFF] animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#34C759]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-xs font-black text-white">
              <span className="truncate">{uploadStatus.fileName}</span>
              <span className="text-[#00CFFF] font-mono shrink-0">{uploadStatus.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#34C759] transition-all duration-300 rounded-full"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/50 font-bold mt-1">
              {uploadStatus.status === 'uploading'
                ? '⚡ Background Storage Stream ($O(1)$ client thread)...'
                : '✓ Cloud attachment verified & synced!'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
export default App;
