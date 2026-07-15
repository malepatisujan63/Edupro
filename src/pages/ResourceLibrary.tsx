import React, { useState } from 'react';
import { Download, Search, Heart, MessageCircle, Share2, Bookmark, FileText, Play, Zap } from 'lucide-react';

export const ResourceLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'dsa' | 'latest'>('dsa');

  // DSA Watch-time & Interaction Dwell Scoring
  const [dwellScores, setDwellScores] = useState<Record<string, number>>({
    'Operating Systems': 12,
    'DSA': 18,
    'DBMS': 8,
    'Web Development': 15,
  });

  const handleInteraction = (category: string, bonus: number = 2) => {
    setDwellScores((prev) => ({
      ...prev,
      [category]: (prev[category] || 0) + bonus,
    }));
  };

  const resources: any[] = [];

  const filteredResources = resources
    .filter((res) => !searchQuery.trim() || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.category.toLowerCase().includes(searchQuery.toLowerCase()))
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
      
      {/* Top Search Bar (Clean and minimal) */}
      <div className="kx-field-pill">
        <div className="relative w-full flex items-center">
          <Search className="w-4 h-4 text-[#4169E1] absolute left-4" />
          <input
            type="text"
            placeholder="Search notes & videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium"
          />
        </div>
      </div>

      {/* Pure Instagram-Like Notes & Videos Feed (Clean borderless, dark background #000000 posts with white text) */}
      <div className="space-y-8">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            onMouseEnter={() => handleInteraction(res.category, 1)}
            onClick={() => handleInteraction(res.category, 3)}
            className="pb-8 border-b border-white/15 space-y-4 transition-all duration-300"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#00CFFF] via-[#9B5DE5] to-[#9B5DE5] p-0.5 shadow-sm">
                    <div className="w-full h-full bg-[#000000] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                      {res.authorName[0]}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#05050A] shadow-sm" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    {res.authorName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D0D0D] border border-white/20 text-white font-bold shadow-2xs">
                      {res.authorCollege}
                    </span>
                  </h4>
                  <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                    <span className="text-[#00CFFF] font-bold">#{res.category}</span> • <span>{res.createdAt}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#0D0D0D] text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-2xs">
                  {res.format === 'Video Lecture' ? <Play className="w-3.5 h-3.5 text-[#9B5DE5] fill-current" /> : <FileText className="w-3.5 h-3.5 text-[#4169E1]" />}
                  <span>{res.format}</span>
                </span>
              </div>
            </div>

            {/* Note / Video Title & Compression Badge */}
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-white leading-relaxed font-normal">{res.title}</p>

              {/* Media Thumbnail with Huffman / DCT Compression Tag */}
              {res.mediaUrl && (
                <div className="rounded-[24px] overflow-hidden border border-white/20 bg-[#000000] relative group/img shadow-md">
                  <img
                    src={res.mediaUrl}
                    alt="Resource thumbnail"
                    className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-500"
                  />
                  {res.format === 'Video Lecture' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/img:bg-black/50 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-[#000000]/80 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 scale-100 group-hover/img:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-[#9B5DE5] fill-current ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#000000]/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>{res.fileSize} ({res.huffmanRatio})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pure Instagram Action Bar (Like, Comment, Download, Share, Bookmark) */}
            <div className="pt-1 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(res.category, 5);
                    alert(`Upvoted "${res.title.slice(0, 20)}..."!`);
                  }}
                  className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#9B5DE5] transition-all active:scale-90 group/btn"
                >
                  <Heart className="w-6 h-6 fill-[#9B5DE5] text-[#9B5DE5] transition-transform group-hover/btn:scale-110" />
                  <span>{res.upvotes}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Open Q&A / Discussion thread to view replies.');
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#4169E1] transition-all active:scale-90"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <span>{res.commentsCount}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(res.category, 10);
                    alert(`Downloading "${res.title}" via CDN!`);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D0D0D] hover:bg-[#111111] text-white font-extrabold text-xs border border-white/20 shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#34C759]" />
                  <span>Download ({res.downloads})</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Resource link copied! Ready to share with your study group.');
                  }}
                  className="text-white hover:text-[#00CFFF] transition-all active:scale-90"
                >
                  <Share2 className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Bookmarked "${res.title.slice(0, 20)}..."!`);
                  }}
                  className="text-white hover:text-[#00CFFF] transition-all active:scale-90"
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

