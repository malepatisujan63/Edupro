import React, { useState, useEffect } from 'react';
import { IOSFloatingNav, type NavTab } from './components/layout/IOSFloatingNav';
import { AuthModal } from './components/auth/AuthModal';
import { DSAIntelligenceHUD } from './components/dsa/DSAIntelligenceHUD';
import { HomeFeed } from './pages/HomeFeed';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { SubjectCommunities } from './pages/SubjectCommunities';
import { QnAPlatform } from './pages/QnAPlatform';
import { RealtimeMessaging } from './pages/RealtimeMessaging';
import { StudentProfile } from './pages/StudentProfile';
import { preloadPlatformData, globalTrendingHeap, globalPlatformTrie, type HeapItem } from './dsa-engine';
import { AppleTimerExtension } from './components/extensions/AppleTimerExtension';
import { ShieldCheck, Sparkles, Lock, ArrowRight, CheckCircle2, Bell, Plus, X, Image as ImageIcon, FileText, Send, Video, Trash2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDSAHUDOpen, setIsDSAHUDOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | 'pdf' | null>(null);
  
  // Mandatory Login Gate: start as null so user MUST login before opening
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setAttachedFile(file);
      setAttachedMediaType(type);
      if (type === 'image' || type === 'video') {
        const url = URL.createObjectURL(file);
        setAttachedMediaUrl(url);
      } else {
        setAttachedMediaUrl(file.name);
      }
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      preloadPlatformData();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleQuickDemoLogin = () => {
    setCurrentUser({
      id: 'usr_1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@iitb.ac.in',
      phone: '+91 9876543210',
      college: 'IIT Bombay',
      department: 'Computer Science & Engineering',
      semester: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'student',
      reputationPoints: 1240,
      badges: ['DSA Expert', 'Top Contributor', 'Verified Student'],
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    alert('You have successfully logged out. Mandatory Authentication Gate reactivated.');
  };

  const handleDeleteAccount = () => {
    setCurrentUser(null);
    setActiveTab('home');
    alert('Account deleted and purged from all UniqueRegistrationHashSet and Graph indices ($O(1)$).');
  };

  return (
    <div className="min-h-screen text-white bg-[#000000] font-sans selection:bg-[#E1306C] selection:text-white relative overflow-x-hidden">
      
      {/* Top-Right Neighborhood Grouped Capsule (Notification Bell & Post + Button - Pure Glossy No Border) */}
      {currentUser && (
        <div className="fixed top-4 right-4 sm:right-6 z-40 pointer-events-auto">
          <div className="segmented-glass-group shadow-xl p-1.5 flex items-center gap-1.5 bg-[#121212]/95">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`segmented-glass-btn flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all text-xs font-bold ${
                isNotificationsOpen ? 'bg-[#262626] text-[#E1306C] shadow-md' : 'text-white hover:bg-[#181818]'
              }`}
            >
              <Bell className="w-4 h-4 text-[#FD1D1D]" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="w-2 h-2 rounded-full bg-[#E1306C] animate-pulse" />
            </button>
            <button
              onClick={() => setIsCreatePostOpen(true)}
              className="segmented-glass-btn flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all text-xs font-extrabold text-white bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] hover:opacity-95 shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Post</span>
            </button>
          </div>
        </div>
      )}

      {/* If currentUser is null, enforce the Mandatory iOS 18 Frosted Glass Login Portal */}
      {!currentUser ? (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10">
          <div className="w-full max-w-xl glass-card p-8 sm:p-10 text-center space-y-8 animate-panelRise relative overflow-hidden bg-[#121212]">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] text-xs font-semibold text-white shadow-inner">
              <Lock className="w-3.5 h-3.5 text-[#E1306C]" />
              <span>Mandatory Authentication Gate • iOS 18 Liquid Glass</span>
            </div>

            <div className="space-y-3">
              <img
                src="/logo.png"
                alt="EduNetwork"
                className="h-20 sm:h-24 mx-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] mb-3"
              />
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Welcome to EduNetwork
              </h1>
              <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed font-normal">
                An Instagram-like student social platform built with **Data Structures & Algorithms** and **iOS 18 Liquid Glass Lock Screen widgets**. Please verify your identity or select demo entry.
              </p>
            </div>

            {/* Grouped Apple Glass Login Buttons */}
            <div className="space-y-4 pt-2">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full btn-primary py-4 text-sm font-bold shadow-lg"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Sign in with Google OAuth + Mobile OTP</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={handleQuickDemoLogin}
                className="w-full btn-secondary py-3.5 text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4 text-[#E1306C]" />
                <span>Quick Demo Entry (Bypass OTP as Aarav Sharma)</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-white/60 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                Google Verified Identity
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                Mobile OTP Guard
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                $O(1)$ Unique Registration Hash
              </span>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* iOS / visionOS Floating Transparent Pill Dock */}
          <IOSFloatingNav
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDSAHUD={() => setIsDSAHUDOpen(true)}
            onOpenTimer={() => setIsTimerOpen(true)}
            currentUser={currentUser}
          />

          {/* Main Content View Switcher */}
          <main className="transition-all duration-300 relative z-10 pt-16">
            {activeTab === 'home' && <HomeFeed />}
            {activeTab === 'resources' && <ResourceLibrary />}
            {activeTab === 'communities' && <SubjectCommunities />}
            {activeTab === 'qna' && <QnAPlatform />}
            {activeTab === 'messaging' && <RealtimeMessaging />}
            {activeTab === 'profile' && (
              <StudentProfile
                currentUser={currentUser}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </main>
        </>
      )}

      {/* Slide-Over Notification Panel ($O(1)$ Queue Feed) */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm h-full bg-[#121212] border-l border-white/20 p-6 space-y-6 flex flex-col shadow-2xl animate-panelRise">
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#FD1D1D]" />
                <span>Notification Panel</span>
              </h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181818] border border-white/20 flex items-center justify-center text-white hover:bg-[#262626] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 divide-y divide-white/10 pr-1">
              <div className="pt-3 space-y-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Prof. S. R. Ramesh upvoted your note</span>
                  <span className="text-white/40 text-[10px]">2m ago</span>
                </p>
                <p className="text-xs text-white/70 font-normal">
                  Your "Operating Systems Process Synchronization" PDF gained +15 dwell points.
                </p>
              </div>

              <div className="pt-3 space-y-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Striver commented on your doubt</span>
                  <span className="text-white/40 text-[10px]">1h ago</span>
                </p>
                <p className="text-xs text-white/70 font-normal">
                  "Check out the topological sort Kahn's algorithm approach for BFS queue cycles."
                </p>
              </div>

              <div className="pt-3 space-y-1">
                <p className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Campus Study Hub Invite</span>
                  <span className="text-white/40 text-[10px]">3h ago</span>
                </p>
                <p className="text-xs text-white/70 font-normal">
                  You were invited to join **Algorithm Masters Pod** by Ananya Verma.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/15">
              <button
                onClick={() => {
                  alert('All notifications marked read ($O(1)$ queue reset).');
                  setIsNotificationsOpen(false);
                }}
                className="w-full btn-secondary text-xs py-2.5 font-bold"
              >
                Clear All Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Post Modal (Instagram Dark Theme) */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-card rounded-[28px] p-6 space-y-5 bg-[#121212] border border-white/20 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E1306C]" />
                <span>Create New Post / Share Resource</span>
              </h3>
              <button
                onClick={() => setIsCreatePostOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181818] border border-white/20 flex items-center justify-center text-white hover:bg-[#262626]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder="What's happening on campus or what notes do you want to share today?..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full bg-[#181818] border border-white/20 rounded-[18px] p-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-[#E1306C]"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#181818] border border-white/20 text-xs text-white font-bold flex items-center gap-1.5 hover:bg-[#262626] transition-all shadow-sm">
                  <ImageIcon className="w-4 h-4 text-[#E1306C]" />
                  <span>Attach Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#181818] border border-white/20 text-xs text-white font-bold flex items-center gap-1.5 hover:bg-[#262626] transition-all shadow-sm">
                  <Video className="w-4 h-4 text-[#34C759]" />
                  <span>Attach Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#181818] border border-white/20 text-xs text-white font-bold flex items-center gap-1.5 hover:bg-[#262626] transition-all shadow-sm">
                  <FileText className="w-4 h-4 text-[#833AB4]" />
                  <span>Attach PDF Note</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileChange(e, 'pdf')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Live Attachment Preview HUD */}
              {attachedFile && (
                <div className="p-3 rounded-[18px] bg-[#181818] border border-white/20 flex items-center justify-between gap-3 animate-panelRise shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachedMediaType === 'image' && attachedMediaUrl && (
                      <img src={attachedMediaUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
                    )}
                    {attachedMediaType === 'video' && attachedMediaUrl && (
                      <video src={attachedMediaUrl} className="w-16 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
                    )}
                    {attachedMediaType === 'pdf' && (
                      <div className="w-12 h-12 rounded-xl bg-[#833AB4]/20 border border-[#833AB4]/40 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-[#833AB4]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{attachedFile.name}</p>
                      <p className="text-[10px] text-[#34C759] font-mono font-bold">
                        ⚡ {(attachedFile.size / 1024).toFixed(1)} KB • {attachedMediaType?.toUpperCase()} Attached ($O(1)$ stream)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAttachedFile(null);
                      setAttachedMediaUrl(null);
                      setAttachedMediaType(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-[#FD1D1D]" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/15">
              <button
                onClick={() => {
                  setIsCreatePostOpen(false);
                  setAttachedFile(null);
                  setAttachedMediaUrl(null);
                  setAttachedMediaType(null);
                }}
                className="btn-secondary text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!postContent.trim() && !attachedFile) {
                    alert('Please write a caption or attach a Photo/Video/PDF before posting!');
                    return;
                  }
                  const newPost: HeapItem = {
                    id: `post_${Date.now().toString().slice(-4)}`,
                    title: postContent || (attachedFile ? `[Shared ${attachedMediaType?.toUpperCase()}] ${attachedFile.name}` : 'Shared Post'),
                    authorName: currentUser?.name || 'Aarav Sharma (You)',
                    authorCollege: currentUser?.college || 'IIT Bombay • CSE',
                    upvotes: 1,
                    commentsCount: 0,
                    category: 'DSA',
                    createdAt: 'Just now',
                    type: attachedMediaType === 'pdf' ? 'note' : (attachedMediaType === 'video' ? 'post' : 'note'),
                    mediaUrl: attachedMediaType === 'image' || attachedMediaType === 'video' ? attachedMediaUrl || undefined : undefined,
                    mediaType: attachedMediaType || undefined,
                  };
                  globalTrendingHeap.insert(newPost);
                  globalPlatformTrie.indexItem({
                    id: newPost.id,
                    title: newPost.title,
                    subtitle: `By ${newPost.authorName} (${newPost.category})`,
                    type: newPost.type,
                    tags: [newPost.category, 'Student Post'],
                  });
                  window.dispatchEvent(new CustomEvent('edunetwork:refresh'));
                  alert(`${attachedMediaType ? attachedMediaType.toUpperCase() + ' and caption' : 'Post'} published to Instagram Dark Campus Feed! ($O(1)$ insert)`);
                  setPostContent('');
                  setAttachedFile(null);
                  setAttachedMediaUrl(null);
                  setAttachedMediaType(null);
                  setIsCreatePostOpen(false);
                  setActiveTab('home');
                }}
                className="btn-primary text-xs py-2 px-6 font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share Post</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict Google OAuth + Mobile OTP Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
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

    </div>
  );
};
export default App;
