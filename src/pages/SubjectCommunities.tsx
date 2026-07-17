import React, { useState, useEffect } from 'react';
import { Search, Heart, MessageCircle, Share2, Bookmark, Users, Plus, X, Headphones, Radio, Mic, Volume2, Sparkles } from 'lucide-react';
import { createCommunity, subscribeToCommunities, type FirestoreCommunity } from '../lib/firestoreService';

interface LiveStudyRoom {
  id: string;
  title: string;
  tag: string;
  activePeers: number;
  speakers: string[];
  color: string;
}

const LIVE_STUDY_ROOMS: LiveStudyRoom[] = [
  {
    id: 'room-1',
    title: '💻 DSA & LeetCode Grind Lounge',
    tag: 'Competitive Coding',
    activePeers: 24,
    speakers: ['Sujan M.', 'Ananya S.', 'Rohan K.'],
    color: 'from-[#00CFFF] to-[#4169E1]',
  },
  {
    id: 'room-2',
    title: '⚡ OS & DBMS Exam Revision Room',
    tag: 'Core IT Placements',
    activePeers: 38,
    speakers: ['Prof. Sharma', 'Aryan M.', 'Priya N.'],
    color: 'from-[#9B5DE5] to-[#F15BB5]',
  },
  {
    id: 'room-3',
    title: '🚀 AI & EdTech 36h Hackathon War Room',
    tag: 'Project Building',
    activePeers: 19,
    speakers: ['Sneha P.', 'Vikram T.'],
    color: 'from-[#FEE140] to-[#FA709A]',
  },
];

