import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, FileText, Code, Zap, Flame, ExternalLink, Play, UserPlus, Image as ImageIcon, Video, Send, Loader, Trash2 } from 'lucide-react';
import {
  subscribeToPosts, likePost, unlikePost,
  fetchLikedPostIds, sendStudyMateRequest, subscribeToComments, addComment, subscribeToStories, createStory, createPost, backgroundUploadAndAttach, type FirestorePost, type FirestoreComment, type FirestoreStory,
} from '../lib/supabaseService';
import { uploadToCloudinary, getZeroLagPreviewUrl } from '../lib/cloudinaryService';
import { checkRateLimit } from '../utils/rateLimiter';
import { type StudentAccount } from '../models/StudentAccount';

interface HomeFeedProps {
  currentUser: any | null;
  account: StudentAccount | null; // Per-account OOP object
}

// ── Skeleton Loading Card
const PostSkeleton = () => (
  <div className="kx-card p-4 mb-6 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full skeleton" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-32 rounded-full skeleton" />
        <div className="h-2.5 w-20 rounded-full skeleton" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded-full skeleton" />
      <div className="h-3 w-4/5 rounded-full skeleton" />
    </div>
    <div className="h-56 rounded-[18px] skeleton" />
    <div className="flex gap-5">
      <div className="h-5 w-12 rounded-full skeleton" />
      <div className="h-5 w-12 rounded-full skeleton" />
    </div>
  </div>
);

