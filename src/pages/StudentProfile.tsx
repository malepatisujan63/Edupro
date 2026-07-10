import React, { useState } from 'react';
import { Award, Share2, Check, X, Shield, Trash2, LogOut } from 'lucide-react';
import { globalSocialGraph, type StudentNode } from '../dsa-engine';

interface StudentProfileProps {
  currentUser: any;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  onLogout,
  onDeleteAccount,
}) => {
  const userNode = currentUser || {
    id: 'usr_1',
    name: 'Aarav Sharma',
    college: 'IIT Bombay',
    department: 'Computer Science & Engineering',
    semester: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'student' as const,
    reputationPoints: 1240,
    badges: ['DSA Expert', 'Top Contributor', 'Verified Student'],
  };

  const [friendRequests, setFriendRequests] = useState(() => {
    // Return pending requests from the social graph
    return globalSocialGraph.getFriendRequests(userNode.id) || [
      { id: 'usr_4', name: 'Ananya Verma', college: 'VIT Vellore • IT', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { id: 'usr_2', name: 'Riya Patel', college: 'BITS Pilani • ECE', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    ];
  });

  const [myFriends, setMyFriends] = useState<StudentNode[]>(() => globalSocialGraph.getFriends(userNode.id));

  const handleAcceptRequest = (senderId: string) => {
    globalSocialGraph.acceptFriendRequest(userNode.id, senderId);
    setFriendRequests((prev: any[]) => prev.filter((r) => r.id !== senderId));
    setMyFriends(globalSocialGraph.getFriends(userNode.id));
    alert(`Friend request accepted! Added bidirectional Graph edge ($O(1)$) between you and user.`);
  };

  const handleDeclineRequest = (senderId: string) => {
    setFriendRequests((prev: any[]) => prev.filter((r) => r.id !== senderId));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 pb-32">
      
      {/* Profile Header Banner */}
      <div className="p-8 rounded-3xl bg-[#121212] border border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E1306C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <img
              src={userNode.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-white/30 shadow-2xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-lg uppercase">
              {userNode.role || 'STUDENT'}
            </span>
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{userNode.name}</h1>
              <span className="px-3 py-1 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30 text-xs font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Google Verified + Mobile OTP
              </span>
            </div>

            <p className="text-sm text-white/70 font-medium">
              {userNode.college || 'IIT Bombay'} • {userNode.department || 'Computer Science'} • Semester {userNode.semester || 5}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {(userNode.badges || ['DSA Expert', 'Top Contributor']).map((badge: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-[#181818] border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-[#FD1D1D]" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="text-center sm:text-right shrink-0 bg-[#181818] p-4 rounded-2xl border border-white/20">
            <p className="text-xs text-white/60 uppercase font-mono">Reputation Points</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E1306C] to-[#FCB045]">
              {userNode.reputationPoints || 1240}
            </p>
            <p className="text-[10px] text-white/40 font-mono mt-1">Upvote rank: #1</p>
          </div>
        </div>
      </div>

      {/* Friend Requests Section (Instagram-Style Graph Edge Management) */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#E1306C]" />
            <span>Instagram-Style Friend Requests ({friendRequests.length} pending)</span>
          </h2>
          <span className="text-xs text-white/50 font-mono">Graph Edge Management ($O(1)$)</span>
        </div>

        {friendRequests.length === 0 ? (
          <p className="text-xs text-white/50 italic py-4 text-center">No pending friend requests at this time.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friendRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-2xl bg-[#181818] border border-white/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={req.avatarUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/20 shrink-0" />
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate">{req.name}</h4>
                    <p className="text-xs text-white/60 truncate">{req.college}</p>
                  </div>
                </div>

                <div className="segmented-glass-group shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    title="Accept Friend Request (Add Graph Edge)"
                    className="w-9 h-9 rounded-full bg-[#34C759]/80 hover:bg-[#34C759] text-white flex items-center justify-center font-bold shadow-md transition-all active:scale-95 border border-[#34C759]/50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    title="Decline Request"
                    className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333333] text-white flex items-center justify-center transition-all border border-white/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Graph Network Connections */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-white/20 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center justify-between">
          <span>My Classmate Network ({myFriends.length} connected edges)</span>
          <span className="text-xs text-[#833AB4] font-mono">Bidirectional Graph ($O(1)$ Adj List)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {myFriends.map((f) => (
            <div key={f.id} className="p-3.5 rounded-2xl bg-[#181818] border border-white/20 flex items-center gap-3">
              <img src={f.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{f.name}</h4>
                <p className="text-[10px] text-white/60 truncate">{f.college}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings & Permanent Deletion */}
      <div className="p-6 rounded-3xl bg-[#121212] border border-[#FD1D1D]/30 shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-[#FD1D1D]" />
          <span>Account Security & Lifecycle Management</span>
        </h2>
        <p className="text-xs text-white/70">
          As required by your security model, one account maps uniquely to one Google account & phone number in our `UniqueRegistrationHashSet`. You can log out or permanently delete your profile at any time:
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={onLogout}
            className="px-6 py-2.5 rounded-xl bg-[#181818] hover:bg-[#262626] border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Permanently delete your account? This removes all your profile data, upvotes, graph connections, and cache.')) {
                onDeleteAccount();
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Delete Account ($O(1)$ Purge)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
