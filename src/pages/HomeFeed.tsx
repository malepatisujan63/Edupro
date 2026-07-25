import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame } from 'lucide-react';
import {
  subscribeToPosts, likePost, unlikePost, fetchLikedPostIds,
  sendStudyMateRequest, type FirestorePost
} from '../lib/supabaseService';
import { checkRateLimit } from '../utils/rateLimiter';
import { type StudentAccount } from '../models/StudentAccount';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { PostCommentsModal } from '../components/feed/PostCommentsModal';

interface HomeFeedProps {
  currentUser: any | null;
  account: StudentAccount | null;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ currentUser, account }) => {
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [likingProgress, setLikingProgress] = useState<Set<string>>(new Set());
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [activeCommentPost, setActiveCommentPost] = useState<FirestorePost | null>(null);
  const [activeFilter] = useState('foryou');
  
  const loaderRef = useRef<HTMLDivElement>(null);

  const recordDwell = useCallback((category: string, bonus: number) => {
    if (account) account.recordDwell(category, bonus);
  }, [account]);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToPosts((firestorePosts) => {
      account?.syncFeed(firestorePosts);
      setPosts(firestorePosts);
      setIsLoading(false);
    });
    return () => unsub();
  }, [account]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    fetchLikedPostIds(currentUser.uid).then(setLikedPostIds);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!account) return;
    const ids = new Set(account.getBookmarks().map(p => p.id!));
    setBookmarkedIds(ids);
  }, [account]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => Math.min(prev + 6, posts.length)); },
      { threshold: 0, rootMargin: '300px' }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [posts.length]);

  const visiblePosts = useMemo(() => {
    const dwellScores = account?.getDwellScores() ?? {};
    const now = Date.now();
    let filteredPosts = [...posts];

    if (activeFilter === 'latest') {
      filteredPosts = filteredPosts.sort((a, b) => ((b as any).timestamp || 0) - ((a as any).timestamp || 0));
    } else if (activeFilter === 'trending') {
      filteredPosts = filteredPosts.sort((a, b) => b.upvotes - a.upvotes);
    } else if (activeFilter === 'academic') {
      filteredPosts = filteredPosts.filter(p => p.category === 'Academics');
    } else if (activeFilter === 'starred') {
      filteredPosts = filteredPosts.filter(p => bookmarkedIds.has(p.id!));
    } else {
      // For You
      filteredPosts = filteredPosts.sort((a, b) => {
        const isFreshA = now - ((a as any).timestamp || 0) < 30 * 60 * 1000;
        const isFreshB = now - ((b as any).timestamp || 0) < 30 * 60 * 1000;
        const isMineA = a.authorId === currentUser?.uid;
        const isMineB = b.authorId === currentUser?.uid;

        const scoreA = (a.upvotes * 3) + ((dwellScores[a.category] || 0) * 4) + (isFreshA ? 500 : 0) + (isMineA ? 200 : 0);
        const scoreB = (b.upvotes * 3) + ((dwellScores[b.category] || 0) * 4) + (isFreshB ? 500 : 0) + (isMineB ? 200 : 0);
        return scoreB - scoreA;
      });
    }

    return filteredPosts.slice(0, visibleCount);
  }, [posts, visibleCount, account, currentUser?.uid, activeFilter, bookmarkedIds]);

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
    setLikingProgress(prev => new Set(prev).add(postId));
    setLikedPostIds(prev => { const n = new Set(prev); alreadyLiked ? n.delete(postId) : n.add(postId); return n; });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: alreadyLiked ? Math.max(0, p.upvotes - 1) : p.upvotes + 1 } : p));

    if (!alreadyLiked) { setHeartBurst(postId); setTimeout(() => setHeartBurst(null), 800); }
    recordDwell(post.category, 5);

    try {
      alreadyLiked ? await unlikePost(postId, currentUser.uid) : await likePost(postId, currentUser.uid);
    } catch {
      setLikedPostIds(prev => { const n = new Set(prev); alreadyLiked ? n.add(postId) : n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: alreadyLiked ? p.upvotes + 1 : Math.max(0, p.upvotes - 1) } : p));
    } finally {
      setLikingProgress(prev => { const n = new Set(prev); n.delete(postId); return n; });
    }
  }, [currentUser, likedPostIds, likingProgress, recordDwell]);

  const handleStudyMateRequest = useCallback(async (authorId: string) => {
    if (!currentUser?.uid || authorId === currentUser.uid) return;
    try {
      await sendStudyMateRequest(currentUser.uid, authorId);
      alert('Study Mate request sent!');
    } catch {
      alert('Failed to send request.');
    }
  }, [currentUser]);

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

  if (isLoading) return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-4 space-y-8 pb-36">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 mb-6 space-y-4 bg-white/5 rounded-[24px] animate-pulse">
          <div className="flex gap-3"><div className="w-11 h-11 rounded-full bg-white/10" /><div className="h-3 w-32 bg-white/10 rounded" /></div>
          <div className="h-40 bg-white/10 rounded-2xl" />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[600px] mx-auto px-0 sm:px-4 py-4 pb-36"
    >


      <AnimatePresence mode="popLayout">
        {visiblePosts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center py-20"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] flex items-center justify-center shadow-2xl shadow-[#00CFFF]/30">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">No posts found</h2>
            <p className="text-sm text-white/40 max-w-xs">Check back later or try a different filter.</p>
          </motion.div>
        ) : (
          visiblePosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              isLiked={likedPostIds.has(post.id!)}
              isLiking={likingProgress.has(post.id!)}
              isBookmark={bookmarkedIds.has(post.id!)}
              heartBurst={heartBurst === post.id}
              dwellPts={account ? (account.getDwellScores()[post.category] || 0) * 4 : 0}
              totalPriorityScore={(post.upvotes * 3) + (account ? (account.getDwellScores()[post.category] || 0) * 4 : 0)}
              handleLikeToggle={handleLikeToggle}
              handleStudyMateRequest={handleStudyMateRequest}
              handleBookmark={handleBookmark}
              recordDwell={recordDwell}
              setActiveCommentPost={setActiveCommentPost}
            />
          ))
        )}
      </AnimatePresence>

      <div ref={loaderRef} className="py-6 flex items-center justify-center gap-2 text-xs text-white/25 font-bold">
        {visibleCount < posts.length ? (
          <><Zap className="w-4 h-4 text-[#00CFFF] animate-pulse" /><span>Loading more...</span></>
        ) : (
          <><span className="text-[#00CFFF]">✓</span><span>All {posts.length} posts shown</span></>
        )}
      </div>

      <PostCommentsModal
        post={activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        currentUser={currentUser}
      />
    </motion.div>
  );
};
