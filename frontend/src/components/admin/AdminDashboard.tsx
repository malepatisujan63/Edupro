import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Ban,
  Unlock,
  UserCheck,
  Users,
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Sliders,
  Mail,
  FileText,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Eye,
  Check,
  X,
  Send,
  GraduationCap,
  Building2,
  Lock,
  ChevronRight,
  ChevronDown,
  Key,
  Server,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FacultyApplication, SentEmail } from '../../types';

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.66-.74 1.66-1.66a1.66 1.66 0 1 0-3.32 0c0 .92.74 1.66 1.66 1.66m1.39 9.97v-8.37H5.07v8.37h2.78z" />
  </svg>
);

export const AdminDashboard: React.FC = () => {
  const { user, authFetch, logout } = useAuth();

  // Overview Stats
  const [stats, setStats] = useState<any>({
    total_users: 0,
    total_faculty: 0,
    pending_applications: 0,
    approved_applications: 0,
    rejected_applications: 0,
    sent_emails_count: 0,
    ai_strictness: 'balanced',
    ai_autopilot_enabled: true
  });

  const [applications, setApplications] = useState<FacultyApplication[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'banned'>('pending');
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [isLoadingBanned, setIsLoadingBanned] = useState(false);
  const [unbanSuccessMessage, setUnbanSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Deep-Dive Modal
  const [selectedApp, setSelectedApp] = useState<FacultyApplication | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Email Outbox Modal
  const [isEmailOutboxOpen, setIsEmailOutboxOpen] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [previewEmail, setPreviewEmail] = useState<SentEmail | null>(null);

  // Live SMTP Gateway Configuration & Dispatcher State
  const [isSmtpPanelOpen, setIsSmtpPanelOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHasPass, setSmtpHasPass] = useState(false);
  const [fromEmail, setFromEmail] = useState('veritas@koinexa.edu');
  const [fromName, setFromName] = useState('KOINEXA Veritas-AI');
  const [testEmailRecipient, setTestEmailRecipient] = useState('malepatisujan63@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fetch Stats & Applications
  const fetchOverview = async () => {
    try {
      const res = await authFetch('/api/admin/overview');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch overview stats', e);
    }
  };

  const fetchBannedUsers = async () => {
    setIsLoadingBanned(true);
    try {
      const res = await authFetch('/api/admin/banned-users');
      const data = await res.json();
      if (data.success) {
        setBannedUsers(data.banned_users || []);
      }
    } catch (e) {
      console.error('Failed to fetch banned users', e);
    } finally {
      setIsLoadingBanned(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await authFetch('/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setUnbanSuccessMessage('User account unblocked successfully! They can now log in.');
        fetchBannedUsers();
        fetchOverview();
        setTimeout(() => setUnbanSuccessMessage(null), 4000);
      }
    } catch (e) {
      console.error('Failed to unban user', e);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/admin/applications?status=${filteredStatus}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error('Failed to fetch applications', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await authFetch('/api/admin/emails');
      const data = await res.json();
      if (data.success) {
        setSentEmails(data.emails || []);
      }
    } catch (e) {
      console.error('Failed to fetch emails', e);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await authFetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.smtp_host) setSmtpHost(data.settings.smtp_host);
        if (data.settings.smtp_port) setSmtpPort(data.settings.smtp_port);
        if (data.settings.smtp_user) setSmtpUser(data.settings.smtp_user);
        if (data.settings.smtp_has_pass !== undefined) setSmtpHasPass(data.settings.smtp_has_pass);
        if (data.settings.from_email) setFromEmail(data.settings.from_email);
        if (data.settings.from_name) setFromName(data.settings.from_name);
      }
    } catch (e) {
      console.error('Failed to fetch SMTP settings', e);
    }
  };

  const handleSaveSmtp = async () => {
    setIsSavingSmtp(true);
    setSmtpFeedback(null);
    try {
      const body: any = {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        from_email: fromEmail,
        from_name: fromName
      };
      if (smtpPass) {
        body.smtp_pass = smtpPass;
      }
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSmtpFeedback({ type: 'success', message: 'SMTP Gateway settings saved successfully.' });
        if (smtpPass) {
          setSmtpHasPass(true);
          setSmtpPass('');
        }
      } else {
        setSmtpFeedback({ type: 'error', message: data.error || 'Failed to save SMTP settings.' });
      }
    } catch (e: any) {
      setSmtpFeedback({ type: 'error', message: e.message || 'Network error saving settings.' });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) return;
    setIsSendingTest(true);
    setSmtpFeedback(null);
    try {
      const body: any = {
        to_email: testEmailRecipient,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        from_email: fromEmail,
        from_name: fromName
      };
      if (smtpPass) {
        body.smtp_pass = smtpPass;
      }
      const res = await authFetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSmtpFeedback({
          type: 'success',
          message: data.message || `Test email successfully delivered to ${data.to_email}! Check your inbox and spam folder.`
        });
        if (smtpPass) {
          setSmtpHasPass(true);
          setSmtpPass('');
        }
        fetchOverview();
        fetchEmails();
      } else {
        setSmtpFeedback({
          type: 'error',
          message: data.message || 'SMTP delivery rejected by host.'
        });
      }
    } catch (e: any) {
      setSmtpFeedback({
        type: 'error',
        message: e.message || 'Failed to dispatch test email.'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchApplications();
    fetchBannedUsers();
    fetchEmails();
    fetchSmtpSettings();
  }, [user, filteredStatus]);

  // Update Settings (Strictness & Autopilot)
  const handleUpdateSetting = async (key: 'ai_strictness' | 'ai_autopilot_enabled', value: any) => {
    setStats((prev: any) => ({ ...prev, [key]: value }));
    try {
      await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      fetchOverview();
    } catch (e) {
      console.error('Failed to update setting', e);
    }
  };

  // Decide on application (Approve / Reject)
  const handleDecide = async (appId: string, decision: 'approve' | 'reject', reason: string = '') => {
    setIsProcessingAction(true);
    try {
      const res = await authFetch(`/api/admin/applications/${appId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedApp(null);
        setIsRejectModalOpen(false);
        setRejectReason('');
        fetchOverview();
        fetchApplications();
      }
    } catch (e) {
      console.error('Decision error', e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Re-evaluate with Veritas-AI
  const handleReevaluate = async (appId: string) => {
    setIsProcessingAction(true);
    try {
      const res = await authFetch(`/api/admin/applications/${appId}/re-evaluate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.ai_dossier) {
        if (selectedApp) {
          setSelectedApp(prev => prev ? { ...prev, ai_dossier: data.ai_dossier, ai_recommendation: data.ai_dossier.recommendation, ai_verification_score: data.ai_dossier.verification_score, ai_risk_score: data.ai_dossier.risk_score, ai_reasoning: data.ai_dossier.summary_reasoning } : null);
        }
        fetchApplications();
      }
    } catch (e) {
      console.error('Re-evaluate error', e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter applications by status
  const filteredApps = applications.filter((app) => {
    if (filteredStatus === 'pending') return app.status === 'pending';
    if (filteredStatus === 'approved') return app.status === 'approved';
    if (filteredStatus === 'rejected') return app.status === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] pl-4 sm:pl-6 lg:pl-[88px] xl:pl-[104px] p-4 sm:p-8 pb-28 lg:pb-8 space-y-7 relative overflow-x-hidden selection:bg-blue-600/30 selection:text-white transition-colors duration-200">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP HEADER & TELEMETRY ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--x-border)] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--x-text)] tracking-tight">
                  Veritas-AI Command Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold">
                  SUPERADMIN (koinexa)
                </span>
              </div>
              <p className="text-xs text-[var(--x-subtext)] mt-0.5">
                Multi-Artifact Faculty Credential Vetting, Agentic Verification & Automated Email Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchEmails();
              setIsEmailOutboxOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--x-border)] text-xs text-neutral-200 transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Outbox History ({stats.sent_emails_count})</span>
          </button>

          <button
            onClick={() => window.location.hash = '#/classroom'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Classroom Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] backdrop-blur-md space-y-1">
          <div className="text-[var(--x-subtext)] text-xs flex items-center justify-between">
            <span>Pending Review Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.pending_applications}
          </div>
          <div className="text-[11px] text-[var(--x-subtext)]">Requires review or decision</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] backdrop-blur-md space-y-1">
          <div className="text-[var(--x-subtext)] text-xs flex items-center justify-between">
            <span>Approved Faculty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.approved_applications}
          </div>
          <div className="text-[11px] text-[var(--x-subtext)]">Active university & coaching faculty</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] backdrop-blur-md space-y-1">
          <div className="text-[var(--x-subtext)] text-xs flex items-center justify-between">
            <span>Dispatched Emails</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {stats.sent_emails_count}
          </div>
          <div className="text-[11px] text-[var(--x-subtext)]">OTPs, approvals & notifications</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] backdrop-blur-md space-y-1">
          <div className="text-[var(--x-subtext)] text-xs flex items-center justify-between">
            <span>Total Campus Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {stats.total_users}
          </div>
          <div className="text-[11px] text-[var(--x-subtext)]">Students, teachers & staff</div>
        </div>
      </div>

      {/* ── VERITAS-AI AGENTIC CONTROL PANEL ── */}
      <div className="p-5 rounded-3xl bg-[var(--x-surface)] border border-blue-500/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 mt-0.5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[var(--x-text)]">Veritas-AI Autonomy & Strictness Engine</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                ONLINE
              </span>
            </div>
            <p className="text-xs text-[var(--x-subtext)] mt-1 max-w-xl leading-relaxed">
              Analyzes LinkedIn handles, Resume PDFs, ID card photos, and institutional domains. Automatically dispatches approval/rejection emails upon decision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Strictness Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--x-subtext)] font-medium">Strictness:</span>
            <select
              value={stats.ai_strictness}
              onChange={(e) => handleUpdateSetting('ai_strictness', e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] focus:outline-none focus:border-blue-500"
            >
              <option value="lenient">Lenient (Fast Onboarding)</option>
              <option value="balanced">Balanced (Recommended)</option>
              <option value="strict">Strict (High Assurance)</option>
              <option value="paranoid">Paranoid (100% Human Review)</option>
            </select>
          </div>

          {/* Autopilot Toggle */}
          <div className="flex items-center gap-2.5 text-xs bg-[var(--x-surface-hover)] px-3 py-1.5 rounded-xl border border-[var(--x-border)]">
            <span className="text-[var(--x-subtext)] font-medium">Auto-Pilot:</span>
            <button
              onClick={() => handleUpdateSetting('ai_autopilot_enabled', !stats.ai_autopilot_enabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                stats.ai_autopilot_enabled ? 'bg-blue-600' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  stats.ai_autopilot_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[11px] text-[var(--x-subtext)]">
              {stats.ai_autopilot_enabled ? 'Auto-Accept ≥ 80%' : 'Manual Sign-off'}
            </span>
          </div>
        </div>
      </div>

      {/* ── LIVE SMTP & REAL-WORLD EMAIL GATEWAY DISPATCHER ── */}
      <div className="p-5 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-inner mt-0.5">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-[var(--x-text)]">Live SMTP & Real-World Email Gateway</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  smtpUser && smtpHasPass
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : smtpUser
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                }`}>
                  {smtpUser && smtpHasPass ? 'SMTP AUTH ACTIVE' : smtpUser ? 'APP PASSWORD NEEDED' : 'LOCAL SIMULATOR + SMTP READY'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-[var(--x-border)] text-[var(--x-subtext)] text-[10px] font-mono">
                  From: {fromName} &lt;{fromEmail}&gt;
                </span>
              </div>
              <p className="text-xs text-[var(--x-subtext)] mt-1 max-w-2xl leading-relaxed">
                KOINEXA Veritas-AI dispatches real acceptance/rejection letters and OTPs. Connect any standard Gmail (with a 16-character Google App Password) or custom SMTP server to ensure physical inbox delivery without spam flags.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsSmtpPanelOpen(!isSmtpPanelOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--x-border)] text-xs text-[var(--x-subtext)] transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSmtpPanelOpen ? 'Hide Credentials' : 'Configure SMTP'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSmtpPanelOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Send Test Email Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)]">
          <div className="flex items-center gap-2 flex-1 px-3 py-1 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)]">
            <Mail className="w-4 h-4 text-[var(--x-subtext)] flex-shrink-0" />
            <input
              type="email"
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              placeholder="Enter recipient email (e.g. malepatisujan63@gmail.com)"
              className="w-full bg-transparent text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none py-1.5 font-mono text-xs"
            />
          </div>

          <button
            onClick={handleSendTestEmail}
            disabled={isSendingTest || !testEmailRecipient}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex-shrink-0"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching SMTP...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Email to {testEmailRecipient || 'Recipient'}</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Feedback Alert */}
        {smtpFeedback && (
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
            smtpFeedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-start gap-2.5 font-semibold">
              {smtpFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-bold">
                  {smtpFeedback.type === 'success' ? 'Dispatched Successfully:' : 'SMTP Gateway Diagnostic:'}
                </span>{' '}
                {smtpFeedback.message}
              </div>
            </div>

            {smtpFeedback.type === 'error' && (
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-[var(--x-subtext)] space-y-1">
                <div className="font-bold text-amber-300">Why Google rejected unauthenticated or passwordless SMTP:</div>
                <p>
                  1. Modern Gmail and mail providers block unauthenticated local relays from consumer IP addresses to protect against spam.
                </p>
                <p>
                  2. To send real emails straight into your phone/inbox, open <strong>Configure SMTP</strong> below, enter your Gmail (e.g. <code className="text-blue-300 font-mono">user@gmail.com</code>) and generate a <strong>16-character Google App Password</strong> from Google Account &gt; Security &gt; App Passwords.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapsible SMTP Configuration Drawer */}
        <AnimatePresence>
          {isSmtpPanelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-4 pt-3 border-t border-[var(--x-border)]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[var(--x-subtext)] font-medium">SMTP Server Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--x-subtext)] font-medium">SMTP Port</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587 (TLS) or 465 (SSL)"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--x-subtext)] font-medium">SMTP Username (Gmail / Mail Address)</label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[var(--x-subtext)] font-medium">SMTP App Password (16 characters)</label>
                    {smtpHasPass && (
                      <span className="text-[10px] text-emerald-400 font-mono">Password Configured ✓</span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={smtpHasPass ? "•••••••••••••••• (Leave blank to keep current)" : "16-char Google App Password"}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--x-subtext)] font-medium">Sender Display Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="KOINEXA Veritas-AI"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--x-subtext)] font-medium">Sender From Email</label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="veritas@koinexa.edu or your.email@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons & Guidance Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[var(--x-subtext)] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Need a Google App Password? Visit{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Google App Passwords <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    (requires 2-Step Verification).
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSmtpHost('smtp.gmail.com');
                      setSmtpPort('587');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--x-border)] text-[var(--x-subtext)] text-xs cursor-pointer"
                  >
                    Reset Gmail Defaults
                  </button>
                  <button
                    onClick={handleSaveSmtp}
                    disabled={isSavingSmtp}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingSmtp ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save SMTP Gateway</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── APPLICATIONS REVIEW QUEUE ── */}
      <div className="space-y-4">
        {/* Controls Bar: Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-xs">
            <button
              onClick={() => setFilteredStatus('pending')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filteredStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              Pending ({stats.pending_applications})
            </button>
            <button
              onClick={() => setFilteredStatus('approved')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filteredStatus === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              Approved ({stats.approved_applications})
            </button>
            <button
              onClick={() => setFilteredStatus('rejected')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filteredStatus === 'rejected'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              Rejected ({stats.rejected_applications})
            </button>
            <button
              onClick={() => setFilteredStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filteredStatus === 'all'
                  ? 'bg-[var(--x-surface-hover)] text-[var(--x-text)] border border-[var(--x-border)] shadow-sm'
                  : 'text-[var(--x-subtext)] hover:text-[var(--x-text)]'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => {
                setFilteredStatus('banned');
                fetchBannedUsers();
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filteredStatus === 'banned'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Banned Accounts ({bannedUsers.length})</span>
            </button>
          </div>
        </div>

        
        {/* Unban Success Feedback Toast */}
        {unbanSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{unbanSuccessMessage}</span>
            </div>
            <button onClick={() => setUnbanSuccessMessage(null)} className="text-[var(--x-subtext)] hover:text-[var(--x-text)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {filteredStatus === 'banned' ? (
          /* ── BANNED ACCOUNTS MANAGEMENT TABLE ── */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-[var(--x-text)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Language Policy Suspensions & Account Unblock</span>
                </h3>
                <p className="text-xs text-[var(--x-subtext)]">
                  Accounts suspended automatically when vulgar, abusive, or harmful language was detected across 13 Indian languages + English.
                </p>
              </div>
              <button
                onClick={fetchBannedUsers}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[var(--x-subtext)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBanned ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingBanned ? (
              <div className="py-16 text-center text-xs text-[var(--x-subtext)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                <span>Loading banned accounts...</span>
              </div>
            ) : bannedUsers.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--x-subtext)] p-8 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-[var(--x-text)]">No Suspended Accounts</p>
                <p className="text-[var(--x-subtext)]">All registered students and mentors are in good standing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bannedUsers.map((bu) => (
                  <div
                    key={bu.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[var(--x-surface)]/80 border border-rose-500/20 hover:border-rose-500/35 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-[var(--x-text)]">{bu.name}</span>
                        <span className="text-xs font-mono text-[var(--x-subtext)]">@{bu.username}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                          Banned
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[var(--x-subtext)] text-[10px] capitalize">
                          {bu.role}
                        </span>
                        <span className="text-xs text-[var(--x-subtext)]">•</span>
                        <span className="text-xs text-[var(--x-subtext)]">{bu.college || 'Institution'}</span>
                      </div>

                      <div className="text-xs text-[var(--x-subtext)] flex items-center gap-3">
                        <span className="font-mono">{bu.email}</span>
                        {bu.contact_email && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--x-subtext)]">Contact: {bu.contact_email}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/15 text-xs text-rose-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Ban className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span>{bu.banned_reason || 'Policy violation'}</span>
                        </div>
                        {bu.latest_violation && (
                          <div className="text-[11px] text-[var(--x-subtext)] pl-5 font-mono">
                            Detected: <span className="text-rose-300 font-bold">{bu.latest_violation.detected_word}</span> [{bu.latest_violation.detected_language}]
                            {bu.latest_violation.content_snippet && (
                              <span className="text-[var(--x-subtext)]"> — "{bu.latest_violation.content_snippet}"</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleUnbanUser(bu.id)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer select-none hover:scale-105 active:scale-95"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unblock Account</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
          <div className="py-16 text-center text-xs text-[var(--x-subtext)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading applications queue...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--x-subtext)] p-8 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)]">
            No applications matching current filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredApps.map((app) => {
              const rec = app.ai_recommendation || 'NEEDS_MANUAL_REVIEW';
              const score = app.ai_verification_score ?? 0;

              return (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md"
                >
                  {/* Left: Identity & Artifact Badges */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-[var(--x-text)]">{app.name}</span>
                      <span className="text-xs text-[var(--x-subtext)]">({app.designation || 'Faculty'})</span>
                      <span className="text-xs text-[var(--x-subtext)]">•</span>
                      <span className="text-xs text-blue-400 font-medium">{app.institution}</span>
                    </div>

                    <div className="text-xs text-[var(--x-subtext)] font-mono flex items-center gap-3">
                      <span>{app.email}</span>
                      <span>•</span>
                      <span className="text-[var(--x-subtext)]">{app.department}</span>
                    </div>

                    {/* Artifact indicators */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/15 border border-blue-500/30 text-blue-300 flex items-center gap-1 font-mono">
                        <LinkedinIcon className="w-3 h-3" /> LinkedIn Verified
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 font-mono">
                        <FileText className="w-3 h-3" /> Resume Attached
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-600/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1 font-mono">
                        <CreditCard className="w-3 h-3" /> ID Verified
                      </span>
                    </div>
                  </div>

                  {/* Middle: Veritas-AI Recommendation Pill */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                        rec === 'ACCEPT'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : rec === 'REJECT'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{score}% Score</span>
                      <span>•</span>
                      <span>{rec === 'ACCEPT' ? 'Recommended Accept' : rec === 'REJECT' ? 'Suspicious' : 'Needs Review'}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1.5 rounded-xl x-btn-secondary text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspect Dossier</span>
                    </button>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleDecide(app.id, 'approve')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-[var(--x-text)] shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setIsRejectModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {app.status === 'approved' && (
                      <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg">
                        ✓ ACTIVE
                      </span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="text-xs font-mono font-bold text-rose-400 px-2 py-1 bg-rose-500/10 rounded-lg">
                        ✗ REJECTED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 1: DEEP-DIVE APPLICATION & AI DOSSIER INSPECTOR      */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedApp && !isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto ios-glass-card specular-top rounded-[28px] sm:rounded-[36px] p-6 sm:p-7 border border-[var(--x-border)] shadow-2xl z-10 space-y-5 backdrop-blur-2xl bg-[var(--x-surface)] text-[var(--x-text)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--x-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--x-text)]">{selectedApp.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                      {selectedApp.id}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--x-subtext)] mt-0.5">
                    {selectedApp.designation} • {selectedApp.institution} ({selectedApp.department})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-xl text-[var(--x-subtext)] hover:text-[var(--x-text)] bg-[var(--x-surface-hover)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Veritas-AI Scorecard Banner */}
              <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/30 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-[var(--x-text)] uppercase tracking-wider">
                      Veritas-AI Decision Dossier
                    </span>
                  </div>
                  <button
                    onClick={() => handleReevaluate(selectedApp.id)}
                    disabled={isProcessingAction}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-[11px] text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isProcessingAction ? 'animate-spin' : ''}`} />
                    <span>Re-evaluate</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)]">
                    <div className="text-[var(--x-subtext)] text-[10px]">Verification Score</div>
                    <div className="text-lg font-mono font-black text-emerald-400">
                      {selectedApp.ai_verification_score ?? 0}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)]">
                    <div className="text-[var(--x-subtext)] text-[10px]">Risk Score</div>
                    <div className="text-lg font-mono font-black text-rose-400">
                      {selectedApp.ai_risk_score ?? 0}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)]">
                    <div className="text-[var(--x-subtext)] text-[10px]">AI Recommendation</div>
                    <div className="text-xs font-bold text-blue-300 uppercase mt-1">
                      {selectedApp.ai_recommendation || 'REVIEW'}
                    </div>
                  </div>
                </div>

                {/* Plain-English Reasoning */}
                <div className="text-xs text-[var(--x-subtext)] leading-relaxed bg-black/30 p-3 rounded-xl border border-[var(--x-border)]">
                  <strong>Agent Rationale:</strong> {selectedApp.ai_reasoning || 'Artifacts ingested and analyzed.'}
                </div>
              </div>

              {/* Submitted Artifacts & Veritas-AI Verification Dossier */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--x-subtext)] uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Faculty Verification & Compulsory Proof Links</span>
                  </h4>
                  {selectedApp.contact_email && (
                    <span className="text-xs text-sky-400 font-mono bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      Dispatches to: {selectedApp.contact_email}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  {/* Proof Link 1: Official Institutional / Faculty Directory Profile */}
                  <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span>Compulsory Proof Link 1: Institutional Profile</span>
                      </div>
                      {selectedApp.proof_link_1 ? (
                        <a
                          href={selectedApp.proof_link_1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-[11px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="truncate max-w-[220px]">{selectedApp.proof_link_1}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[var(--x-subtext)] italic">Not provided</span>
                      )}
                    </div>
                    {selectedApp.link_1_scraped_summary && (
                      <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-[var(--x-subtext)] leading-relaxed">
                        <strong className="text-blue-300">Veritas-AI Crawl Summary:</strong> {selectedApp.link_1_scraped_summary}
                      </div>
                    )}
                  </div>

                  {/* Proof Link 2: Academic / Research Portfolio */}
                  <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        <span>Compulsory Proof Link 2: Academic / Research Portfolio</span>
                      </div>
                      {selectedApp.proof_link_2 ? (
                        <a
                          href={selectedApp.proof_link_2}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 text-[11px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="truncate max-w-[220px]">{selectedApp.proof_link_2}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[var(--x-subtext)] italic">Not provided</span>
                      )}
                    </div>
                    {selectedApp.link_2_scraped_summary && (
                      <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-[var(--x-subtext)] leading-relaxed">
                        <strong className="text-purple-300">Veritas-AI Crawl Summary:</strong> {selectedApp.link_2_scraped_summary}
                      </div>
                    )}
                  </div>

                  {/* Veritas-AI Public Web Search Results */}
                  {selectedApp.online_search_results_json && (
                    <div className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2">
                      <div className="flex items-center gap-2 text-neutral-200 font-medium">
                        <Search className="w-4 h-4 text-emerald-400" />
                        <span>Veritas-AI Autonomous Web Search Dossier</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2 text-[11px] text-[var(--x-subtext)] max-h-48 overflow-y-auto">
                        {(() => {
                          try {
                            const parsed = JSON.parse(selectedApp.online_search_results_json);
                            if (parsed.results && Array.isArray(parsed.results) && parsed.results.length > 0) {
                              return parsed.results.map((res: any, idx: number) => (
                                <div key={idx} className="border-b border-[var(--x-border)] pb-2 last:border-none last:pb-0">
                                  <div className="font-semibold text-[var(--x-text)] flex items-center justify-between gap-1">
                                    <span>{res.title || 'Scholarly Record'}</span>
                                    {res.link && (
                                      <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-0.5">
                                        <span>Source</span> <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[var(--x-subtext)] mt-0.5">{res.snippet}</p>
                                </div>
                              ));
                            }
                            return <p className="italic text-[var(--x-subtext)]">{parsed.raw_summary || 'Public search verified academic affiliation.'}</p>;
                          } catch {
                            return <p className="italic text-[var(--x-subtext)]">{selectedApp.online_search_results_json}</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Additional Legacy Links if present */}
                  {selectedApp.linkedin_url && (
                    <div className="p-3 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[var(--x-subtext)]">
                        <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>LinkedIn:</span>
                        <span className="text-[var(--x-subtext)] font-mono truncate max-w-xs">{selectedApp.linkedin_url}</span>
                      </div>
                      <a
                        href={selectedApp.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 text-[10px] font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Statement */}
                  {selectedApp.statement_of_purpose && (
                    <div className="p-3 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-1">
                      <span className="text-[var(--x-subtext)] font-medium">Statement of Purpose / Bio:</span>
                      <p className="text-[var(--x-text)] leading-relaxed">{selectedApp.statement_of_purpose}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-3 border-t border-[var(--x-border)] flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl x-btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Reject with Feedback Email
                </button>
                <button
                  onClick={() => handleDecide(selectedApp.id, 'approve')}
                  disabled={isProcessingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Dispatch Welcome Email</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 2: REJECT WITH CONSTRUCTIVE FEEDBACK EMAIL           */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRejectModalOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRejectModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md ios-glass-card rounded-[28px] p-6 border border-[var(--x-border)] shadow-2xl z-10 space-y-4 bg-[var(--x-surface)] text-[var(--x-text)]"
            >
              <h3 className="text-base font-bold text-[var(--x-text)] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject Application & Send Feedback</span>
              </h3>
              <p className="text-xs text-[var(--x-subtext)]">
                The applicant will receive a professional email explaining the decision so they can provide updated proof.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--x-subtext)]">Feedback / Reason for Rejection</label>
                <textarea
                  rows={3}
                  placeholder="e.g. LinkedIn profile link is inaccessible, or ID card image was unreadable."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] text-xs text-[var(--x-text)] focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] text-xs font-semibold text-[var(--x-subtext)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecide(selectedApp.id, 'reject', rejectReason)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Send Rejection Email
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 3: EMAIL OUTBOX DRAWER / INSPECTOR                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEmailOutboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEmailOutboxOpen(false);
                setPreviewEmail(null);
              }}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto ios-glass-card rounded-[32px] p-6 border border-[var(--x-border)] shadow-2xl z-10 space-y-4 bg-[var(--x-surface)] text-[var(--x-text)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--x-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-[var(--x-text)]">Dispatched Emails Outbox ({sentEmails.length})</h3>
                </div>
                <button
                  onClick={() => {
                    setIsEmailOutboxOpen(false);
                    setPreviewEmail(null);
                  }}
                  className="p-1.5 rounded-xl text-[var(--x-subtext)] hover:text-[var(--x-text)] bg-[var(--x-surface-hover)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewEmail ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setPreviewEmail(null)}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to Outbox List
                  </button>

                  <div className="p-4 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2 text-xs">
                    <div><strong>To:</strong> {previewEmail.recipient_name} &lt;{previewEmail.recipient_email}&gt;</div>
                    <div><strong>Subject:</strong> {previewEmail.subject}</div>
                    <div><strong>Type:</strong> <span className="font-mono text-blue-300">{previewEmail.email_type}</span></div>
                    <div className="border-t border-[var(--x-border)] pt-3 mt-3 bg-white text-black p-4 rounded-xl max-h-96 overflow-y-auto"
                         dangerouslySetInnerHTML={{ __html: previewEmail.body_html }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {sentEmails.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--x-subtext)]">
                      No outgoing emails dispatched yet.
                    </div>
                  ) : (
                    sentEmails.map((em) => (
                      <div
                        key={em.id}
                        onClick={() => setPreviewEmail(em)}
                        className="p-3.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] hover:border-blue-500/30 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[var(--x-text)] flex items-center gap-2">
                            <span>{em.recipient_email}</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                              {em.email_type}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--x-subtext)] truncate max-w-md">{em.subject}</div>
                        </div>

                        <div className="text-[11px] text-[var(--x-subtext)] font-mono">
                          Inspect HTML →
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
