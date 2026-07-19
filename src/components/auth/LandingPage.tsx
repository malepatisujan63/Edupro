import React, { useState, useEffect, useRef } from 'react';
import { Users, BookOpen, Rocket, Quote, Mail, Lock, Eye, EyeOff, Loader, AlertTriangle, CheckCircle2, ArrowRight, User, Zap, Star, TrendingUp } from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/supabaseService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
}

const BG_IMAGE = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop';
type AuthView = 'login' | 'register' | 'register_details';

/* ─── Floating Particle ─── */
const Particle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute rounded-full pointer-events-none" style={style} />
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Details
  const [studentType, setStudentType] = useState<'school' | 'college' | ''>('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState(1);
  const [schoolClass, setSchoolClass] = useState('');
  const [board, setBoard] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [hobbies, setHobbies] = useState('');

  // Typewriter
  const words = ['Koinexa', 'Your Campus', 'Your Future', 'Your Network'];
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const current = words[wordIdx];
    const speed = isDeleting ? 60 : 120;
    typeRef.current = setTimeout(() => {
      if (!isDeleting && displayed.length < current.length) {
        setDisplayed(current.slice(0, displayed.length + 1));
      } else if (isDeleting && displayed.length > 0) {
        setDisplayed(current.slice(0, displayed.length - 1));
      } else if (!isDeleting && displayed.length === current.length) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && displayed.length === 0) {
        setIsDeleting(false);
        setWordIdx(i => (i + 1) % words.length);
      }
    }, speed);
    return () => { if (typeRef.current) clearTimeout(typeRef.current); };
  }, [displayed, isDeleting, wordIdx]);

  // Particles config
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    width: 2 + Math.random() * 4,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    opacity: 0.1 + Math.random() * 0.25,
    background: i % 3 === 0 ? '#00CFFF' : i % 3 === 1 ? '#9B5DE5' : '#4169E1',
    animationDuration: `${4 + Math.random() * 8}s`,
    animationDelay: `${Math.random() * 4}s`,
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const user = await fetchUserProfileByEmail(email.trim().toLowerCase());
      if (!user) { setErrorMsg('No account found with that email.'); return; }
      const ok = await verifyPassword(password, user.password);
      if (!ok) { setErrorMsg('Incorrect password. Try again.'); return; }
      onLoginSuccess(user);
    } catch (err: any) { setErrorMsg(err.message || 'Login failed.'); }
    finally { setIsLoading(false); }
  };

  const handleRegisterNext = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPass) { setErrorMsg('Please fill all fields.'); return; }
    if (regPass.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (regPass !== regConfirm) { setErrorMsg('Passwords do not match.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const existing = await fetchUserProfileByEmail(regEmail.trim().toLowerCase());
      if (existing) { setErrorMsg('Email already registered. Please sign in.'); return; }
      setView('register_details');
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setIsLoading(false); }
  };

  const handleCompleteRegistration = async () => {
    if (!studentType) { setErrorMsg('Please select School or College.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const uid = `usr_${Date.now()}`;
      const name = regName.trim();
      const userEmail = regEmail.trim().toLowerCase();
      const pwd = await hashPassword(regPass);
      const pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4169E1&color=fff`;
      const isSchool = studentType === 'school';
      const newUser = {
        uid, id: `usr_${Date.now().toString().slice(-6)}`,
        name, email: userEmail, password: pwd, phone: '',
        studentType, college: isSchool ? '' : (collegeName || 'Koinexa Campus'),
        department: isSchool ? '' : (department || 'General'),
        semester: isSchool ? 0 : semester,
        schoolClass: isSchool ? schoolClass : '', board: isSchool ? board : '',
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        hobbies: hobbies.split(',').map(s => s.trim()).filter(Boolean),
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        studyMates: [], pendingStudyMateRequests: [], createdCommunities: [],
        avatarUrl: pic, role: 'student' as const, reputationPoints: 100,
        badges: ['Verified Student'], createdAt: new Date().toISOString(),
      };
      globalRegistrationHash.registerUser(userEmail, '', newUser);
      try { await saveUserProfile(newUser); } catch (e: any) { console.warn('DB save warn:', e); }
      globalSocialGraph.addStudent(newUser);
      const loc = isSchool ? `${newUser.schoolClass} • ${newUser.board}` : `${newUser.college} • ${newUser.department}`;
      globalPlatformTrie.indexItem({ id: newUser.id, title: newUser.name, subtitle: loc, type: 'user', tags: [...newUser.badges, ...newUser.skills], avatarUrl: newUser.avatarUrl });
      onLoginSuccess(newUser);
    } catch (err: any) { setErrorMsg(err.message || 'Registration failed.'); }
    finally { setIsLoading(false); }
  };

  const switchView = (v: AuthView) => { setView(v); setErrorMsg(''); };

  const stats = [
    { icon: <Users className="w-3.5 h-3.5" />, value: '12K+', label: 'Students', color: 'text-[#00CFFF]' },
    { icon: <Star className="w-3.5 h-3.5" />, value: '200+', label: 'Colleges', color: 'text-[#9B5DE5]' },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, value: '50K+', label: 'Posts', color: 'text-[#34C759]' },
  ];

  const features = [
    { icon: <Users className="w-5 h-5" />, label: 'Connect', sub: 'with peers across India', accent: '#9B5DE5' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Learn', sub: 'together in study hubs', accent: '#00CFFF' },
    { icon: <Rocket className="w-5 h-5" />, label: 'Grow', sub: 'your career & network', accent: '#4169E1' },
  ];

  const inputCls = "flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/70 focus-within:bg-[#4169E1]/5 focus-within:shadow-[0_0_0_3px_rgba(65,105,225,0.12)] transition-all duration-200";

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden font-sans select-none" style={{ background: '#030308' }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes kx-float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes kx-pulse-glow { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes kx-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes kx-fadeL { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes kx-fadeR { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
        @keyframes kx-fadeU { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kx-orbit { 0%{transform:rotate(0deg) translateX(18px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(18px) rotate(-360deg)} }
        @keyframes kx-particle { 0%,100%{transform:translateY(0) scale(1);opacity:0.2} 50%{transform:translateY(-30px) scale(1.3);opacity:0.6} }
        @keyframes kx-border-spin { 0%{--angle:0deg} 100%{--angle:360deg} }
        @keyframes kx-scan { 0%{top:-2px} 100%{top:100%} }
        .kx-shimmer-text {
          background: linear-gradient(90deg, #00CFFF, #9B5DE5, #4169E1, #00CFFF);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: kx-shimmer 3s linear infinite;
        }
        .kx-card-glow {
          position:relative;
        }
        .kx-card-glow::before {
          content:'';
          position:absolute;
          inset:-1px;
          border-radius:36px;
          background: linear-gradient(135deg, rgba(0,207,255,0.35), rgba(65,105,225,0.2), rgba(155,93,229,0.35));
          z-index:-1;
          animation: kx-pulse-glow 3s ease-in-out infinite;
        }
        .kx-card-glow::after {
          content:'';
          position:absolute;
          inset:-1px;
          border-radius:36px;
          background: linear-gradient(135deg, transparent 40%, rgba(0,207,255,0.15) 100%);
          z-index:-1;
        }
        .kx-btn-primary {
          background: linear-gradient(135deg, #00CFFF, #4169E1, #9B5DE5);
          background-size: 200% auto;
          transition: background-position 0.4s ease, opacity 0.2s, transform 0.15s;
        }
        .kx-btn-primary:hover { background-position: right center; }
        .kx-cursor { display:inline-block; width:3px; height:1em; background:#9B5DE5; margin-left:2px; vertical-align:middle; animation:kx-orbit 0.8s step-end infinite; border-radius:2px; }
        @keyframes kx-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .kx-cursor { animation: kx-blink 0.9s step-end infinite; }
      `}</style>

      {/* ── BACKGROUND IMAGE ── */}
      <div className="absolute inset-0 z-0">
        <img src={BG_IMAGE} alt="" className="w-full h-full object-cover object-center" style={{ opacity: 0.45, filter: 'brightness(0.7) saturate(1.1)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #030308 38%, rgba(3,3,8,0.75) 60%, rgba(3,3,8,0.3) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(3,3,8,0.85) 0%, transparent 40%, rgba(3,3,8,0.5) 100%)' }} />
      </div>

      {/* ── AMBIENT GLOW ORBS ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(65,105,225,0.18) 0%, transparent 70%)', animation: 'kx-float 8s ease-in-out infinite' }} />
        <div className="absolute top-0 left-1/4 w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(155,93,229,0.12) 0%, transparent 70%)', animation: 'kx-float 11s ease-in-out infinite reverse' }} />
        <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,207,255,0.1) 0%, transparent 70%)', animation: 'kx-float 7s ease-in-out infinite 2s' }} />
      </div>

      {/* ── FLOATING PARTICLES ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {particles.map(p => (
          <Particle key={p.id} style={{
            width: p.width, height: p.width,
            top: p.top, left: p.left,
            opacity: p.opacity,
            background: p.background,
            animation: `kx-particle ${p.animationDuration} ${p.animationDelay} ease-in-out infinite`,
            boxShadow: `0 0 ${p.width * 3}px ${p.background}`,
          }} />
        ))}
      </div>

      {/* ── TOP NAVIGATION ── */}
      <div className="relative z-30 w-full px-6 lg:px-10 pt-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3" style={{ animation: mounted ? 'kx-fadeL 0.6s ease both' : 'none' }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl"
                style={{ background: 'linear-gradient(135deg, #00CFFF, #4169E1, #9B5DE5)', boxShadow: '0 0 20px rgba(65,105,225,0.5)' }}>
                K
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#030308] animate-pulse" />
            </div>
            <span className="text-[1.7rem] font-extrabold text-white tracking-tight leading-none">koinexa</span>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-3" style={{ animation: mounted ? 'kx-fadeR 0.6s ease both' : 'none' }}>
            <button onClick={() => switchView('login')}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white/80 border border-white/12 hover:bg-white/8 hover:text-white hover:border-white/25 transition-all duration-200 backdrop-blur-sm">
              Sign In
            </button>
            <button onClick={() => switchView('register')}
              className="kx-btn-primary px-5 py-2.5 rounded-full text-sm font-black text-white shadow-lg active:scale-95"
              style={{ boxShadow: '0 4px 20px rgba(65,105,225,0.45)' }}>
              Open an Account
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="relative z-10 flex-1 flex items-center w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-8 pt-6 gap-6 lg:gap-20">

        {/* ════ LEFT PANEL ════ */}
        <div className="flex-1 min-w-0 flex flex-col gap-7" style={{ animation: mounted ? 'kx-fadeL 0.7s 0.1s ease both' : 'none', opacity: 0, animationFillMode: 'forwards' }}>

          {/* Live status badge */}
          <div className="flex items-center gap-2 w-fit px-4 py-2 rounded-full border border-[#34C759]/25 bg-[#34C759]/8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
            <span className="text-[11px] font-bold text-[#34C759] tracking-wide">LIVE · 3,247 students online now</span>
          </div>

          {/* Headline */}
          <div>
            <p className="text-white/60 text-sm font-semibold mb-3 tracking-wider uppercase">India's #1 Student Platform</p>
            <h1 className="text-[4rem] lg:text-[5rem] leading-[1.0] font-black text-white tracking-tight mb-4">
              Welcome to<br />
              <span className="kx-shimmer-text" style={{ fontSize: 'inherit' }}>
                {displayed}
              </span>
              <span className="kx-cursor" />
            </h1>
            <div className="w-24 h-[3px] rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #00CFFF, #9B5DE5)' }} />
            <p className="text-[1.05rem] font-bold text-white/85 mb-3 leading-snug">
              The student social platform<br />for India's top colleges.
            </p>
            <p className="text-sm font-normal text-white/50 leading-relaxed max-w-[340px]">
              Share knowledge, solve doubts, discover opportunities and build connections that last a lifetime.
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2.5 group">
                {i > 0 && <div className="w-px h-8 bg-white/10 mr-3" />}
                <div className={`${s.color} opacity-70`}>{s.icon}</div>
                <div>
                  <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
                  <p className="text-[10px] text-white/40 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={f.label}
                className="flex items-center gap-4 p-3.5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 group cursor-default max-w-sm"
                style={{ animation: mounted ? `kx-fadeL 0.7s ${0.2 + i * 0.1}s ease both` : 'none', opacity: 0, animationFillMode: 'forwards' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
                  style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30`, color: f.accent, boxShadow: `0 0 12px ${f.accent}20` }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{f.label}</p>
                  <p className="text-xs text-white/40 font-medium">{f.sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto mr-1 transition-all group-hover:translate-x-1 duration-200" />
              </div>
            ))}
          </div>

          {/* Quote Card */}
          <div className="relative overflow-hidden rounded-[20px] border border-white/10 py-4 px-5 max-w-sm backdrop-blur-xl"
            style={{ background: 'rgba(0,0,0,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-20 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(rgba(155,93,229,0.5) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="relative z-10 flex items-start gap-3">
              <Quote className="w-7 h-7 text-[#4169E1] opacity-50 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/80 italic font-medium leading-relaxed">
                  "Alone we can do so little; together we can do so much."
                </p>
                <p className="text-xs font-bold text-[#9B5DE5] mt-2">— Helen Keller</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL — AUTH CARD ════ */}
        <div className="w-full max-w-[430px] shrink-0 kx-card-glow"
          style={{ animation: mounted ? 'kx-fadeR 0.7s 0.2s ease both' : 'none', opacity: 0, animationFillMode: 'forwards' }}>

          <div className="relative overflow-hidden rounded-[34px] p-8"
            style={{ background: 'linear-gradient(145deg, rgba(13,13,28,0.95) 0%, rgba(8,8,20,0.98) 100%)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Scan line animation */}
            <div className="absolute left-0 right-0 h-[1px] pointer-events-none z-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(65,105,225,0.4), transparent)', animation: 'kx-scan 4s linear infinite', top: '-2px' }} />

            {/* Corner glow accents */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle at top right, rgba(0,207,255,0.08) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle at bottom left, rgba(155,93,229,0.08) 0%, transparent 70%)' }} />

            {/* ── Error ── */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}

            {/* ── LOGIN ── */}
            {view === 'login' && (
              <div className="space-y-5 relative z-10">
                <div className="text-center mb-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4169E1]/10 border border-[#4169E1]/20 mb-3">
                    <Zap className="w-3 h-3 text-[#00CFFF]" />
                    <span className="text-[10px] font-bold text-[#00CFFF] tracking-wider">SECURE LOGIN</span>
                  </div>
                  <h2 className="text-[1.6rem] font-black text-white leading-tight">
                    Log in to <span className="kx-shimmer-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/40 mt-1.5 font-medium">Glad to see you back! 👋</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Email / Username</label>
                  <div className={inputCls}>
                    <Mail className="w-4 h-4 text-white/25 shrink-0" />
                    <input type="email" placeholder="Enter your email or username" value={email}
                      onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none font-medium" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Password</label>
                  <div className={inputCls}>
                    <Lock className="w-4 h-4 text-white/25 shrink-0" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                      onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none font-medium" />
                    <button onClick={() => setShowPassword(p => !p)} className="text-white/25 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button className="text-[11px] text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">Forgot password?</button>
                  </div>
                </div>

                <button onClick={handleLogin} disabled={isLoading}
                  className="kx-btn-primary w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-transform"
                  style={{ boxShadow: '0 6px 24px rgba(65,105,225,0.45)' }}>
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Log In</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/6" />
                  <span className="text-[11px] text-white/25 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-white/6" />
                </div>

                <button className="w-full py-3.5 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-white/18 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 4.4-5.8 7.5-11.3 7.5C17 35.5 11 29.5 11 22.5S17 9.5 24 9.5c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 4.2 29.2 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-2z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 5.2 29.2 3 24 3 16.1 3 9.3 7.9 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 43c5.1 0 9.8-2 13.2-5.1l-6.1-5.2C29.2 34.7 26.7 35.5 24 35.5c-5.4 0-9.6-3.1-11.3-7.5l-6.5 5C9.3 40 16.1 43 24 43z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.5l6.1 5.2C41.9 35.1 44 28.9 44 22c0-1.3-.1-2.7-.4-2z"/>
                  </svg>
                  Sign in with Google
                </button>

                <p className="text-center text-xs text-white/35 font-medium">
                  Don't have an account?{' '}
                  <button onClick={() => switchView('register')} className="text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">Create one</button>
                </p>
              </div>
            )}

            {/* ── REGISTER ── */}
            {view === 'register' && (
              <div className="space-y-4 relative z-10">
                <div className="text-center mb-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9B5DE5]/10 border border-[#9B5DE5]/20 mb-3">
                    <Star className="w-3 h-3 text-[#9B5DE5]" />
                    <span className="text-[10px] font-bold text-[#9B5DE5] tracking-wider">JOIN 12K+ STUDENTS</span>
                  </div>
                  <h2 className="text-[1.6rem] font-black text-white leading-tight">
                    Join <span className="kx-shimmer-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/40 mt-1.5 font-medium">Create your student account 🎓</p>
                </div>

                {[
                  { label: 'Full Name', placeholder: 'Your full name', value: regName, set: setRegName, icon: <User className="w-4 h-4 text-white/25 shrink-0" />, type: 'text' },
                  { label: 'Email Address', placeholder: 'Your email address', value: regEmail, set: setRegEmail, icon: <Mail className="w-4 h-4 text-white/25 shrink-0" />, type: 'email' },
                  { label: 'Password', placeholder: 'Create a password (min 6 chars)', value: regPass, set: setRegPass, icon: <Lock className="w-4 h-4 text-white/25 shrink-0" />, type: 'password' },
                  { label: 'Confirm Password', placeholder: 'Repeat your password', value: regConfirm, set: setRegConfirm, icon: <Lock className="w-4 h-4 text-white/25 shrink-0" />, type: 'password' },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{f.label}</label>
                    <div className={inputCls}>
                      {f.icon}
                      <input type={f.type} placeholder={f.placeholder} value={f.value} onChange={e => f.set(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none font-medium" />
                    </div>
                  </div>
                ))}

                <button onClick={handleRegisterNext} disabled={isLoading}
                  className="kx-btn-primary w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-transform"
                  style={{ boxShadow: '0 6px 24px rgba(65,105,225,0.45)' }}>
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-xs text-white/35 font-medium">
                  Already have an account?{' '}
                  <button onClick={() => switchView('login')} className="text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">Sign in</button>
                </p>
              </div>
            )}

            {/* ── REGISTER DETAILS ── */}
            {view === 'register_details' && (
              <div className="space-y-4 relative z-10">
                <div className="text-center mb-1">
                  <h2 className="text-xl font-black text-white">Setup Your Profile</h2>
                  <p className="text-xs text-white/40 mt-1">One more step! Tell us about yourself.</p>
                </div>
                <div className="flex gap-2">
                  {(['school', 'college'] as const).map(t => (
                    <button key={t} onClick={() => setStudentType(t)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold border capitalize transition-all duration-200 ${studentType === t ? 'text-white border-transparent shadow-lg' : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white'}`}
                      style={studentType === t ? { background: 'linear-gradient(135deg, #4169E1, #9B5DE5)', boxShadow: '0 4px 16px rgba(65,105,225,0.35)' } : {}}>
                      {t} Student
                    </button>
                  ))}
                </div>
                {studentType === 'school' && (
                  <div className="space-y-3">
                    {[{ p: 'Class (e.g. 10th, 12th)', v: schoolClass, s: setSchoolClass }, { p: 'Board (e.g. CBSE, ICSE)', v: board, s: setBoard }].map(f => (
                      <div key={f.p} className={inputCls}>
                        <input type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
                      </div>
                    ))}
                  </div>
                )}
                {studentType === 'college' && (
                  <div className="space-y-3">
                    <div className={inputCls}>
                      <input type="text" placeholder="College Name" value={collegeName} onChange={e => setCollegeName(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <div className={`flex-1 ${inputCls}`}>
                        <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
                      </div>
                      <div className={`w-20 ${inputCls}`}>
                        <input type="number" min={1} max={8} placeholder="Sem" value={semester} onChange={e => setSemester(Number(e.target.value))}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
                      </div>
                    </div>
                  </div>
                )}
                {(studentType === 'school' || studentType === 'college') && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[10px] font-bold text-[#00CFFF] uppercase tracking-widest">Personalize your feed</p>
                    {[{ p: 'Skills (comma separated)', v: skills, s: setSkills }, { p: 'Interests (comma separated)', v: interests, s: setInterests }, { p: 'Hobbies (comma separated)', v: hobbies, s: setHobbies }].map(f => (
                      <div key={f.p} className={inputCls}>
                        <input type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleCompleteRegistration} disabled={isLoading || !studentType}
                  className="kx-btn-primary w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-transform"
                  style={{ boxShadow: '0 6px 24px rgba(65,105,225,0.45)' }}>
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /><span>Complete Registration</span></>}
                </button>
                <button onClick={() => switchView('register')} className="w-full text-center text-xs text-white/30 hover:text-[#00CFFF] font-medium transition-colors">← Back</button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
