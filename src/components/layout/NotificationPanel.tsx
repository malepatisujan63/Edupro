import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, UserPlus } from 'lucide-react';
import { fetchUserProfile, acceptStudyMateRequest } from '../../lib/supabaseService';

interface NotificationPanelProps {
  currentUser: any;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ currentUser, onClose }) => {
  const [requests, setRequests] = useState<{ id: string, name: string, college: string, avatarUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!currentUser?.uid) return;
      setLoading(true);
      const profile = await fetchUserProfile(currentUser.uid);
      if (profile && profile.pendingStudyMateRequests) {
        // Fetch details for each requester
        const requestDetails = await Promise.all(
          profile.pendingStudyMateRequests.map(async (reqId: string) => {
            const user = await fetchUserProfile(reqId);
            return {
              id: reqId,
              name: user?.name || 'Student',
              college: user?.college || 'Unknown College',
              avatarUrl: user?.avatarUrl || ''
            };
          })
        );
        setRequests(requestDetails);
      }
      setLoading(false);
    }
    loadRequests();
  }, [currentUser]);

  const handleAccept = async (reqId: string) => {
    if (!currentUser?.uid) return;
    try {
      await acceptStudyMateRequest(reqId, currentUser.uid);
      setRequests(requests.filter(r => r.id !== reqId));
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleDecline = async (reqId: string) => {
    // In a full implementation we would have declineStudyMateRequest. 
    // For now we just remove it locally to simulate.
    setRequests(requests.filter(r => r.id !== reqId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm h-full glass-panel rounded-none border-l border-white/10 p-6 space-y-6 flex flex-col shadow-2xl animate-panelRise bg-[#0D0D14]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#9B5DE5]" />
            <span>Notification Panel</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="text-white/50 animate-pulse">Loading...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 pt-10">
              <Bell className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm font-bold">No new notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Friend Requests</h4>
              {requests.map(req => (
                <div key={req.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4169E1] to-[#9B5DE5] flex items-center justify-center shrink-0">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <UserPlus className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{req.name}</p>
                      <p className="text-[10px] text-white/60">{req.college}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleAccept(req.id)} className="px-3 py-1 bg-[#4169E1] hover:bg-[#5179F1] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all">
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button onClick={() => handleDecline(req.id)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/15">
          <button
            onClick={() => {
              alert('All notifications marked read.');
              onClose();
            }}
            className="w-full btn-secondary text-xs py-2.5 font-bold bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-xl text-white transition-all border border-white/10"
          >
            Clear All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};
