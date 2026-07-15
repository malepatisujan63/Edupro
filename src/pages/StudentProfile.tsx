import React, { useState } from 'react';
import { Check, X, Shield, Trash2, LogOut, BookOpen, Star, Zap, UserPlus, Users } from 'lucide-react';
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
  const userNode = currentUser || {};
  const isSchool = userNode.studentType === 'school';

  const [studyMateRequests, setStudyMateRequests] = useState<any[]>(() => {
    return globalSocialGraph.getFriendRequests(userNode.id || userNode.uid) || [];
  });

  const [studyMates, setStudyMates] = useState<StudentNode[]>(() => globalSocialGraph.getFriends(userNode.id));

  const handleAcceptRequest = (senderId: string) => {
    globalSocialGraph.acceptFriendRequest(userNode.id, senderId);
    setStudyMateRequests((prev: any[]) => prev.filter((r) => r.id !== senderId));
    setStudyMates(globalSocialGraph.getFriends(userNode.id));
    alert(`Study Mate request accepted! You can now message each other.`);
  };

  const handleDeclineRequest = (senderId: string) => {
    setStudyMateRequests((prev: any[]) => prev.filter((r) => r.id !== senderId));
  };

  const renderTags = (items?: string[], icon?: React.ReactNode, title?: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white/50 uppercase flex items-center gap-1.5">{icon} {title}</h4>
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-[#111111] border border-white/10 text-white text-[11px] font-bold">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-32">
      
      {/* Profile Header Banner */}
      <div className="kx-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00CFFF]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative shrink-0">
          <img
            src={userNode.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Avatar"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border border-white/20 shadow-2xl"
          />
          <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] text-white font-black text-[10px] px-2 py-0.5 rounded-lg shadow-lg uppercase">
            {userNode.studentType || 'STUDENT'}
          </span>
        </div>

        <div className="text-center sm:text-left space-y-2 flex-1 relative z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{userNode.name}</h1>
            <span className="px-3 py-1 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30 text-[10px] font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified User
            </span>
          </div>

          <p className="text-sm text-[#00CFFF] font-bold">
            {isSchool 
              ? `${userNode.schoolClass || 'School'} • ${userNode.board || 'Board'}`
              : `${userNode.college || 'College'} • ${userNode.department || 'Department'} • Sem ${userNode.semester || '1'}`
            }
          </p>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            {(userNode.badges || ['Verified Student']).map((badge: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold">
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0 bg-[#000000] p-4 rounded-2xl border border-white/10 shadow-inner">
          <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Reputation</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5]">
            {userNode.reputationPoints || 100}
          </p>
        </div>
      </div>

      {/* About & Interests */}
      {(userNode.skills?.length > 0 || userNode.interests?.length > 0 || userNode.hobbies?.length > 0) && (
        <div className="kx-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderTags(userNode.skills, <Zap className="w-3.5 h-3.5 text-[#00CFFF]" />, 'Skills')}
          {renderTags(userNode.interests, <Star className="w-3.5 h-3.5 text-[#4169E1]" />, 'Interests')}
          {renderTags(userNode.hobbies, <BookOpen className="w-3.5 h-3.5 text-[#9B5DE5]" />, 'Hobbies')}
        </div>
      )}

      {/* Study Mate Requests */}
      <div className="kx-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <UserPlus className="w-5 h-5 text-[#00CFFF]" />
          <span>Pending Study Mate Requests ({studyMateRequests.length})</span>
        </h2>

        {studyMateRequests.length === 0 ? (
          <p className="text-xs text-white/40 italic text-center py-2">No pending requests right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {studyMateRequests.map((req: any) => (
              <div key={req.id} className="p-4 rounded-2xl bg-[#000000] border border-white/10 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={req.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate">{req.name}</h4>
                    <p className="text-[10px] text-[#00CFFF] font-bold truncate">{req.college || req.schoolClass}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleAcceptRequest(req.id)} className="w-8 h-8 rounded-full bg-[#34C759]/20 hover:bg-[#34C759]/40 text-[#34C759] flex items-center justify-center transition-all border border-[#34C759]/30">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button onClick={() => handleDeclineRequest(req.id)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Study Mates */}
      <div className="kx-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Users className="w-5 h-5 text-[#4169E1]" />
          <span>My Study Mates ({studyMates.length})</span>
        </h2>

        {studyMates.length === 0 ? (
          <p className="text-xs text-white/40 italic text-center py-2">Connect with others to build your network.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {studyMates.map((f) => (
              <div key={f.id} className="p-3 rounded-2xl bg-[#000000] border border-white/10 flex flex-col items-center gap-2 text-center shadow-inner">
                <img src={f.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-white/20" />
                <div className="min-w-0 w-full">
                  <h4 className="text-xs font-bold text-white truncate">{f.name}</h4>
                  <p className="text-[9px] text-[#4169E1] font-bold truncate">{f.college || 'Student'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="kx-card p-6 space-y-4 border-[#9B5DE5]/30">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-5 h-5 text-[#9B5DE5]" />
          <span>Account Security</span>
        </h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={onLogout} className="px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#111111] border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Permanently delete your account? This removes all your profile data.')) {
                onDeleteAccount();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#000000] border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

    </div>
  );
};
