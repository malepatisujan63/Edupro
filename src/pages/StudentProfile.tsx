import React, { useState, useEffect } from 'react';
import { Grid, LogOut, Trash2, X, Settings } from 'lucide-react';
import { fetchUserProfile, fetchPostsByUser, sendStudyMateRequest, acceptStudyMateRequest, saveUserProfile, type FirestoreUser, type FirestorePost } from '../lib/supabaseService';
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
  viewProfileId,
  onLogout,
  onDeleteAccount,
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
    await sendStudyMateRequest(currentUser.uid, profileUser.uid);
    alert('Friend request sent!');
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
    <div className="max-w-[1000px] mx-auto min-h-screen bg-[#000000] pb-32 text-white pt-8 px-4 sm:px-6 font-sans">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          {profileUser.name.toLowerCase()} <span className="text-white/50 text-sm">▼</span>
        </h1>
        <div className="flex items-center gap-4 text-white/70">
          <span className="text-xl font-light cursor-pointer hover:text-white">@</span>
          <Settings className="w-5 h-5 cursor-pointer hover:text-white" onClick={() => isViewingSelf && setIsEditing(!isEditing)} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
        {/* Left Column: Profile Info */}
        <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#4169E1] to-[#9B5DE5] flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-[0_0_20px_rgba(65,105,225,0.4)]">
            {profileUser.avatarUrl ? (
              <img src={profileUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              profileUser.name.substring(0, 2).toUpperCase()
            )}
          </div>
          
          <h2 className="text-xl font-bold">{profileUser.name}</h2>
          <p className="text-sm text-white/70 mt-1">
            {profileUser.college ? profileUser.college.toLowerCase() : 'campus'} • {profileUser.department ? profileUser.department.toLowerCase() : 'student'}
          </p>
          <p className="text-sm text-white/90 mt-3 max-w-xs">
            {profileUser.bio || (profileUser.skills?.length > 0 ? `Passionate about ${profileUser.skills?.slice(0,2).join(' and ')}. Let's push limits!` : "Passionate about learning. Let's push limits!")}
          </p>
          <p className="text-sm text-white mt-2 flex items-center justify-center md:justify-start gap-1 cursor-pointer">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            <span className="font-semibold">{`edunetwork.app/${profileUser.name.toLowerCase().replace(/\s/g, '')}`}</span>
          </p>

          <div className="flex items-center gap-10 mt-8 w-full justify-center md:justify-start">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{posts.length}</span>
              <span className="text-[13px] text-white/70">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{followersCount}</span>
              <span className="text-[13px] text-white/70">study mates</span>
            </div>
          </div>
          
          {isViewingSelf ? (
             <div className="mt-8 w-full">
               <button onClick={() => setIsEditing(true)} className="w-full py-2 rounded-lg font-bold bg-[#1A1A1A] text-white border border-white/10 hover:bg-[#2A2A2A] transition-all">
                 Edit Profile
               </button>
             </div>
          ) : (
             <div className="mt-8 w-full flex gap-3">
               <button onClick={handleFollow} className={`flex-1 py-2 rounded-lg font-bold ${isFollowing ? 'bg-[#1A1A1A] text-white' : 'bg-[#4169E1] text-white'}`}>
                 {isFollowing ? 'Following' : 'Follow'}
               </button>
               <button className="flex-1 py-2 rounded-lg font-bold bg-[#1A1A1A] text-white">Message</button>
             </div>
          )}
        </div>

        {/* Edit Profile Modal (Only show if editing and viewing self) */}
        {isViewingSelf && isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#1A1A1A] rounded-[24px] p-6 shadow-2xl relative border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#4169E1] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">Bio</label>
                <input type="text" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#4169E1] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">College / University</label>
                <input type="text" value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#4169E1] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">Hobbies</label>
                <input type="text" value={editForm.hobbies} onChange={e => setEditForm({...editForm, hobbies: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#4169E1] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">Interests</label>
                <input type="text" value={editForm.interests} onChange={e => setEditForm({...editForm, interests: e.target.value})} className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#4169E1] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/60 font-semibold px-1">Website</label>
                <input type="text" value={editForm.website} readOnly className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/50 outline-none cursor-not-allowed" />
              </div>
            </div>

            <button onClick={handleSaveChanges} className="w-full mt-8 py-3.5 bg-[#4B14A3] hover:bg-[#5B21B6] rounded-xl text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(91,33,182,0.5)]">
              Save Changes
            </button>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
               <button onClick={onLogout} className="text-xs text-white/60 hover:text-white flex items-center gap-1"><LogOut className="w-3 h-3"/> Sign Out</button>
               <button onClick={() => { if(confirm('Delete account permanently?')) onDeleteAccount(); }} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete Account</button>
            </div>
          </div>
        </div>
        )}
      </div>

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
            <div key={post.id || idx} className="aspect-square bg-[#0A0A0A] border border-white/10 rounded-xl relative group cursor-pointer overflow-hidden hover:border-[#4169E1] transition-colors">
              {post.mediaUrl ? (
                post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post content" />
                )
              ) : (
                <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#111] to-[#222]">
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
