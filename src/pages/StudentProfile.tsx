import React, { useState, useEffect } from 'react';
import { LogOut, Trash2, Grid, Bookmark, PlaySquare, ChevronDown, UserPlus, MessageCircle, Settings, CheckCircle } from 'lucide-react';
import { fetchUserProfile, fetchPostsByUser, sendStudyMateRequest, acceptStudyMateRequest, type FirestoreUser, type FirestorePost } from '../lib/supabaseService';
import { globalSocialGraph } from '../dsa-engine';

interface StudentProfileProps {
  currentUser: any;
  account?: any;
  viewProfileId?: string | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  account,
  viewProfileId,
  onLogout,
  onDeleteAccount,
}) => {
  const isViewingSelf = !viewProfileId || viewProfileId === (currentUser.uid || currentUser.id);
  const targetId = isViewingSelf ? (currentUser.uid || currentUser.id) : viewProfileId!;

  const [profileUser, setProfileUser] = useState<FirestoreUser | any>(isViewingSelf ? currentUser : null);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridTab, setGridTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (!isViewingSelf) {
        const u = await fetchUserProfile(targetId);
        setProfileUser(u);
        // Check if we are following
        if (u && currentUser) {
          const amIFollowing = (u.studyMates || []).includes(currentUser.uid) || (currentUser.studyMates || []).includes(u.uid);
          setIsFollowing(amIFollowing);
        }
      } else {
        setProfileUser(currentUser);
        // Load pending requests for self
        const freshSelf = await fetchUserProfile(targetId);
        if (freshSelf && freshSelf.pendingStudyMateRequests) {
          setPendingRequests(freshSelf.pendingStudyMateRequests);
        }
      }
      
      const p = await fetchPostsByUser(targetId);
      setPosts(p);
      setLoading(false);
    }
    loadData();
  }, [targetId, isViewingSelf, currentUser]);

  const handleFollow = async () => {
    if (!profileUser || !currentUser) return;
    await sendStudyMateRequest(currentUser.uid, profileUser.uid);
    alert('Friend request sent!');
  };

  const handleAcceptRequest = async (senderId: string) => {
    await acceptStudyMateRequest(senderId, currentUser.uid);
    setPendingRequests(prev => prev.filter(id => id !== senderId));
    alert('Friend request accepted!');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><span className="text-white/50 animate-pulse">Loading Profile...</span></div>;
  }

  if (!profileUser) {
    return <div className="text-center text-white/50 mt-10">Profile not found.</div>;
  }

  const followersCount = profileUser.studyMates?.length || 0;
  // Following count is assumed to be similar in an undirected graph, but for UI sake:
  const followingCount = followersCount; 

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-[#000000] pb-24 text-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-[#000000]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-white/50 hidden" />
          <h1 className="text-xl font-bold tracking-tight">{profileUser.name.toLowerCase().replace(/\s/g, '_')}</h1>
          <ChevronDown className="w-4 h-4 text-white/70" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="text-xl font-light">@</span>
            {pendingRequests.length > 0 && isViewingSelf && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>
            )}
          </div>
          {isViewingSelf && (
            <button onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal (for own profile) */}
      {isSettingsOpen && isViewingSelf && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <div className="w-full sm:max-w-sm bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 animate-slideUp sm:animate-scaleUp">
            <h3 className="text-lg font-bold mb-4 text-white">Account Settings</h3>
            
            {pendingRequests.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-semibold text-[#00CFFF]">Friend Requests</h4>
                {pendingRequests.map(reqId => (
                  <div key={reqId} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                    <span className="text-sm text-white/80 truncate max-w-[150px]">User {reqId.slice(-4)}</span>
                    <button onClick={() => handleAcceptRequest(reqId)} className="text-xs bg-[#00CFFF] text-black px-3 py-1 rounded-lg font-bold hover:bg-[#00CFFF]/80">
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-white/10">
              <button onClick={() => { setIsSettingsOpen(false); onLogout(); }} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2 transition">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button onClick={() => {
                if (confirm('Permanently delete your account?')) {
                  setIsSettingsOpen(false);
                  onDeleteAccount();
                }
              }} className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 transition">
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-2 text-sm text-white/50 hover:text-white mt-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header (Avatar & Stats) */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div className="relative">
          <img 
            src={profileUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt="Avatar" 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-white/10 p-0.5"
          />
          {isViewingSelf && (
            <div className="absolute bottom-0 right-0 bg-[#00CFFF] text-black rounded-full p-1 border-2 border-black cursor-pointer">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex justify-center gap-6 sm:gap-10 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg sm:text-xl font-bold">{posts.length}</span>
            <span className="text-[11px] sm:text-xs text-white/80">posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg sm:text-xl font-bold">{followersCount}</span>
            <span className="text-[11px] sm:text-xs text-white/80">followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg sm:text-xl font-bold">{followingCount}</span>
            <span className="text-[11px] sm:text-xs text-white/80">following</span>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="px-4 mt-3 space-y-1">
        <h2 className="font-bold text-sm">{profileUser.name}</h2>
        <p className="text-xs text-white/90">
          {profileUser.college ? `${profileUser.college} • ${profileUser.department}` : (profileUser.schoolClass ? `${profileUser.schoolClass} • ${profileUser.board}` : 'Student at Koinexa')}
        </p>
        {(profileUser.skills?.length > 0 || profileUser.interests?.length > 0) && (
          <p className="text-xs text-white/70">
            Passionate about {profileUser.skills?.slice(0,2).join(', ')} {(profileUser.interests?.length > 0) ? `and ${profileUser.interests[0]}` : ''}. Let's push limits!
          </p>
        )}
        <p className="text-xs text-[#E0F7FA] font-medium pt-0.5 flex items-center gap-1 cursor-pointer">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          edunetwork.app/{profileUser.name.toLowerCase().replace(/\s/g, '')}
        </p>
      </div>

      {/* Mutual Connections (Optional dummy data for Instagram vibe) */}
      {!isViewingSelf && (
        <div className="px-4 mt-3 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <img src="https://ui-avatars.com/api/?name=A&background=random" className="w-5 h-5 rounded-full border border-black" />
            <img src="https://ui-avatars.com/api/?name=B&background=random" className="w-5 h-5 rounded-full border border-black" />
            <img src="https://ui-avatars.com/api/?name=C&background=random" className="w-5 h-5 rounded-full border border-black" />
          </div>
          <span className="text-[11px] text-white/70 font-medium">Followed by sujan, anita and 42 others</span>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="px-4 mt-4 flex items-center gap-2">
        {isViewingSelf ? (
          <>
            <button className="flex-1 bg-[#1A1A1A] hover:bg-[#262626] text-white font-semibold text-[13px] py-1.5 rounded-lg transition">Edit profile</button>
            <button className="flex-1 bg-[#1A1A1A] hover:bg-[#262626] text-white font-semibold text-[13px] py-1.5 rounded-lg transition">Share profile</button>
            <button className="bg-[#1A1A1A] hover:bg-[#262626] text-white p-1.5 rounded-lg transition">
              <UserPlus className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleFollow}
              className={`flex-1 font-semibold text-[13px] py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${isFollowing ? 'bg-[#1A1A1A] text-white' : 'bg-[#00CFFF] text-black hover:bg-[#00CFFF]/90'}`}
            >
              {isFollowing ? <>Following <ChevronDown className="w-3 h-3" /></> : 'Follow'}
            </button>
            <button className="flex-1 bg-[#1A1A1A] hover:bg-[#262626] text-white font-semibold text-[13px] py-1.5 rounded-lg transition">Message</button>
            <button className="bg-[#1A1A1A] hover:bg-[#262626] text-white p-1.5 rounded-lg transition">
              <UserPlus className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-t border-white/10 flex items-center justify-around">
        <button 
          onClick={() => setGridTab('posts')} 
          className={`flex-1 flex justify-center py-3 border-b-2 transition ${gridTab === 'posts' ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          <Grid className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setGridTab('reels')} 
          className={`flex-1 flex justify-center py-3 border-b-2 transition ${gridTab === 'reels' ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          <PlaySquare className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setGridTab('saved')} 
          className={`flex-1 flex justify-center py-3 border-b-2 transition ${gridTab === 'saved' ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
        {gridTab === 'posts' && posts.length > 0 ? (
          posts.map((post, idx) => (
            <div key={post.id || idx} className="aspect-square bg-[#1A1A1A] relative group cursor-pointer overflow-hidden">
              {post.mediaUrl ? (
                post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post content" />
                )
              ) : (
                <div className="w-full h-full p-2 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#111] to-[#222]">
                  <p className="text-[9px] sm:text-xs font-semibold text-white/90 line-clamp-3 leading-snug">{post.title}</p>
                </div>
              )}
              {post.mediaType === 'video' && <PlaySquare className="absolute top-1 right-1 w-4 h-4 text-white drop-shadow-md" />}
              {post.type === 'note' && <Bookmark className="absolute top-1 right-1 w-4 h-4 text-white drop-shadow-md" />}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 text-white text-sm font-bold">
                <span className="flex items-center gap-1"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {post.upvotes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-current" /> {post.commentsCount}</span>
              </div>
            </div>
          ))
        ) : gridTab === 'posts' ? (
          <div className="col-span-3 text-center py-10 text-white/50 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mb-3">
              <Grid className="w-8 h-8 text-white/20" />
            </div>
            <p className="font-bold text-lg text-white">No Posts Yet</p>
            <p className="text-xs mt-1">Capture the moment or share your study notes.</p>
          </div>
        ) : (
          <div className="col-span-3 text-center py-12 text-white/50 text-sm font-semibold">
            {gridTab === 'reels' ? 'No Reels Yet' : 'No Saved Posts'}
          </div>
        )}
      </div>

    </div>
  );
};
