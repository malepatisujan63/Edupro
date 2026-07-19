import React, { useState } from 'react';
import { Users, BookOpen, Rocket, Quote, Mail, Lock, Eye, EyeOff, Loader, AlertTriangle, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/supabaseService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';

interface LandingPageProps { onLoginSuccess: (user: any) => void; }
type AuthView = 'login' | 'register' | 'register_details';

const BG = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop';

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
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
  const [hobbies, setHobbies] = useState('');

  const go = (v: AuthView) => { setView(v); setErrorMsg(''); };

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErrorMsg('Please enter your email and password.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const user = await fetchUserProfileByEmail(email.trim().toLowerCase());
      if (!user) { setErrorMsg('No account found with that email.'); return; }
      if (user.accountStatus === 'suspended') { setErrorMsg('Your account is currently suspended for violating our terms of service.'); return; }
      if (!await verifyPassword(password, user.password)) { setErrorMsg('Incorrect password.'); return; }
      onLoginSuccess(user);
    } catch (e: any) { setErrorMsg(e.message || 'Login failed.'); }
    finally { setIsLoading(false); }
  };

  const handleRegisterNext = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPass) { setErrorMsg('Please fill all fields.'); return; }
    if (regPass.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (regPass !== regConfirm) { setErrorMsg('Passwords do not match.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      if (await fetchUserProfileByEmail(regEmail.trim().toLowerCase())) { setErrorMsg('Email already registered.'); return; }
      setView('register_details');
    } catch (e: any) { setErrorMsg(e.message); }
    finally { setIsLoading(false); }
  };

  const handleComplete = async () => {
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
      try { await saveUserProfile(newUser); } catch (e: any) { console.warn(e); }
      globalSocialGraph.addStudent(newUser);
      const loc = isSchool ? `${newUser.schoolClass} • ${newUser.board}` : `${newUser.college} • ${newUser.department}`;
      globalPlatformTrie.indexItem({ id: newUser.id, title: newUser.name, subtitle: loc, type: 'user', tags: [...newUser.badges, ...newUser.skills], avatarUrl: newUser.avatarUrl });
      onLoginSuccess(newUser);
    } catch (e: any) { setErrorMsg(e.message || 'Registration failed.'); }
    finally { setIsLoading(false); }
  };

  /* ─ Shared input style ─ */
  const inp = `
    w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none
  `.trim();

  const field = (icon: React.ReactNode, children: React.ReactNode) => (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03]
      focus-within:border-white/25 focus-within:bg-white/[0.06] transition-all duration-200">
      <span className="text-white/25 shrink-0">{icon}</span>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#080810', fontFamily: "'Inter', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes lp-in-l { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lp-in-r { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lp-in-u { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .lp-l  { animation: lp-in-l 0.65s cubic-bezier(.22,1,.36,1) both; }
        .lp-r  { animation: lp-in-r 0.65s 0.1s cubic-bezier(.22,1,.36,1) both; opacity:0; animation-fill-mode:forwards; }
        .lp-u  { animation: lp-in-u 0.65s 0.2s cubic-bezier(.22,1,.36,1) both; opacity:0; animation-fill-mode:forwards; }
        .grad-text {
          background: linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .kx-feat:hover .kx-feat-arrow { opacity: 1; transform: translateX(3px); }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        <img src={BG} alt="" className="w-full h-full object-cover object-center" style={{ opacity: 0.35, filter: 'saturate(0.8)' }} />
        {/* Gradient fades */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #080810 40%, rgba(8,8,16,0.82) 62%, rgba(8,8,16,0.35) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,8,16,0.9) 0%, transparent 45%)' }} />
        {/* Single subtle blue glow bottom-left */}
        <div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 lg:px-14 pt-6 lp-l">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-[1.1rem] shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            K
          </div>
          <span className="text-[1.45rem] font-bold text-white tracking-tight">koinexa</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => go('login')} className="btn-secondary py-2.5">
            Sign In
          </button>
          <button onClick={() => go('register')} className="btn-primary py-2.5">
            Open an Account
          </button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="relative z-10 flex-1 flex items-center gap-10 lg:gap-20 px-8 lg:px-14 py-8 max-w-[1320px] mx-auto w-full">

        {/* ════ LEFT ════ */}
        <div className="flex-1 flex flex-col gap-8 lp-l">

          {/* Headline */}
          <div>
            <h1 className="font-black text-white tracking-tight leading-[1.06] mb-5"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)' }}>
              Welcome to<br />
              <span className="grad-text">Koinexa</span>
            </h1>
            {/* Underline accent */}
            <div className="w-16 h-[2px] rounded-full mb-6"
              style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
            <p className="text-[1.05rem] font-semibold text-white/80 leading-snug mb-3">
              The student social platform<br />for India's top colleges.
            </p>
            <p className="text-sm text-white/45 leading-relaxed max-w-[320px] font-normal">
              Share knowledge, solve doubts, discover opportunities and build connections that last a lifetime.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2.5">
            {[
              { icon: <Users className="w-4 h-4" />, label: 'Connect', sub: 'with peers across India', c: '#818cf8' },
              { icon: <BookOpen className="w-4 h-4" />, label: 'Learn', sub: 'together in study hubs', c: '#60a5fa' },
              { icon: <Rocket className="w-4 h-4" />, label: 'Grow', sub: 'your career & network', c: '#c084fc' },
            ].map((f, i) => (
              <div key={f.label} className="kx-feat flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-200 cursor-default group max-w-[340px]"
                style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.c}14`, border: `1px solid ${f.c}28`, color: f.c }}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{f.label}</p>
                  <p className="text-xs text-white/40">{f.sub}</p>
                </div>
                <ArrowRight className="kx-feat-arrow w-4 h-4 text-white/20 opacity-0 transition-all duration-200 shrink-0" />
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="lp-u max-w-[340px] relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(rgba(129,140,248,0.6) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="relative flex items-start gap-3">
              <Quote className="w-5 h-5 text-[#6366f1] opacity-60 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/70 italic leading-relaxed font-normal">
                  "Alone we can do so little; together we can do so much."
                </p>
                <p className="text-xs font-semibold text-[#818cf8] mt-2">— Helen Keller</p>
              </div>
            </div>
          </div>

        </div>

        {/* ════ RIGHT — AUTH CARD ════ */}
        <div className="w-full max-w-[400px] shrink-0 lp-r">
          <div className="glass-card p-8">

            {/* Error */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}

            {/* ── LOGIN ── */}
            {view === 'login' && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-[1.45rem] font-black text-white">
                    Log in to <span className="grad-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/35 mt-1.5">Glad to see you back 👋</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Email</label>
                    {field(<Mail className="w-4 h-4" />,
                      <input type="email" placeholder="your@email.com" value={email}
                        onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className={inp} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Password</label>
                    {field(<Lock className="w-4 h-4" />,
                      <>
                        <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password}
                          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                          className={inp} />
                        <button onClick={() => setShowPwd(p => !p)} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                    <div className="text-right pt-0.5">
                      <button className="text-[11px] font-medium text-[#818cf8] hover:text-[#60a5fa] transition-colors">Forgot password?</button>
                    </div>
                  </div>
                </div>

                <button onClick={handleLogin} disabled={isLoading} className="btn-primary w-full py-4 text-base">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Log In</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/25 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <button className="w-full py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.96]">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 4.4-5.8 7.5-11.3 7.5C17 35.5 11 29.5 11 22.5S17 9.5 24 9.5c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 4.2 29.2 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-2z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 5.2 29.2 3 24 3 16.1 3 9.3 7.9 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 43c5.1 0 9.8-2 13.2-5.1l-6.1-5.2C29.2 34.7 26.7 35.5 24 35.5c-5.4 0-9.6-3.1-11.3-7.5l-6.5 5C9.3 40 16.1 43 24 43z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.5l6.1 5.2C41.9 35.1 44 28.9 44 22c0-1.3-.1-2.7-.4-2z"/>
                  </svg>
                  Sign in with Google
                </button>

                <p className="text-center text-xs text-white/30">
                  Don't have an account?{' '}
                  <button onClick={() => go('register')} className="text-[#818cf8] font-semibold hover:text-[#60a5fa] transition-colors">Create one</button>
                </p>
              </div>
            )}

            {/* ── REGISTER ── */}
            {view === 'register' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-[1.45rem] font-black text-white">
                    Join <span className="grad-text">Koinexa</span>
                  </h2>
                  <p className="text-xs text-white/35 mt-1.5">Create your student account 🎓</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', ph: 'Your full name', val: regName, set: setRegName, icon: <User className="w-4 h-4" />, type: 'text' },
                    { label: 'Email', ph: 'your@email.com', val: regEmail, set: setRegEmail, icon: <Mail className="w-4 h-4" />, type: 'email' },
                    { label: 'Password', ph: 'Min 6 characters', val: regPass, set: setRegPass, icon: <Lock className="w-4 h-4" />, type: 'password' },
                    { label: 'Confirm Password', ph: 'Repeat password', val: regConfirm, set: setRegConfirm, icon: <Lock className="w-4 h-4" />, type: 'password' },
                  ].map(f => (
                    <div key={f.label} className="space-y-1">
                      <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{f.label}</label>
                      {field(f.icon, <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className={inp} />)}
                    </div>
                  ))}
                </div>
                <button onClick={handleRegisterNext} disabled={isLoading} className="btn-primary w-full py-4 text-base">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-center text-xs text-white/30">
                  Already have an account?{' '}
                  <button onClick={() => go('login')} className="text-[#818cf8] font-semibold hover:text-[#60a5fa] transition-colors">Sign in</button>
                </p>
              </div>
            )}

            {/* ── REGISTER DETAILS ── */}
            {view === 'register_details' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-black text-white">Setup Profile</h2>
                  <p className="text-xs text-white/35 mt-1">One last step!</p>
                </div>

                <div className="flex gap-2">
                  {(['school', 'college'] as const).map(t => (
                    <button key={t} onClick={() => setStudentType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border capitalize transition-all duration-200 ${studentType === t ? 'text-white border-transparent' : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70'}`}
                      style={studentType === t ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                      {t} Student
                    </button>
                  ))}
                </div>

                {studentType === 'school' && (
                  <div className="space-y-2.5">
                    {[{ p: 'Class (e.g. 10th, 12th)', v: schoolClass, s: setSchoolClass }, { p: 'Board (e.g. CBSE, ICSE)', v: board, s: setBoard }].map(f =>
                      field(null, <input key={f.p} type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)} className={inp} />)
                    )}
                  </div>
                )}
                {studentType === 'college' && (
                  <div className="space-y-2.5">
                    {field(null, <input type="text" placeholder="College Name" value={collegeName} onChange={e => setCollegeName(e.target.value)} className={inp} />)}
                    <div className="flex gap-2">
                      {field(null, <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)} className={`${inp} flex-1`} />)}
                      <div className="w-20 flex items-center px-3 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] focus-within:border-white/25 transition-all">
                        <input type="number" min={1} max={8} placeholder="Sem" value={semester} onChange={e => setSemester(Number(e.target.value))} className={inp} />
                      </div>
                    </div>
                  </div>
                )}

                {(studentType === 'school' || studentType === 'college') && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">Personalize your feed</p>
                    {[{ p: 'Skills (comma separated)', v: skills, s: setSkills }, { p: 'Interests (comma separated)', v: interests, s: setInterests }, { p: 'Hobbies (comma separated)', v: hobbies, s: setHobbies }].map(f =>
                      field(null, <input key={f.p} type="text" placeholder={f.p} value={f.v} onChange={e => f.s(e.target.value)} className={inp} />)
                    )}
                  </div>
                )}

                <button onClick={handleComplete} disabled={isLoading || !studentType} className="btn-primary w-full py-4 text-base">
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /><span>Complete Registration</span></>}
                </button>
                <button onClick={() => go('register')} className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors">← Back</button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
