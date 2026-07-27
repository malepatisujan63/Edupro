import React, { useState, useEffect } from 'react';
import { Search, Heart, MessageCircle, Share2, Bookmark, Users, Plus, X, Sparkles } from 'lucide-react';
import { createCommunity, subscribeToCommunities, type FirestoreCommunity } from '../lib/supabaseService';

export const SubjectCommunities: React.FC<{ currentUser?: any; account?: any; onOpenRoomChat?: (roomTitle: string) => void }> = ({ currentUser, account, onOpenRoomChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<FirestoreCommunity[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
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
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 pb-36">
      
      {/* Subject Communities Head & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-xl sm:text-2xl font-extrabold kx-text-glow flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00CFFF]" />
            <span>Subject Communities</span>
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
                <button onClick={() => { if (account) account.recordDwell(comm.category, 3); alert('Upvoted! Dwell affinity boosted for ' + comm.category); }} className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white hover:text-[#9B5DE5] transition-all group/btn">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:fill-[#9B5DE5] group-hover/btn:text-[#9B5DE5]" />
                  <span>{comm.upvotes}</span>
                </button>

                <button onClick={() => { 
                  if (account) account.recordDwell(comm.category, 5); 
                  if (onOpenRoomChat) onOpenRoomChat(comm.title);
                }} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white hover:text-[#4169E1] transition-all">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Room Chat</span>
                </button>

                <button onClick={() => {
                  if (account) account.recordDwell(comm.category, 10);
                  setCommunities(prev => prev.map(c => c.id === comm.id ? { ...c, memberCount: c.memberCount + 1 } : c));
                  alert(`Joined ${comm.title}! +10 Dwell points added to your personal Max-Heap for ${comm.category}.`);
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
