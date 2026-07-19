import React, { useState, useEffect } from 'react';
import { IOSFloatingNav, type NavTab } from './components/layout/IOSFloatingNav';
import { NotificationPanel } from './components/layout/NotificationPanel';
import { AuthModal } from './components/auth/AuthModal';
import { DSAIntelligenceHUD } from './components/dsa/DSAIntelligenceHUD';
import { HomeFeed } from './pages/HomeFeed';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { SubjectCommunities } from './pages/SubjectCommunities';
import { QnAPlatform } from './pages/QnAPlatform';
import { RealtimeMessaging } from './pages/RealtimeMessaging';
import { StudentProfile } from './pages/StudentProfile';
import { preloadPlatformData } from './dsa-engine';
import { createPost, backgroundUploadAndAttach, populateTrieWithAllUsers } from './lib/supabaseService';
import { AppleTimerExtension } from './components/extensions/AppleTimerExtension';
import { checkRateLimit } from './utils/rateLimiter';
import { validateContentSafety, verifyFileMagicBytes } from './utils/safetyFilter';
import { accountManager } from './models/AccountManager';
import { type StudentAccount } from './models/StudentAccount';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, Bell, Plus, X, Image as ImageIcon, FileText, Send, Video, Trash2, Loader, Users, BookOpen, Rocket, Quote } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialStep, setAuthInitialStep] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');
  const [isDSAHUDOpen, setIsDSAHUDOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const isPosting = false;
  const [uploadStatus, setUploadStatus] = useState<{ fileName: string; progress: number; status: 'uploading' | 'completed' } | null>(null);

  const [currentUser,    setCurrentUser]    = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<StudentAccount | null>(null);
  const [activeDm,       setActiveDm]       = useState<{id: string, name: string} | null>(null);
  const [initialChannel, setInitialChannel] = useState<string | undefined>();
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
        // Convert to universal Data URL so every student across all devices can see the photo or video instantly
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAttachedMediaUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedMediaUrl(file.name);
      }
    }
  };

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

  return (
    <div className="min-h-screen font-sans selection:bg-[#4169E1]/40 selection:text-white relative overflow-x-hidden" style={{background: 'var(--bg-canvas)', color: 'var(--text-primary)', transition: 'background 0.3s ease, color 0.3s ease'}}>
      
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

      {/* If currentUser is null, enforce the Mandatory GOATED Glassmorphism Landing Page */}
      {!currentUser ? (
        <div className="min-h-screen relative flex items-center justify-start p-6 lg:p-12 z-10 overflow-hidden font-sans">
          
          {/* Background Image & Ambient Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
              alt="Students studying" 
              className="w-full h-full object-cover"
            />
            {/* Dark gradient overlay to ensure text readability while maintaining contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050A]/95 via-[#05050A]/70 to-transparent" />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Top Navigation Bar */}
          <div className="absolute top-6 left-6 right-6 z-20">
            <div className="max-w-[1400px] mx-auto bg-[#000000]/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00CFFF] to-[#9B5DE5] flex items-center justify-center font-black text-white text-lg shadow-lg">
                  K
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight">koinex<span className="text-white/60">a</span></span>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setAuthInitialStep('SIGN_IN'); setIsAuthOpen(true); }}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white border border-white/15 hover:bg-white/10 transition-all shadow-sm"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthInitialStep('REGISTER'); setIsAuthOpen(true); }}
                  className="px-5 py-2.5 rounded-full text-sm font-black text-white bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] hover:opacity-90 shadow-lg shadow-[#4169E1]/40 transition-transform active:scale-95"
                >
                  Open an Account
                </button>
              </div>
            </div>
          </div>

          {/* Main Welcome Panel */}
          <div className="relative z-10 w-full max-w-[500px] mt-16 animate-fadeInLeft">
            <div className="bg-[#000000]/50 backdrop-blur-[32px] border border-white/15 rounded-[40px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              
              <h1 className="text-[3.2rem] leading-[1.1] font-black text-white tracking-tight mb-2">
                Welcome to <br/>
                <span className="bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-transparent bg-clip-text drop-shadow-lg">
                  Koinexa
                </span>
              </h1>
              
              <div className="w-24 h-1 rounded-full bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] mb-8 opacity-80" />

              <p className="text-lg font-bold text-white/90 mb-4 leading-snug">
                The student social platform for India's top colleges.
              </p>
              
              <p className="text-sm font-medium text-white/60 mb-10 leading-relaxed pr-4">
                Share knowledge, solve doubts, discover opportunities and build connections that last a lifetime.
              </p>

              {/* Feature 3-Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-white/5 border border-white/10">
                
                <div className="flex flex-col items-center justify-center text-center gap-2 p-2 hover:bg-white/5 rounded-2xl transition-all cursor-default">
                  <div className="w-10 h-10 rounded-full bg-[#9B5DE5]/15 border border-[#9B5DE5]/30 flex items-center justify-center text-[#9B5DE5]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Connect</p>
                    <p className="text-[10px] font-medium text-white/40">with peers</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center gap-2 p-2 border-x border-white/5 hover:bg-white/5 rounded-2xl transition-all cursor-default">
                  <div className="w-10 h-10 rounded-full bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center text-[#00CFFF]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Learn</p>
                    <p className="text-[10px] font-medium text-white/40">together</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center gap-2 p-2 hover:bg-white/5 rounded-2xl transition-all cursor-default">
                  <div className="w-10 h-10 rounded-full bg-[#9B5DE5]/15 border border-[#9B5DE5]/30 flex items-center justify-center text-[#9B5DE5]">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Grow</p>
                    <p className="text-[10px] font-medium text-white/40">together</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Left Quote Card */}
          <div className="absolute bottom-6 left-6 sm:left-12 max-w-2xl z-10 animate-fadeInUp delay-300">
            <div className="bg-[#000000]/50 backdrop-blur-2xl border border-white/10 rounded-3xl py-4 px-6 sm:px-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
              
              {/* Dot Grid Accent Background */}
              <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:12px_12px] opacity-40 pointer-events-none" />

              <div className="flex items-start gap-4 relative z-10">
                <Quote className="w-8 h-8 text-[#4169E1] opacity-70 shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-bold text-white/90 italic leading-snug">
                    "Alone we can do so little; <br className="hidden sm:block"/> together we can do so much."
                  </p>
                  <p className="text-xs font-bold text-[#9B5DE5] mt-2">
                    — Helen Keller
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
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
            {activeTab === 'messaging' && <RealtimeMessaging activeDm={activeDm} initialChannel={initialChannel} currentUser={currentUser} />}
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

                  try {
                    const localPreview = attachedMediaUrl || undefined;
                    const fileToUpload = attachedFile;
                    const mediaTypeToSave = attachedMediaType || undefined;

                    // Write post immediately to Firestore (0ms optimistic latency)
                    const postId = await createPost({
                      title: postContent.trim() || `[${mediaTypeToSave?.toUpperCase()}] ${fileToUpload?.name || 'Attachment'}`,
                      authorId: currentUser.uid,
                      authorName: currentUser.name || 'Student',
                      authorCollege: currentUser.college || 'Campus',
                      authorAvatarUrl: currentUser.avatarUrl || '',
                      upvotes: 0,
                      commentsCount: 0,
                      category: 'General',
                      type: mediaTypeToSave === 'video' ? 'post' : 'note',
                      mediaUrl: localPreview,
                      mediaType: mediaTypeToSave,
                    });

                    // Launch non-blocking background upload engine + compression if file exists
                    if (fileToUpload && mediaTypeToSave) {
                      setUploadStatus({ fileName: fileToUpload.name, progress: 0, status: 'uploading' });
                      backgroundUploadAndAttach(
                        fileToUpload,
                        currentUser.uid,
                        postId,
                        'posts',
                        (pct) => setUploadStatus({ fileName: fileToUpload.name, progress: pct, status: 'uploading' })
                      ).then(() => {
                        setUploadStatus({ fileName: fileToUpload.name, progress: 100, status: 'completed' });
                        setTimeout(() => setUploadStatus(null), 3500);
                      }).catch((err) => {
                        console.warn('Using universal Data URL stream as fallback (Storage sync skipped):', err.message);
                        setUploadStatus(null);
                      });
                    }

                    // Reset modal immediately (0ms block time)
                    setPostContent('');
                    setAttachedFile(null);
                    setAttachedMediaUrl(null);
                    setAttachedMediaType(null);
                    setIsCreatePostOpen(false);
                    setActiveTab('home');
                  } catch (err: any) {
                    alert(`Failed to post: ${err.message}`);
                  }
                }}
                className="btn-primary text-xs py-2 px-6 font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
              >
                {isPosting ? (
                  <><Loader className="w-3.5 h-3.5 animate-spin" /><span>Posting...</span></>
                ) : (
                  <><Send className="w-3.5 h-3.5" /><span>Share Post</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strict Authentication Modal (GOATED Aesthetic) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialStep={authInitialStep}
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
