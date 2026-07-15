// src/components/auth/AuthModal.tsx  — Real Email OTP + EduNetwork Color Identity
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Trash2, Loader, Lock, Mail, Send } from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfile, fetchUserProfileByEmail } from '../../lib/firestoreService';
import { sendOtpEmail } from '../../lib/emailService';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLoginSuccess: (user: any) => void;
  onDeleteAccount: () => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const OTP_EXPIRY_SECONDS = 120; // 2 minutes

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen, onClose, currentUser, onLoginSuccess, onDeleteAccount,
}) => {
  type Step = 'SIGN_IN' | 'GOOGLE_OAUTH' | 'REG_PASSWORD' | 'REG_DETAILS' | 'OTP_VERIFY_REG' | 'OTP_VERIFY_LOGIN' | 'LOGGED_IN';
  const [step, setStep] = useState<Step>('SIGN_IN');

  const [googleUser, setGoogleUser] = useState<{ uid: string; name: string; email: string; picture: string } | null>(null);
  const [loginUser,  setLoginUser]  = useState<any>(null);

  // Input fields
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');

  // New Registration Details
  const [studentType, setStudentType] = useState<'school' | 'college' | ''>('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState(1);
  const [schoolClass, setSchoolClass] = useState('');
  const [board, setBoard] = useState('');
  const [skills, setSkills] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [interests, setInterests] = useState('');

  // OTP boxes — 6 individual digits
  const [otpDigits, setOtpDigits]   = useState<string[]>(['','','','','','']);
  const [correctOtp, setCorrectOtp] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [errorMsg,           setErrorMsg]           = useState('');
  const [successMsg,         setSuccessMsg]          = useState('');
  const [isLoading,          setIsLoading]          = useState(false);
  const [isSendingOtp,       setIsSendingOtp]       = useState(false);
  const [isGoogleLoading,    setIsGoogleLoading]    = useState(false);

  // CAPTCHA
  const [captchaChecked,    setCaptchaChecked]   = useState(false);
  const [captchaVerifying,  setCaptchaVerifying] = useState(false);

  // OTP countdown timer
  const [countdown,        setCountdown]       = useState(0);
  const [canResend,        setCanResend]        = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // ── Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('SIGN_IN'); setErrorMsg(''); setSuccessMsg('');
      setOtpDigits(['','','','','','']); setCountdown(0); setCanResend(false);
      setCaptchaChecked(false);
    }
  }, [isOpen]);

  // ── Countdown timer
  const startCountdown = useCallback(() => {
    setCountdown(OTP_EXPIRY_SECONDS); setCanResend(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // ── Parse Google JWT
  const parseJwt = (token: string) => {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    } catch { return null; }
  };

  // ── Google Credential Callback
  const handleGoogleCredential = async (response: { credential: string }) => {
    setIsGoogleLoading(false);
    const payload = parseJwt(response.credential);
    if (!payload) { setErrorMsg('Google sign-in failed. Please try again.'); return; }
    const uid = payload.sub || payload.email;

    try {
      const existingUser = await fetchUserProfile(uid);
      if (existingUser) {
        setErrorMsg('This Google account is already registered. Please sign in with your email & password.');
        setStep('SIGN_IN'); return;
      }
    } catch {}

    setGoogleUser({
      uid, name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=6C63FF&color=fff`,
    });
    setErrorMsg('');
    setStep('REG_PASSWORD');
  };

  // ── Google GIS init
  useEffect(() => {
    if (!isOpen || step !== 'GOOGLE_OAUTH') return;
    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'filled_black', size: 'large', shape: 'pill', width: 360, text: 'signup_with' });
      }
    };
    window.google ? init() : (() => {
      const t = setInterval(() => { if (window.google) { clearInterval(t); init(); } }, 200);
      return () => clearInterval(t);
    })();
  }, [isOpen, step]);

  if (!isOpen) return null;

  // ── CAPTCHA click
  const handleCaptchaClick = () => {
    if (captchaChecked || captchaVerifying) return;
    setCaptchaVerifying(true);
    setTimeout(() => { setCaptchaVerifying(false); setCaptchaChecked(true); }, 1100);
  };

  // ── OTP box input handler
  const handleOtpDigit = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const getEnteredOtp = () => otpDigits.join('');

  // ── Send OTP email helper
  const generateAndSendOtp = async (toEmail: string, toName: string, purpose: 'registration' | 'login') => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCorrectOtp(code);
    setIsSendingOtp(true);
    setErrorMsg('');
    try {
      await sendOtpEmail(toEmail, toName, code, purpose);
      setSuccessMsg(`OTP sent to ${toEmail} ✓`);
      startCountdown();
      setOtpDigits(['','','','','','']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(`Failed to send OTP: ${err?.text || err?.message || 'Unknown error'}`);
      throw err;
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Login flow
  const handleCustomLogin = async () => {
    if (!email.trim() || !password.trim()) { setErrorMsg('Enter your email and password.'); return; }
    if (!captchaChecked) { setErrorMsg('Please verify you are not a robot.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const user = await fetchUserProfileByEmail(email.trim().toLowerCase());
      if (!user || user.password !== password) { setErrorMsg('Incorrect email or password.'); return; }
      setLoginUser(user);
      await generateAndSendOtp(user.email, user.name, 'login');
      setStep('OTP_VERIFY_LOGIN');
    } catch (err: any) {
      if (!err?.text) setErrorMsg(`Login failed: ${err?.message || 'Unknown error'}`);
    } finally { setIsLoading(false); }
  };

  // ── Register — create password step, then collect details
  const handleNextToDetails = async () => {
    if (!registerPassword || registerPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (registerPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (!googleUser) return;
    setStep('REG_DETAILS');
  };

  const handleSendRegisterOtp = async () => {
    if (!studentType) { setErrorMsg('Please select School or College.'); return; }
    if (!googleUser) return;
    setIsLoading(true);
    try {
      await generateAndSendOtp(googleUser.email, googleUser.name, 'registration');
      setStep('OTP_VERIFY_REG');
    } catch {} finally { setIsLoading(false); }
  };

  // ── Verify registration OTP & save
  const handleVerifyAndRegister = async () => {
    const entered = getEnteredOtp();
    if (entered !== correctOtp) { setErrorMsg('Incorrect OTP. Please try again.'); return; }
    if (!googleUser) return;
    setIsLoading(true); setErrorMsg('');
    try {
      const isSchool = studentType === 'school';
      const newUser = {
        uid: googleUser.uid, id: `usr_${Date.now().toString().slice(-6)}`,
        name: googleUser.name, email: googleUser.email,
        password: registerPassword, phone: '',
        
        studentType: studentType as 'school' | 'college',
        college: isSchool ? '' : (collegeName || 'Unknown College'),
        department: isSchool ? '' : (department || 'General'),
        semester: isSchool ? 0 : semester,
        
        schoolClass: isSchool ? schoolClass : '',
        board: isSchool ? board : '',
        
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        hobbies: hobbies.split(',').map(s => s.trim()).filter(Boolean),
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),

        studyMates: [],
        pendingStudyMateRequests: [],
        createdCommunities: [],

        avatarUrl: googleUser.picture,
        role: 'student' as const, reputationPoints: 100,
        badges: ['Verified Student', 'Google Verified'], createdAt: new Date(),
      };
      globalRegistrationHash.registerUser(googleUser.email, '', newUser);
      await saveUserProfile(newUser);
      globalSocialGraph.addStudent(newUser);
      
      const locationInfo = isSchool ? `${newUser.schoolClass} • ${newUser.board}` : `${newUser.college} • ${newUser.department}`;
      globalPlatformTrie.indexItem({ id: newUser.id, title: newUser.name, subtitle: locationInfo, type: 'user', tags: [...newUser.badges, ...(newUser.skills||[])], avatarUrl: newUser.avatarUrl });
      onLoginSuccess(newUser);
      setStep('LOGGED_IN');
    } catch (err: any) { setErrorMsg(`Registration failed: ${err?.message || 'Unknown'}`); }
    finally { setIsLoading(false); }
  };

  // ── Verify login OTP
  const handleVerifyLoginOtp = () => {
    if (getEnteredOtp() !== correctOtp) { setErrorMsg('Incorrect OTP. Please try again.'); return; }
    if (!loginUser) { setStep('SIGN_IN'); return; }
    onLoginSuccess(loginUser);
    setStep('LOGGED_IN');
  };

  const stepLabel: Record<Step, string> = {
    SIGN_IN: 'Sign In to EduNetwork',
    GOOGLE_OAUTH: 'Register via Google',
    REG_PASSWORD: 'Create Password',
    REG_DETAILS: 'Setup Student Profile',
    OTP_VERIFY_REG: 'Verify Email (Registration)',
    OTP_VERIFY_LOGIN: 'Verify Identity (Login)',
    LOGGED_IN: 'Authenticated successfully',
  };

  const OtpBoxes = ({ onSubmit }: { onSubmit: () => void }) => (
    <div className="space-y-4">
      {successMsg && (
        <div className="flex items-center gap-2 text-[11px] text-[#00CFFF] font-bold px-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{successMsg}</span>
        </div>
      )}
      <div className="flex gap-2 justify-center">
        {otpDigits.map((d, i) => (
          <input key={i}
            ref={el => { otpRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleOtpDigit(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            className="w-11 h-14 text-center text-xl font-black rounded-2xl border-2 bg-[#0D0D0D] text-white outline-none transition-all
              border-[rgba(99,179,237,0.2)] focus:border-[#00CFFF] focus:shadow-[0_0_0_3px_rgba(108,99,255,0.25)]"
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-white/40">
          {countdown > 0 ? `Expires in ${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}` : 'OTP expired'}
        </span>
        {canResend && (
          <button onClick={() => step === 'OTP_VERIFY_REG'
            ? generateAndSendOtp(googleUser!.email, googleUser!.name, 'registration')
            : generateAndSendOtp(loginUser?.email, loginUser?.name, 'login')}
            disabled={isSendingOtp}
            className="text-[#00CFFF] font-bold hover:text-[#4169E1] transition-colors">
            {isSendingOtp ? 'Sending...' : 'Resend OTP'}
          </button>
        )}
      </div>
      <button onClick={onSubmit} disabled={getEnteredOtp().length < 6 || isLoading}
        className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all
          bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] hover:opacity-90
          disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#00CFFF]/20">
        {isLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Continue →'}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-[420px] glass-panel rounded-[32px] overflow-hidden animate-scaleUp">

        {/* Header — EduNetwork gradient */}
        <div className="relative p-6 bg-gradient-to-br from-[#00CFFF]/90 via-[#9B5DE5] to-[#4169E1]/70 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-50" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all text-sm font-bold z-10">✕</button>
          <div className="relative flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-black tracking-tight">EduNetwork</h2>
          </div>
          <p className="relative text-xs text-white/75 font-medium ml-10">{stepLabel[step]}</p>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Error banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#00CFFF]/10 border border-[#00CFFF]/30 text-[#00CFFF] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </div>
          )}

          {/* ── SIGN IN ── */}
          {step === 'SIGN_IN' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Email — kx-field: flowing gradient border on focus */}
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <Mail className="w-4 h-4 text-[#4169E1] shrink-0" />
                  <input type="email" placeholder="Student email address" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
                {/* Password */}
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <Lock className="w-4 h-4 text-[#4169E1] shrink-0" />
                  <input type="password" placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomLogin()}
                    className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
              </div>

              {/* CAPTCHA */}
              <div onClick={handleCaptchaClick}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-[rgba(99,179,237,0.12)] hover:border-[#00CFFF]/40 cursor-pointer select-none transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    captchaChecked ? 'bg-[#00CFFF] border-[#00CFFF]' : 'border-white/20 bg-black/20'}`}>
                    {captchaVerifying && <Loader className="w-3 h-3 text-white animate-spin" />}
                    {captchaChecked && <CheckCircle2 className="w-4 h-4 text-[#05050A]" />}
                  </div>
                  <span className="text-xs font-bold text-white/80">I'm not a robot</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#00CFFF]" />
                  <span className="text-[9px] text-white/25 font-bold">PROTECTED</span>
                </div>
              </div>

              <button onClick={handleCustomLogin} disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Sign In & Send OTP</span></>}
              </button>

              <div className="flex items-center gap-3 text-white/20 text-xs">
                <div className="flex-1 h-px bg-white/8" /><span>OR</span><div className="flex-1 h-px bg-white/8" />
              </div>

              <button onClick={() => { setStep('GOOGLE_OAUTH'); setErrorMsg(''); }}
                className="w-full py-3.5 rounded-2xl bg-white/5 border border-[rgba(108,99,255,0.25)] text-white font-bold text-sm hover:border-[#00CFFF]/60 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00CFFF]" />
                <span>New here? Register with Google</span>
              </button>
            </div>
          )}

          {/* ── GOOGLE OAUTH ── */}
          {step === 'GOOGLE_OAUTH' && (
            <div className="space-y-5 text-center">
              <p className="text-sm font-bold text-white">Continue with your Google account</p>
              <p className="text-xs text-white/40">We'll verify your student email via Google, then set your password.</p>
              <div className="flex justify-center min-h-[48px]">
                {isGoogleLoading ? <Loader className="w-5 h-5 animate-spin text-white/50" /> : <div ref={googleBtnRef} />}
              </div>
              {(!window.google || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE')) && (
                <div className="p-3 rounded-2xl bg-[#00CFFF]/10 border border-[#00CFFF]/25 text-xs text-white/60 text-center">
                  <p className="font-bold text-white mb-1">⚙️ Google Client ID not configured</p>
                  <code className="block text-[10px] bg-[#0D0D0D] rounded-xl p-2 text-[#4169E1] font-mono">VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com</code>
                </div>
              )}
              <button onClick={() => setStep('SIGN_IN')} className="text-xs text-white/30 hover:text-white/60 underline">← Back to Sign In</button>
            </div>
          )}

          {/* ── SET PASSWORD (Register Step 2) ── */}
          {step === 'REG_PASSWORD' && googleUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0D0D0D] border border-[#00CFFF]/30">
                <img src={googleUser.picture} alt="" className="w-10 h-10 rounded-full border-2 border-[#00CFFF]/40 object-cover" />
                <div>
                  <p className="text-sm font-bold text-white">{googleUser.name}</p>
                  <p className="text-xs text-[#00CFFF] font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{googleUser.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-3.5" />
                  <input type="password" placeholder="Create password (min 6 chars)" value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[rgba(99,179,237,0.15)] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00CFFF] transition-all font-medium" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-3.5" />
                  <input type="password" placeholder="Confirm password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[rgba(99,179,237,0.15)] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00CFFF] transition-all font-medium" />
                </div>
              </div>
              <button onClick={handleNextToDetails}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 flex items-center justify-center gap-2">
                <span>Continue to Profile Details →</span>
              </button>
            </div>
          )}

          {/* ── SET DETAILS (Register Step 3) ── */}
          {step === 'REG_DETAILS' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setStudentType('school')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    studentType === 'school' ? 'bg-[#4169E1] border-[#00CFFF] text-white' : 'bg-[#0D0D0D] border-white/20 text-white/50'
                  }`}
                >
                  School Student
                </button>
                <button
                  onClick={() => setStudentType('college')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    studentType === 'college' ? 'bg-[#4169E1] border-[#00CFFF] text-white' : 'bg-[#0D0D0D] border-white/20 text-white/50'
                  }`}
                >
                  College Student
                </button>
              </div>

              {studentType === 'school' && (
                <div className="space-y-3">
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="Class (e.g. 10th, 12th)" value={schoolClass} onChange={e => setSchoolClass(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="Board (e.g. CBSE, ICSE, State)" value={board} onChange={e => setBoard(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                </div>
              )}

              {studentType === 'college' && (
                <div className="space-y-3">
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="College Name" value={collegeName} onChange={e => setCollegeName(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                  <div className="flex gap-2">
                    <div className="kx-field flex-1 flex items-center gap-2 px-3.5">
                      <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                    </div>
                    <div className="kx-field w-24 flex items-center gap-2 px-3.5">
                      <input type="number" min={1} max={8} placeholder="Sem" value={semester} onChange={e => setSemester(Number(e.target.value))}
                        className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                    </div>
                  </div>
                </div>
              )}

              {(studentType === 'school' || studentType === 'college') && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-[#00CFFF]">Let's personalize your feed!</p>
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="Skills (comma separated)" value={skills} onChange={e => setSkills(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="Interests (comma separated)" value={interests} onChange={e => setInterests(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                  <div className="kx-field flex items-center gap-2 px-3.5">
                    <input type="text" placeholder="Hobbies (comma separated)" value={hobbies} onChange={e => setHobbies(e.target.value)}
                      className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                  </div>
                </div>
              )}

              <button onClick={handleSendRegisterOtp} disabled={isLoading || isSendingOtp || !studentType}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading || isSendingOtp ? <Loader className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Send Verification OTP</span></>}
              </button>
              <p className="text-center text-xs text-white/30">OTP will be sent to <span className="text-[#4169E1]">{googleUser?.email}</span></p>
            </div>
          )}

          {/* ── OTP VERIFY REGISTER ── */}
          {step === 'OTP_VERIFY_REG' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <p className="text-sm font-bold text-white">Check your email</p>
                <p className="text-xs text-white/40 mt-1">OTP sent to <span className="text-[#4169E1]">{googleUser?.email}</span></p>
              </div>
              <OtpBoxes onSubmit={handleVerifyAndRegister} />
            </div>
          )}

          {/* ── OTP VERIFY LOGIN ── */}
          {step === 'OTP_VERIFY_LOGIN' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#4169E1]/15 border border-[#4169E1]/30 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-[#4169E1]" />
                </div>
                <p className="text-sm font-bold text-white">Two-Factor Verification</p>
                <p className="text-xs text-white/40 mt-1">OTP sent to <span className="text-[#4169E1]">{loginUser?.email}</span></p>
              </div>
              <OtpBoxes onSubmit={handleVerifyLoginOtp} />
            </div>
          )}

          {/* ── LOGGED IN ── */}
          {step === 'LOGGED_IN' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-[#00CFFF]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Welcome back, {currentUser?.name || googleUser?.name}! 🎓</h3>
                <p className="text-xs text-white/40 mt-1">Email OTP verified — secure 2FA login complete.</p>
              </div>
              <div className="pt-3 border-t border-white/8 flex flex-col gap-2">
                <button onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 shadow-lg shadow-[#00CFFF]/20">
                  Enter EduNetwork →
                </button>
                <button onClick={() => { if (confirm('Delete your account permanently?')) { onDeleteAccount(); onClose(); } }}
                  className="w-full py-2 rounded-2xl bg-[#00CFFF]/10 hover:bg-[#00CFFF]/20 border border-[#00CFFF]/25 text-[#00CFFF] text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
