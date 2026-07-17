import React, { useState, useEffect } from 'react';
import { Grid, LogOut, Trash2, X, Settings } from 'lucide-react';
import { fetchUserProfile, fetchPostsByUser, sendStudyMateRequest, saveUserProfile, type FirestoreUser, type FirestorePost } from '../lib/supabaseService';

interface StudentProfileProps {
  currentUser: any;
  account?: any;
  viewProfileId?: string | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onStartMessage?: (userId: string, userName: string) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  currentUser,
  viewProfileId,
  onLogout,
  onDeleteAccount,
  onStartMessage,
}) => {
  const isViewingSelf = !viewProfileId || viewProfileId === (currentUser.uid || currentUser.id);
  const targetId = isViewingSelf ? (currentUser.uid || currentUser.id) : viewProfileId!;

  const [profileUser, setProfileUser] = useState<FirestoreUser | any>(isViewingSelf ? currentUser : null);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false); // Default to NOT showing edit panel
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    college: '',
    department: '',
    hobbies: '',
    interests: '',
    website: ''
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (!isViewingSelf) {
        const u = await fetchUserProfile(targetId);
        setProfileUser(u);
        if (u && currentUser) {
          const amIFollowing = (u.studyMates || []).includes(currentUser.uid) || (currentUser.studyMates || []).includes(u.uid);
          setIsFollowing(amIFollowing);
        }
        setIsEditing(false); // Can't edit someone else
      } else {
        const u = await fetchUserProfile(targetId);
        const userToUse = u || currentUser;
        setProfileUser(userToUse);
        setEditForm({
          name: userToUse.name || '',
          bio: userToUse.bio || '',
          college: userToUse.college || '',
          department: userToUse.department || '',
          hobbies: userToUse.hobbies?.join(', ') || '',
          interests: userToUse.interests?.join(', ') || '',
          website: `edunetwork.app/${userToUse.name?.toLowerCase().replace(/\s/g, '') || ''}`
        });
      }
      
      const p = await fetchPostsByUser(targetId);
      setPosts(p);
      setLoading(false);
    }
    loadData();
  }, [targetId, isViewingSelf, currentUser]);

  const handleFollow = async () => {
    if (!profileUser || !currentUser) return;
    setIsFollowing(true); // Optimistic UI update
    await sendStudyMateRequest(currentUser.uid, profileUser.uid);
  };

  const handleSaveChanges = async () => {
    if (!profileUser) return;
    try {
      const updatedUser = {
        ...profileUser,
        name: editForm.name,
        bio: editForm.bio,
        college: editForm.college,
        department: editForm.department,
        hobbies: editForm.hobbies.split(',').map(s => s.trim()).filter(Boolean),
        interests: editForm.interests.split(',').map(s => s.trim()).filter(Boolean),
      };
      await saveUserProfile(updatedUser);
      setProfileUser(updatedUser);
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><span className="text-white/50 animate-pulse">Loading Profile...</span></div>;
  }

  if (!profileUser) {
    return <div className="text-center text-white/50 mt-10">Profile not found.</div>;
  }

  const followersCount = profileUser.studyMates?.length || 0;

  return (
    <div className="max-w-[1000px] mx-auto min-h-screen bg-[#000000] pb-32 text-white font-sans">
      
      {/* ── COVER BANNER WITH FLOWING GLOW ── */}
      <div className="relative w-full h-48 sm:h-64 rounded-b-[40px] overflow-hidden bg-[#0A0A0A] border-b border-white/10 shadow-[0_10px_50px_rgba(65,105,225,0.15)] group">
        {/* Animated glowing mesh gradients */}
        <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[200%] bg-gradient-to-br from-[#4169E1]/30 via-[#9B5DE5]/20 to-transparent blur-[80px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[100%] h-[150%] bg-gradient-to-tl from-[#00CFFF]/20 to-transparent blur-[100px] animate-[pulse_8s_ease-in-out_infinite_alternate]" />
        
        {/* Top Navbar overlapping banner */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
          <h1 className="text-xl font-bold flex items-center gap-2 drop-shadow-md">
            {profileUser.name.toLowerCase()} <span className="text-white/70 text-sm bg-white/10 px-2 py-0.5 rounded-full border border-white/20">Verified</span>
          </h1>
          <div className="flex items-center gap-4 text-white">
            <span className="text-xl font-light cursor-pointer hover:text-[#00CFFF] transition-colors drop-shadow-md">@</span>
            {isViewingSelf && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PROFILE HEADER SECTION ── */}
      <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-20 z-20 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
        
        {/* Avatar & Core Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
          {/* Glowing Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1] via-[#9B5DE5] to-[#00CFFF] rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative rounded-full bg-[#05050A] p-1.5 z-10 shadow-2xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4169E1] to-[#9B5DE5] flex items-center justify-center text-5xl font-black text-white overflow-hidden border-2 border-[#111]">
                {profileUser.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profileUser.name.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>
          </div>
          
          {/* Typography */}
          <div className="text-center sm:text-left mb-2 flex-1">
            <h2 className="text-3xl font-black tracking-tight">{profileUser.name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#4169E1]/20 text-[#4169E1] border border-[#4169E1]/30 rounded-full">
                {profileUser.college ? profileUser.college : 'Koinexa Campus'}
              </span>
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#9B5DE5]/20 text-[#9B5DE5] border border-[#9B5DE5]/30 rounded-full">
                {profileUser.department ? profileUser.department : 'Student'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Right Aligned) */}
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pb-2">
          {isViewingSelf ? (
            <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none px-8 py-3 rounded-[16px] font-bold text-sm bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:border-white/40 shadow-lg backdrop-blur-md hover:scale-105 transition-all">
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={handleFollow} className={`flex-1 sm:flex-none px-8 py-3 rounded-[16px] font-bold text-sm border shadow-lg backdrop-blur-md hover:scale-105 transition-all ${isFollowing ? 'bg-white/10 border-white/20 text-white' : 'bg-gradient-to-br from-[#4169E1] to-[#9B5DE5] border-[#9B5DE5]/50 text-white shadow-[0_0_20px_rgba(65,105,225,0.4)]'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button onClick={() => onStartMessage?.(profileUser.uid, profileUser.name)} className="flex-1 sm:flex-none px-8 py-3 rounded-[16px] font-bold text-sm bg-gradient-to-r from-[#111] to-[#222] border border-white/10 hover:border-white/30 shadow-lg hover:scale-105 transition-all">
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── BIO & GLASS STAT BAR ── */}
      <div className="px-4 sm:px-8 mt-8 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left: Bio Details */}
        <div className="w-full md:flex-1 space-y-4">
          <p className="text-sm text-white/80 leading-relaxed font-medium">
            {profileUser.bio || (profileUser.skills?.length > 0 ? `Passionate about ${profileUser.skills?.slice(0,2).join(' and ')}. Let's push limits!` : "Passionate about learning. Let's push limits! Exploring the edges of technology and networking on Koinexa.")}
          </p>
          <p className="text-sm flex items-center gap-2 cursor-pointer text-[#00CFFF] hover:text-white transition-colors group">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            <span className="font-semibold group-hover:underline underline-offset-4">{`edunetwork.app/${profileUser.name.toLowerCase().replace(/\s/g, '')}`}</span>
          </p>
        </div>

        {/* Right: Glassmorphism Stats Bar */}
        <div className="w-full md:w-auto flex items-center gap-6 p-5 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-2xl backdrop-blur-xl animate-[pulse_4s_ease-in-out_infinite] hover:scale-105 transition-transform duration-300">
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-black tracking-tight drop-shadow-md">{posts.length}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mt-1">Posts</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-black tracking-tight drop-shadow-md">{followersCount}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mt-1">Study Mates</span>
          </div>
        </div>
      </div>

        {/* Edit Profile Modal (Only show if editing and viewing self) */}
        {isViewingSelf && isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fadeIn">
            <div className="w-full max-w-lg bg-[#05050A]/90 rounded-[32px] p-8 shadow-[0_0_80px_rgba(65,105,225,0.2)] relative border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-b-full" />
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Edit Profile</h2>
                <p className="text-xs text-white/50 mt-1">Customize your Koinexa presence</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-[#4169E1] font-bold uppercase tracking-wider px-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/50 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#4169E1] font-bold uppercase tracking-wider px-1">Bio</label>
                <input type="text" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/50 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9B5DE5] font-bold uppercase tracking-wider px-1">College</label>
                <input type="text" value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white outline-none focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5]/50 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9B5DE5] font-bold uppercase tracking-wider px-1">Hobbies</label>
                <input type="text" value={editForm.hobbies} onChange={e => setEditForm({...editForm, hobbies: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white outline-none focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5]/50 transition-all shadow-inner" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs text-[#00CFFF] font-bold uppercase tracking-wider px-1">Interests</label>
                <input type="text" value={editForm.interests} onChange={e => setEditForm({...editForm, interests: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white outline-none focus:border-[#00CFFF] focus:ring-1 focus:ring-[#00CFFF]/50 transition-all shadow-inner" />
              </div>
            </div>

            <button onClick={handleSaveChanges} className="w-full mt-10 py-4 bg-gradient-to-r from-[#4169E1] to-[#9B5DE5] hover:opacity-90 rounded-2xl text-white font-black tracking-wide text-sm transition-all shadow-[0_0_30px_rgba(91,33,182,0.4)] hover:shadow-[0_0_40px_rgba(91,33,182,0.6)]">
              SAVE CHANGES
            </button>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between">
               <button onClick={onLogout} className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1.5 transition-colors"><LogOut className="w-4 h-4"/> Sign Out</button>
               <button onClick={() => { if(confirm('Delete account permanently?')) onDeleteAccount(); }} className="text-xs font-bold text-[#FF3B30]/70 hover:text-[#FF3B30] flex items-center gap-1.5 transition-colors"><Trash2 className="w-4 h-4"/> Delete Account</button>
            </div>
          </div>
        </div>
        )}

      {/* Tabs Row */}
      <div className="mt-12 border-t border-white/20 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-3 border-t-2 border-white text-white cursor-pointer -mt-[2px]">
          <Grid className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase hidden sm:inline">Posts</span>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4 mt-2">Posts</h3>

      {/* Grid Content */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 max-w-4xl">
        {posts.length > 0 ? (
          posts.map((post, idx) => (
            <div key={post.id || idx} className="aspect-square bg-[#0A0A0A] border border-white/10 rounded-2xl relative group cursor-pointer overflow-hidden hover:border-[#4169E1] transition-all duration-300 hover:shadow-[0_0_30px_rgba(65,105,225,0.3)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-end p-4">
                <p className="text-xs font-bold text-white truncate drop-shadow-md">{post.title}</p>
                <p className="text-[10px] text-[#00CFFF] font-semibold mt-1 flex items-center gap-1"><Grid className="w-3 h-3"/> View Post</p>
              </div>
              {post.mediaUrl ? (
                post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <img src={post.mediaUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" alt="Post content" />
                )
              ) : (
                <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#111] to-[#222] transform group-hover:scale-105 transition-transform duration-500">
                  <p className="text-xs font-semibold text-white/90 line-clamp-3 leading-snug">{post.title}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 md:col-span-3 text-center py-20 text-white/50 flex flex-col items-center bg-[#111111] rounded-2xl border border-white/5">
            <Grid className="w-10 h-10 text-white/20 mb-3" />
            <p className="font-bold text-lg text-white">No Posts Yet</p>
            <p className="text-sm mt-1">Capture the moment or share your study notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
