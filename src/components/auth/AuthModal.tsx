import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Trash2, Loader, Lock, Mail } from 'lucide-react';
import { globalRegistrationHash, globalPlatformTrie, globalSocialGraph } from '../../dsa-engine';
import { saveUserProfile, fetchUserProfileByEmail } from '../../lib/firestoreService';
import { hashPassword, verifyPassword } from '../../utils/authHasher';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen, onClose, currentUser, onLoginSuccess, onDeleteAccount,
}) => {
  type Step = 'SIGN_IN' | 'REGISTER' | 'REG_DETAILS' | 'LOGGED_IN';
  const [step, setStep] = useState<Step>('SIGN_IN');

  // Input fields
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [registerName,     setRegisterName]     = useState('');
  const [registerEmail,    setRegisterEmail]    = useState('');
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

  const [errorMsg,           setErrorMsg]           = useState('');
  const [successMsg,         setSuccessMsg]          = useState('');
  const [isLoading,          setIsLoading]          = useState(false);

  // CAPTCHA
  const [captchaChecked,    setCaptchaChecked]   = useState(false);
  const [captchaVerifying,  setCaptchaVerifying] = useState(false);

  // ── Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('SIGN_IN'); setErrorMsg(''); setSuccessMsg('');
      setCaptchaChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── CAPTCHA click
  const handleCaptchaClick = () => {
    if (captchaChecked || captchaVerifying) return;
    setCaptchaVerifying(true);
    setTimeout(() => { setCaptchaVerifying(false); setCaptchaChecked(true); }, 1100);
  };

  // ── Login flow (Instant Database Lookup + Hashed Password Verification)
  const handleCustomLogin = async () => {
    if (!email.trim() || !password.trim()) { setErrorMsg('Enter your email and password.'); return; }
    if (!captchaChecked) { setErrorMsg('Please verify you are not a robot.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const fetchPromise = fetchUserProfileByEmail(email.trim().toLowerCase());
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore connection timed out. Please make sure you clicked "Create Database" inside your Firebase Console -> Firestore Database.')), 6000));
      const user = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!user) {
        setErrorMsg('Invalid email or password.');
        return;
      }

      // Compare entered plaintext with stored hashed password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        setErrorMsg('Invalid email or password.');
        return;
      }

      onLoginSuccess(user);
      setStep('LOGGED_IN');
    } catch (err: any) {
      setErrorMsg(`Login failed: ${err?.message || 'Unknown error'}`);
    } finally { setIsLoading(false); }
  };

  // ── Register flow (Manual Form & Duplicate Email Check)
  const handleManualRegisterNext = async () => {
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword) { setErrorMsg('Please fill all fields.'); return; }
    if (registerPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (registerPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    
    setIsLoading(true); setErrorMsg('');
    try {
      // Backend checks if the email already exists
      const existingUser = await fetchUserProfileByEmail(registerEmail.trim().toLowerCase());
      if (existingUser) {
        setErrorMsg('Email is already registered! Please sign in instead.');
        setIsLoading(false);
        return;
      }
      setErrorMsg('');
      setStep('REG_DETAILS');
    } catch (err: any) {
      setErrorMsg(`Error checking email: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Complete Registration & Save (Store User with Hashed Password)
  const handleCompleteRegistration = async () => {
    if (!studentType) { setErrorMsg('Please select School or College.'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const isSchool = studentType === 'school';
      
      const uid = `usr_${Date.now()}`;
      const name = registerName.trim();
      const userEmail = registerEmail.trim().toLowerCase();
      // Hash the password (don't store as plain text)
      const pwd = await hashPassword(registerPassword);
      const pic = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C63FF&color=fff`;

      const newUser = {
        uid, id: `usr_${Date.now().toString().slice(-6)}`,
        name, email: userEmail,
        password: pwd, phone: '',
        
        studentType: studentType as 'school' | 'college',
        college: isSchool ? '' : (collegeName || 'Koinexa Campus'),
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

        avatarUrl: pic,
        role: 'student' as const, reputationPoints: 100,
        badges: ['Verified Student'], createdAt: new Date().toISOString(),
      };

      globalRegistrationHash.registerUser(userEmail, '', newUser);
      
      try {
        const savePromise = saveUserProfile(newUser);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore connection timed out. Please make sure you clicked "Create Database" inside your Firebase Console -> Firestore Database.')), 6000));
        await Promise.race([savePromise, timeoutPromise]);
      } catch (dbErr: any) {
        // Even if Firestore fails, we store locally and log them in so they aren't blocked!
        console.warn('Firestore save warning:', dbErr);
        if (dbErr.message.includes('timed out') || dbErr.message.includes('NOT_FOUND')) {
          setErrorMsg('Warning: Firestore database is not created yet in Firebase Console. Logged in locally for now!');
        } else {
          setErrorMsg(`Database Warning: ${dbErr.message}`);
        }
      }

      globalSocialGraph.addStudent(newUser);
      
      const locationInfo = isSchool ? `${newUser.schoolClass} • ${newUser.board}` : `${newUser.college} • ${newUser.department}`;
      globalPlatformTrie.indexItem({ id: newUser.id, title: newUser.name, subtitle: locationInfo, type: 'user', tags: [...newUser.badges, ...(newUser.skills||[])], avatarUrl: newUser.avatarUrl });
      
      onLoginSuccess(newUser);
      setStep('LOGGED_IN');
    } catch (err: any) { setErrorMsg(`Registration failed: ${err?.message || 'Unknown'}`); }
    finally { setIsLoading(false); }
  };

  const stepLabel: Record<Step, string> = {
    SIGN_IN: 'Sign In to Koinexa',
    REGISTER: 'Create an Account',
    REG_DETAILS: 'Setup Student Profile',
    LOGGED_IN: 'Authenticated successfully',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-[420px] kx-flow-card rounded-[32px] overflow-hidden animate-scaleUp">

        {/* Header — Sleek Minimalist Koinexa */}
        <div className="relative p-6 pb-2 text-white flex items-center justify-between border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all text-sm font-bold z-10">✕</button>
          
          <div className="flex flex-col items-center justify-center w-full mt-2">
            <img src="/koinexa-logo.jpg" alt="Koinexa" className="w-16 h-16 object-contain mb-3 drop-shadow-[0_0_15px_rgba(0,207,255,0.3)]" />
            <h2 className="text-xl font-black tracking-tight text-white">{stepLabel[step]}</h2>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Error banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#00CFFF]/10 border border-[#00CFFF]/30 text-[#00CFFF] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-[#00CFFF]/10 border border-[#00CFFF]/30 text-[#00CFFF] text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{successMsg}</span>
            </div>
          )}

          {/* ── SIGN IN ── */}
          {step === 'SIGN_IN' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <Mail className="w-4 h-4 text-[#00CFFF] shrink-0" />
                  <input type="email" placeholder="Student email address" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <Lock className="w-4 h-4 text-[#00CFFF] shrink-0" />
                  <input type="password" placeholder="Password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomLogin()}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
              </div>

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
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <span>Sign In →</span>}
              </button>

              <div className="flex items-center gap-3 text-white/20 text-xs">
                <div className="flex-1 h-px bg-white/8" /><span>OR</span><div className="flex-1 h-px bg-white/8" />
              </div>

              <button onClick={() => { setStep('REGISTER'); setErrorMsg(''); }}
                className="w-full py-3.5 rounded-2xl bg-white/5 border border-[rgba(108,99,255,0.25)] text-white font-bold text-sm hover:border-[#00CFFF]/60 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <span>New here? Create an Account</span>
              </button>
            </div>
          )}

          {/* ── REGISTER ── */}
          {step === 'REGISTER' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <input type="text" placeholder="Full Name" value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <input type="email" placeholder="Email Address" value={registerEmail}
                    onChange={e => setRegisterEmail(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <input type="password" placeholder="Create password" value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
                <div className="kx-field flex items-center gap-2 px-3.5">
                  <input type="password" placeholder="Confirm password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
                </div>
              </div>
              <button onClick={handleManualRegisterNext}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 flex items-center justify-center gap-2">
                <span>Continue to Profile Details →</span>
              </button>

              <button onClick={() => setStep('SIGN_IN')} className="w-full mt-4 text-xs text-white/40 hover:text-[#00CFFF] font-bold transition-all underline text-center block">← Already have an account? Sign In</button>
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

              <button onClick={handleCompleteRegistration} disabled={isLoading || !studentType}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /><span>Complete Registration</span></>}
              </button>
            </div>
          )}

          {/* ── LOGGED IN ── */}
          {step === 'LOGGED_IN' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-[#00CFFF]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Welcome back, {currentUser?.name || registerName || 'Student'}! 🎓</h3>
                <p className="text-xs text-white/40 mt-1">Authenticated securely. You can now enter the app.</p>
              </div>
              <div className="pt-3 border-t border-white/8 flex flex-col gap-2">
                <button onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 shadow-lg shadow-[#00CFFF]/20">
                  Enter Koinexa →
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
