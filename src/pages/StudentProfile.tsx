import React, { useState } from 'react';
import { Check, X, Shield, Trash2, LogOut, BookOpen, Star, Zap, UserPlus, Users } from 'lucide-react';
import { globalSocialGraph, type StudentNode } from '../dsa-engine';

interface StudentProfileProps {
  currentUser: any;
  account?: any;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  account,
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

      {/* ── ⚡ MongoDB Storage Record & Personal DSA Max-Heap Engine Diagnostics ── */}
      <div className="kx-card p-6 space-y-5 border border-[#00CFFF]/40 bg-gradient-to-br from-[#00CFFF]/10 via-transparent to-[#9B5DE5]/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00CFFF] shadow-[0_0_12px_#00CFFF] animate-pulse" />
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Personal Database Record & DSA Engine Status</span>
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-xs font-mono font-bold">
            MongoDB Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MongoDB Person Details Storage Document Card */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00CFFF]">
                MongoDB Document (_id & Metadata)
              </span>
              <span className="text-[10px] text-white/40">db.users.findOne()</span>
            </div>
            <div className="p-3 rounded-xl bg-[#08080C] border border-white/5 text-xs text-emerald-400 space-y-1 overflow-x-auto">
              <p><span className="text-white/50">{`{`}</span></p>
              <p className="pl-3"><span className="text-[#00CFFF]">"_id":</span> <span className="text-amber-300">"{userNode._id || userNode.id || userNode.uid || '6899fbe38d7f46a8b92c53d1'}"</span>,</p>
              <p className="pl-3"><span className="text-[#00CFFF]">"username":</span> <span className="text-amber-300">"{userNode.name || userNode.username || 'Student'}"</span>,</p>
              <p className="pl-3"><span className="text-[#00CFFF]">"email":</span> <span className="text-amber-300">"{userNode.email || 'student@gmail.com'}"</span>,</p>
              <p className="pl-3"><span className="text-[#00CFFF]">"studentType":</span> <span className="text-amber-300">"{userNode.studentType || 'college'}"</span>,</p>
              <p className="pl-3"><span className="text-[#00CFFF]">"college":</span> <span className="text-amber-300">"{userNode.college || userNode.schoolClass || 'Koinexa Campus'}"</span>,</p>
              <p className="pl-3"><span className="text-[#00CFFF]">"password":</span> <span className="text-white/40">"&lt;hashed_password_bcrypt&gt;"</span></p>
              <p><span className="text-white/50">{`}`}</span></p>
            </div>
            <p className="text-[10px] text-white/60 font-sans">
              🔒 Stored securely in MongoDB with auto-generated 24-char ObjectID and BCrypt hashing.
            </p>
          </div>

          {/* Personal DSA Max-Heap & Dwell Tracking Card */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#9B5DE5]">
                  Your Personal Max-Heap & Dwell Affinity ($O(1)$)
                </span>
                <span className="text-[10px] text-white/40 font-mono">Heap Active</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Your interaction patterns (video dwell times, upvotes, note downloads) train an isolated <strong className="text-[#00CFFF]">Max-Heap priority queue</strong> so your Campus Feed is sorted uniquely for you:
              </p>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/10">
              <span className="text-[10px] font-bold text-white/50 block">Live Category Dwell Scores (Trained via clicks/watch time):</span>
              <div className="flex flex-wrap gap-1.5">
                {account && Object.entries(account.getDwellScores()).length > 0 ? (
                  Object.entries(account.getDwellScores()).map(([cat, score]) => (
                    <span key={cat} className="px-2.5 py-1 rounded-lg bg-[#9B5DE5]/20 border border-[#9B5DE5]/40 text-white font-mono text-[11px] font-bold">
                      {cat}: <span className="text-[#00CFFF]">+{Number(score)} pts</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/50 italic">No dwell points accumulated yet. Watch videos or like notes to train!</span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
              <span className="font-bold text-white/70">Personal Bookmarks ($O(1)$ Array):</span>
              <strong className="text-[#00CFFF] font-mono">{account?.getBookmarks().length || 0} Saved Posts</strong>
            </div>
          </div>
        </div>
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
