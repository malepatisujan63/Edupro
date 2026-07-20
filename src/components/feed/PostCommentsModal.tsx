import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { subscribeToComments, addComment, type FirestorePost, type FirestoreComment } from '../../lib/supabaseService';
import styles from './PostCommentsModal.module.css';

interface PostCommentsModalProps {
  post: FirestorePost | null;
  onClose: () => void;
  currentUser: any | null;
}

export const PostCommentsModal: React.FC<PostCommentsModalProps> = ({ post, onClose, currentUser }) => {
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

  const handlePostReply = async () => {
    if (!newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({
        parentId: post!.id!,
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
    <AnimatePresence>
      {post && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <div>
                <span className={styles.kicker}>Academic Discussion</span>
                <h3 className={styles.title}>{post.title}</h3>
              </div>
              <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <div className={styles.emptyState}>
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <MessageCircle className="w-10 h-10 text-white/20 mx-auto" />
                  </motion.div>
                  <p className={styles.emptyTitle}>No academic discussions yet</p>
                  <p className={styles.emptyText}>Be the first to share an insight or question!</p>
                </div>
              ) : (
                <div className={styles.listWrapper}>
                  {comments.map((comment, i) => (
                    <motion.div 
                      key={comment.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={styles.commentItem}
                    >
                      <div className={styles.commentHeader}>
                        <div className={styles.commentAuthor}>
                          <img src={comment.authorAvatarUrl} alt="" className={styles.commentAvatar} />
                          <div>
                            <span className={styles.commentName}>{comment.authorName}</span>
                            <span className={styles.commentCollege}>{comment.authorCollege}</span>
                          </div>
                        </div>
                        <span className={styles.verifiedBadge}>Verified Reply</span>
                      </div>
                      <p className={styles.commentContent}>{comment.content}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <input
                type="text"
                placeholder="Write a helpful reply..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePostReply()}
                className={styles.input}
              />
              <motion.button
                onClick={handlePostReply}
                disabled={!newCommentText.trim() || isSubmitting}
                className={styles.replyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                Reply
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