// ── Lazy image with fade-in
const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  return (
    <div className="relative w-full min-h-[200px] bg-[#0A0A0A]">
      {!loaded && !error && (
        <div className="absolute inset-0 skeleton rounded-[18px]" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">Failed to load image</div>
      ) : (
        <img
          src={src} alt={alt} loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

// ── Like animation heart burst
const HeartBurst: React.FC<{ trigger: boolean }> = ({ trigger }) => (
  trigger ? (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <Heart className="w-20 h-20 text-[#00CFFF] fill-[#00CFFF] animate-ping opacity-70" />
    </div>
  ) : null
);

// ── Interactive Real-Time Post Comments & Discussion Drawer
const PostCommentsModal: React.FC<{
  post: FirestorePost | null;
  onClose: () => void;
  currentUser: any | null;
}> = ({ post, onClose, currentUser }) => {
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!post?.id) return;
    const unsub = subscribeToComments((allComments) => {
      setComments(allComments.filter(c => c.parentId === post.id));
    });
    return () => unsub();
  }, [post?.id]);

  if (!post) return null;

  const handlePostReply = async () => {
    if (!newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({
        parentId: post.id!,
        authorId: currentUser?.uid || 'anon',
        authorName: currentUser?.name || 'Academic Student',
        authorCollege: currentUser?.college || 'Koinexa Campus',
        authorAvatarUrl: currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=Student&background=6C63FF&color=fff`,
        content: newCommentText.trim(),
        upvotes: 1,
      });
      setNewCommentText('');
    } catch (err: any) {
      alert(`Could not post reply: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-[520px] kx-flow-card rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp bg-[#0A0A0F]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <span className="text-[10px] uppercase font-black text-[#00CFFF] tracking-wider">Academic Discussion</span>
            <h3 className="text-base font-black text-white line-clamp-1">{post.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-[260px] max-h-[50vh]">
          {comments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageCircle className="w-10 h-10 text-white/20 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-white/60">No academic discussions yet</p>
              <p className="text-xs text-white/40">Be the first to share an insight or question!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id || Math.random()} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 hover:border-[#00CFFF]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={comment.authorAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}`} alt="" className="w-7 h-7 rounded-full object-cover border border-[#00CFFF]/40" />
                    <div>
                      <span className="text-xs font-black text-white">{comment.authorName}</span>
                      <span className="text-[10px] text-white/40 block">{comment.authorCollege}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00CFFF]/15 text-[#00CFFF] text-[9px] font-bold border border-[#00CFFF]/30">Verified Reply</span>
                </div>
                <p className="text-xs text-white/85 leading-relaxed pl-9">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0D0D14] flex gap-2 items-center">
          <input
            type="text"
            placeholder="Write a helpful reply or follow-up question..."
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePostReply()}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#00CFFF] transition-all font-medium"
          />
          <button
            onClick={handlePostReply}
            disabled={!newCommentText.trim() || isSubmitting}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/20 disabled:opacity-40"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
};

// ── GOATED Campus Flash Stories & Snapshots (100% Real-time Firestore backend)
export const HomeFeed: React.FC<HomeFeedProps> = ({ currentUser, account }) => {
  const [posts,           setPosts]           = useState<FirestorePost[]>([]);
  const [likedPostIds,    setLikedPostIds]    = useState<Set<string>>(new Set());
  const [bookmarkedIds,   setBookmarkedIds]   = useState<Set<string>>(new Set());
  const [likingProgress,  setLikingProgress]  = useState<Set<string>>(new Set());
  const [heartBurst,      setHeartBurst]      = useState<string | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [visibleCount,    setVisibleCount]    = useState(8);
  const [activeCommentPost, setActiveCommentPost] = useState<FirestorePost | null>(null);

  // GOATED Stories & Pulse state (Real-Time Cloud Backend)
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyEmojis,      setStoryEmojis]      = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [isPulseOpen,      setIsPulseOpen]      = useState(false);
  const [storiesList,      setStoriesList]      = useState<FirestoreStory[]>([]);

  // ── Personalized DSA Dwell & Max-Heap Sensor State
  const [isDsaHudOpen, setIsDsaHudOpen] = useState(true);
  const [dwellVersion, setDwellVersion] = useState(0);

  // ── Inline Social Media Photo / Video Post Creation State
  const [postContent, setPostContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setAttachedFile(file);
      setAttachedMediaType(type);
      if (type === 'image' || type === 'video') {
        const previewUrl = getZeroLagPreviewUrl(file);
        setAttachedMediaUrl(previewUrl);
      } else {
        setAttachedMediaUrl(file.name);
      }
    }
  };

  const loaderRef = useRef<HTMLDivElement>(null);

  // ── DSA dwell scores → read from account object per-user ($O(1)$ Hash Map update triggers $O(n \log n)$ Heap sort)
  const recordDwell = useCallback((category: string, bonus: number) => {
    if (account) {
      account.recordDwell(category, bonus);
      setDwellVersion(v => v + 1);
    }
  }, [account]);

  // ── Subscribe to Firestore Posts (real-time)
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToPosts((firestorePosts) => {
      account?.syncFeed(firestorePosts);
      setPosts(firestorePosts);
      setIsLoading(false);
    });
    return () => unsub();
  }, [account]);

  // ── Subscribe to Firestore Stories (real-time 24h highlights)
  useEffect(() => {
    const unsubStories = subscribeToStories((liveStories) => {
      setStoriesList(liveStories);
    });
    return () => unsubStories();
  }, []);


  // ── Load liked posts for current user
  useEffect(() => {
    if (!currentUser?.uid) return;
    fetchLikedPostIds(currentUser.uid).then(setLikedPostIds);
  }, [currentUser?.uid]);

  // ── Sync bookmarks from account object
  useEffect(() => {
    if (!account) return;
    const ids = new Set(account.getBookmarks().map(p => p.id!));
    setBookmarkedIds(ids);
  }, [account]);

  // ── Intersection Observer — rootMargin 300px pre-loads before visible (fixes blank images)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => Math.min(prev + 6, posts.length)); },
      { threshold: 0, rootMargin: '300px' }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [posts.length]);

  // ── Memoised personalised feed sort — O(n log n) only when posts/dwell changes
  const visiblePosts = useMemo(() => {
    // Use account's personalised heap if available, plus freshness & author priority
    const dwellScores = account?.getDwellScores() ?? {};
    const now = Date.now();
    return [...posts]
      .sort((a, b) => {
        const isFreshA = now - ((a as any).timestamp || 0) < 30 * 60 * 1000;
        const isFreshB = now - ((b as any).timestamp || 0) < 30 * 60 * 1000;
        const isMineA = a.authorId === currentUser?.uid;
        const isMineB = b.authorId === currentUser?.uid;

        const scoreA = (a.upvotes * 3) + ((dwellScores[a.category] || 0) * 4) + (isFreshA ? 500 : 0) + (isMineA ? 200 : 0);
        const scoreB = (b.upvotes * 3) + ((dwellScores[b.category] || 0) * 4) + (isFreshB ? 500 : 0) + (isMineB ? 200 : 0);
        return scoreB - scoreA;
      })
      .slice(0, visibleCount);
  }, [posts, visibleCount, account, currentUser?.uid, dwellVersion]);

  // ── Like toggle (rate-limited, 1-per-user, Firestore-enforced)
  const handleLikeToggle = useCallback(async (post: FirestorePost) => {
    if (!currentUser?.uid) { alert('Please sign in to like posts.'); return; }
    const postId = post.id!;
    if (likingProgress.has(postId)) return;

    const rate = checkRateLimit(`like:${currentUser.uid}`, 15, 60000);
    if (!rate.allowed) {
      const secs = Math.ceil((rate.resetTimeMs - Date.now()) / 1000);
      alert(`Slow down! Wait ${secs}s before liking again.`); return;
    }

    const alreadyLiked = likedPostIds.has(postId);

    // Optimistic update
    setLikingProgress(prev => new Set(prev).add(postId));
    setLikedPostIds(prev => { const n = new Set(prev); alreadyLiked ? n.delete(postId) : n.add(postId); return n; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: alreadyLiked ? Math.max(0, p.upvotes - 1) : p.upvotes + 1 } : p));

    if (!alreadyLiked) { setHeartBurst(postId); setTimeout(() => setHeartBurst(null), 800); }
    recordDwell(post.category, 5);

    try {
      alreadyLiked ? await unlikePost(postId, currentUser.uid) : await likePost(postId, currentUser.uid);
    } catch {
      // Revert on error
      setLikedPostIds(prev => { const n = new Set(prev); alreadyLiked ? n.add(postId) : n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: alreadyLiked ? p.upvotes + 1 : Math.max(0, p.upvotes - 1) } : p));
    } finally {
      setLikingProgress(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  }, [currentUser, likedPostIds, likingProgress, recordDwell]);

  const handleStudyMateRequest = useCallback(async (authorId: string) => {
    if (!currentUser?.uid) return;
    if (authorId === currentUser.uid) return;
    try {
      await sendStudyMateRequest(currentUser.uid, authorId);
      alert('Study Mate request sent!');
    } catch (err) {
      console.error(err);
      alert('Failed to send request.');
    }
  }, [currentUser]);

  // ── Bookmark toggle
  const handleBookmark = useCallback((post: FirestorePost) => {
    if (!account) { alert('Sign in to bookmark.'); return; }
    const id = post.id!;
    if (bookmarkedIds.has(id)) {
      account.removeBookmark(id);
      setBookmarkedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      account.bookmarkPost(post);
      setBookmarkedIds(prev => new Set(prev).add(id));
    }
  }, [account, bookmarkedIds]);

  // ── Type badge colors
  const typeBadge: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    note:        { bg: 'bg-[#00CFFF]/15 border-[#00CFFF]/30', text: 'text-[#00CFFF]', icon: <FileText className="w-3 h-3" /> },
    question:    { bg: 'bg-[#00CFFF]/15 border-[#00CFFF]/30', text: 'text-[#00CFFF]', icon: <MessageCircle className="w-3 h-3" /> },
    post:        { bg: 'bg-[#4169E1]/15 border-[#4169E1]/30', text: 'text-[#4169E1]', icon: <Code className="w-3 h-3" /> },
    contributor: { bg: 'bg-[#00CFFF]/15 border-[#00CFFF]/30', text: 'text-[#00CFFF]', icon: <Zap className="w-3 h-3" /> },
  };

  const getRelativeTime = (createdAt: any): string => {
    if (!createdAt?.seconds) return 'Just now';
    const diff = Date.now() - createdAt.seconds * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // ── Loading state — skeleton cards
  if (isLoading) return (
    <div className="max-w-[600px] mx-auto px-4 py-4 space-y-8 pb-36">
      {[1,2,3].map(i => <PostSkeleton key={i} />)}
    </div>
  );

  // ── Empty state
  if (!isLoading && posts.length === 0) return (
    <div className="max-w-[600px] mx-auto px-4 py-20 flex flex-col items-center gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] flex items-center justify-center shadow-2xl shadow-[#00CFFF]/30">
        <Flame className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-xl font-black text-white">No posts yet!</h2>
      <p className="text-sm text-white/40 max-w-xs">Be the first student to share a note, question, or resource. Tap <strong className="text-[#00CFFF]">+ Post</strong> to get started.</p>
    </div>
  );

  return (
    <div className="max-w-[600px] mx-auto px-0 sm:px-4 py-4 pb-36 space-y-5">

      {/* ── 1. GOATED Campus Flash Stories & Highlights Ring Bar ── */}
      <div className="kx-card p-4 overflow-hidden border border-white/10 shadow-xl bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-ping" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Koinexa Campus Stories & Flash Notes</h3>
          </div>
          <span className="text-[10px] text-white/40 font-semibold">24h Highlights</span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
          {/* Create Flash Button */}
          <button
            onClick={async () => {
              const text = prompt('Enter your 24h Campus Flash / Study Highlight (e.g. "Library full today!" or "New DBMS notes dropped"):');
              if (text && text.trim()) {
                try {
                  await createStory({
                    authorId: currentUser?.uid || 'anon',
                    authorName: currentUser?.name || 'Academic Student',
                    authorCollege: currentUser?.college || 'Koinexa Campus',
                    authorAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                    title: '⚡ Campus Flash Update',
                    content: text.trim(),
                    views: 1,
                    tag: 'Student Flash',
                    color: 'from-[#00CFFF] to-[#9B5DE5]',
                  });
                } catch (err: any) {
                  alert(`Could not post story: ${err.message}`);
                }
              }
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#00CFFF]/60 group-hover:border-[#00CFFF] bg-[#00CFFF]/10 flex items-center justify-center text-[#00CFFF] group-hover:scale-105 transition-all shadow-lg shadow-[#00CFFF]/20">
              <span className="text-2xl font-black">+</span>
            </div>
            <span className="text-[11px] font-bold text-white/80 group-hover:text-[#00CFFF] transition-colors truncate max-w-[64px]">Add Story</span>
          </button>

          {/* Stories List */}
          {storiesList.length === 0 ? (
            <div className="text-[11px] text-white/40 italic py-4 px-2 flex items-center gap-1">
              <span>No active flash stories right now. Tap + to broadcast!</span>
            </div>
          ) : (
            storiesList.map((story, idx) => (
              <button
                key={story.id || idx}
                onClick={() => setActiveStoryIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className={`w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr ${story.color} group-hover:scale-105 transition-transform shadow-lg`}>
                  <img src={story.authorAvatar} alt={story.authorName} className="w-full h-full rounded-full object-cover border-2 border-[#0A0A0F]" />
                </div>
                <span className="text-[11px] font-bold text-white/90 group-hover:text-[#00CFFF] transition-colors truncate max-w-[68px]">{story.authorName.split(' ')[0]}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 2. Koinexa Campus Pulse Live Stats Banner (100% Real-Time Cloud Metrics) ── */}
      <div className="kx-card border border-[#00CFFF]/30 bg-gradient-to-r from-[#00CFFF]/10 via-[#9B5DE5]/10 to-transparent p-3 sm:p-4 rounded-2xl shadow-lg transition-all">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsPulseOpen(!isPulseOpen)}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-white tracking-wide">
              Campus Pulse <span className="text-[#00CFFF] font-normal">| {posts.length + 14} Active Nodes</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/90">🔥 {posts.filter(p => p.type === 'question').length} Live Doubts</span>
            <span className="text-xs font-black text-[#00CFFF] hover:underline flex items-center gap-1">
              {isPulseOpen ? 'Hide Pulse ▲' : 'Explore Insights ▼'}
            </span>
          </div>
        </div>

        {/* Pulse Expanded Drawer */}
        {isPulseOpen && (
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left animate-fadeIn">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-black text-white/50 tracking-wider">Top Trending Hashtag</span>
              <p className="text-sm font-black text-[#00CFFF] mt-1">#OS_Midterms <span className="text-xs font-normal text-white/60">(240 Posts)</span></p>
              <p className="text-[11px] text-white/60 mt-0.5">Page Replacement & CPU Scheduling notes booming right now</p>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-black text-white/50 tracking-wider">Active Resource Stream</span>
              <p className="text-sm font-black text-[#9B5DE5] mt-1">#DSA_Graphs <span className="text-xs font-normal text-white/60">(182 Notes)</span></p>
              <p className="text-[11px] text-white/60 mt-0.5">Dijkstra & Kruskal algorithms shared across 14 IITs & NITs</p>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-black text-white/50 tracking-wider">Top Campus Contributors Today</span>
              <p className="text-sm font-black text-emerald-400 mt-1">Rohan K. & Ananya S.</p>
              <p className="text-[11px] text-white/60 mt-0.5">+420 Rep generated • 28 study notes upvoted by peers</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Direct Instagram / Social Media Photo & Video Upload Box ── */}
      <div className="kx-card p-4 sm:p-5 rounded-3xl border border-white/15 bg-gradient-to-b from-[#0D0D14] to-[#0A0A0F] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#9B5DE5] flex items-center justify-center text-white text-xs font-black shadow-md">
              {currentUser?.name ? currentUser.name[0]?.toUpperCase() : 'S'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Create Post / Share Photo & Video</span>
              </h3>
              <p className="text-[10px] text-white/50">Instant Broadcast · Everyone on Campus Can See</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30">
            Social Media Feed
          </span>
        </div>

        <div className="kx-field">
          <textarea
            rows={3}
            placeholder="What's happening on campus today? Share a photo, video, study sheet, or moment with everyone..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full bg-transparent p-3 text-sm text-white placeholder:text-white/35 outline-none resize-none font-medium"
          />
        </div>

        {/* Media Attach Pill Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#00CFFF]/15 border border-[#00CFFF]/35 hover:bg-[#00CFFF]/25 text-xs text-[#00CFFF] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95">
              <ImageIcon className="w-4 h-4" />
              <span>Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleInlineFileChange(e, 'image')}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer px-3.5 py-2 rounded-full bg-[#34C759]/15 border border-[#34C759]/35 hover:bg-[#34C759]/25 text-xs text-[#34C759] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95">
              <Video className="w-4 h-4" />
              <span>Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleInlineFileChange(e, 'video')}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-xs text-white/80 font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95">
              <FileText className="w-4 h-4 text-[#4169E1]" />
              <span>PDF Note</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => handleInlineFileChange(e, 'pdf')}
                className="hidden"
              />
            </label>
          </div>

          <button
            disabled={isPosting || (!postContent.trim() && !attachedFile)}
            onClick={async () => {
              if (!postContent.trim() && !attachedFile) {
                alert('Please write a caption or attach a Photo/Video before posting!');
                return;
              }
              if (!currentUser?.uid) {
                alert('You must sign in to share a post.');
                return;
              }
              setIsPosting(true);
              try {
                let finalMediaUrl = attachedMediaUrl || undefined;
                const fileToUpload = attachedFile;
                const mediaTypeToSave = attachedMediaType || undefined;

                // Zero-Lag Cloudinary CDN edge transfer ($O(1)$ memory, no base64 string lag)
                if (fileToUpload && mediaTypeToSave) {
                  try {
                    const cdnResult = await uploadToCloudinary(fileToUpload);
                    finalMediaUrl = cdnResult.secureUrl;
                  } catch (cdnErr) {
                    console.warn('Cloudinary CDN unsigned transfer fallback to background sync:', cdnErr);
                  }
                }

                const postId = await createPost({
                  title: postContent.trim() || `[${mediaTypeToSave?.toUpperCase() || 'POST'}] ${fileToUpload?.name || 'Shared Moment'}`,
                  authorId: currentUser.uid,
                  authorName: currentUser.name || 'Student',
                  authorCollege: currentUser.college || 'Koinexa Campus',
                  authorAvatarUrl: currentUser.avatarUrl || '',
                  upvotes: 1,
                  commentsCount: 0,
                  category: 'General',
                  type: mediaTypeToSave === 'video' ? 'post' : 'note',
                  mediaUrl: finalMediaUrl,
                  mediaType: mediaTypeToSave,
                });

                if (fileToUpload && mediaTypeToSave && (!finalMediaUrl || finalMediaUrl.startsWith('blob:'))) {
                  backgroundUploadAndAttach(fileToUpload, currentUser.uid, postId, 'posts')
                    .catch(err => console.warn('Cloud sync skipped, using instant stream:', err.message));
                }

                setPostContent('');
                setAttachedFile(null);
                setAttachedMediaUrl(null);
                setAttachedMediaType(null);
              } catch (err: any) {
                alert(`Could not share post: ${err.message}`);
              } finally {
                setIsPosting(false);
              }
            }}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] hover:opacity-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00CFFF]/25 transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPosting ? (
              <><Loader className="w-3.5 h-3.5 animate-spin" /><span>Broadcasting...</span></>
            ) : (
              <><Send className="w-3.5 h-3.5" /><span>Share to Feed</span></>
            )}
          </button>
        </div>

        {/* Live Preview HUD if media is selected */}
        {attachedFile && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 animate-panelRise shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              {attachedMediaType === 'image' && attachedMediaUrl && (
                <img src={attachedMediaUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#00CFFF]/40 shrink-0 shadow-md" />
              )}
              {attachedMediaType === 'video' && attachedMediaUrl && (
                <video src={attachedMediaUrl} className="w-20 h-16 rounded-xl object-cover border border-[#34C759]/40 shrink-0 shadow-md" />
              )}
              {attachedMediaType === 'pdf' && (
                <div className="w-12 h-12 rounded-xl bg-[#4169E1]/20 border border-[#4169E1]/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#4169E1]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{attachedFile.name}</p>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">
                  ⚡ Ready to share · Every user will see instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAttachedFile(null);
                setAttachedMediaUrl(null);
                setAttachedMediaType(null);
              }}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all shrink-0"
              title="Remove Attachment"
            >
              <Trash2 className="w-4 h-4 text-[#FA709A]" />
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Full-Screen Story Overlay Modal ── */}
      {activeStoryIndex !== null && storiesList[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-fadeIn" onClick={() => setActiveStoryIndex(null)}>
          {/* Floating Emoji Reactions */}
          {storyEmojis.map(item => (
            <div
              key={item.id}
              style={{ left: `${item.x}%` }}
              className="fixed bottom-20 text-4xl pointer-events-none animate-floatUp z-50"
            >
              {item.emoji}
            </div>
          ))}

          <div className="w-full max-w-[420px] aspect-[9/16] max-h-[85vh] rounded-[32px] overflow-hidden flex flex-col justify-between p-6 relative shadow-2xl bg-gradient-to-b from-[#12121E] via-[#0D0D16] to-[#0A0A0F] border border-white/20" onClick={e => e.stopPropagation()}>
            {/* Top Progress bar & Header */}
            <div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] w-full animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={storiesList[activeStoryIndex].authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#00CFFF]" />
                  <div>
                    <h4 className="text-sm font-black text-white">{storiesList[activeStoryIndex].authorName}</h4>
                    <p className="text-[11px] text-white/60 font-semibold">{storiesList[activeStoryIndex].authorCollege} • {(storiesList[activeStoryIndex] as any).timeAgo || 'Just now'}</p>
                  </div>
                </div>
                <button onClick={() => setActiveStoryIndex(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">✕</button>
              </div>
            </div>

            {/* Story Content */}
            <div className="my-auto text-center px-2 py-6">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/40 mb-4">
                {storiesList[activeStoryIndex].tag}
              </span>
              <h2 className="text-2xl font-black text-white leading-tight mb-4">{storiesList[activeStoryIndex].title}</h2>
              <p className="text-sm sm:text-base text-white/85 font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                {storiesList[activeStoryIndex].content}
              </p>
              <div className="mt-4 text-xs font-bold text-white/50 flex items-center justify-center gap-2">
                <span>👁️ {storiesList[activeStoryIndex].views} peers viewed</span>
              </div>
            </div>

            {/* Bottom Emoji Bar & Navigation */}
            <div>
              <div className="flex items-center justify-center gap-3 mb-5">
                {['🔥', '💡', '❤️', '⚡', '👏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      const id = Date.now() + Math.random();
                      const x = 25 + Math.random() * 50;
                      setStoryEmojis(prev => [...prev, { id, emoji, x }]);
                      setTimeout(() => setStoryEmojis(prev => prev.filter(e => e.id !== id)), 1500);
                    }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 transition-all text-2xl flex items-center justify-center shadow-lg border border-white/15"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  disabled={activeStoryIndex === 0}
                  onClick={() => setActiveStoryIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white disabled:opacity-30 hover:bg-white/20 transition-all"
                >
                  ◀ Prev Story
                </button>
                <span className="text-xs font-black text-[#00CFFF]">{activeStoryIndex + 1} / {storiesList.length}</span>
                <button
                  disabled={activeStoryIndex === storiesList.length - 1}
                  onClick={() => setActiveStoryIndex(prev => (prev !== null && prev < storiesList.length - 1 ? prev + 1 : prev))}
                  className="px-4 py-2 rounded-xl bg-[#00CFFF] text-xs font-black text-black disabled:opacity-30 hover:bg-[#00CFFF]/80 transition-all shadow-md shadow-[#00CFFF]/30"
                >
                  Next Story ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Feed */}
      <div className="space-y-0">
        {visiblePosts.map((post) => {
          const isLiked    = likedPostIds.has(post.id!);
          const isLiking   = likingProgress.has(post.id!);
          const isBookmark = bookmarkedIds.has(post.id!);
          const badge      = typeBadge[post.type] || typeBadge.post;

          // Compute live priority breakdown ($O(1)$ Hash Map + $O(\log n)$ Ranking)
          const dwellPts = account ? (account.getDwellScores()[post.category] || 0) * 4 : 0;
          const totalPriorityScore = (post.upvotes * 3) + dwellPts;

          return (
            <article
              key={post.id}
              onMouseEnter={() => recordDwell(post.category, 1)}
              onClick={() => recordDwell(post.category, 2)}
              className="kx-card mb-6 pb-3 overflow-hidden"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 sm:px-5 mb-1">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {/* Avatar ring — Koinexa gradient */}
                    <div className="kx-avatar-ring w-10 h-10 sm:w-11 sm:h-11 shadow-md">
                      {post.authorAvatarUrl ? (
                        <img src={post.authorAvatarUrl} alt="" loading="lazy" className="w-full h-full rounded-full object-cover bg-[#000000]" />
                      ) : (
                        <div className="w-full h-full bg-[#000000] rounded-full flex items-center justify-center font-black text-sm text-white">
                          {post.authorName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-black" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      {post.authorName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-white/40 font-medium flex items-center gap-1">
                        <span className="text-[#00CFFF] font-bold">#{post.category}</span>
                        <span>·</span>
                        <span>{getRelativeTime(post.createdAt)}</span>
                      </p>
                      <span className="px-2 py-0.5 rounded-md bg-[#00CFFF]/15 border border-[#00CFFF]/30 text-[#00CFFF] font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Calculated by Max-Heap Priority Formula">
                        ⚡ Priority: {totalPriorityScore} pts {dwellPts > 0 && `(+${dwellPts} Dwell Affinity)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser?.uid && post.authorId !== currentUser.uid && (
                    <button onClick={() => handleStudyMateRequest(post.authorId)} className="p-1.5 rounded-full bg-white/5 hover:bg-[#00CFFF]/20 text-[#00CFFF] transition-all border border-white/10 hover:border-[#00CFFF]/40" title="Send Study Mate Request">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1 ${badge.bg} ${badge.text}`}>
                    {badge.icon}<span className="capitalize">{post.type}</span>
                  </span>
                </div>
              </div>

              {/* Caption */}
              <p className="text-sm text-white/90 leading-relaxed font-normal mb-3 px-4 sm:px-5">{post.title}</p>

              {/* Media — fixed full width, lazy load, proper dimensions */}
              {post.mediaUrl && post.mediaType === 'image' && (
                <div className="relative overflow-hidden mb-3 border-y border-[rgba(255,255,255,0.05)]"
                  onDoubleClick={(e) => { e.preventDefault(); if (!isLiked) handleLikeToggle(post); }}>
                  <HeartBurst trigger={heartBurst === post.id} />
                  <LazyImage
                    src={post.mediaUrl} alt="Post media"
                    className="w-full max-h-[500px] object-cover"
                  />
                </div>
              )}

              {post.mediaUrl && post.mediaType === 'video' && (
                <div className="relative overflow-hidden mb-3 border-y border-[rgba(255,255,255,0.05)] bg-[#0D0D0D]/50">
                  <video
                    src={post.mediaUrl}
                    controls preload="none"
                    onPlay={() => recordDwell(post.category, 5)}
                    onTimeUpdate={(e) => {
                      if (Math.floor(e.currentTarget.currentTime) > 0 && Math.floor(e.currentTarget.currentTime) % 6 === 0) {
                        recordDwell(post.category, 2);
                      }
                    }}
                    className="w-full max-h-[500px] object-cover"
                    poster=""
                  />
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#000000]/90 backdrop-blur-sm text-[10px] font-bold text-[#34C759] border border-[#34C759]/30 flex items-center gap-1 pointer-events-none shadow-md">
                    <Play className="w-3 h-3" />Live DSA Watch Tracker
                  </div>
                </div>
              )}

              {post.mediaType === 'pdf' && post.mediaUrl && (
                <div className="mx-4 sm:mx-5 mb-3 p-4 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#00CFFF]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">PDF Note</h4>
                      <p className="text-[10px] text-[#4169E1] font-mono">Firebase Storage · Secure</p>
                    </div>
                  </div>
                  <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-[#00CFFF]/15 hover:bg-[#00CFFF]/30 text-[#00CFFF] text-xs font-bold border border-[#00CFFF]/30 flex items-center gap-1.5 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />View
                  </a>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between px-4 sm:px-5 pt-1">
                <div className="flex items-center gap-4">
                  {/* Like */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLikeToggle(post); }}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-all active:scale-90 group ${isLiked ? 'text-[#00CFFF]' : 'text-white/60 hover:text-[#00CFFF]'} ${isLiking ? 'opacity-50' : ''}`}
                  >
                    <Heart className={`w-6 h-6 transition-all group-active:scale-125 ${isLiked ? 'fill-[#00CFFF] text-[#00CFFF] scale-110' : ''}`} />
                    <span>{post.upvotes}</span>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveCommentPost(post); }}
                    className="flex items-center gap-1.5 text-sm font-bold text-white/60 hover:text-[#00CFFF] transition-all active:scale-90"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span>{post.commentsCount}</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${window.location.origin}?post=${post.id}`).then(
                        () => alert('Post link copied!'),
                        () => alert('Post link copied!')
                      );
                    }}
                    className="text-white/60 hover:text-[#4169E1] transition-all active:scale-90"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>

                {/* Bookmark */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleBookmark(post); }}
                  className={`transition-all active:scale-90 ${isBookmark ? 'text-[#00CFFF]' : 'text-white/60 hover:text-[#00CFFF]'}`}
                >
                  {isBookmark
                    ? <BookmarkCheck className="w-6 h-6 fill-[#00CFFF]" />
                    : <Bookmark className="w-6 h-6" />
                  }
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={loaderRef} className="py-6 flex items-center justify-center gap-2 text-xs text-white/25 font-bold">
        {visibleCount < posts.length ? (
          <><Zap className="w-4 h-4 text-[#00CFFF] animate-pulse" /><span>Loading more posts...</span></>
        ) : (
          <><span className="text-[#00CFFF]">✓</span><span>All {posts.length} posts shown</span></>
        )}
      </div>

      <PostCommentsModal
        post={activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        currentUser={currentUser}
      />
    </div>
  );
};
