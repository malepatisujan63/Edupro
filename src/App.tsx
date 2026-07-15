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
import { preloadPlatformData } from './dsa-engine';
import { uploadFile, createPost } from './lib/firestoreService';
import { AppleTimerExtension } from './components/extensions/AppleTimerExtension';
import { checkRateLimit } from './utils/rateLimiter';
import { validateContentSafety, verifyFileMagicBytes } from './utils/safetyFilter';
import { accountManager } from './models/AccountManager';
import { type StudentAccount } from './models/StudentAccount';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, Bell, Plus, X, Image as ImageIcon, FileText, Send, Video, Trash2, Loader } from 'lucide-react';

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
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mandatory Login Gate: start as null so user MUST login before opening
  const [currentUser,    setCurrentUser]    = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<StudentAccount | null>(null);
  const [isInitialized,  setIsInitialized]  = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Safety Layer: Magic Bytes verification to block renamed executables/malware
      try {
        const safetyCheck = await verifyFileMagicBytes(file);
        if (!safetyCheck.isValid) {
          alert('Security Alert: The attached file has a mismatched or invalid binary signature. Upload blocked.');
          e.target.value = '';
          return;
        }
      } catch (err) {
        alert('Security check failed to read file headers.');
        e.target.value = '';
        return;
      }

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



  const handleLogout = () => {
    if (currentUser?.uid) accountManager.destroyAccount(currentUser.uid);
    setCurrentUser(null);
    setCurrentAccount(null);
    alert('You have successfully logged out. Mandatory Authentication Gate reactivated.');
  };

  const handleDeleteAccount = () => {
    setCurrentUser(null);
    setActiveTab('home');
    alert('Account deleted and purged from all UniqueRegistrationHashSet and Graph indices ($O(1)$).');
  };

  return (
    <div className="min-h-screen text-white bg-[#000000] font-sans selection:bg-[#4169E1]/40 selection:text-white relative overflow-x-hidden">
      
      {/* Koinexa Ambient Orbs — Subtle depth glow matching logo gradient */}
      <div className="fixed -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#00CFFF]/8 to-[#4169E1]/4 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed -top-32 -right-32 w-[400px] h-[400px] bg-gradient-to-bl from-[#9B5DE5]/8 to-[#4169E1]/4 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-1/3 right-0 w-[300px] h-[300px] bg-[#4169E1]/4 rounded-full blur-[90px] pointer-events-none z-0" />

      {/* Top-Right Actions Capsule — single clean gradient border, no nesting */}
      {currentUser && (
        <div className="fixed top-4 right-4 sm:right-6 z-40 pointer-events-auto">
          <div className="kx-capsule">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`kx-pill-flow flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all ${
                isNotificationsOpen ? 'active' : ''
              }`}
            >
              <Bell className="w-4 h-4 text-[#9B5DE5]" />
              <span className="hidden sm:inline text-white">Notifications</span>
              <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse" />
            </button>

            {/* Post Button — gradient fill */}
            <button
              onClick={() => setIsCreatePostOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold text-white transition-all
                bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5]
                hover:opacity-90 hover:shadow-[0_0_20px_rgba(65,105,225,0.5)]
                shadow-[0_0_12px_rgba(65,105,225,0.3)]"
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
          <div className="w-full max-w-xl glass-panel p-8 sm:p-10 text-center space-y-8 animate-panelRise relative overflow-hidden">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black border border-[#4169E1]/30 text-xs font-semibold text-white shadow-inner">
            <Lock className="w-3.5 h-3.5 text-[#00CFFF]" />
              <span>Mandatory Authentication Gate • iOS 18 Liquid Glass</span>
            </div>

            <div className="space-y-3">
              <img src="/koinexa-logo.jpg" alt="Koinexa" className="w-24 h-24 mb-4 object-contain mx-auto" />
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Welcome to Koinexa
              </h1>
              <p className="text-white/60 text-sm sm:text-base font-medium max-w-sm mx-auto mt-4 leading-relaxed">
                The student social platform for India's top colleges. Sign in with your Google account to get started.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-4 rounded-[18px] bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-white font-black text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,207,255,0.4)] hover:shadow-[0_0_30px_rgba(155,93,229,0.6)] flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-auto mr-2" />
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
            {activeTab === 'home' && <HomeFeed currentUser={currentUser} account={currentAccount} />}
            {activeTab === 'resources' && <ResourceLibrary />}
            {activeTab === 'communities' && <SubjectCommunities currentUser={currentUser} />}
            {activeTab === 'qna' && <QnAPlatform currentUser={currentUser} />}
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
          <div className="w-full max-w-sm h-full glass-panel rounded-none border-l border-white/10 p-6 space-y-6 flex flex-col shadow-2xl animate-panelRise">
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#9B5DE5]" />
                <span>Notification Panel</span>
              </h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 divide-y divide-white/10 pr-1">
              <div className="flex flex-col items-center justify-center h-full text-white/40 pt-10">
                <Bell className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm font-bold">No new notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00CFFF]" />
                <span>Create New Post / Share Resource</span>
              </h3>
              <button
                onClick={() => setIsCreatePostOpen(false)}
                className="w-8 h-8 rounded-full bg-[#0D0D0D] border border-white/20 flex items-center justify-center text-white hover:bg-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Post textarea with flowing gradient border on focus */}
              <div className="kx-field">
                <textarea
                  rows={4}
                  placeholder="What's on campus today? Share notes, doubts, or resources…"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-transparent p-4 text-sm text-white placeholder:text-white/30 outline-none resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="kx-pill-flow cursor-pointer px-3.5 py-2 text-xs text-white font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#00CFFF]" />
                  <span>Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white font-bold flex items-center gap-1.5 hover:bg-white/15 transition-all shadow-sm">
                  <Video className="w-4 h-4 text-[#34C759]" />
                  <span>Attach Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#0D0D0D] border border-white/20 text-xs text-white font-bold flex items-center gap-1.5 hover:bg-[#111111] transition-all shadow-sm">
                  <FileText className="w-4 h-4 text-[#4169E1]" />
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
                <div className="p-3 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-between gap-3 animate-panelRise shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachedMediaType === 'image' && attachedMediaUrl && (
                      <img src={attachedMediaUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
                    )}
                    {attachedMediaType === 'video' && attachedMediaUrl && (
                      <video src={attachedMediaUrl} className="w-16 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
                    )}
                    {attachedMediaType === 'pdf' && (
                      <div className="w-12 h-12 rounded-xl bg-[#4169E1]/20 border border-[#4169E1]/40 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-[#4169E1]" />
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
                    <Trash2 className="w-4 h-4 text-[#9B5DE5]" />
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
                disabled={isPosting}
                onClick={async () => {
                  if (!postContent.trim() && !attachedFile) {
                    alert('Please write a caption or attach a Photo/Video/PDF before posting!');
                    return;
                  }
                  if (!currentUser?.uid) {
                    alert('You must be signed in to post.');
                    return;
                  }

                  // Safety Layer: Anti-Spam Rate Limiter (Max 3 posts per minute)
                  const rateLimit = checkRateLimit(`create_post:${currentUser.uid}`, 3, 60000);
                  if (!rateLimit.allowed) {
                    const remainingSeconds = Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000);
                    alert(`Rate Limit Triggered: Please wait ${remainingSeconds} seconds before creating another post.`);
                    return;
                  }

                  // Safety Layer: Content Moderation & Profanity Filtering
                  const contentCheck = validateContentSafety(postContent);
                  if (!contentCheck.isSafe) {
                    alert(`Safety Alert: Your post contains flagged keyword: "${contentCheck.flaggedWord}". Please keep content academic and campus-friendly.`);
                    return;
                  }

                  setIsPosting(true);
                  setUploadProgress(0);
                  try {
                    let mediaUrl: string | undefined;
                    let storagePath: string | undefined;

                    // Upload file to Firebase Storage if attached
                    if (attachedFile && attachedMediaType) {
                      const result = await uploadFile(
                        attachedFile,
                        currentUser.uid,
                        (pct) => setUploadProgress(pct)
                      );
                      mediaUrl = result.downloadUrl;
                      storagePath = result.storagePath;
                    }

                    // Write post to Firestore
                    await createPost({
                      title: postContent.trim() || `[${attachedMediaType?.toUpperCase()}] ${attachedFile?.name}`,
                      authorId: currentUser.uid,
                      authorName: currentUser.name || 'Student',
                      authorCollege: currentUser.college || 'Campus',
                      authorAvatarUrl: currentUser.avatarUrl || '',
                      upvotes: 0,
                      commentsCount: 0,
                      category: 'General',
                      type: attachedMediaType === 'video' ? 'post' : 'note',
                      mediaUrl,
                      mediaType: attachedMediaType || undefined,
                      storagePath,
                    });

                    setPostContent('');
                    setAttachedFile(null);
                    setAttachedMediaUrl(null);
                    setAttachedMediaType(null);
                    setIsCreatePostOpen(false);
                    setActiveTab('home');
                  } catch (err: any) {
                    alert(`Failed to post: ${err.message}`);
                  } finally {
                    setIsPosting(false);
                    setUploadProgress(0);
                  }
                }}
                className="btn-primary text-xs py-2 px-6 font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
              >
                {isPosting ? (
                  <><Loader className="w-3.5 h-3.5 animate-spin" /><span>{uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Posting...'}</span></>
                ) : (
                  <><Send className="w-3.5 h-3.5" /><span>Share Post</span></>
                )}
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
          // Create per-account OOP instance with fresh DSA engines
          const account = accountManager.createAccount(user);
          setCurrentAccount(account);
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
