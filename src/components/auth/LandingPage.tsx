import React, { useState } from 'react';
import { Users, BookOpen, Rocket, Quote, Mail, Lock, Eye, EyeOff, Loader, AlertTriangle, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/supabaseService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
}

const BG_IMAGE = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop';

type AuthView = 'login' | 'register' | 'register_details';

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Details step
  const [studentType, setStudentType] = useState<'school' | 'college' | ''>('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState(1);
  const [schoolClass, setSchoolClass] = useState('');
  const [board, setBoard] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [hobbies, setHobbies] = useState('');




  const handleLogin = async () => {
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const user = await fetchUserProfileByEmail(email.trim().toLowerCase());
      if (!user) { setErrorMsg('No account found with that email.'); return; }
      const ok = await verifyPassword(password, user.password);
      if (!ok) { setErrorMsg('Incorrect password. Try again.'); return; }
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally { setIsLoading(false); }
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

  const featureItems = [
    { icon: <Users className="w-5 h-5" />, label: 'Connect', sub: 'with peers', color: 'text-[#9B5DE5]', bg: 'bg-[#9B5DE5]/10 border-[#9B5DE5]/20' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Learn', sub: 'together', color: 'text-[#00CFFF]', bg: 'bg-[#00CFFF]/10 border-[#00CFFF]/20' },
    { icon: <Rocket className="w-5 h-5" />, label: 'Grow', sub: 'together', color: 'text-[#9B5DE5]', bg: 'bg-[#9B5DE5]/10 border-[#9B5DE5]/20' },
  ];

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden font-sans" style={{ background: '#05050A' }}>

      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt="Students studying at Koinexa"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.55 }}
        />
        {/* Gradient: heavy dark left, fading right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/80 to-[#05050A]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050A]/80 via-transparent to-[#05050A]/50" />
        {/* Ambient colour glow */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#4169E1]/10 blur-[120px] pointer-events-none" />
        <div className="absolute -top-20 right-1/3 w-[400px] h-[400px] rounded-full bg-[#9B5DE5]/8 blur-[100px] pointer-events-none" />
      </div>

      {/* ── FLOATING WORDS BG (decorative) ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden select-none">
        {['Focus', 'Learn', 'Grow', 'Together we learn, together we grow.', 'Ideas', 'Success', 'Plan'].map((w, i) => (
          <span
            key={w}
            className="absolute text-white/[0.04] font-black whitespace-nowrap"
            style={{
              top: `${8 + i * 12}%`,
              left: `${10 + (i % 3) * 30}%`,
              fontSize: i === 3 ? '1.5rem' : '1.1rem',
              transform: `rotate(${-5 + i * 2}deg)`,
            }}
          >{w}</span>
        ))}
      </div>

      {/* ── TOP NAVIGATION ── */}
      <div className="relative z-20 w-full px-6 pt-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00CFFF] to-[#9B5DE5] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-[#4169E1]/30">
              K
            </div>
            <span className="text-[1.6rem] font-extrabold text-white tracking-tight leading-none">
              koinexa
            </span>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchView('login')}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white/90 border border-white/15 hover:bg-white/8 hover:text-white backdrop-blur-sm transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => switchView('register')}
              className="px-5 py-2.5 rounded-full text-sm font-black text-white bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] hover:opacity-90 shadow-lg shadow-[#4169E1]/40 transition-all active:scale-95"
            >
              Open an Account
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY — Left welcome + Right auth card ── */}
      <div className="relative z-10 flex-1 flex items-center max-w-[1400px] mx-auto w-full px-6 pb-10 pt-8 gap-8 lg:gap-16">

        {/* ════ LEFT PANEL ════ */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 animate-[fadeInLeft_0.7s_ease_both]">

          <div>
            <h1 className="text-[3.8rem] leading-[1.05] font-black text-white tracking-tight mb-4">
              Welcome to<br />
              <span className="bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-transparent bg-clip-text">
                Koinexa
              </span>
            </h1>
            <div className="w-20 h-[3px] rounded-full bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] mb-6 opacity-80" />
            <p className="text-[1.1rem] font-bold text-white/90 mb-3 leading-snug">
              The student social platform<br />for India's top colleges.
            </p>
            <p className="text-sm font-normal text-white/55 leading-relaxed max-w-sm">
              Share knowledge, solve doubts, discover opportunities and build connections that last a lifetime.
            </p>
          </div>

          {/* Feature vertical list */}
          <div className="flex flex-col gap-3">
            {featureItems.map((f) => (
              <div key={f.label} className="flex items-center gap-4 group cursor-default">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${f.color} ${f.bg} group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{f.label}</p>
                  <p className="text-xs text-white/40 font-medium">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quote Card */}
          <div className="mt-2 relative overflow-hidden rounded-[22px] border border-white/10 bg-[#000]/45 backdrop-blur-xl py-4 px-5 shadow-xl max-w-sm">
            {/* dot grid accent */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-30 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="relative z-10 flex items-start gap-3">
              <Quote className="w-7 h-7 text-[#4169E1] opacity-60 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/85 italic font-medium leading-relaxed">
                  "Alone we can do so little; together we can do so much."
                </p>
                <p className="text-xs font-bold text-[#9B5DE5] mt-2">— Helen Keller</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL — AUTH CARD ════ */}
        <div className="w-full max-w-[420px] shrink-0 animate-[fadeInRight_0.7s_0.15s_ease_both] opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="bg-[#0D0D18]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.7)]">

            {/* ── Error Message ── */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold animate-[fadeIn_0.3s_ease]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <div className="space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black text-white">
                    Log in to <span className="bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] text-transparent bg-clip-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1.5 font-medium">Glad to see you back! 👋</p>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Email / Username</label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 focus-within:bg-white/[0.06] transition-all">
                    <Mail className="w-4 h-4 text-white/30 shrink-0" />
                    <input
                      type="email"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Password</label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 focus-within:bg-white/[0.06] transition-all">
                    <Lock className="w-4 h-4 text-white/30 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none font-medium"
                    />
                    <button onClick={() => setShowPassword(p => !p)} className="text-white/30 hover:text-white/70 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button className="text-[11px] text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">Forgot password?</button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-[#4169E1]/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Log In</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[11px] text-white/30 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Google Button */}
                <button className="w-full py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 4.4-5.8 7.5-11.3 7.5C17 35.5 11 29.5 11 22.5S17 9.5 24 9.5c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 4.2 29.2 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-2z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 5.2 29.2 3 24 3 16.1 3 9.3 7.9 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 43c5.1 0 9.8-2 13.2-5.1l-6.1-5.2C29.2 34.7 26.7 35.5 24 35.5c-5.4 0-9.6-3.1-11.3-7.5l-6.5 5C9.3 40 16.1 43 24 43z" />
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.5l6.1 5.2C41.9 35.1 44 28.9 44 22c0-1.3-.1-2.7-.4-2z" />
                  </svg>
                  Sign in with Google
                </button>

                {/* Switch to register */}
                <p className="text-center text-xs text-white/40 font-medium">
                  Don't have an account?{' '}
                  <button onClick={() => switchView('register')} className="text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">
                    Create one
                  </button>
                </p>
              </div>
            )}

            {/* ── REGISTER VIEW ── */}
            {view === 'register' && (
              <div className="space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black text-white">
                    Join <span className="bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] text-transparent bg-clip-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1.5 font-medium">Create your student account 🎓</p>
                </div>

                {[
                  { label: 'Full Name', placeholder: 'Your full name', value: regName, set: setRegName, icon: <User className="w-4 h-4 text-white/30 shrink-0" />, type: 'text' },
                  { label: 'Email Address', placeholder: 'Your email address', value: regEmail, set: setRegEmail, icon: <Mail className="w-4 h-4 text-white/30 shrink-0" />, type: 'email' },
                  { label: 'Password', placeholder: 'Create a password (min 6 chars)', value: regPass, set: setRegPass, icon: <Lock className="w-4 h-4 text-white/30 shrink-0" />, type: 'password' },
                  { label: 'Confirm Password', placeholder: 'Repeat your password', value: regConfirm, set: setRegConfirm, icon: <Lock className="w-4 h-4 text-white/30 shrink-0" />, type: 'password' },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider">{f.label}</label>
                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                      {f.icon}
                      <input type={f.type} placeholder={f.placeholder} value={f.value}
                        onChange={e => f.set(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none font-medium" />
                    </div>
                  </div>
                ))}

                <button onClick={handleRegisterNext} disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-[#4169E1]/30 transition-all active:scale-[0.98] disabled:opacity-50">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-xs text-white/40 font-medium">
                  Already have an account?{' '}
                  <button onClick={() => switchView('login')} className="text-[#9B5DE5] font-bold hover:text-[#00CFFF] transition-colors">Sign in</button>
                </p>
              </div>
            )}

            {/* ── REGISTER DETAILS VIEW ── */}
            {view === 'register_details' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-black text-white">Setup Your Profile</h2>
                  <p className="text-xs text-white/50 mt-1">One more step! Tell us about yourself.</p>
                </div>

                {/* School / College toggle */}
                <div className="flex gap-2">
                  {(['school', 'college'] as const).map(t => (
                    <button key={t} onClick={() => setStudentType(t)}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all capitalize ${studentType === t ? 'bg-gradient-to-r from-[#4169E1] to-[#9B5DE5] border-transparent text-white shadow-md' : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white'}`}>
                      {t} Student
                    </button>
                  ))}
                </div>

                {studentType === 'school' && (
                  <div className="space-y-3">
                    {[{ p: 'Class (e.g. 10th, 12th)', v: schoolClass, s: setSchoolClass }, { p: 'Board (e.g. CBSE, ICSE)', v: board, s: setBoard }].map(f => (
                      <div key={f.p} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                        <input type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                      </div>
                    ))}
                  </div>
                )}
                {studentType === 'college' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                      <input type="text" placeholder="College Name" value={collegeName} onChange={e => setCollegeName(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                        <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                      </div>
                      <div className="w-20 flex items-center gap-2 px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                        <input type="number" min={1} max={8} placeholder="Sem" value={semester} onChange={e => setSemester(Number(e.target.value))}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {(studentType === 'school' || studentType === 'college') && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] font-bold text-[#00CFFF] uppercase tracking-wider">Personalize your feed</p>
                    {[{ p: 'Skills (comma separated)', v: skills, s: setSkills }, { p: 'Interests (comma separated)', v: interests, s: setInterests }, { p: 'Hobbies (comma separated)', v: hobbies, s: setHobbies }].map(f => (
                      <div key={f.p} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#4169E1]/60 transition-all">
                        <input type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" />
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleCompleteRegistration} disabled={isLoading || !studentType}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-[#4169E1]/30 transition-all active:scale-[0.98] disabled:opacity-50">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /><span>Complete Registration</span></>}
                </button>

                <button onClick={() => switchView('register')} className="w-full text-center text-xs text-white/30 hover:text-[#00CFFF] font-medium transition-colors">
                  ← Back
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
