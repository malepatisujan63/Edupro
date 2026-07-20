import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, FileText, Send, Trash2, Loader } from 'lucide-react';
import styles from './CreatePostModal.module.css';
import { checkRateLimit } from '../../utils/rateLimiter';
import { validateContentSafety } from '../../utils/safetyFilter';
import { createPost, backgroundUploadAndAttach } from '../../lib/supabaseService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  setUploadStatus: (status: any) => void;
  setActiveTab: (tab: any) => void;
  handleFileChangeProps?: any; // To maintain compatibility or pass the logic
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen, onClose, currentUser, setUploadStatus, setActiveTab
}) => {
  const [postContent, setPostContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setAttachedFile(file);
      setAttachedMediaType(type);
      if (type === 'image' || type === 'video') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setAttachedMediaUrl(event.target.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedMediaUrl(file.name);
      }
    }
  };

  const resetModal = () => {
    setPostContent('');
    setAttachedFile(null);
    setAttachedMediaUrl(null);
    setAttachedMediaType(null);
    onClose();
  };

  const handlePost = async () => {
    if (!postContent.trim() && !attachedFile) {
      alert('Please write a caption or attach media!');
      return;
    }
    if (!currentUser?.uid) {
      alert('You must be signed in.');
      return;
    }

    const rateLimit = checkRateLimit(`create_post:${currentUser.uid}`, 3, 60000);
    if (!rateLimit.allowed) {
      const remaining = Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000);
      alert(`Rate Limit: Wait ${remaining}s.`);
      return;
    }

    const contentCheck = validateContentSafety(postContent);
    if (!contentCheck.isSafe) {
      alert(`Safety Alert: Contains flagged keyword "${contentCheck.flaggedWord}".`);
      return;
    }

    setIsPosting(true);
    try {
      const localPreview = attachedMediaUrl || undefined;
      const fileToUpload = attachedFile;
      const mediaTypeToSave = attachedMediaType || undefined;

      const postId = await createPost({
        title: postContent.trim() || `[${mediaTypeToSave?.toUpperCase()}] Attachment`,
        authorId: currentUser.uid,
        authorName: currentUser.name || 'Student',
        authorCollege: currentUser.college || 'Campus',
        authorAvatarUrl: currentUser.avatarUrl || '',
        upvotes: 0,
        commentsCount: 0,
        category: 'General',
        type: mediaTypeToSave === 'video' ? 'post' : 'note',
        mediaUrl: localPreview,
        mediaType: mediaTypeToSave,
      });

      if (fileToUpload && mediaTypeToSave) {
        setUploadStatus({ fileName: fileToUpload.name, progress: 0, status: 'uploading' });
        backgroundUploadAndAttach(
          fileToUpload, currentUser.uid, postId, 'posts',
          (pct) => setUploadStatus({ fileName: fileToUpload.name, progress: pct, status: 'uploading' })
        ).then(() => {
          setUploadStatus({ fileName: fileToUpload.name, progress: 100, status: 'completed' });
          setTimeout(() => setUploadStatus(null), 3500);
        }).catch(() => setUploadStatus(null));
      }

      resetModal();
      setActiveTab('home');
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div 
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h3 className={styles.title}>Share on Campus</h3>
              <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
            </div>

            {/* Body */}
            <div className={styles.body}>
              <textarea
                autoFocus
                placeholder="What's on your mind? Share notes or doubts..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className={styles.textarea}
                rows={4}
              />

              <div className={styles.actionsBar}>
                <label className={`${styles.actionBtn} ${styles.imgBtn}`}>
                  <ImageIcon size={16} /> Photo
                  <input type="file" accept="image/*" onChange={(e)=>handleFileChange(e,'image')} hidden />
                </label>
                <label className={`${styles.actionBtn} ${styles.vidBtn}`}>
                  <Video size={16} /> Video
                  <input type="file" accept="video/*" onChange={(e)=>handleFileChange(e,'video')} hidden />
                </label>
                <label className={`${styles.actionBtn} ${styles.pdfBtn}`}>
                  <FileText size={16} /> PDF Note
                  <input type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,'pdf')} hidden />
                </label>
              </div>

              {/* Attachment Preview */}
              <AnimatePresence>
                {attachedFile && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className={styles.attachmentPreview}
                  >
                    <div className={styles.attachmentInfo}>
                      {attachedMediaType === 'image' && <img src={attachedMediaUrl!} alt="preview" />}
                      {attachedMediaType === 'video' && <video src={attachedMediaUrl!} />}
                      {attachedMediaType === 'pdf' && <div className={styles.pdfIcon}><FileText size={24}/></div>}
                      
                      <div className={styles.attachmentText}>
                        <p className={styles.fileName}>{attachedFile.name}</p>
                        <p className={styles.fileMeta}>{(attachedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => { setAttachedFile(null); setAttachedMediaUrl(null); setAttachedMediaType(null); }} className={styles.removeBtn}>
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button onClick={resetModal} className={styles.cancelBtn}>Cancel</button>
              <motion.button 
                onClick={handlePost} 
                disabled={isPosting} 
                className={styles.postBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPosting ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                {isPosting ? 'Posting...' : 'Share Post'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