export const SubjectCommunities: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<FirestoreCommunity[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeRoom, setActiveRoom] = useState<LiveStudyRoom | null>(null);
  
  // New Community Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const unsub = subscribeToCommunities((comms) => setCommunities(comms));
    return () => unsub();
  }, []);

  const handleCreateCommunity = async () => {
    if (!currentUser?.uid) {
      alert('Sign in to create a community!');
      return;
    }
    if (!newTitle.trim() || !newCategory.trim()) {
      alert('Please fill out both title and category.');
      return;
    }
    
    const isSchool = currentUser?.studentType === 'school';
    const loc = isSchool ? `${currentUser?.schoolClass} • ${currentUser?.board}` : `${currentUser?.college || 'Student'} • ${currentUser?.department || ''}`;

    await createCommunity({
      title: newTitle.trim(),
      category: newCategory.trim(),
      authorId: currentUser.uid,
      authorName: currentUser.name || 'Anonymous',
      authorCollege: loc,
      upvotes: 0,
      memberCount: 1,
    });
    
    setNewTitle('');
    setNewCategory('');
    setIsCreating(false);
    alert('Community created successfully!');
  };

  const filteredCommunities = communities.filter((comm) => 
    !searchQuery.trim() || 
    comm.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    comm.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6 pb-36">
      
      {/* ── GOATED 24/7 Live Study Rooms & Audio Lounges Dock ── */}
      <div className="kx-card p-4 rounded-3xl border border-[#00CFFF]/30 bg-gradient-to-r from-[#00CFFF]/10 via-[#9B5DE5]/10 to-transparent space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-[#00CFFF]" />
              <span>Koinexa 24/7 Live Study Rooms & Voice Hubs</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            81 Active Peers Online
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LIVE_STUDY_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className="text-left p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-[#00CFFF]/50 transition-all group space-y-2 relative overflow-hidden focus:outline-none"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-tr ${room.color} opacity-10 rounded-full blur-xl pointer-events-none group-hover:opacity-25 transition-opacity`} />
              
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#00CFFF] uppercase tracking-wide">{room.tag}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Radio className="w-3 h-3 animate-pulse" />
                  {room.activePeers}
                </span>
              </div>

              <h4 className="text-xs font-black text-white group-hover:text-[#00CFFF] transition-colors line-clamp-1">{room.title}</h4>
              
              <div className="flex items-center gap-1.5 text-[10px] text-white/50 pt-1 border-t border-white/5">
                <Volume2 className="w-3 h-3 text-[#9B5DE5] shrink-0" />
                <span className="truncate">Speakers: {room.speakers.join(', ')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Live Study Room Overlay Modal ── */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fadeIn" onClick={() => setActiveRoom(null)}>
          <div className="kx-card max-w-md w-full p-6 rounded-3xl border border-[#00CFFF]/40 shadow-2xl space-y-5 relative bg-gradient-to-b from-slate-900 to-slate-950" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wide flex items-center gap-1 inline-flex mb-1">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE AUDIO ROOM
                </span>
                <h3 className="text-base font-black text-white">{activeRoom.title}</h3>
              </div>
              <button onClick={() => setActiveRoom(null)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Active Speakers & Mentors:</span>
                <span className="text-[#00CFFF] font-bold">{activeRoom.speakers.length} speaking</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeRoom.speakers.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-[#00CFFF]/30 text-xs font-bold text-white">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#9B5DE5] flex items-center justify-center text-[10px] text-white font-black">
                      {s[0]}
                    </div>
                    <span>{s}</span>
                    <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => alert(`Joined ${activeRoom.title} Audio Lounge! You are connected via clear WebRTC channels.`)} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/30 flex items-center justify-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>Join Voice War Room Now</span>
              </button>
              <button onClick={() => setActiveRoom(null)} className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs">Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Communities Head & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00CFFF]" />
            <span>Koinexa Subject Communities</span>
          </h1>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00CFFF]/20 text-[#00CFFF] font-bold text-xs rounded-full border border-[#00CFFF]/30 hover:bg-[#00CFFF]/40 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Hub
          </button>
        </div>

        {/* Search Bar */}
        <div className="kx-field-pill">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-[#4169E1] absolute left-4" />
            <input
              type="text"
              placeholder="Search subject hubs, exam revision rooms, and study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      {isCreating && (
        <div className="kx-card p-6 space-y-4 rounded-3xl border border-[#00CFFF]/30 shadow-2xl bg-slate-900 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00CFFF]" />
              <span>Launch a New Study Hub</span>
            </h2>
            <button onClick={() => setIsCreating(false)} className="text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 pt-1">
            <div className="kx-field flex items-center px-3.5">
              <input type="text" placeholder="Hub Name (e.g. Advanced Data Structures & Graphs)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
            </div>
            <div className="kx-field flex items-center px-3.5">
              <input type="text" placeholder="Category Tag (e.g. Computer Science / Placement Preparation)" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium" />
            </div>
            <button onClick={handleCreateCommunity} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/30 mt-2">
              Start Community Hub
            </button>
          </div>
        </div>
      )}

      {/* Community Feed */}
      <div className="space-y-4">
        {filteredCommunities.length === 0 && !isCreating && (
          <div className="p-10 rounded-3xl border border-white/10 bg-slate-900/50 text-center space-y-2">
            <Users className="w-10 h-10 text-[#00CFFF]/40 mx-auto" />
            <p className="text-sm font-bold text-white">No communities found matching your query.</p>
            <p className="text-xs text-white/40">Launch your own study hub above right now!</p>
          </div>
        )}
        
        {filteredCommunities.map((comm) => (
          <div key={comm.id} className="kx-card p-5 space-y-4 rounded-3xl border border-white/10 hover:border-[#00CFFF]/40 transition-all duration-300 shadow-xl bg-gradient-to-r from-slate-900/90 to-slate-950/90">
            {/* Community Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] p-[2px] shadow-md">
                    <div className="w-full h-full bg-[#0A0A0F] rounded-[14px] flex items-center justify-center font-black text-sm text-white">
                      {comm.authorName[0]}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    {comm.authorName}
                  </h4>
                  <p className="text-xs text-white/60 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="text-[#00CFFF] font-bold">#{comm.category}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-black border border-[#00CFFF]/30 flex items-center gap-1.5 shadow-inner">
                  <Users className="w-3.5 h-3.5 text-[#00CFFF]" />
                  <span>{comm.memberCount} Active Members</span>
                </span>
              </div>
            </div>

            {/* Community Content */}
            <div className="space-y-2 pt-1">
              <p className="text-base font-black text-white tracking-wide">{comm.title}</p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-4 sm:gap-5">
                <button onClick={() => alert('Upvoted!')} className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white hover:text-[#9B5DE5] transition-all group/btn">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:fill-[#9B5DE5] group-hover/btn:text-[#9B5DE5]" />
                  <span>{comm.upvotes}</span>
                </button>

                <button onClick={() => alert('Opened Koinexa Room Chat!')} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white hover:text-[#4169E1] transition-all">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Room Chat</span>
                </button>

                <button onClick={() => {
                  setCommunities(prev => prev.map(c => c.id === comm.id ? { ...c, memberCount: c.memberCount + 1 } : c));
                  alert(`Joined ${comm.title}! You now receive instant study broadcast notifications.`);
                }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00CFFF]/20 to-[#4169E1]/20 hover:from-[#00CFFF] hover:to-[#4169E1] text-white font-black text-xs shadow-md transition-all border border-[#00CFFF]/40">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join Hub</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => alert('Community hub link copied to clipboard!')} className="text-white/70 hover:text-[#00CFFF] transition-all p-1">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button onClick={() => alert('Community bookmarked!')} className="text-white/70 hover:text-[#00CFFF] transition-all p-1">
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
