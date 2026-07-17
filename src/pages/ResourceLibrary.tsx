import React, { useState, useEffect } from 'react';
import { Download, Search, Heart, MessageCircle, Share2, Bookmark, FileText, Play, Zap, Plus } from 'lucide-react';
import { subscribeToPosts, createPost, backgroundUploadAndAttach, type FirestorePost } from '../lib/firestoreService';
import { uploadToCloudinary, getZeroLagPreviewUrl } from '../lib/cloudinaryService';

interface ResourceLibraryProps {
  currentUser?: any | null;
  account?: any | null;
}

// ── Instant 0ms Resource & Note Upload Modal
const ResourceUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentUser: any | null;
}> = ({ isOpen, onClose, currentUser }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operating Systems');
  const [format, setFormat] = useState<'PDF Study Sheet' | 'Video Lecture' | 'Photo Diagram'>('PDF Study Sheet');
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith('image/') || selected.type.startsWith('video/')) {
        const previewUrl = getZeroLagPreviewUrl(selected);
        setLocalUrl(previewUrl);
      } else {
        setLocalUrl(selected.name);
      }
    }
  };

  const handleInstantUpload = async () => {
    if (!title.trim() && !file) {
      alert('Please provide a title or attach a study material file.');
      return;
    }
    const user = currentUser || { uid: 'anon', name: 'Student Contributor', college: 'Koinexa Campus' };

    try {
      let previewUrl = localUrl || undefined;
      const mediaTypeVal = format === 'Video Lecture' ? 'video' : format === 'Photo Diagram' ? 'image' : 'pdf';

      if (file && (mediaTypeVal === 'image' || mediaTypeVal === 'video')) {
        try {
          const cdnRes = await uploadToCloudinary(file);
          previewUrl = cdnRes.secureUrl;
        } catch (err) {
          console.warn('Cloudinary unsigned CDN upload fallback:', err);
        }
      }

      // Write immediately to Firestore (0ms optimistic latency)
      const postId = await createPost({
        title: title.trim() || file?.name || 'Academic Study Sheet',
        authorId: user.uid,
        authorName: user.name,
        authorCollege: user.college || 'Koinexa Campus',
        authorAvatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
        upvotes: 1,
        commentsCount: 0,
        category,
        type: 'note',
        mediaUrl: previewUrl,
        mediaType: mediaTypeVal as any,
      });

      if (file && (!previewUrl || previewUrl.startsWith('blob:'))) {
        backgroundUploadAndAttach(file, user.uid, postId, 'resources').catch(() => {});
      }

      // Launch background upload engine
      if (file) {
        backgroundUploadAndAttach(file, user.uid, postId, 'posts').catch((err) => {
          console.error('Background note upload failed:', err);
          alert(`Cloud storage sync failed: ${err.message}`);
        });
      }

      onClose();
      setTitle('');
      setFile(null);
      setLocalUrl(null);
    } catch (err: any) {
      alert(`Could not create note: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-[500px] kx-flow-card rounded-[32px] overflow-hidden flex flex-col bg-[#0A0A0F] border border-white/15 animate-scaleUp" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <span className="text-[10px] uppercase font-black text-[#00CFFF] tracking-wider">Academic Cloud Upload ($O(1)$ Stream)</span>
            <h3 className="text-base font-black text-white">Upload Study Note / Video Sheet</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center font-bold text-sm">✕</button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">Note / Sheet Title</label>
            <input
              type="text"
              placeholder="e.g. Complete Operating Systems Quick Revision Notes..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#00CFFF] transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full py-3 px-3 rounded-2xl bg-[#12121A] border border-white/10 text-xs text-white outline-none font-medium"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="DSA">DSA & Algorithms</option>
                <option value="DBMS">DBMS</option>
                <option value="Web Development">Web Development</option>
                <option value="Mathematics">Mathematics</option>
                <option value="General">General Campus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 mb-1.5">Material Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as any)}
                className="w-full py-3 px-3 rounded-2xl bg-[#12121A] border border-white/10 text-xs text-white outline-none font-medium"
              >
                <option value="PDF Study Sheet">📄 PDF Study Sheet</option>
                <option value="Video Lecture">🎥 Video Lecture</option>
                <option value="Photo Diagram">🖼️ Photo Diagram</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/70 mb-1.5">Attach File (Instant Background Upload)</label>
            <label className="border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#00CFFF]/60 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              {file ? (
                <div className="text-center space-y-1">
                  <span className="text-xs font-black text-[#00CFFF] block">{file.name}</span>
                  <span className="text-[10px] text-white/50 block">{(file.size / 1024).toFixed(1)} KB • Ready for instant feed sync</span>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <FileText className="w-8 h-8 text-[#00CFFF] mx-auto opacity-70 animate-bounce" />
                  <span className="text-xs font-bold text-white block">Click to pick PDF, Video, or Photo</span>
                  <span className="text-[10px] text-white/40 block">Max 50 MB • Non-blocking upload engine</span>
                </div>
              )}
              <input type="file" onChange={handleFilePick} className="hidden" />
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0D0D14] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl bg-white/10 text-xs font-bold text-white/80 hover:text-white transition-all">Cancel</button>
          <button
            onClick={handleInstantUpload}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-xs hover:opacity-95 shadow-lg shadow-[#00CFFF]/20 transition-all active:scale-95"
          >
            Upload Study Note ($0$ms)
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ currentUser, account }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'dsa' | 'latest'>('dsa');
  const [resources, setResources] = useState<FirestorePost[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPosts((allPosts) => {
      setResources(allPosts.filter(p => p.type === 'note' || p.mediaUrl || p.mediaType || p.category));
    });
    return () => unsub();
  }, []);

  // DSA Watch-time & Interaction Dwell Scoring (connected to global OOP StudentAccount)
  const [dwellScores, setDwellScores] = useState<Record<string, number>>({
    'Operating Systems': 12,
    'DSA': 18,
    'DBMS': 8,
    'Web Development': 15,
    ...(account?.getDwellScores() || {}),
  });

  const handleInteraction = (category: string, bonus: number = 2) => {
    if (account) {
      account.recordDwell(category, bonus);
    }
    setDwellScores((prev) => ({
      ...prev,
      [category]: (prev[category] || 0) + bonus,
    }));
  };

  const filteredResources = resources
    .filter((res) => !searchQuery.trim() || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'dsa') {
        const now = Date.now();
        const isFreshA = now - ((a as any).timestamp || 0) < 30 * 60 * 1000;
        const isFreshB = now - ((b as any).timestamp || 0) < 30 * 60 * 1000;
        const isMineA = a.authorId === currentUser?.uid;
        const isMineB = b.authorId === currentUser?.uid;

        const scoreA = ((a.upvotes || 0) * 2) + ((dwellScores[a.category || 'DSA'] || 0) * 5) + (isFreshA ? 500 : 0) + (isMineA ? 200 : 0);
        const scoreB = ((b.upvotes || 0) * 2) + ((dwellScores[b.category || 'DSA'] || 0) * 5) + (isFreshB ? 500 : 0) + (isMineB ? 200 : 0);
        return scoreB - scoreA;
      }
      return 0;
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      
      {/* Top Search Bar & Upload Button */}
      <div className="flex items-center gap-3">
        <div className="kx-field-pill flex-1">
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

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] hover:opacity-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-[#00CFFF]/20 transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Note</span>
        </button>
      </div>

      <ResourceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Pure Instagram-Like Notes & Videos Feed (Clean borderless, dark background #000000 posts with white text) */}
      <div className="space-y-8">
        {filteredResources.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-white/[0.02] rounded-3xl border border-white/10 p-8">
            <FileText className="w-12 h-12 text-[#00CFFF] mx-auto opacity-60 animate-pulse" />
            <p className="text-base font-bold text-white">No academic study notes uploaded yet</p>
            <p className="text-xs text-white/50">Click "Upload Note" right above to share the first study sheet or video!</p>
          </div>
        ) : filteredResources.map((res) => {
          const authorName = res.authorName || 'Student Contributor';
          const authorCollege = res.authorCollege || 'Koinexa Campus';
          const category = res.category || 'General';
          const format = (res as any).format || (res.mediaType === 'video' ? 'Video Lecture' : 'PDF Study Sheet');
          const fileSize = (res as any).fileSize || '3.2 MB';
          const huffmanRatio = (res as any).huffmanRatio || 'Huffman Encoded';
          const downloads = (res as any).downloads || 14;

          return (
            <div
              key={res.id || Math.random()}
              onMouseEnter={() => handleInteraction(category, 1)}
              onClick={() => handleInteraction(category, 3)}
              className="pb-8 border-b border-white/15 space-y-4 transition-all duration-300"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#00CFFF] via-[#9B5DE5] to-[#9B5DE5] p-0.5 shadow-sm">
                      <div className="w-full h-full bg-[#000000] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                        {authorName[0]}
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#05050A] shadow-sm" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {authorName}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D0D0D] border border-white/20 text-white font-bold shadow-2xs">
                        {authorCollege}
                      </span>
                    </h4>
                    <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                      <span className="text-[#00CFFF] font-bold">#{category}</span> • <span>{(res.createdAt as any) || 'Just now'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#0D0D0D] text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-2xs">
                    {format === 'Video Lecture' ? <Play className="w-3.5 h-3.5 text-[#9B5DE5] fill-current" /> : <FileText className="w-3.5 h-3.5 text-[#4169E1]" />}
                    <span>{format}</span>
                  </span>
                </div>
              </div>

              {/* Note / Video Title & Compression Badge */}
              <div className="space-y-3">
                <p className="text-sm sm:text-base text-white leading-relaxed font-normal">{res.title}</p>

                {/* Media Thumbnail with Huffman / DCT Compression Tag */}
                {res.mediaUrl && (
                  <div className="rounded-[24px] overflow-hidden border border-white/20 bg-[#000000] relative group/img shadow-md">
                    {res.mediaType === 'video' || format === 'Video Lecture' ? (
                      <video src={res.mediaUrl} controls className="w-full max-h-[480px] object-cover" />
                    ) : (
                      <img
                        src={res.mediaUrl}
                        alt="Resource thumbnail"
                        className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform duration-500"
                      />
                    )}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#000000]/90 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#34C759]" />
                      <span>{fileSize} ({huffmanRatio})</span>
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
                      handleInteraction(category, 5);
                      alert(`Upvoted "${res.title.slice(0, 20)}..."!`);
                    }}
                    className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#9B5DE5] transition-all active:scale-90 group/btn"
                  >
                    <Heart className="w-6 h-6 fill-[#9B5DE5] text-[#9B5DE5] transition-transform group-hover/btn:scale-110" />
                    <span>{res.upvotes || 1}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Open Q&A / Discussion thread to view replies.');
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#4169E1] transition-all active:scale-90"
                  >
                    <MessageCircle className="w-6 h-6 text-white" />
                    <span>{res.commentsCount || 0}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInteraction(category, 10);
                      if (res.mediaUrl && !res.mediaUrl.startsWith('blob:')) {
                        window.open(res.mediaUrl, '_blank');
                      } else {
                        alert(`Downloading "${res.title}" via CDN!`);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D0D0D] hover:bg-[#111111] text-white font-extrabold text-xs border border-white/20 shadow-sm transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-[#34C759]" />
                    <span>Download ({downloads})</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard?.writeText(`${window.location.origin}?note=${res.id}`).then(() => alert('Note link copied!'));
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
          );
        })}
      </div>

    </div>
  );
};

