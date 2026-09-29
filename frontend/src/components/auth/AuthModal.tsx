import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  Building2,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FlowingBorderGlow } from '../common/FlowingBorderGlow';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, commitUser, register, registerMentor } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [roleTab, setRoleTab] = useState<'faculty' | 'student'>('faculty');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1px Flowing Koinexa Color Queue Border Glow State
  const [isAuthenticatingGlow, setIsAuthenticatingGlow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regContactEmail, setRegContactEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regProofLink1, setRegProofLink1] = useState('');
  const [regProofLink2, setRegProofLink2] = useState('');
  const [regStatement, setRegStatement] = useState('');

  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setSuccess(null);
    setIsAuthenticatingGlow(false);
    setIsExiting(false);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticatingGlow || isSubmitting) return;
    setError(null);
    setSuccess(null);

    const emailClean = loginEmail.trim().toLowerCase();
    if (roleTab === 'student') {
      if (!emailClean.endsWith('@bloom.com')) {
        setError('Student account email must end with @bloom.com (e.g. name@bloom.com)');
        return;
      }
    } else {
      if (emailClean.includes('@') && !emailClean.endsWith('@bloom.com')) {
        setError('Account email must end with @bloom.com (e.g. name@bloom.com)');
        return;
      }
      if (!emailClean) {
        setError('Account email or admin username is required');
        return;
      }
    }

    if (!loginPassword) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);
    const res = await login(
      {
        username: emailClean,
        email: emailClean,
        password: loginPassword,
        portal_type: roleTab === 'faculty' ? 'mentor' : 'student',
      },
      true
    );

    if (res.success && res.user && res.token) {
      setIsSubmitting(false);
      setIsAuthenticatingGlow(true);

      setTimeout(() => {
        setIsExiting(true);
      }, 4700);

      setTimeout(() => {
        commitUser(res.user!, res.token!);
        closeAuthModal();
      }, 5200);
    } else {
      setIsSubmitting(false);
      setError(res.error || 'Failed to log in');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailClean = regEmail.trim().toLowerCase();
    const contactClean = regContactEmail.trim().toLowerCase();

    if (!emailClean.endsWith('@bloom.com')) {
      setError('Platform email must end with @bloom.com');
      return;
    }

    const validContact = contactClean.endsWith('@gmail.com') || contactClean.endsWith('@outlook.com');
    if (!validContact) {
      setError('Contact email must end with @gmail.com or @outlook.com');
      return;
    }

    if (!regFullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!regInstitution.trim()) {
      setError(roleTab === 'faculty' ? 'University / Institution is required' : 'Institution of study is required');
      return;
    }

    if (roleTab === 'faculty') {
      if (!regDepartment.trim()) {
        setError('Department is required for faculty registration');
        return;
      }
      if (!regProofLink1.trim() || (!regProofLink1.startsWith('http://') && !regProofLink1.startsWith('https://'))) {
        setError('Compulsory Proof Link 1: Please enter a valid institutional profile URL');
        return;
      }
      if (!regProofLink2.trim() || (!regProofLink2.startsWith('http://') && !regProofLink2.startsWith('https://'))) {
        setError('Compulsory Proof Link 2: Please enter a valid academic/scholar portfolio URL');
        return;
      }
      if (regProofLink1.trim().toLowerCase() === regProofLink2.trim().toLowerCase()) {
        setError('Proof Link 1 and Proof Link 2 must be two distinct URLs');
        return;
      }

      setIsSubmitting(true);
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
      setIsSubmitting(false);

      if (res.success) {
        setSuccess('Mentor application submitted! Veritas-AI is reviewing your credentials. Confirmation will be sent to ' + contactClean);
        setTimeout(() => {
          setMode('login');
        }, 3000);
      } else {
        setError(res.error || 'Mentor registration failed');
      }
      return;
    }

    // Student Registration
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
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
    setIsSubmitting(false);

    if (res.success) {
      setSuccess('Student account created successfully!');
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Wrapper with 8px Flowing Glow Around Border */}
        <div className="relative w-full max-w-md mx-auto z-10">
          {/* 8PX FLOWING GLOW AROUND BORDER OF EXACT 4 KOINEXA LOGO COLORS (CIRCULAR, NO BREAKS) */}
          <FlowingBorderGlow isActive={isAuthenticatingGlow} borderRadius="rounded-[32px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={
              isExiting
                ? { opacity: 0, scale: 1.03, filter: 'blur(10px)' }
                : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
            }
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: isExiting ? 0.6 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full bg-white/95 dark:bg-[#16181c]/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-neutral-200/90 dark:border-neutral-800 shadow-2xl z-10 space-y-5 overflow-hidden text-neutral-900 dark:text-white"
          >
          {/* Transparent Specular Top Hairline */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Header & Close */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/koinexa-logo.png"
                alt="KOINEXA"
                className="w-8 h-8 rounded-xl object-contain drop-shadow-md"
              />
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight leading-none">KOINEXA</h2>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
                  {mode === 'login' ? 'Authentication Portal' : 'Register New Account'}
                </span>
              </div>
            </div>

            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Toggle: Mentor & Faculty vs Student */}
          <div className="relative p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-neutral-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setRoleTab('faculty');
                setError(null);
              }}
              className={`relative z-10 flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                roleTab === 'faculty' ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {roleTab === 'faculty' && (
                <motion.div
                  layoutId="activeModalRolePill"
                  className="absolute inset-0 rounded-xl bg-white dark:bg-[#1f2228] border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 440, damping: 32, mass: 0.8 }}
                />
              )}
              <GraduationCap className="w-3.5 h-3.5 text-[#12BEF9]" />
              <span>Mentor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setError(null);
              }}
              className={`relative z-10 flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                roleTab === 'student' ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {roleTab === 'student' && (
                <motion.div
                  layoutId="activeModalRolePill"
                  className="absolute inset-0 rounded-xl bg-white dark:bg-[#1f2228] border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 440, damping: 32, mass: 0.8 }}
                />
              )}
              <UserIcon className="w-3.5 h-3.5 text-[#BC5AFC]" />
              <span>Student</span>
            </button>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={
                    roleTab === 'faculty'
                      ? 'Account Email (@bloom.com) or Admin Identifier'
                      : 'Student Email (@bloom.com)'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 pr-12 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting || isAuthenticatingGlow}
                whileHover={!isAuthenticatingGlow ? { scale: 1.01 } : {}}
                whileTap={!isAuthenticatingGlow ? { scale: 0.985 } : {}}
                className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 select-none btn-keep-white"
              >
                <span className="relative z-10 font-bold">
                  {isSubmitting || isAuthenticatingGlow ? 'Signing In...' : 'Login'}
                </span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </motion.button>

              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-neutral-900 dark:text-white hover:text-[#0A84FF] font-medium underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-[#0A84FF] transition-colors cursor-pointer"
                  >
                    {roleTab === 'faculty' ? 'Apply as Faculty / Mentor' : 'Register here'}
                  </button>
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      closeAuthModal();
                      window.location.hash = '#/auth';
                    }}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Forgot password or need help? Open Auth Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {roleTab === 'faculty' ? (
                /* ── MENTOR REGISTRATION WITH 2 COMPULSORY PROOF LINKS ── */
                <>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Full Name (e.g. Dr. Ramesh Verma)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="text"
                    required
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    placeholder="Institution / University (e.g. IIT Delhi)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="Department (e.g. CSE)"
                      className="w-full px-3 py-2 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                    />
                    <input
                      type="text"
                      value={regDesignation}
                      onChange={(e) => setRegDesignation(e.target.value)}
                      placeholder="Designation (e.g. Assoc. Prof)"
                      className="w-full px-3 py-2 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>

                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Platform Email (@bloom.com)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="email"
                    required
                    value={regContactEmail}
                    onChange={(e) => setRegContactEmail(e.target.value)}
                    placeholder="Contact Email (@gmail.com or @outlook.com)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (minimum 6 characters)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  {/* Compulsory Proof Link 1 */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold px-1 flex items-center justify-between">
                      <span>Proof Link 1 (Institutional Directory Profile)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Required</span>
                    </div>
                    <input
                      type="url"
                      required
                      value={regProofLink1}
                      onChange={(e) => setRegProofLink1(e.target.value)}
                      placeholder="https://dept.univ.edu/faculty/profile"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 font-mono focus:outline-none shadow-sm"
                    />
                  </div>

                  {/* Compulsory Proof Link 2 */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold px-1 flex items-center justify-between">
                      <span>Proof Link 2 (Google Scholar / Academic Portfolio)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Required</span>
                    </div>
                    <input
                      type="url"
                      required
                      value={regProofLink2}
                      onChange={(e) => setRegProofLink2(e.target.value)}
                      placeholder="https://scholar.google.com/citations?user=..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 font-mono focus:outline-none shadow-sm"
                    />
                  </div>

                  {/* Veritas-AI Notice */}
                  <div className="p-3 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 text-xs text-neutral-800 dark:text-neutral-200 leading-snug shadow-sm">
                    <strong className="text-neutral-900 dark:text-white">Agentic Verification:</strong> Veritas-AI will autonomously verify both links and compile your background dossier for admin approval. Credentials will be sent to your contact email.
                  </div>
                </>
              ) : (
                /* ── STUDENT REGISTRATION ── */
                <>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Username (e.g. alex_dev)"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Platform Email (must end with @bloom.com)"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (minimum 6 characters)"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="text"
                    required
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    placeholder="Institution of Study / University"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />

                  <input
                    type="email"
                    required
                    value={regContactEmail}
                    onChange={(e) => setRegContactEmail(e.target.value)}
                    placeholder="Contact Email (@gmail.com or @outlook.com)"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-black/60 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-[#0A84FF] focus:bg-white dark:focus:bg-black/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none transition-all shadow-sm"
                  />
                </>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="relative group overflow-hidden w-full py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-50 mt-2 select-none btn-keep-white"
              >
                <span className="relative z-10 font-bold">
                  {isSubmitting ? 'Processing...' : 'Register'}
                </span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </motion.button>

              <div className="pt-2 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-neutral-900 dark:text-white hover:text-[#0A84FF] font-medium underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-[#0A84FF] transition-colors cursor-pointer"
                  >
                    Log in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>
      </div>
    </AnimatePresence>
  );
};
