import React, { useState } from 'react';
import { Search, Heart, MessageCircle, Share2, Bookmark, Users, Sparkles } from 'lucide-react';

export const SubjectCommunities: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'dsa' | 'latest'>('dsa');

  // DSA Watch-time & Interaction Dwell Scoring
  const [dwellScores, setDwellScores] = useState<Record<string, number>>({
    'Data Structures & Algorithms': 16,
    'Operating Systems': 12,
    'Full Stack Web Dev': 18,
    'Competitive Programming': 10,
  });

  const handleInteraction = (category: string, bonus: number = 2) => {
    setDwellScores((prev) => ({
      ...prev,
      [category]: (prev[category] || 0) + bonus,
    }));
  };

  const communities = [
    {
      id: 'comm_1',
      authorName: 'Algo Champions Pod',
      authorCollege: 'IIT Bombay + BITS Pilani Cluster',
      title: 'Welcome to our daily Top 180 LeetCode & Striver DSA Grind! We are organizing live mock interviews every Saturday at 8 PM. Drop your doubts or code solutions below!',
      category: 'Data Structures & Algorithms',
      membersCount: 1420,
      upvotes: 480,
      commentsCount: 92,
      createdAt: '3 hrs ago',
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
    },
    {
      id: 'comm_2',
      authorName: 'System Design & OS Club',
      authorCollege: 'IIT Delhi • Systems Guild',
      title: 'Our new community study sheet for Linux Kernel Synchronization & Semaphores is live! Check out the architecture diagram below and join our weekly code review pod.',
      category: 'Operating Systems',
      membersCount: 890,
      upvotes: 310,
      commentsCount: 45,
      createdAt: '6 hrs ago',
      mediaUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600',
    },
    {
      id: 'comm_3',
      authorName: 'Full Stack Web Dev Mastery',
      authorCollege: 'VIT + IIIT Hyderabad Hub',
      title: 'Building scalable high-throughput microservices using Spring Boot, Redis PubSub, and Neo4j Graph DBs. Share your project portfolios for live feedback!',
      category: 'Full Stack Web Dev',
      membersCount: 2150,
      upvotes: 615,
      commentsCount: 134,
      createdAt: '1 day ago',
      mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600',
    },
    {
      id: 'comm_4',
      authorName: 'Competitive Coders Pod',
      authorCollege: 'Top Rated Codeforces Guild',
      title: 'Discussing Segment Trees with Lazy Propagation and Heavy-Light Decomposition. We have posted our editorial notes for the latest Div-1 contest!',
      category: 'Competitive Programming',
      membersCount: 760,
      upvotes: 240,
      commentsCount: 38,
      createdAt: '2 days ago',
      mediaUrl: 'https://images.unsplash.com/photo-1516116218213-31f8f6f743a4?w=600',
    },
  ];

  const filteredCommunities = communities
    .filter((comm) => !searchQuery.trim() || comm.title.toLowerCase().includes(searchQuery.toLowerCase()) || comm.authorName.toLowerCase().includes(searchQuery.toLowerCase()) || comm.category.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'dsa') {
        const scoreA = (a.upvotes * 2) + ((dwellScores[a.category] || 0) * 5);
        const scoreB = (b.upvotes * 2) + ((dwellScores[b.category] || 0) * 5);
        return scoreB - scoreA;
      }
      return 0;
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      
      {/* Subject Communities Head & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#E1306C]" />
            <span>Subject Communities</span>
          </h1>
          <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/15 px-3 py-1 rounded-full border border-[#34C759]/30">
            Active Study Pods
          </span>
        </div>

        {/* Search Bar (Clean and minimal without recommender buttons) */}
        <div className="p-2 rounded-full glass-pill shadow-lg border border-white/20">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-white/70 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search subject communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212]/90 border border-white/20 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/50 outline-none focus:border-[#E1306C] focus:bg-[#181818] shadow-inner font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pure Instagram-Like Community Feed (Clean borderless, dark background #000000 posts with white text) */}
      <div className="space-y-8">
        {filteredCommunities.map((comm) => (
          <div
            key={comm.id}
            onMouseEnter={() => handleInteraction(comm.category, 1)}
            onClick={() => handleInteraction(comm.category, 3)}
            className="pb-8 border-b border-white/15 space-y-4 transition-all duration-300"
          >
            {/* Community Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#FD1D1D] to-[#FCB045] p-0.5 shadow-sm">
                    <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                      {comm.authorName[0]}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#121212] shadow-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    {comm.authorName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-white/20 text-white font-bold shadow-2xs">
                      {comm.authorCollege}
                    </span>
                  </h4>
                  <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                    <span className="text-[#E1306C] font-bold">#{comm.category}</span> • <span>{comm.createdAt}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#181818] text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-[#E1306C]" />
                  <span>{comm.membersCount} Members</span>
                </span>
              </div>
            </div>

            {/* Community Post Body & Media */}
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-white leading-relaxed font-normal">{comm.title}</p>

              {comm.mediaUrl && (
                <div className="rounded-[24px] overflow-hidden border border-white/20 bg-[#121212] relative group/img shadow-md">
                  <img
                    src={comm.mediaUrl}
                    alt="Community activity"
                    className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#121212]/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E1306C]" />
                    <span>Active Study Cluster</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pure Instagram Action Bar (Like, Comment, Join/Share, Bookmark) */}
            <div className="pt-1 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(comm.category, 5);
                    alert(`Upvoted "${comm.authorName}" study group!`);
                  }}
                  className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#FD1D1D] transition-all active:scale-90 group/btn"
                >
                  <Heart className="w-6 h-6 fill-[#FD1D1D] text-[#FD1D1D] transition-transform group-hover/btn:scale-110" />
                  <span>{comm.upvotes}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Opening community chat and discussion thread...');
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#833AB4] transition-all active:scale-90"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <span>{comm.commentsCount}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(comm.category, 10);
                    alert(`Joined "${comm.authorName}"! You will now receive daily study updates in your feed.`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E1306C] hover:bg-[#FD1D1D] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Join Community</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Community invite link copied!');
                  }}
                  className="text-white hover:text-[#E1306C] transition-all active:scale-90"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Community bookmarked to quick access list!');
                  }}
                  className="text-white hover:text-[#E1306C] transition-all active:scale-90"
                >
                  <Bookmark className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
