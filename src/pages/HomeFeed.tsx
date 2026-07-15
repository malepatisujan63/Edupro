import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, FileText, Code, Zap, Flame, ExternalLink, Play, UserPlus } from 'lucide-react';
import {
  subscribeToPosts, likePost, unlikePost,
  fetchLikedPostIds, sendStudyMateRequest, subscribeToComments, addComment, type FirestorePost, type FirestoreComment,
} from '../lib/firestoreService';
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

export const HomeFeed: React.FC<HomeFeedProps> = ({ currentUser, account }) => {
  const [posts,           setPosts]           = useState<FirestorePost[]>([]);
  const [likedPostIds,    setLikedPostIds]    = useState<Set<string>>(new Set());
  const [bookmarkedIds,   setBookmarkedIds]   = useState<Set<string>>(new Set());
  const [likingProgress,  setLikingProgress]  = useState<Set<string>>(new Set());
  const [heartBurst,      setHeartBurst]      = useState<string | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [visibleCount,    setVisibleCount]    = useState(8);
  const [activeCommentPost, setActiveCommentPost] = useState<FirestorePost | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  // ── DSA dwell scores → read from account object per-user
  const recordDwell = useCallback((category: string, bonus: number) => {
    account?.recordDwell(category, bonus);
  }, [account]);

  // ── Subscribe to Firestore (real-time)
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToPosts((firestorePosts) => {
      // Sync into account's personal DSA heap
      account?.syncFeed(firestorePosts);
      setPosts(firestorePosts);
      setIsLoading(false);
    });
    return () => unsub();
  }, [account]);

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
    // Use account's personalised heap if available, else fall back to upvote sort
    const dwellScores = account?.getDwellScores() ?? {};
    return [...posts]
      .sort((a, b) => {
        const scoreA = (a.upvotes * 3) + ((dwellScores[a.category] || 0) * 4);
        const scoreB = (b.upvotes * 3) + ((dwellScores[b.category] || 0) * 4);
        return scoreB - scoreA;
      })
      .slice(0, visibleCount);
  }, [posts, visibleCount, account]);

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
    <div className="max-w-[600px] mx-auto px-0 sm:px-4 py-4 pb-36">

      {/* Feed */}
      <div className="space-y-0">
        {visiblePosts.map((post) => {
          const isLiked    = likedPostIds.has(post.id!);
          const isLiking   = likingProgress.has(post.id!);
          const isBookmark = bookmarkedIds.has(post.id!);
          const badge      = typeBadge[post.type] || typeBadge.post;

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
                    <p className="text-[11px] text-white/40 font-medium flex items-center gap-1">
                      <span className="text-[#00CFFF] font-bold">#{post.category}</span>
                      <span>·</span>
                      <span>{getRelativeTime(post.createdAt)}</span>
                    </p>
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
                    className="w-full max-h-[500px] object-cover"
                    poster=""
                  />
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#000000]/90 backdrop-blur-sm text-[10px] font-bold text-[#4169E1] border border-[#4169E1]/25 flex items-center gap-1 pointer-events-none">
                    <Play className="w-3 h-3" />Storage Stream
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
