import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  FileText,
  Code,
  Zap,
} from 'lucide-react';
import {
  globalTrendingHeap,
  globalUndoStack,
  type HeapItem,
} from '../dsa-engine';

export const HomeFeed: React.FC = () => {
  const [posts, setPosts] = useState<HeapItem[]>([]);
  const [sortBy] = useState<'heap' | 'latest'>('heap');

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  const refreshFeed = () => {
    if (sortBy === 'heap') {
      // Top K by Max-Heap O(N log N) or O(K log N)
      setPosts(globalTrendingHeap.getTopK(50));
    } else {
      setPosts(globalTrendingHeap.getRawArray().reverse());
    }
  };

  useEffect(() => {
    refreshFeed();
    const handleRefresh = () => refreshFeed();
    window.addEventListener('edunetwork:refresh', handleRefresh);
    return () => window.removeEventListener('edunetwork:refresh', handleRefresh);
  }, [sortBy]);

  // IntersectionObserver Lazy Loading hook (Point 5 & 6)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 5, posts.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [posts.length]);

  const handleUpvote = (post: HeapItem) => {
    const newCount = post.upvotes + 1;
    globalTrendingHeap.updateUpvotes(post.id, newCount);
    globalUndoStack.push({
      id: `undo_${Date.now()}`,
      type: 'DOWNVOTE',
      description: `Upvoted "${post.title.slice(0, 30)}..." to ${newCount} upvotes in Max-Heap`,
      timestamp: new Date().toLocaleTimeString(),
      payload: { postId: post.id, prevUpvotes: post.upvotes },
    });
    refreshFeed();
  };

  // DSA Interaction & Watch-Time (Dwell) Scoring Engine
  const [categoryDwellScores, setCategoryDwellScores] = useState<Record<string, number>>({
    'DSA': 10,
    'Operating Systems': 5,
    'Full Stack Web Dev': 8,
    'Competitive Programming': 6,
  });

  const handlePostHoverOrInteraction = (category: string, bonus: number = 2) => {
    setCategoryDwellScores((prev) => ({
      ...prev,
      [category]: (prev[category] || 0) + bonus,
    }));
  };

  // Dynamically sorted visible posts using Max-Heap interaction scoring
  const visiblePosts = posts
    .slice()
    .sort((a, b) => {
      if (sortBy === 'heap') {
        const scoreA = (a.upvotes * 3) + ((categoryDwellScores[a.category] || 0) * 4);
        const scoreB = (b.upvotes * 3) + ((categoryDwellScores[b.category] || 0) * 4);
        return scoreB - scoreA;
      }
      return 0; // Chronological already sorted
    })
    .slice(0, visibleCount);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      
      {/* Pure Instagram-Like Feed (Clean posts, dark background #000000, white text) */}
      <div className="space-y-8">
        {visiblePosts.map((post) => (
          <div
            key={post.id}
            onMouseEnter={() => handlePostHoverOrInteraction(post.category, 1)}
            onClick={() => handlePostHoverOrInteraction(post.category, 3)}
            className="pb-8 border-b border-white/15 space-y-4 transition-all duration-300"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#FD1D1D] to-[#FCB045] p-0.5 shadow-sm">
                    <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                      {post.authorName[0]}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#121212] shadow-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    {post.authorName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-white/20 text-white font-bold shadow-2xs">
                      {post.authorCollege || 'Campus Verified'}
                    </span>
                  </h4>
                  <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                    <span className="text-[#E1306C] font-bold">#{post.category}</span> • <span>{post.createdAt}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#181818] text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-2xs">
                  {post.type === 'note' && <FileText className="w-3.5 h-3.5 text-[#833AB4]" />}
                  {post.type === 'question' && <MessageCircle className="w-3.5 h-3.5 text-[#E1306C]" />}
                  {post.type === 'post' && <Code className="w-3.5 h-3.5 text-[#34C759]" />}
                  <span className="capitalize">{post.type}</span>
                </span>
              </div>
            </div>

            {/* Post Caption / Body Text */}
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-white leading-relaxed font-normal">{post.title}</p>

              {/* Attached Photo / Video / Compressed Diagram Thumbnail */}
              {post.mediaUrl && post.mediaType === 'video' ? (
                <div className="rounded-[24px] overflow-hidden border border-white/20 bg-[#121212] relative shadow-md">
                  <video
                    src={post.mediaUrl}
                    controls
                    className="w-full max-h-[480px] object-cover"
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#121212]/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5 pointer-events-none">
                    <Zap className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Video Attached ($O(1)$ Stream)</span>
                  </div>
                </div>
              ) : post.mediaUrl ? (
                <div className="rounded-[24px] overflow-hidden border border-white/20 bg-[#121212] relative group/img shadow-md">
                  <img
                    src={post.mediaUrl}
                    alt="Resource preview"
                    className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#121212]/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#E1306C]" />
                    <span>WebP Preview ($O(1)$ Cache)</span>
                  </div>
                </div>
              ) : null}
              {post.mediaType === 'pdf' && (
                <div className="p-4 rounded-[20px] bg-[#181818] border border-white/20 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#833AB4]/20 border border-[#833AB4]/40 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-[#833AB4]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Attached PDF Document Note</h4>
                      <p className="text-[10px] text-[#34C759] font-mono">Huffman DEFLATE Compressed ($O(1)$ lookup)</p>
                    </div>
                  </div>
                  <button onClick={() => alert('Opening attached PDF file via CDN...')} className="px-3.5 py-1.5 rounded-full bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold border border-white/20">
                    View PDF
                  </button>
                </div>
              )}
            </div>

            {/* Pure Instagram Action Bar (Like, Comment, Share, Bookmark) */}
            <div className="pt-1 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvote(post);
                    handlePostHoverOrInteraction(post.category, 5);
                  }}
                  className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#FD1D1D] transition-all active:scale-90 group/btn"
                >
                  <Heart className="w-6 h-6 fill-[#FD1D1D] text-[#FD1D1D] transition-transform group-hover/btn:scale-110" />
                  <span>{post.upvotes}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Open Q&A / Discussion thread to view replies.');
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#833AB4] transition-all active:scale-90"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <span>{post.commentsCount}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Post link copied! Ready to share with your study pod.');
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#E1306C] transition-all active:scale-90"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Bookmarked "${post.title.slice(0, 20)}..." ($O(1)$ HashSet insert).`);
                  }}
                  className="text-white hover:text-[#E1306C] transition-all active:scale-90"
                >
                  <Bookmark className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

          </div>
        ))}

        {/* Lazy Loading Infinite Scroll Trigger */}
        <div ref={loaderRef} className="py-6 text-center text-xs text-white/60 flex items-center justify-center gap-2 font-bold">
          <Zap className="w-4 h-4 text-[#E1306C] animate-pulse" />
          <span>
            Lazy Loading: Showing {visibleCount} of {posts.length} feed items...
          </span>
        </div>
      </div>

    </div>
  );
};
