import React, { useState, useEffect } from 'react';
import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { 
  Users, BookOpen, Rocket, Mail, Lock, Eye, EyeOff, Loader, 
  AlertTriangle, CheckCircle2, ArrowRight, User, Menu, 
  X, Check, Scan, Smartphone, Monitor, ChevronLeft,
  Sparkles, Code, MessageCircle
} from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/supabaseService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';
import { KoinexaLogo } from '../common/KoinexaLogo';

interface LandingPageProps { onLoginSuccess: (user: any) => void; }
type AuthView = 'login' | 'register';

const InputField = ({ icon, type = "text", placeholder, value, onChange, isPassword = false, onTogglePwd, showPwdFlag }: any) => (
  <motion.div whileTap={{ scale: 0.99 }} className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#00CFFF] transition-colors">
      {icon}
    </div>
    <input
      type={isPassword ? (showPwdFlag ? 'text' : 'password') : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="kx-input-flow w-full pl-11 pr-12 bg-[#0D0D14]"

    />
    {isPassword && (
      <button type="button" onClick={onTogglePwd} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors">
        {showPwdFlag ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    )}
  </motion.div>
);

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

  // Advanced Mouse Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const parallaxX1 = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-30, 30]);
  const parallaxY1 = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [-30, 30]);
  
  const parallaxX2 = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [20, -20]);
  const parallaxY2 = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [20, -20]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const go = (v: AuthView) => { 
    setView(v); 
    setErrorMsg(''); 
    setRegStep(1);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        studentType: (studentType || 'college') as 'college' | 'school', college: isSchool ? '' : (collegeName || 'Koinexa Campus'),
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

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 px-4 sm:px-8">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <KoinexaLogo size="xl" className="mb-12" />
            <h1 className="text-5xl font-bold tracking-tight">Scan to login</h1>
            <p className="text-xl text-white/50 max-w-md leading-relaxed">
              Use the Koinexa mobile app to scan the QR code and sign in instantly.
            </p>
            <div className="flex items-center gap-8 pt-12 text-sm text-white/40 font-medium">
              <span className="flex items-center gap-2 hover:text-white/80 cursor-pointer transition-colors"><Monitor className="w-5 h-5" /> Having trouble?</span>
              <span className="flex items-center gap-2 hover:text-white/80 cursor-pointer transition-colors"><Smartphone className="w-5 h-5" /> Enter code</span>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center relative">
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
          </motion.div>
        </div>

        <button onClick={() => setIsTVMode(false)} className="absolute top-8 right-8 text-white/30 hover:text-white">
          <X className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#030305] text-white font-sans selection:bg-[#4169E1]/30 selection:text-white overflow-x-hidden relative">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-outfit { font-family: 'Space Grotesk', sans-serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-auth-card {
          background: rgba(14, 14, 20, 0.45);
          backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-2 flex items-center justify-between bg-[#030305]/50 backdrop-blur-md border-b border-white/5"
      >
        {view === 'login' ? (
          <KoinexaLogo size="md" />
        ) : (
          <button onClick={() => go('login')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm">Back to Login</span>
          </button>
        )}

        {/* Desktop Nav */}
        {view === 'login' && (
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8 text-sm font-medium text-white/60">
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </nav>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => go('register')} 
              className="px-5 py-2 rounded-lg bg-[#4169E1] text-white text-sm font-semibold shadow-[0_0_15px_rgba(65,105,225,0.3)]"
            >
              Sign up
            </motion.button>
          </div>
        )}



        {/* Mobile Hamburger */}
        <button className="md:hidden text-white/80" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 w-full bg-[#0A0A10]/95 backdrop-blur-xl border-b border-white/5 z-40 p-6 flex flex-col gap-6">
           <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white/80">About</a>
           <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white/80">Features</a>
           {view === 'login' ? (
             <button onClick={() => go('register')} className="w-full py-3 rounded-lg bg-[#4169E1] text-white font-semibold">Sign up</button>
           ) : (
             <button onClick={() => go('login')} className="w-full py-3 rounded-lg border border-white/10 text-white font-semibold">Log in</button>
           )}
           <button onClick={() => setIsTVMode(true)} className="flex items-center gap-2 text-sm text-white/40 mt-4"><Monitor className="w-4 h-4" /> TV Login</button>
        </div>
      )}

      {/* ── HERO / AUTH SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-8 z-10">
          
          {/* LEFT COLUMN (Only visible on Desktop Login or hidden on mobile/tablet) */}
          {view === 'login' && (
            <motion.div 
              style={{ x: parallaxX1, y: parallaxY1 }}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              className="hidden lg:flex flex-col justify-center flex-1 max-w-xl mobile-bg-blur"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-[3.5rem] xl:text-[4.5rem] font-black leading-[1.05] tracking-tight mb-6 font-outfit"
              >
                <span className="inline-block hover:scale-105 hover:text-[#4169E1] transition-all duration-300">Connect.</span>{' '}
                <span className="inline-block hover:scale-105 hover:text-[#9B5DE5] transition-all duration-300">Learn.</span>{' '}
                <span className="inline-block hover:scale-105 hover:text-[#00CFFF] transition-all duration-300">Build.</span>{' '}
                <span className="text-gradient-purple inline-block hover:scale-110 transition-all duration-300">Thrive.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-[1.1rem] text-white/60 mb-12 max-w-sm leading-relaxed font-medium"
              >
                Empowering students to grow beyond classrooms — share knowledge, solve problems, and shape your future.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex items-center gap-10 mt-auto"
              >
                {[
                  { icon: <Users className="w-5 h-5 text-[#9B5DE5]" />, val: "50K+", label: "Students" },
                  { icon: <BookOpen className="w-5 h-5 text-[#4169E1]" />, val: "500+", label: "Colleges" },
                  { icon: <Rocket className="w-5 h-5 text-[#00CFFF]" />, val: "1M+", label: "Connections" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="flex flex-col gap-1 cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="font-bold text-lg">{stat.val}</span>
                    </div>
                    <span className="text-xs text-white/40 font-medium">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* RIGHT COLUMN (Auth Forms) */}
          <motion.div 
            style={{ x: parallaxX2, y: parallaxY2 }}
            className={`w-full ${view === 'register' ? 'max-w-5xl' : 'max-w-md lg:mr-12'} mx-auto lg:mx-0`}
          >
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </motion.div>
            )}

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                className="glass-auth-card rounded-3xl p-8 sm:p-10 w-full"
              >
                <div className="mb-8 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white mb-2 font-outfit">Welcome back</h2>
                  <p className="text-sm text-white/50 font-medium">Login to continue your journey</p>
                </div>

                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Email or username</label>
                    <InputField 
                      icon={<User className="w-4 h-4" />} 
                      placeholder="Enter your email or username"
                      value={email} onChange={(e: any) => setEmail(e.target.value)}
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Password</label>
                    <InputField 
                      icon={<Lock className="w-4 h-4" />} 
                      placeholder="Enter your password"
                      isPassword showPwdFlag={showPwd} onTogglePwd={() => setShowPwd(!showPwd)}
                      value={password} onChange={(e: any) => setPassword(e.target.value)}
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded-[4px] border border-white/20 bg-white/5 group-hover:border-[#4169E1]/50 flex items-center justify-center transition-colors">
                        <Check className="w-3 h-3 text-[#4169E1] opacity-0 group-hover:opacity-50" />
                      </div>
                      <span className="text-xs text-white/60 font-medium select-none">Remember me</span>
                    </label>
                    <a href="#" className="text-xs font-medium text-[#4169E1] hover:text-[#5B7FF5] transition-colors">Forgot password?</a>
                  </motion.div>

                  <motion.button 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleLogin} disabled={isLoading} className="btn-gradient-auth w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Log in <ArrowRight className="w-4 h-4" /></>}
                  </motion.button>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <div className="text-center pt-6 md:hidden">
                      <p className="text-xs text-white/40">
                        Don't have an account? <button onClick={() => go('register')} className="text-[#9B5DE5] font-semibold hover:text-[#B57AFF] transition-colors">Sign up</button>
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ── REGISTER VIEW ── */}
            {view === 'register' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row w-full h-auto min-h-[500px]"
              >
                {/* Stepper Logic... existing */}
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
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: s.num * 0.1 }}
                        key={s.num} className="flex items-center md:items-start gap-4 min-w-max md:min-w-0 relative"
                      >
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
                      </motion.div>
                    )
                  })}
                </div>

                {/* Form Content */}
                <div className="flex-1 glass-auth-card rounded-2xl md:rounded-[32px] p-6 sm:p-10 ml-0 md:ml-8 mt-6 md:mt-0 shadow-[0_0_80px_rgba(155,93,229,0.05)] relative overflow-hidden">
                  {/* Step 1 */}
                  {regStep === 1 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Create your account</h2>
                        <p className="text-sm text-white/50 font-medium">Let's get started with the basics.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Full name</label><InputField icon={<User className="w-4 h-4"/>} placeholder="Enter your full name" value={regName} onChange={(e:any)=>setRegName(e.target.value)} /></div>
                        <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">College email</label><InputField icon={<Mail className="w-4 h-4"/>} placeholder="you@college.edu" value={regEmail} onChange={(e:any)=>setRegEmail(e.target.value)} /></div>
                      </div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Username</label><InputField icon={<User className="w-4 h-4"/>} placeholder="Choose a username" value={regUsername} onChange={(e:any)=>setRegUsername(e.target.value)} /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Password</label><InputField isPassword showPwdFlag={showPwd} onTogglePwd={()=>setShowPwd(!showPwd)} icon={<Lock className="w-4 h-4"/>} placeholder="Create a strong password" value={regPass} onChange={(e:any)=>setRegPass(e.target.value)} /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Confirm password</label><InputField isPassword showPwdFlag={showPwd} onTogglePwd={()=>setShowPwd(!showPwd)} icon={<Lock className="w-4 h-4"/>} placeholder="Confirm your password" value={regConfirm} onChange={(e:any)=>setRegConfirm(e.target.value)} /></div>
                      <div className="pt-2 flex justify-end">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRegisterNext} disabled={isLoading} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  {/* Steps 2-5 omitted for brevity, keeping functionality exactly as is but wrapped in motion.div */}
                  {regStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div><h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">What describes you best?</h2></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={()=>setStudentType('college')} className={`p-6 rounded-2xl border text-left transition-all ${studentType === 'college' ? 'bg-[#4169E1]/10 border-[#4169E1]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}><BookOpen className={`w-8 h-8 mb-4 ${studentType === 'college' ? 'text-[#00CFFF]' : 'text-white/50'}`} /><h4 className="text-base font-bold text-white">College Student</h4></motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={()=>setStudentType('school')} className={`p-6 rounded-2xl border text-left transition-all ${studentType === 'school' ? 'bg-[#9B5DE5]/10 border-[#9B5DE5]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}><Users className={`w-8 h-8 mb-4 ${studentType === 'school' ? 'text-[#9B5DE5]' : 'text-white/50'}`} /><h4 className="text-base font-bold text-white">School Student</h4></motion.button>
                      </div>
                      <div className="pt-6 flex justify-between">
                        <button onClick={()=>setRegStep(1)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                        <button onClick={handleRegisterNext} disabled={!studentType} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  )}
                  {regStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div><h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Your Interests</h2></div>
                      <div className="space-y-4">
                        <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Skills</label><InputField placeholder="e.g. React, Python, UI Design" value={skills} onChange={(e:any)=>setSkills(e.target.value)} /></div>
                        <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Interests</label><InputField placeholder="e.g. AI, Open Source, Hackathons" value={interests} onChange={(e:any)=>setInterests(e.target.value)} /></div>
                      </div>
                      <div className="pt-6 flex justify-between">
                        <button onClick={()=>setRegStep(2)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                        <button onClick={handleRegisterNext} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  )}
                  {regStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div><h2 className="text-2xl font-bold text-white mb-1.5 font-outfit">Academic Details</h2></div>
                      {studentType === 'college' ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">College / University</label><InputField placeholder="Enter college name" value={collegeName} onChange={(e:any)=>setCollegeName(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Department/Major</label><InputField placeholder="e.g. Computer Science" value={department} onChange={(e:any)=>setDepartment(e.target.value)} /></div>
                            <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Semester</label><InputField type="number" placeholder="1-8" value={semester} onChange={(e:any)=>setSemester(Number(e.target.value))} /></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Class / Grade</label><InputField placeholder="e.g. 11th, 12th" value={schoolClass} onChange={(e:any)=>setSchoolClass(e.target.value)} /></div>
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-white/70">Board</label><InputField placeholder="e.g. CBSE, State Board" value={board} onChange={(e:any)=>setBoard(e.target.value)} /></div>
                        </div>
                      )}
                      <div className="pt-6 flex justify-between">
                        <button onClick={()=>setRegStep(3)} className="px-6 py-3 rounded-xl text-white/50 hover:text-white font-medium text-sm transition-colors">Back</button>
                        <button onClick={handleRegisterNext} disabled={isLoading} className="btn-gradient-auth px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <>Complete <CheckCircle2 className="w-4 h-4" /></>}</button>
                      </div>
                    </motion.div>
                  )}
                  {regStep === 5 && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full space-y-6 text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4169E1] to-[#9B5DE5] flex items-center justify-center shadow-[0_0_40px_rgba(65,105,225,0.4)]">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <div><h2 className="text-2xl font-bold text-white font-outfit mb-2">You're in!</h2><p className="text-sm text-white/60">Account created successfully. Redirecting...</p></div>
                    </motion.div>
                  )}
                  
                  <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#9B5DE5]/5 blur-[80px] rounded-full pointer-events-none" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {view === 'login' && (
        <>
          {/* ── ABOUT SECTION ── */}
          <section id="about" className="relative min-h-[60vh] flex items-center justify-center py-20 px-6 border-t border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-8 relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 text-[#4169E1] text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> About Koinexa
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-outfit tracking-tight">Where ambition meets community.</h2>
          <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-3xl mx-auto">
            We’re bridging the gap between learning and belonging. Koinexa is where students collaborate, exchange knowledge, and grow together — all in one inspiring space.
          </p>
        </motion.div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative min-h-screen py-20 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#0A0A10]/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-outfit tracking-tight">Everything you need to succeed.</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">Experience a platform engineered for absolute peak productivity and networking.</p>
          </motion.div>

          <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            {[
              { title: "Secure Accounts", desc: "Role-based authentication ensures privacy and safe interactions.", icon: <Lock className="w-7 h-7 text-[#4169E1]" /> },
              { title: "Resource Library", desc: "Upload, organize, and retrieve study materials with intelligent categorization.", icon: <BookOpen className="w-7 h-7 text-[#9B5DE5]" /> },
              { title: "Subject Communities", desc: "Join topic-based groups for discussions, Q&A, and collaboration.", icon: <Users className="w-7 h-7 text-[#00CFFF]" /> },
              { title: "Real-Time Messaging", desc: "Lightning-fast communication powered by Supabase Realtime and WebSocket technology.", icon: <MessageCircle className="w-7 h-7 text-[#34C759]" /> },
              { title: "AI Moderation", desc: "Smart filters and neural networks keep conversations relevant and respectful.", icon: <Sparkles className="w-7 h-7 text-[#F5A623]" /> },
              { title: "DSA-Optimized Search", desc: "Graph-based algorithms deliver precise, context-aware results.", icon: <Code className="w-7 h-7 text-[#FF3B30]" /> }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                whileHover={{ scale: 1.02, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                className="flex flex-col md:flex-row md:items-center gap-6 p-8 rounded-[32px] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-default shadow-xl backdrop-blur-md"
              >
                <div className="w-16 h-16 rounded-[20px] bg-white/5 flex items-center justify-center shrink-0 shadow-inner border border-white/10">
                  {feat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 font-outfit tracking-wide">{feat.title}</h3>
                  <p className="text-white/60 text-[15px] leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      </>
      )}

      {/* Footer Text (Login view desktop) */}
      <footer className="w-full py-8 text-center text-sm text-white/30 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-4">
          <span>© 2026 Koinexa. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Hidden Dev toggle for TV mode testing */}
      <button onClick={() => setIsTVMode(true)} className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-white/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-50">
        <Monitor className="w-4 h-4 text-white/30" />
      </button>
    </div>
  );
};
