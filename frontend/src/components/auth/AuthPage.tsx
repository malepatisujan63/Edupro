import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  User as UserIcon,
  Lock,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FlowingBorderGlow } from '../common/FlowingBorderGlow';

interface AuthPageProps {
  onBackToHome?: () => void;
  onSuccessRedirect?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBackToHome, onSuccessRedirect }) => {
  const { login, verifyLoginOtp, resendLoginOtp, commitUser, register, registerMentor, forgotPassword, verifyOtp, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Role toggle: 'faculty' (Mentor & Faculty) | 'student' (Student)
  const [roleTab, setRoleTab] = useState<'faculty' | 'student'>('faculty');

  // Mode: 'login' | 'register' | 'forgot_password' | 'login_otp'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'login_otp'>('login');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ─── 5-SECOND FLOWING KOINEXA 1PX BORDER GLOW ANIMATION STATE ───
  const [isAuthenticatingGlow, setIsAuthenticatingGlow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // ─── LOGIN STATE (Email / Admin identifier & Password) ───
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ─── LOGIN OTP STATE (MANDATORY 2-STEP VERIFICATION) ───
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [maskedContactEmail, setMaskedContactEmail] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── REGISTER STATE ───
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regContactEmail, setRegContactEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regProofLink1, setRegProofLink1] = useState('');
  const [regProofLink2, setRegProofLink2] = useState('');
  const [regStatement, setRegStatement] = useState('');

  // ─── FORGOT PASSWORD STATE ───
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpStep, setFpStep] = useState<'email' | 'otp' | 'done'>('email');

  // ─── SUBMIT HANDLER: LOGIN (DISPATCHES OTP TO CONTACT EMAIL) ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticatingGlow || isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = loginEmail.trim().toLowerCase();
    if (roleTab === 'student') {
      if (!emailClean.endsWith('@bloom.com')) {
        setErrorMessage('Student account email must end with @bloom.com (e.g. name@bloom.com)');
        return;
      }
    } else {
      if (emailClean.includes('@') && !emailClean.endsWith('@bloom.com')) {
        setErrorMessage('Account email must end with @bloom.com (e.g. name@bloom.com)');
        return;
      }
      if (!emailClean) {
        setErrorMessage('Account email or admin username is required');
        return;
      }
    }

    if (!loginPassword) {
      setErrorMessage('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(
        {
          username: emailClean,
          email: emailClean,
          password: loginPassword,
          portal_type: roleTab === 'faculty' ? 'mentor' : 'student',
        },
        true
      );

      setIsLoading(false);

      if (res.success && res.requires_otp) {
        setOtpIdentifier(res.identifier || emailClean);
        setMaskedContactEmail(res.masked_contact_email || 'your registered contact email');
        setLoginOtpCode('');
        setResendCooldown(60);
        setMode('login_otp');
        setSuccessMessage(res.message || 'Verification code sent to your contact email.');
        return;
      }

      if (res.success && res.user && res.token) {
        setIsAuthenticatingGlow(true);
        setTimeout(() => {
          setIsExiting(true);
        }, 4700);
        setTimeout(() => {
          commitUser(res.user!, res.token!);
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }, 5200);
      } else {
        setErrorMessage(res.error || 'Invalid credentials or account not found.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to reach server. Please check backend connection.');
    }
  };

  // ─── SUBMIT HANDLER: TWO-FACTOR LOGIN OTP VERIFICATION ───
  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticatingGlow || isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = loginOtpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your contact email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyLoginOtp(otpIdentifier || loginEmail.trim().toLowerCase(), cleanCode, true);
      if (res.success && res.user && res.token) {
        setIsLoading(false);
        setIsAuthenticatingGlow(true);

        setTimeout(() => {
          setIsExiting(true);
        }, 4700);

        setTimeout(() => {
          commitUser(res.user!, res.token!);
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }, 5200);
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'Invalid verification code. Please check and try again.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to reach server. Please check your connection.');
    }
  };

  // ─── RESEND LOGIN OTP ───
  const handleResendLoginOtp = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resendLoginOtp(otpIdentifier || loginEmail.trim().toLowerCase());
      if (res.success) {
        setSuccessMessage('A fresh 6-digit verification code has been dispatched to your contact email.');
        if (res.masked_contact_email) {
          setMaskedContactEmail(res.masked_contact_email);
        }
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend verification code');
      }
    } catch {
      setErrorMessage('Network error while requesting code.');
    } finally {
      setIsResending(false);
    }
  };

  // ─── SUBMIT HANDLER: REGISTER ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = regEmail.trim().toLowerCase();
    const contactClean = regContactEmail.trim().toLowerCase();

    // Enforce platform email ends with @bloom.com
    if (!emailClean.endsWith('@bloom.com')) {
      setErrorMessage('Platform account email must end with @bloom.com');
      return;
    }

    // Enforce contact email ends with @gmail.com or @outlook.com
    const validContact = contactClean.endsWith('@gmail.com') || contactClean.endsWith('@outlook.com');
    if (!validContact) {
      setErrorMessage('Contact email must end with @gmail.com or @outlook.com');
      return;
    }

    if (!regFullName.trim()) {
      setErrorMessage('Full name is required');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (!regInstitution.trim()) {
      setErrorMessage(roleTab === 'faculty' ? 'University / Institution name is required' : 'Institution of study is required');
      return;
    }

    if (roleTab === 'faculty') {
      if (!regDepartment.trim()) {
        setErrorMessage('Department is required for faculty / mentor registration');
        return;
      }
      if (!regProofLink1.trim() || (!regProofLink1.startsWith('http://') && !regProofLink1.startsWith('https://'))) {
        setErrorMessage('Compulsory Proof Link 1: Please enter a valid URL to your institutional directory or faculty profile');
        return;
      }
      if (!regProofLink2.trim() || (!regProofLink2.startsWith('http://') && !regProofLink2.startsWith('https://'))) {
        setErrorMessage('Compulsory Proof Link 2: Please enter a valid URL to your academic/research portfolio (Google Scholar, ORCID, etc.)');
        return;
      }
      if (regProofLink1.trim().toLowerCase() === regProofLink2.trim().toLowerCase()) {
        setErrorMessage('Proof Link 1 and Proof Link 2 must be two distinct URLs to verify your academic credentials');
        return;
      }

      setIsLoading(true);
      try {
        const res = await registerMentor({
          name: regFullName.trim(),
          username: regUsername.trim() || undefined,
          email: emailClean,
          contact_email: contactClean,
          password: regPassword,
          institution: regInstitution.trim(),
          department: regDepartment.trim(),
          designation: regDesignation.trim() || 'Faculty Member',
          proof_link_1: regProofLink1.trim(),
          proof_link_2: regProofLink2.trim(),
          statement_of_purpose: regStatement.trim() || undefined,
        });

        if (res.success) {
          setSuccessMessage(
            'Mentor application submitted! Veritas-AI has scraped your proof links and compiled your dossier for Admin review. Once approved, your login access confirmation will be delivered to ' + contactClean + '.'
          );
          setTimeout(() => {
            setMode('login');
          }, 3500);
        } else {
          setErrorMessage(res.error || 'Mentor registration failed.');
        }
      } catch {
        setErrorMessage('Unable to reach server. Please check backend connection.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Student registration
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: regFullName.trim(),
        username: regUsername.trim(),
        email: emailClean,
        contact_email: contactClean,
        password: regPassword,
        college: regInstitution.trim(),
        role: 'student',
        portal_type: 'student',
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Student account created successfully!');
        if (onSuccessRedirect) onSuccessRedirect();
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } catch {
      setErrorMessage('Unable to reach server. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SUBMIT HANDLER: FORGOT PASSWORD (STEP 1: SEND OTP) ───
  const handleForgotPasswordSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = fpEmail.trim().toLowerCase();
    if (!emailClean) {
      setErrorMessage('Please enter your account email (@bloom.com)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(emailClean);
      if (res.success) {
        setSuccessMessage(res.message || 'Recovery code dispatched to your registered contact email.');
        setFpStep('otp');
      } else {
        setErrorMessage(res.error || 'Failed to dispatch reset code.');
      }
    } catch {
      setErrorMessage('Network error while requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SUBMIT HANDLER: FORGOT PASSWORD (STEP 2: RESET PASSWORD) ───
  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fpOtp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    if (!fpNewPassword || fpNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword({
        email: fpEmail.trim().toLowerCase(),
        otp: fpOtp.trim(),
        new_password: fpNewPassword,
      });

      if (res.success) {
        setSuccessMessage('Password successfully updated! You can now log in.');
        setTimeout(() => {
          setMode('login');
          setFpStep('email');
          setLoginEmail(fpEmail.trim().toLowerCase());
          setLoginPassword('');
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to reset password.');
      }
    } catch {
      setErrorMessage('Network error while resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfd] dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden select-none transition-colors duration-200">
      {/* Floating Theme Toggle Switcher on Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer select-none active:scale-90 shadow-md"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-700 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>

      {/* Dynamic Dedicated Architecture Background - Crisp Architectural Studio for Light vs Deep Midnight Corner for Dark */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-500 ${
          theme === 'light' ? 'opacity-95' : 'opacity-85'
        }`}
        style={{
          backgroundImage: theme === 'light' ? "url('/auth-light-minimal.jpg')" : "url('/auth-bg.jpg')",
        }}
      />
      {/* Adaptive Vignette & Readability Gradient */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-white/30 via-transparent to-white/30'
            : 'bg-gradient-to-r from-black/75 via-black/40 to-black/75'
        }`}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-300"
        style={{
          background:
            theme === 'light'
              ? 'radial-gradient(circle at center, transparent 35%, rgba(255,255,255,0.45) 100%)'
              : 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Subtle Ambient Background Glow Elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#0A84FF]/10 dark:bg-[#0A84FF]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center z-10 my-auto">

{/* ── LEFT COLUMN: KOINEXA BRAND LOGO & CENTURY GOTHIC CAPTION ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center justify-center text-center px-4 py-8 lg:p-12 select-none relative"
        >
          {/* Subtle Ambient Glow Behind Brand Showcase */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A84FF]/10 via-transparent to-transparent rounded-3xl blur-3xl pointer-events-none -z-10" />

          {/* Minimal Floating Koinexa Logo */}
          <div className="relative mb-8 sm:mb-10 group">
            <div className="absolute inset-0 bg-[#0A84FF]/25 rounded-full blur-3xl pointer-events-none group-hover:bg-[#0A84FF]/35 transition-all duration-500" />
            <img
              src="/koinexa-logo.png"
              alt="KOINEXA Logo"
              className="relative w-64 sm:w-80 md:w-96 max-h-48 object-contain drop-shadow-[0_0_35px_rgba(10,132,255,0.4)] transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('koinexa-logo.jpg')) {
                  target.src = '/koinexa-logo.jpg';
                }
              }}
            />
          </div>

          {/* Best Minimal Caption in Century Gothic Font - Ultra High Contrast Sharp Text */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.6rem] font-normal leading-[1.22] max-w-xl lg:max-w-2xl mx-auto tracking-wide text-neutral-900 dark:text-[#f7f9f9] drop-shadow-sm"
            style={{
              fontFamily: '"Century Gothic", CenturyGothic, AppleGothic, "URW Gothic", "ITC Avant Garde Gothic", Futura, sans-serif',
            }}
          >
            {"Connect. Collaborate. Grow Together."
              .split(' ')
              .map((word, wordIdx, arr) => (
                <span key={wordIdx} className="inline-block whitespace-nowrap">
                  {word.split('').map((char, charIdx) => {
                    const isPeriod = char === '.';
                    return (
                      <span
                        key={charIdx}
                        className={`inline-block transition-all duration-200 ease-out cursor-default transform hover:scale-125 hover:-translate-y-1 hover:text-[#0A84FF] hover:drop-shadow-[0_0_24px_rgba(10,132,255,1)] ${
                          isPeriod
                            ? 'text-[#0A84FF] font-semibold'
                            : 'text-neutral-900 dark:text-[#f7f9f9] font-normal hover:text-[#0A84FF]'
                        }`}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {wordIdx < arr.length - 1 && <span className="inline-block">&nbsp;</span>}
                </span>
              ))}
          </h1>
        </motion.div>

{/* ── RIGHT COLUMN: AUTHENTICATION CARD (WITH 8PX FLOWING KOINEXA GLOW AROUND BORDER) ── */}
        <div className="relative w-full max-w-[420px] mx-auto">
          {/* 8PX FLOWING GLOW AROUND BORDER OF EXACT 4 KOINEXA LOGO COLORS (CIRCULAR, NO BREAKS) */}
          <FlowingBorderGlow isActive={isAuthenticatingGlow} borderRadius="rounded-[32px]" />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={
              isExiting
                ? { opacity: 0, scale: 1.03, filter: 'blur(10px)' }
                : { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }
            }
            transition={{ duration: isExiting ? 0.6 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 overflow-hidden w-full p-7 sm:p-9 rounded-[32px] bg-white/95 dark:bg-[#16181c]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-200"
          >
            {/* Role Toggle: Mentor & Faculty Portal vs Student Portal (or 2FA banner if verifying login) */}
            {mode === 'login_otp' ? (
              <div className="flex items-center gap-2.5 mb-3 px-4 py-3 rounded-2xl bg-[#12BEF9]/10 border border-[#12BEF9]/25 text-[#12BEF9]">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-wide text-neutral-900 dark:text-white">Security Check</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Two-Factor OTP Verification</div>
                </div>
              </div>
            ) : (
              <div className="relative p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-neutral-800 flex items-center gap-1 mb-2">
                <button
                  type="button"
                  disabled={isAuthenticatingGlow}
                  onClick={() => {
                    setRoleTab('faculty');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 select-none ${
                    isAuthenticatingGlow ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${roleTab === 'faculty' ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  {roleTab === 'faculty' && (
                    <motion.div
                      layoutId="activeRolePill"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-[#1f2228] border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 440, damping: 32, mass: 0.8 }}
                    />
                  )}
                  <GraduationCap className="w-4 h-4 text-[#12BEF9]" />
                  <span>Mentor</span>
                </button>

                <button
                  type="button"
                  disabled={isAuthenticatingGlow}
                  onClick={() => {
                    setRoleTab('student');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 select-none ${
                    isAuthenticatingGlow ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${roleTab === 'student' ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  {roleTab === 'student' && (
                    <motion.div
                      layoutId="activeRolePill"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-[#1f2228] border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 440, damping: 32, mass: 0.8 }}
                    />
                  )}
                  <UserIcon className="w-4 h-4 text-[#BC5AFC]" />
                  <span>Student</span>
                </button>
              </div>
            )}

            <div className="mb-4" />

            {/* Error / Success Feedback Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* ── 1. LOGIN MODE (PORTAL AWARE) ── */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    disabled={isLoading || isAuthenticatingGlow}
                    placeholder={
                      roleTab === 'faculty'
                        ? 'Faculty Account Email (@bloom.com)'
                        : 'Student Account Email (@bloom.com)'
                    }
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm disabled:opacity-50"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading || isAuthenticatingGlow}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={isLoading || isAuthenticatingGlow}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isAuthenticatingGlow}
                    onClick={() => {
                      setMode('forgot_password');
                      setFpEmail(loginEmail);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || isAuthenticatingGlow}
                  whileHover={!isAuthenticatingGlow ? { scale: 1.01 } : {}}
                  whileTap={!isAuthenticatingGlow ? { scale: 0.985 } : {}}
                  className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-black dark:hover:bg-neutral-950 dark:text-white dark:border dark:border-white/20 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 select-none btn-keep-white"
                >
                  {isLoading || isAuthenticatingGlow ? (
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span className="font-bold text-white">Signing in...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 font-bold flex items-center gap-2 text-white">
                      Login <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </motion.button>

                <div className="text-center pt-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      disabled={isAuthenticatingGlow}
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-neutral-900 dark:text-white hover:text-[#0A84FF] dark:hover:text-[#0A84FF] font-semibold underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-[#0A84FF] transition-colors cursor-pointer"
                    >
                      {roleTab === 'faculty' ? 'Apply as Faculty / Mentor' : 'Register here'}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ── 2. REGISTER MODE (SEPARATE STUDENT VS MENTOR SCHEMAS) ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {roleTab === 'faculty' ? (
                  /* ── MENTOR & FACULTY REGISTRATION (WITH 2 COMPULSORY PROOF LINKS) ── */
                  <>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Full Name (e.g. Dr. Ramesh Verma)"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Institution / University (e.g. IIT Delhi)"
                        value={regInstitution}
                        onChange={(e) => setRegInstitution(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Department (e.g. CSE)"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Designation (e.g. Assoc. Prof)"
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Platform Account Email (@bloom.com)"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Contact Email (@gmail.com or @outlook.com)"
                        value={regContactEmail}
                        onChange={(e) => setRegContactEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Account Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Compulsory Proof Link 1 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold px-1">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-[#12BEF9]" />
                          <span>Compulsory Proof Link 1: Official Directory Profile</span>
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Required</span>
                      </div>
                      <input
                        type="url"
                        required
                        placeholder="https://cse.iitd.ac.in/faculty/dr-name"
                        value={regProofLink1}
                        onChange={(e) => setRegProofLink1(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm font-mono"
                      />
                    </div>

                    {/* Compulsory Proof Link 2 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold px-1">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3 text-[#BC5AFC]" />
                          <span>Compulsory Proof Link 2: Academic/Research Portfolio</span>
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Required</span>
                      </div>
                      <input
                        type="url"
                        required
                        placeholder="https://scholar.google.com/citations?user=..."
                        value={regProofLink2}
                        onChange={(e) => setRegProofLink2(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm font-mono"
                      />
                    </div>

                    {/* Statement / Bio */}
                    <div>
                      <textarea
                        rows={2}
                        placeholder="Brief statement of teaching focus or research interests (optional)"
                        value={regStatement}
                        onChange={(e) => setRegStatement(e.target.value)}
                        className="w-full px-4 py-2 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm resize-none"
                      />
                    </div>

                    {/* Veritas-AI Notice */}
                    <div className="p-3.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 text-[11px] text-neutral-800 dark:text-neutral-200 leading-snug flex items-start gap-2.5 shadow-sm">
                      <Sparkles className="w-4 h-4 text-[#12BEF9] flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-neutral-900 dark:text-white">Agentic Verification:</strong> Veritas-AI will autonomously crawl both links and perform online verification. Upon Admin approval, your access credentials will be delivered to your contact email.
                      </span>
                    </div>
                  </>
                ) : (
                  /* ── STUDENT REGISTRATION (CLEAN INPUTS) ── */
                  <>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Email Address (@bloom.com)"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-11 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Institution of Study"
                        value={regInstitution}
                        onChange={(e) => setRegInstitution(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Contact Email (@gmail.com or @outlook.com)"
                        value={regContactEmail}
                        onChange={(e) => setRegContactEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>
                  </>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-black dark:hover:bg-neutral-950 dark:text-white dark:border dark:border-white/20 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 mt-2 select-none btn-keep-white"
                >
                  {isLoading ? (
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span className="font-bold text-white">Processing...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 font-bold flex items-center gap-2 text-white">
                      Register
                    </span>
                  )}
                </motion.button>

                <div className="text-center pt-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-neutral-900 dark:text-white hover:text-[#0A84FF] dark:hover:text-[#0A84FF] font-semibold underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-[#0A84FF] transition-colors cursor-pointer"
                    >
                      Log in here
                    </button>
                  </p>
                </div>
              </form>
            )}

          {/* ── 2FA LOGIN OTP VERIFICATION FLOW ── */}
          {mode === 'login_otp' && (
            <form onSubmit={handleLoginOtpSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-black/40 border border-neutral-200/80 dark:border-neutral-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-2">
                  Enter the 6-digit security code sent to your registered contact email:
                </p>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white font-mono break-all bg-neutral-100 dark:bg-neutral-900/80 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700/60 inline-flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#12BEF9]" />
                  <span>{maskedContactEmail}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Verification Code (6 Digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  disabled={isLoading || isAuthenticatingGlow}
                  placeholder="••••••"
                  value={loginOtpCode}
                  onChange={(e) => setLoginOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-center font-mono text-xl tracking-[0.5em] font-bold text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-all shadow-sm disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={isLoading || isAuthenticatingGlow}
                  onClick={() => {
                    setMode('login');
                    setLoginOtpCode('');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                >
                  ← Back to Login
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending || isLoading || isAuthenticatingGlow}
                  onClick={handleResendLoginOtp}
                  className="text-[#0A84FF] hover:underline font-semibold disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  {isResending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || isAuthenticatingGlow || loginOtpCode.length < 6}
                whileHover={!isAuthenticatingGlow ? { scale: 1.01 } : {}}
                whileTap={!isAuthenticatingGlow ? { scale: 0.985 } : {}}
                className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-black dark:hover:bg-neutral-950 dark:text-white dark:border dark:border-white/20 text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 select-none btn-keep-white mt-2"
              >
                {isLoading || isAuthenticatingGlow ? (
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span className="font-bold text-white">Verifying Code...</span>
                  </div>
                ) : (
                  <span className="relative z-10 font-bold flex items-center gap-2 text-white">
                    Verify & Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </motion.button>
            </form>
          )}

          {/* ── 3. FORGOT PASSWORD FLOW (TRANSPARENT GLASS) ── */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#12BEF9]" />
                  <span>Password Recovery</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {fpStep === 'email' ? (
                <form onSubmit={handleForgotPasswordSendOtp} className="space-y-4">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Enter your KOINEXA account email (<code className="text-neutral-900 dark:text-white font-mono bg-neutral-100 dark:bg-white/10 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">@bloom.com</code>). Veritas-AI will dispatch a verification code to your registered contact email address.
                  </p>

                  <input
                    type="email"
                    required
                    placeholder="Account Email (@bloom.com)"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {isLoading ? (
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-black" />
                        <span className="font-bold text-white dark:text-black">Dispatching Code...</span>
                      </div>
                    ) : (
                      <span className="relative z-10 font-bold flex items-center gap-2 text-white dark:text-black">
                        Send Recovery Code
                      </span>
                    )}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordReset} className="space-y-4">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Enter the 6-digit recovery code sent to your contact email and choose your new password.
                  </p>

                  <input
                    type="text"
                    required
                    placeholder="6-Digit Verification Code"
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm font-mono tracking-wider text-center text-base"
                  />

                  <input
                    type="password"
                    required
                    placeholder="New Password (min 6 characters)"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {isLoading ? (
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-black" />
                        <span className="font-bold text-white dark:text-black">Updating...</span>
                      </div>
                    ) : (
                      <span className="relative z-10 font-bold flex items-center gap-2 text-white dark:text-black">
                        Update Password
                      </span>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>

      </div>
    </div>
  );
};
