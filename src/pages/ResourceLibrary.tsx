import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, FileText } from 'lucide-react';
import { subscribeToPosts, type FirestorePost } from '../lib/supabaseService';
import { ResourceCard } from '../components/resources/ResourceCard';
// Assuming ResourceUploadModal is extracted or we can keep it here for brevity, but I should probably extract it. Let's keep it here for now to save time, or extract it.
// I will keep it in the same file to match the original structure, but with motion.

// We can just keep ResourceUploadModal inline for now, but wrapped in motion.
import { getZeroLagPreviewUrl, uploadToCloudinary } from '../lib/cloudinaryService';
import { createPost, backgroundUploadAndAttach } from '../lib/supabaseService';

const ResourceUploadModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: any | null; }> = ({ isOpen, onClose, currentUser }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operating Systems');
  const [format, setFormat] = useState<'PDF Study Sheet' | 'Video Lecture' | 'Photo Diagram'>('PDF Study Sheet');
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith('image/') || selected.type.startsWith('video/')) {
        setLocalUrl(getZeroLagPreviewUrl(selected));
      } else {
        setLocalUrl(selected.name);
      }
    }
  };

  const handleInstantUpload = async () => {
    if (!title.trim() && !file) return alert('Please provide a title or attach a study material file.');
    const user = currentUser || { uid: 'anon', name: 'Student Contributor', college: 'Koinexa Campus' };
    
    try {
      let previewUrl = localUrl || undefined;
      const mediaTypeVal = format === 'Video Lecture' ? 'video' : format === 'Photo Diagram' ? 'image' : 'pdf';

      if (file && (mediaTypeVal === 'image' || mediaTypeVal === 'video')) {
        try {
          const cdnRes = await uploadToCloudinary(file);
          previewUrl = cdnRes.secureUrl;
        } catch (err) {}
      }

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
      if (file) {
        backgroundUploadAndAttach(file, user.uid, postId, 'posts').catch(() => {});
      }

      onClose();
      setTitle(''); setFile(null); setLocalUrl(null);
    } catch (err: any) { alert(`Could not create note: ${err.message}`); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-[500px] rounded-[32px] overflow-hidden flex flex-col bg-[#0A0A0F] border border-white/15" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <span className="text-[10px] uppercase font-black text-[#00CFFF] tracking-wider">Academic Cloud Upload</span>
                <h3 className="text-base font-black text-white">Upload Study Note</h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Note Title</label>
                <input type="text" placeholder="e.g. Operating Systems Notes" value={title} onChange={e => setTitle(e.target.value)} className="kx-input-flow" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full py-3 px-3 rounded-2xl bg-[#12121A] border border-white/10 text-xs text-white outline-none">
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="DSA">DSA</option>
                    <option value="DBMS">DBMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">Format</label>
                  <select value={format} onChange={e => setFormat(e.target.value as any)} className="w-full py-3 px-3 rounded-2xl bg-[#12121A] border border-white/10 text-xs text-white outline-none">
                    <option value="PDF Study Sheet">PDF Study Sheet</option>
                    <option value="Video Lecture">Video Lecture</option>
                    <option value="Photo Diagram">Photo Diagram</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">Attach File</label>
                <label className="border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#00CFFF]/60 bg-white/[0.02]">
                  {file ? (
                    <div className="text-center space-y-1"><span className="text-xs font-black text-[#00CFFF]">{file.name}</span></div>
                  ) : (
                    <div className="text-center space-y-1"><FileText className="w-8 h-8 text-[#00CFFF] mx-auto opacity-70" /><span className="text-xs font-bold text-white block">Click to pick file</span></div>
                  )}
                  <input type="file" onChange={handleFilePick} className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0D0D14] flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-2xl bg-white/10 text-xs font-bold text-white/80 hover:text-white">Cancel</button>
              <button onClick={handleInstantUpload} className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] to-[#4169E1] text-white font-black text-xs">Upload</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ResourceLibraryProps { currentUser?: any | null; account?: any | null; }

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ currentUser, account }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<FirestorePost[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPosts((allPosts) => {
      setResources(allPosts.filter(p => p.type === 'note' || p.mediaUrl || p.mediaType || p.category));
    });
    return () => unsub();
  }, []);

  const [dwellScores, setDwellScores] = useState<Record<string, number>>({
    'Operating Systems': 12, 'DSA': 18, 'DBMS': 8, 'Web Development': 15, ...(account?.getDwellScores() || {}),
  });

  const handleInteraction = (category: string, bonus: number = 2) => {
    if (account) account.recordDwell(category, bonus);
    setDwellScores(prev => ({ ...prev, [category]: (prev[category] || 0) + bonus }));
  };

  const filteredResources = resources
    .filter((res) => !searchQuery.trim() || res.title.toLowerCase().includes(searchQuery.toLowerCase()) || res.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const scoreA = ((a.upvotes || 0) * 2) + ((dwellScores[a.category || 'DSA'] || 0) * 5);
      const scoreB = ((b.upvotes || 0) * 2) + ((dwellScores[b.category || 'DSA'] || 0) * 5);
      return scoreB - scoreA;
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      <div className="flex items-center gap-3">
        <div className="flex-1 kx-field-pill flex items-center">
          <Search className="w-4 h-4 text-[#4169E1] absolute left-4" />
          <input
            type="text"
            placeholder="Search notes & videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none font-medium"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-3 rounded-full bg-gradient-to-r from-[#00CFFF] to-[#9B5DE5] text-white font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,207,255,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Note</span>
        </motion.button>
      </div>

      <ResourceUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} currentUser={currentUser} />

      <motion.div layout className="space-y-0">
        <AnimatePresence>
          {filteredResources.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-16 space-y-3 bg-white/[0.02] rounded-3xl border border-white/10 p-8">
              <FileText className="w-12 h-12 text-[#00CFFF] mx-auto opacity-60 animate-pulse" />
              <p className="text-base font-bold text-white">No academic study notes found</p>
            </motion.div>
          ) : (
            filteredResources.map((res, i) => (
              <ResourceCard key={res.id} resource={res} handleInteraction={handleInteraction} index={i} />
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
