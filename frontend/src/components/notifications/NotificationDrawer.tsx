import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Check,
  UserCheck,
  UserX,
  UserPlus,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCheck,
  Clock,
  ExternalLink,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClassroom?: (classroomId: string) => void;
  onRefreshUnread?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectClassroom,
  onRefreshUnread
}) => {
  const { user, authFetch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [expandedNotepadId, setExpandedNotepadId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await authFetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const handleMarkAllRead = async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      if (onRefreshUnread) onRefreshUnread();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      if (onRefreshUnread) onRefreshUnread();
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleFacultyDecision = async (
    notif: NotificationItem,
    action: 'accept' | 'reject'
  ) => {
    const classroomId = notif.data?.classroom_id;
    const memberId = notif.data?.member_id;
    if (!classroomId || !memberId) return;

    setActionLoadingId(notif.id);
    try {
      const res = await authFetch(
        `/api/classrooms/${classroomId}/requests/${memberId}/decide`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, decision: action })
        }
      );
      const data = await res.json();
      if (data.success) {
        await handleMarkOneRead(notif.id);
        fetchNotifications();
        if (onRefreshUnread) onRefreshUnread();
      }
    } catch (err) {
      console.error('Failed to process join request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStudymateDecision = async (
    notif: NotificationItem,
    action: 'accept' | 'reject'
  ) => {
    const senderId = notif.data?.sender_id || notif.sender_id;
    if (!senderId) return;

    setActionLoadingId(notif.id);
    try {
      const res = await authFetch('/api/studymates/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: senderId, action })
      });
      const data = await res.json();
      if (data.success) {
        await handleMarkOneRead(notif.id);
        fetchNotifications();
        if (onRefreshUnread) onRefreshUnread();
      }
    } catch (err) {
      console.error('Failed to process studymate request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sliding Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-[var(--x-surface)] backdrop-blur-xl border-l border-[var(--x-border)] h-full shadow-2xl flex flex-col z-10 overflow-hidden text-[var(--x-text)]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[var(--x-border)] flex items-center justify-between bg-[var(--x-surface)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-ios-blue/20 border border-ios-blue/30 flex items-center justify-center text-ios-blue">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--x-text)] text-sm">Notifications</h3>
                <p className="text-[11px] text-[var(--x-subtext)]">
                  {notifications.filter((n) => !n.is_read).length} unread alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.is_read) && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="px-2.5 py-1 rounded-xl bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && notifications.length === 0 ? (
              <div className="py-20 text-center text-[var(--x-subtext)] text-xs">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center justify-center mx-auto text-[var(--x-subtext)]">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-[var(--x-subtext)] text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read;
                const isCbtAlert = n.type === 'cbt_proctor_alert';
                const isJoinReq = n.type === 'join_request';
                const isAccepted = n.type === 'join_accepted';
                const isRejected = n.type === 'join_rejected';
                const isStudyMateReq = n.type === 'studymate_request';
                const isStudyMateAccepted = n.type === 'studymate_accepted';

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnread
                        ? isCbtAlert
                          ? 'bg-rose-500/[0.08] border-rose-500/40 shadow-sm'
                          : 'bg-[var(--x-surface-hover)] border-emerald-500/40 shadow-sm'
                        : 'bg-[var(--x-surface)] border-[var(--x-border)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                          isCbtAlert
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isJoinReq || isStudyMateReq
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isAccepted || isStudyMateAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isCbtAlert && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {isJoinReq && <GraduationCap className="w-4 h-4" />}
                        {isStudyMateReq && <UserPlus className="w-4 h-4 text-emerald-400" />}
                        {(isAccepted || isStudyMateAccepted) && <Check className="w-4 h-4 text-emerald-400" />}
                        {isRejected && <X className="w-4 h-4 text-rose-400" />}
                        {!isJoinReq && !isStudyMateReq && !isAccepted && !isStudyMateAccepted && !isRejected && !isCbtAlert && (
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-[var(--x-text)] truncate">
                            {n.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-[var(--x-subtext)] mt-1 leading-relaxed">
                          {n.message}
                        </p>

                        {/* CBT Proctor Alert Notepad Viewer */}
                        {isCbtAlert && n.data?.proctor_notepad && (
                          <div className="mt-2.5">
                            <button
                              onClick={() => setExpandedNotepadId(expandedNotepadId === n.id ? null : n.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{expandedNotepadId === n.id ? 'Hide Keystroke Audit Log' : 'View Proctor Invisible Notepad Log'}</span>
                              {expandedNotepadId === n.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {expandedNotepadId === n.id && (
                              <pre className="mt-2 p-2.5 rounded-xl bg-black/60 border border-rose-500/20 text-[10px] font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                                {n.data.proctor_notepad}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* Study Mate Request Action Buttons */}
                        {isStudyMateReq && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              disabled={actionLoadingId === n.id}
                              onClick={() => handleStudymateDecision(n, 'accept')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-600/30"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept Study Mate</span>
                            </button>
                            <button
                              disabled={actionLoadingId === n.id}
                              onClick={() => handleStudymateDecision(n, 'reject')}
                              className="px-3 py-1.5 rounded-xl bg-[var(--x-surface-hover)] hover:bg-rose-500/20 text-[var(--x-subtext)] hover:text-rose-500 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-[var(--x-border)] disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}

                        {/* Faculty Join Request Action Buttons */}
                        {isJoinReq && user?.role === 'university' && (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              disabled={actionLoadingId === n.id}
                              onClick={() => handleFacultyDecision(n, 'accept')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-600/30"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept Student</span>
                            </button>
                            <button
                              disabled={actionLoadingId === n.id}
                              onClick={() => handleFacultyDecision(n, 'reject')}
                              className="px-3 py-1.5 rounded-xl bg-[var(--x-surface-hover)] hover:bg-rose-500/20 text-[var(--x-subtext)] hover:text-rose-500 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-[var(--x-border)] disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}

                        {/* Student Accepted Shortcut */}
                        {isAccepted && n.data?.classroom_id && (
                          <div className="mt-2.5">
                            <button
                              onClick={() => {
                                handleMarkOneRead(n.id);
                                if (onSelectClassroom) {
                                  onSelectClassroom(n.data.classroom_id);
                                  onClose();
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ios-blue hover:underline cursor-pointer"
                            >
                              <span>Enter Subject Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="mt-2 text-[10px] text-[var(--x-subtext)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Recently</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
