import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Rocket, Mail, Lock, Eye, EyeOff, Loader, 
  AlertTriangle, CheckCircle2, ArrowRight, User, Github, Menu, 
  X, Check, Scan, Smartphone, Monitor, ChevronLeft
} from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/supabaseService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';
import { KoinexaLogo } from '../common/KoinexaLogo';

interface LandingPageProps { onLoginSuccess: (user: any) => void; }
type AuthView = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State (Multi-step)
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  
  const [studentType, setStudentType] = useState<'school' | 'college' | ''>('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState(1);
  const [schoolClass, setSchoolClass] = useState('');
  const [board, setBoard] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);

  // Auto-detect TV/Large screen mode (optional feature for presentation)
  useEffect(() => {
    const checkScreen = () => {
      // Just for demonstration, if screen is massive, we can toggle it, but let's keep it manual or via a hotkey for now.
    };
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const go = (v: AuthView) => { 
    setView(v); 
    setErrorMsg(''); 
    setRegStep(1);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const user = await fetchUserProfileByEmail(email.trim().toLowerCase());
      if (!user) { setErrorMsg('No account found with that email.'); return; }
      if (user.accountStatus === 'suspended') { setErrorMsg('Your account is suspended.'); return; }
      if (!await verifyPassword(password, user.password)) { setErrorMsg('Incorrect password.'); return; }
      onLoginSuccess(user);
    } catch (e: any) { setErrorMsg(e.message || 'Login failed.'); }
    finally { setIsLoading(false); }
  };

  const handleRegisterNext = async () => {
    if (regStep === 1) {
      if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPass) { setErrorMsg('Please fill all fields.'); return; }
      if (regPass.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
      if (regPass !== regConfirm) { setErrorMsg('Passwords do not match.'); return; }
      setIsLoading(true); setErrorMsg('');
      try {
        if (await fetchUserProfileByEmail(regEmail.trim().toLowerCase())) { setErrorMsg('Email already registered.'); return; }
        setRegStep(2);
      } catch (e: any) { setErrorMsg(e.message); }
      finally { setIsLoading(false); }
    } else if (regStep === 2) {
      if (!studentType) { setErrorMsg('Please select your role.'); return; }
      setRegStep(3);
    } else if (regStep === 3) {
      setRegStep(4);
    } else if (regStep === 4) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true); setErrorMsg('');
    try {
      const uid = `usr_${Date.now()}`;
      const userEmail = regEmail.trim().toLowerCase();
      const pwd = await hashPassword(regPass);
      const pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=4169E1&color=fff`;
      const isSchool = studentType === 'school';
      
      const newUser = {
        uid, id: `usr_${Date.now().toString().slice(-6)}`,
        name: regName.trim(), email: userEmail, password: pwd, phone: '',
        studentType, college: isSchool ? '' : (collegeName || 'Koinexa Campus'),
        department: isSchool ? '' : (department || 'General'),
        semester: isSchool ? 0 : semester,
        schoolClass: isSchool ? schoolClass : '', board: isSchool ? board : '',
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        hobbies: [], studyMates: [], pendingStudyMateRequests: [], createdCommunities: [],
        avatarUrl: pic, role: 'student' as const, reputationPoints: 100,
        badges: ['Verified Student'], createdAt: new Date().toISOString(),
      };
      
      globalRegistrationHash.registerUser(userEmail, '', newUser);
      try { await saveUserProfile(newUser); } catch (e: any) { console.warn(e); }
      globalSocialGraph.addStudent(newUser);
      
      const loc = isSchool ? `${newUser.schoolClass} • ${newUser.board}` : `${newUser.college} • ${newUser.department}`;
      globalPlatformTrie.indexItem({ id: newUser.id, title: newUser.name, subtitle: loc, type: 'user', tags: [...newUser.badges, ...newUser.skills], avatarUrl: newUser.avatarUrl });
      
      setRegStep(5);
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 1500);
    } catch (e: any) { setErrorMsg(e.message || 'Registration failed.'); }
    finally { setIsLoading(false); }
  };

  /* ─ Render TV Mode ─ */
  if (isTVMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#05050A] text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4169E1]/10 via-[#05050A] to-[#05050A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#9B5DE5]/10 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-2 items-center gap-16">
          <div className="space-y-6 animate-slideInRight">
            <KoinexaLogo size="xl" className="mb-12" />
            <h1 className="text-5xl font-bold tracking-tight">Scan to login</h1>
            <p className="text-xl text-white/50 max-w-md leading-relaxed">
              Use the Koinexa mobile app to scan the QR code and sign in instantly.
            </p>
            <div className="flex items-center gap-8 pt-12 text-sm text-white/40 font-medium">
              <span className="flex items-center gap-2 hover:text-white/80 cursor-pointer transition-colors"><Monitor className="w-5 h-5" /> Having trouble?</span>
              <span className="flex items-center gap-2 hover:text-white/80 cursor-pointer transition-colors"><Smartphone className="w-5 h-5" /> Enter code</span>
            </div>
          </div>
          
          <div className="flex justify-center relative animate-panelRise">
            {/* Phone Mockup frame */}
            <div className="absolute w-[320px] h-[640px] rounded-[48px] border-[12px] border-[#1A1A24] bg-[#0A0A10] -z-10 shadow-2xl flex items-center justify-center overflow-hidden right-0 scale-90 translate-x-12 opacity-80">
               <div className="w-full h-full border border-white/5 rounded-[36px] p-6 relative">
                 <div className="w-40 h-7 bg-black rounded-b-3xl absolute top-0 left-1/2 -translate-x-1/2" />
                 <div className="mt-20 border-2 border-[#00CFFF]/50 border-dashed rounded-xl w-full aspect-square flex items-center justify-center relative">
                   <div className="w-4 h-4 border-t-2 border-l-2 border-[#00CFFF] absolute top-0 left-0" />
                   <div className="w-4 h-4 border-t-2 border-r-2 border-[#00CFFF] absolute top-0 right-0" />
                   <div className="w-4 h-4 border-b-2 border-l-2 border-[#00CFFF] absolute bottom-0 left-0" />
                   <div className="w-4 h-4 border-b-2 border-r-2 border-[#00CFFF] absolute bottom-0 right-0" />
                   <Scan className="w-12 h-12 text-[#00CFFF]/50" />
                 </div>
                 <p className="text-center text-xs text-white/40 mt-4">Place the QR code within the frame</p>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-[0_0_60px_rgba(65,105,225,0.2)] relative z-10 flex flex-col items-center gap-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=koinexa_login_${Date.now()}`} alt="QR Code" className="w-56 h-56 rounded-xl" />
              <div className="flex items-center gap-3 text-[#4169E1] font-semibold text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Waiting for scan...</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => setIsTVMode(false)} className="absolute top-8 right-8 text-white/30 hover:text-white">
          <X className="w-8 h-8" />
        </button>
      </div>
    );
  }

  /* ─ Render Input Field Helper ─ */
  const InputField = ({ icon, type = "text", placeholder, value, onChange, isPassword = false, onTogglePwd, showPwdFlag }: any) => (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#00CFFF] transition-colors">
        {icon}
      </div>
      <input
        type={isPassword ? (showPwdFlag ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-[#111116]/80 border border-white/[0.06] rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1]/50 focus:bg-[#151520] focus:ring-1 focus:ring-[#4169E1]/50 transition-all shadow-inner"
      />
      {isPassword && (
        <button type="button" onClick={onTogglePwd} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors">
          {showPwdFlag ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#030305] text-white font-sans selection:bg-[#4169E1]/30 selection:text-white overflow-x-hidden relative">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .glass-auth-card {
          background: rgba(14, 14, 20, 0.65);
          backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .text-gradient-purple {
          background: linear-gradient(135deg, #9B5DE5 0%, #4169E1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-gradient-auth {
          background: linear-gradient(135deg, #4169E1 0%, #9B5DE5 100%);
          box-shadow: 0 4px 14px rgba(65, 105, 225, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.2s ease;
        }
        .btn-gradient-auth:hover {
          box-shadow: 0 6px 20px rgba(155, 93, 229, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .social-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .step-circle {
          transition: all 0.3s ease;
        }
        .step-circle.active {
          background: #4169E1;
          border-color: #4169E1;
          box-shadow: 0 0 12px rgba(65,105,225,0.5);
        }
        .step-circle.completed {
          border-color: #4169E1;
          color: #4169E1;
        }
        /* Mobile fixes */
        @media (max-width: 768px) {
          .mobile-bg-blur {
            background: radial-gradient(circle at top, rgba(65, 105, 225, 0.15) 0%, transparent 60%);
          }
        }
      `}</style>

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {/* Gradients */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#4169E1]/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#9B5DE5]/10 blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#00CFFF]/5 blur-[150px]" />
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <header className="relative z-20 px-6 py-6 lg:px-12 lg:py-8 flex items-center justify-between">
        {view === 'login' ? (
          <KoinexaLogo size="md" />
        ) : (
          <button onClick={() => go('login')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <KoinexaLogo size="md" />
          </button>
        )}

        {/* Desktop Nav */}
        {view === 'login' && (
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8 text-sm font-medium text-white/60">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </nav>
            <button onClick={() => go('register')} className="px-5 py-2 rounded-lg bg-[#4169E1] text-white text-sm font-semibold hover:bg-[#3154C4] transition-colors shadow-[0_0_15px_rgba(65,105,225,0.3)]">
              Sign up
            </button>
          </div>
        )}

        {/* Auth Nav for Register view */}
        {view === 'register' && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-white/40">Already have an account?</span>
            <button onClick={() => go('login')} className="text-[#4169E1] font-semibold hover:text-white transition-colors">Log in</button>
          </div>
        )}

        {/* Mobile Hamburger */}
        <button className="md:hidden text-white/80" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[80px] left-0 w-full bg-[#0A0A10]/95 backdrop-blur-xl border-b border-white/5 z-30 p-6 flex flex-col gap-6 animate-fadeIn">
           <a href="#" className="text-lg font-medium text-white/80">About</a>
           <a href="#" className="text-lg font-medium text-white/80">Features</a>
           <a href="#" className="text-lg font-medium text-white/80">Contact</a>
           {view === 'login' ? (
             <button onClick={() => go('register')} className="w-full py-3 rounded-lg bg-[#4169E1] text-white font-semibold">Sign up</button>
           ) : (
             <button onClick={() => go('login')} className="w-full py-3 rounded-lg border border-white/10 text-white font-semibold">Log in</button>
           )}
           <button onClick={() => setIsTVMode(true)} className="flex items-center gap-2 text-sm text-white/40 mt-4"><Monitor className="w-4 h-4" /> TV Login</button>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-6 lg:px-12 pb-12 w-full max-w-[1440px] mx-auto gap-12 lg:gap-8 min-h-[calc(100vh-100px)]">
        
        {/* LEFT COLUMN (Only visible on Desktop Login or hidden on mobile/tablet) */}
        {view === 'login' && (
          <div className="hidden lg:flex flex-col justify-center flex-1 max-w-xl animate-slideInRight mobile-bg-blur">
            <h1 className="text-[3.5rem] xl:text-[4rem] font-black leading-[1.05] tracking-tight mb-6 font-outfit">
              Where students <br/>
              connect, learn <br/>
              and <span className="text-gradient-purple">grow together.</span>
            </h1>
            <p className="text-[1.1rem] text-white/60 mb-12 max-w-sm leading-relaxed font-medium">
              Join a community built for learners, by learners.
            </p>

            <div className="flex items-center gap-10 mt-auto">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#9B5DE5]" />
                  <span className="font-bold text-lg">50K+</span>
                </div>
                <span className="text-xs text-white/40 font-medium">Students</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#4169E1]" />
                  <span className="font-bold text-lg">500+</span>
                </div>
                <span className="text-xs text-white/40 font-medium">Colleges</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#00CFFF]" />
                  <span className="font-bold text-lg">1M+</span>
                </div>
                <span className="text-xs text-white/40 font-medium">Connections</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN (Auth Forms) */}
        <div className={`w-full ${view === 'register' ? 'max-w-5xl' : 'max-w-md lg:mr-12'} mx-auto lg:mx-0 animate-panelRiseSpring`}>
          
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </div>
          )}

          {/* ── LOGIN VIEW ── */}
          {view === 'login' && (
            <div className="glass-auth-card rounded-3xl p-8 sm:p-10 w-full shadow-[0_0_80px_rgba(65,105,225,0.07)]">
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-2 font-outfit">Welcome back</h2>
                <p className="text-sm text-white/50 font-medium">Login to continue your journey</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Email or username</label>
                  <InputField 
                    icon={<User className="w-4 h-4" />} 
                    placeholder="Enter your email or username"
                    value={email} onChange={(e: any) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Password</label>
                  <InputField 
                    icon={<Lock className="w-4 h-4" />} 
                    placeholder="Enter your password"
                    isPassword showPwdFlag={showPwd} onTogglePwd={() => setShowPwd(!showPwd)}
                    value={password} onChange={(e: any) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-4 h-4 rounded-[4px] border border-white/20 bg-white/5 group-hover:border-[#4169E1]/50 flex items-center justify-center transition-colors">
                      <Check className="w-3 h-3 text-[#4169E1] opacity-0 group-hover:opacity-50" />
                    </div>
                    <span className="text-xs text-white/60 font-medium select-none">Remember me</span>
                  </label>
                  <a href="#" className="text-xs font-medium text-[#4169E1] hover:text-[#5B7FF5] transition-colors">Forgot password?</a>
                </div>

                <button onClick={handleLogin} disabled={isLoading} className="btn-gradient-auth w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Log in <ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-white/30 font-medium uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button className="social-btn py-3 rounded-xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013c-1.18.816-2.584 1.296-4.04 1.296-4.636 0-8.547-3.033-9.845-7.234L-2.187 15.4C-.103 19.508 4.319 22.313 12 22.313c2.973 0 5.67-.98 7.747-2.656l-3.707-1.644z"/><path fill="#4A90E2" d="M19.747 19.657C21.603 17.65 22.754 14.995 22.754 12c0-.853-.105-1.68-.28-2.48H12v4.8h6.143c-.287 1.488-1.077 2.766-2.176 3.693l3.78 1.644z"/><path fill="#FBBC05" d="M2.155 15.402A11.968 11.968 0 011.026 12c0-1.173.226-2.31.62-3.37L-2.38 5.515C-3.23 7.49-3.725 9.68-3.725 12s.495 4.51 1.345 6.485l4.535-3.083z"/></svg>
                  </button>
                  <button className="social-btn py-3 rounded-xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <Github className="w-5 h-5 text-white/80" />
                  </button>
                  <button className="social-btn py-3 rounded-xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/></svg>
                  </button>
                </div>

                <div className="text-center pt-2 md:hidden">
                  <p className="text-xs text-white/40">
                    Don't have an account? <button onClick={() => go('register')} className="text-[#9B5DE5] font-semibold hover:text-[#B57AFF] transition-colors">Sign up</button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTER VIEW (MULTI-STEP) ── */}
          {view === 'register' && (
            <div className="flex flex-col md:flex-row w-full h-auto min-h-[500px]">
              {/* LEFT SIDEBAR - Stepper */}
              <div className="w-full md:w-[280px] shrink-0 p-4 md:p-8 flex flex-row md:flex-col items-start gap-4 md:gap-8 border-b md:border-b-0 md:border-r border-white/10 md:pr-12 overflow-x-auto custom-scrollbar">
                {[
                  { num: 1, title: 'Account', desc: 'Basic details' },
                  { num: 2, title: 'Role', desc: 'Who are you?' },
                  { num: 3, title: 'Interests', desc: 'Your preferences' },
                  { num: 4, title: 'Academics', desc: 'Tell us more' },
                  { num: 5, title: "You're in!", desc: 'Almost done' }
                ].map(s => {
                  const isActive = regStep === s.num;
                  const isPast = regStep > s.num;
                  return (
                    <div key={s.num} className="flex items-center md:items-start gap-4 min-w-max md:min-w-0 relative">
                      {/* Connecting Line (Desktop) */}
                      {s.num !== 5 && <div className="hidden md:block absolute top-10 left-3.5 w-px h-[calc(100%+16px)] bg-white/10" />}
                      
                      <div className={`step-circle w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold z-10
                        ${isActive ? 'bg-[#4169E1] border-[#4169E1] text-white shadow-[0_0_15px_rgba(65,105,225,0.4)]' : 
                          isPast ? 'bg-transparent border-white/30 text-white/60' : 'bg-transparent border-white/10 text-white/30'}`}>
                        {isPast ? <Check className="w-3.5 h-3.5 text-[#00CFFF]" /> : s.num}
                      </div>
                      <div className={`hidden md:block ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <h4 className="text-sm font-bold text-white leading-tight">{s.title}</h4>
                        <p className="text-xs text-white/60 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* RIGHT SIDE - Form Content */}
              <div className="flex-1 glass-auth-card rounded-2xl md:rounded-[32px] p-6 sm:p-10 ml-0 md:ml-8 mt-6 md:mt-0 shadow-[0_0_80px_rgba(155,93,229,0.05)] relative overflow-hidden">
                {/* Step 1: Basic Info */}
                {regStep === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Create your account</h2>
                      <p className="text-sm text-white/50 font-medium">Let's get started with the basics.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70">Full name</label>
                        <InputField icon={<User className="w-4 h-4"/>} placeholder="Enter your full name" value={regName} onChange={(e:any)=>setRegName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70">College email</label>
                        <InputField icon={<Mail className="w-4 h-4"/>} placeholder="you@college.edu" value={regEmail} onChange={(e:any)=>setRegEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Username</label>
                      <InputField icon={<User className="w-4 h-4"/>} placeholder="Choose a username" value={regUsername} onChange={(e:any)=>setRegUsername(e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Password</label>
                      <InputField isPassword showPwdFlag={showPwd} onTogglePwd={()=>setShowPwd(!showPwd)} icon={<Lock className="w-4 h-4"/>} placeholder="Create a strong password" value={regPass} onChange={(e:any)=>setRegPass(e.target.value)} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Confirm password</label>
                      <InputField isPassword showPwdFlag={showPwd} onTogglePwd={()=>setShowPwd(!showPwd)} icon={<Lock className="w-4 h-4"/>} placeholder="Confirm your password" value={regConfirm} onChange={(e:any)=>setRegConfirm(e.target.value)} />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button onClick={handleRegisterNext} disabled={isLoading} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Role */}
                {regStep === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">What describes you best?</h2>
                      <p className="text-sm text-white/50 font-medium">This helps us personalize your feed.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button onClick={()=>setStudentType('college')} className={`p-6 rounded-2xl border text-left transition-all ${studentType === 'college' ? 'bg-[#4169E1]/10 border-[#4169E1] shadow-[0_0_20px_rgba(65,105,225,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                        <BookOpen className={`w-8 h-8 mb-4 ${studentType === 'college' ? 'text-[#00CFFF]' : 'text-white/50'}`} />
                        <h4 className="text-base font-bold text-white">College Student</h4>
                        <p className="text-xs text-white/50 mt-1">Undergrad, Postgrad, Diploma</p>
                      </button>
                      <button onClick={()=>setStudentType('school')} className={`p-6 rounded-2xl border text-left transition-all ${studentType === 'school' ? 'bg-[#9B5DE5]/10 border-[#9B5DE5] shadow-[0_0_20px_rgba(155,93,229,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                        <Users className={`w-8 h-8 mb-4 ${studentType === 'school' ? 'text-[#9B5DE5]' : 'text-white/50'}`} />
                        <h4 className="text-base font-bold text-white">School Student</h4>
                        <p className="text-xs text-white/50 mt-1">High School, Pre-University</p>
                      </button>
                    </div>

                    <div className="pt-6 flex justify-between">
                      <button onClick={()=>setRegStep(1)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                      <button onClick={handleRegisterNext} disabled={!studentType} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Interests */}
                {regStep === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Your Interests</h2>
                      <p className="text-sm text-white/50 font-medium">Add skills and topics you care about (comma separated).</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70">Skills</label>
                        <InputField placeholder="e.g. React, Python, UI Design" value={skills} onChange={(e:any)=>setSkills(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/70">Interests</label>
                        <InputField placeholder="e.g. AI, Open Source, Hackathons" value={interests} onChange={(e:any)=>setInterests(e.target.value)} />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between">
                      <button onClick={()=>setRegStep(2)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                      <button onClick={handleRegisterNext} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Academics */}
                {regStep === 4 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Academic Details</h2>
                      <p className="text-sm text-white/50 font-medium">Tell us where you study.</p>
                    </div>
                    
                    {studentType === 'college' ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/70">College / University</label>
                          <InputField placeholder="Enter college name" value={collegeName} onChange={(e:any)=>setCollegeName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70">Department/Major</label>
                            <InputField placeholder="e.g. Computer Science" value={department} onChange={(e:any)=>setDepartment(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/70">Semester</label>
                            <InputField type="number" placeholder="1-8" value={semester} onChange={(e:any)=>setSemester(Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/70">Class / Grade</label>
                          <InputField placeholder="e.g. 11th, 12th" value={schoolClass} onChange={(e:any)=>setSchoolClass(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-white/70">Board</label>
                          <InputField placeholder="e.g. CBSE, State Board" value={board} onChange={(e:any)=>setBoard(e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div className="pt-6 flex justify-between">
                      <button onClick={()=>setRegStep(3)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                      <button onClick={handleRegisterNext} disabled={isLoading} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Complete <CheckCircle2 className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Success */}
                {regStep === 5 && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-scaleUp py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4169E1] to-[#9B5DE5] flex items-center justify-center shadow-[0_0_40px_rgba(65,105,225,0.4)]">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white font-outfit mb-2">You're in!</h2>
                      <p className="text-sm text-white/60">Account created successfully. Redirecting you...</p>
                    </div>
                    <Loader className="w-6 h-6 text-[#00CFFF] animate-spin mt-4" />
                  </div>
                )}
                
                {/* Background decorative waves for the form side */}
                <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#9B5DE5]/5 blur-[80px] rounded-full pointer-events-none" />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Text (Login view desktop) */}
      {view === 'login' && (
        <div className="hidden lg:flex absolute bottom-8 left-12 right-12 justify-between items-center text-[11px] text-white/30 font-medium z-20">
          <span>© 2026 Koinexa. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      )}

      {/* Hidden Dev toggle for TV mode testing */}
      <button onClick={() => setIsTVMode(true)} className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-white/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-50">
        <Monitor className="w-4 h-4 text-white/30" />
      </button>
    </div>
  );
};
