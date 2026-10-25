import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  portalMode: 'student' | 'mentor';
  setPortalMode: (mode: 'student' | 'mentor') => void;
  openAuthModal: (mode?: 'login' | 'register', portal?: 'student' | 'mentor') => void;
  closeAuthModal: () => void;
  login: (
    credentials: { username?: string; email?: string; password: string; portal_type?: 'student' | 'mentor' },
    deferCommit?: boolean
  ) => Promise<{
    success: boolean;
    requires_otp?: boolean;
    identifier?: string;
    user_id?: string;
    contact_email?: string;
    masked_contact_email?: string;
    status?: string;
    user?: User;
    token?: string;
    error?: string;
    message?: string;
  }>;
  verifyLoginOtp: (
    identifier: string,
    otp: string,
    deferCommit?: boolean
  ) => Promise<{ success: boolean; status?: string; user?: User; token?: string; error?: string; message?: string }>;
  resendLoginOtp: (
    identifier: string
  ) => Promise<{ success: boolean; message?: string; masked_contact_email?: string; error?: string }>;
  commitUser: (userData: User, authToken: string) => void;
  register: (data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    contact_email?: string;
    college?: string;
    bio?: string;
    role?: 'student' | 'university';
    portal_type?: 'student' | 'mentor';
  }) => Promise<{ success: boolean; status?: string; message?: string; error?: string }>;
  registerMentor: (data: {
    name: string;
    email: string;
    password: string;
    contact_email: string;
    institution: string;
    department: string;
    designation?: string;
    proof_link_1: string;
    proof_link_2: string;
    statement_of_purpose?: string;
    username?: string;
  }) => Promise<{ success: boolean; status?: string; message?: string; error?: string }>;
  applyFaculty: (data: {
    name: string;
    email: string;
    password: string;
    institution: string;
    department: string;
    designation?: string;
    proof_link_1?: string;
    proof_link_2?: string;
    linkedin_url?: string;
    resume_url?: string;
    id_card_url?: string;
    extra_links?: string[];
    statement_of_purpose?: string;
    contact_email?: string;
  }) => Promise<{ success: boolean; status?: string; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (data: { email: string; otp: string; new_password: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('koinexa_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [portalMode, setPortalMode] = useState<'student' | 'mentor'>('student');

  const openAuthModal = (mode: 'login' | 'register' = 'login', portal?: 'student' | 'mentor') => {
    setAuthModalMode(mode);
    if (portal) setPortalMode(portal);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const authFetch = async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    const activeToken = token || localStorage.getItem('koinexa_token');
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    if (user?.username) {
      headers.set('X-Username', user.username);
    }
    const res = await fetch(url, { ...init, headers });
    if (res.status === 401 && activeToken) {
      localStorage.removeItem('koinexa_token');
      setUser(null);
      setToken(null);
    }
    return res;
  };

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('koinexa_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('koinexa_token');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        // network issue - keep stored token
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const refreshUser = async () => {
    const storedToken = token || localStorage.getItem('koinexa_token');
    if (!storedToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      // keep existing user on network error
    }
  };

  const commitUser = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('koinexa_token', authToken);
    closeAuthModal();
  };

  const safeParseJson = async (res: Response) => {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.error && typeof parsed.error !== 'string') {
        parsed.error = Array.isArray(parsed.error) ? parsed.error.join(', ') : JSON.stringify(parsed.error);
      }
      return parsed;
    } catch {
      return { success: false, error: res.ok ? 'Unexpected response format from server' : `Server error (${res.status})` };
    }
  };

  const login = async (
    credentials: { username?: string; email?: string; password: string; portal_type?: 'student' | 'mentor' },
    deferCommit: boolean = false
  ) => {
    try {
      const activePortal = credentials.portal_type || portalMode;
      const endpoint = activePortal === 'mentor' ? '/api/auth/mentor/login' : '/api/auth/student/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, portal_type: activePortal }),
      });
      const data = await safeParseJson(res);
      if (data.success && data.requires_otp) {
        return {
          success: true,
          requires_otp: true,
          identifier: data.identifier || credentials.username || credentials.email,
          user_id: data.user_id,
          contact_email: data.contact_email,
          masked_contact_email: data.masked_contact_email,
          message: data.message,
        };
      }
      if (data.success && data.token && data.user) {
        if (!deferCommit) {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('koinexa_token', data.token);
          closeAuthModal();
        }
        return {
          success: true,
          status: data.status || data.user.status || 'active',
          user: data.user,
          token: data.token,
        };
      }
      return { success: false, status: data.status, error: data.error || 'Failed to login' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    name: string;
    email?: string;
    contact_email?: string;
    college?: string;
    bio?: string;
    role?: 'student' | 'university';
    portal_type?: 'student' | 'mentor';
  }) => {
    try {
      const activePortal = userData.portal_type || (userData.role === 'university' ? 'mentor' : portalMode);
      const endpoint = activePortal === 'mentor' ? '/api/auth/mentor/register' : '/api/auth/student/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await safeParseJson(res);
      if (data.success && data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('koinexa_token', data.token);
        closeAuthModal();
        return { success: true, status: data.status || 'active', message: data.message };
      }
      if (data.success && data.status === 'pending') {
        return { success: true, status: 'pending', message: data.message };
      }
      return { success: false, status: data.status, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const registerMentor = async (mentorData: {
    name: string;
    email: string;
    password: string;
    contact_email: string;
    institution: string;
    department: string;
    designation?: string;
    proof_link_1: string;
    proof_link_2: string;
    statement_of_purpose?: string;
    username?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/mentor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentorData),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        if (data.token && data.user && data.status === 'active') {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('koinexa_token', data.token);
          closeAuthModal();
        }
        return {
          success: true,
          status: data.status || 'pending',
          message: data.message || 'Mentor credentials submitted for Veritas-AI verification & admin review'
        };
      }
      return { success: false, status: data.status, error: data.error || 'Mentor registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const applyFaculty = async (facultyData: {
    name: string;
    email: string;
    password: string;
    institution: string;
    department: string;
    designation?: string;
    proof_link_1?: string;
    proof_link_2?: string;
    linkedin_url?: string;
    resume_url?: string;
    id_card_url?: string;
    extra_links?: string[];
    statement_of_purpose?: string;
    contact_email?: string;
  }) => {
    try {
      const payload = {
        ...facultyData,
        proof_link_1: facultyData.proof_link_1 || facultyData.linkedin_url || '',
        proof_link_2: facultyData.proof_link_2 || facultyData.resume_url || facultyData.id_card_url || '',
        contact_email: facultyData.contact_email || ''
      };
      const res = await fetch('/api/auth/mentor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        if (data.token && data.user && data.status === 'active') {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('koinexa_token', data.token);
          closeAuthModal();
        }
        return {
          success: true,
          status: data.status || 'pending',
          message: data.message
        };
      }
      return { success: false, error: data.error || 'Faculty onboarding failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to request password reset code' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Invalid OTP code' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const resetPassword = async (payload: { email: string; otp: string; new_password: string }) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to reset password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const verifyLoginOtp = async (identifier: string, otp: string, deferCommit: boolean = false) => {
    try {
      const res = await fetch('/api/auth/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await safeParseJson(res);
      if (data.success && data.token && data.user) {
        if (!deferCommit) {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('koinexa_token', data.token);
          closeAuthModal();
        }
        return {
          success: true,
          status: data.status || data.user.status || 'active',
          user: data.user,
          token: data.token,
          message: data.message,
        };
      }
      return { success: false, error: data.error || 'Invalid verification code' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const resendLoginOtp = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/login/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await safeParseJson(res);
      if (data.success) {
        return {
          success: true,
          message: data.message,
          masked_contact_email: data.masked_contact_email,
        };
      }
      return { success: false, error: data.error || 'Failed to resend verification code' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('koinexa_token');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        portalMode,
        setPortalMode,
        openAuthModal,
        closeAuthModal,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        commitUser,
        register,
        registerMentor,
        applyFaculty,
        forgotPassword,
        verifyOtp,
        resetPassword,
        logout,
        authFetch,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
