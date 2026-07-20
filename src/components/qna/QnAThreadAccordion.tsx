import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Send, UserPlus, ChevronDown } from 'lucide-react';
import { type CommentNode } from '../../dsa-engine';
import styles from './QnAThreadAccordion.module.css';

interface QnAThreadAccordionProps {
  node: CommentNode;
  currentUser: any;
  handleStudyMateRequest: (authorId: string) => void;
  handleAddReply: (parentId: string, text: string) => Promise<void>;
  depth?: number;
}

export const QnAThreadAccordion: React.FC<QnAThreadAccordionProps> = ({
  node, currentUser, handleStudyMateRequest, handleAddReply, depth = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await handleAddReply(node.id, replyText);
    setReplyText('');
    setIsReplying(false);
    setIsExpanded(true);
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth > 0 ? styles.nestedThread : styles.rootThread}
    >
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {node.authorAvatarUrl ? (
                <img src={node.authorAvatarUrl} alt="" loading="lazy" />
              ) : (
                <div className={styles.avatarFallback}>{node.authorName[0]}</div>
              )}
            </div>
          </div>
          <div>
            <h4 className={styles.authorName}>
              {node.authorName}
              {currentUser?.uid && node.authorId && node.authorId !== currentUser.uid && (
                <button onClick={() => handleStudyMateRequest(node.authorId!)} className={styles.addMateBtn}>
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              )}
              <span className={styles.collegeBadge}>{node.authorCollege}</span>
              {node.isAcceptedAnswer && (
                <span className={styles.solvedBadge}>
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              )}
            </h4>
            <p className={styles.metaText}>{node.timestamp}</p>
          </div>
        </div>

        {hasChildren && (
          <motion.button 
            animate={{ rotate: isExpanded ? 180 : 0 }} 
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandBtn}
          >
            <ChevronDown className="w-5 h-5 text-white/50" />
          </motion.button>
        )}
      </div>

      <div className={styles.content}>
        <p>{node.content}</p>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.leftActions}>
          <button onClick={() => alert('Upvoted!')} className={styles.iconBtn}>
            <Heart className="w-5 h-5 fill-[#9B5DE5] text-[#9B5DE5]" />
            <span>{node.upvotes}</span>
          </button>
          <button onClick={() => setIsReplying(!isReplying)} className={styles.iconBtn}>
            <MessageCircle className="w-5 h-5 text-white" />
            <span>{isReplying ? 'Cancel' : 'Reply'}</span>
          </button>
        </div>
        <div className={styles.rightActions}>
          <button className={styles.simpleIconBtn}><Share2 className="w-5 h-5" /></button>
          <button className={styles.simpleIconBtn}><Bookmark className="w-5 h-5" /></button>
        </div>
      </div>

      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={styles.replyBox}
          >
            <textarea
              rows={2}
              placeholder={`Reply to ${node.authorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={styles.replyInput}
            />
            <div className={styles.replyActions}>
              <button onClick={() => setIsReplying(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={submitReply} className={styles.submitBtn}>
                <Send className="w-3.5 h-3.5" /> Post Answer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={styles.childrenContainer}
          >
            {node.children.map((child) => (
              <QnAThreadAccordion
                key={child.id}
                node={child}
                currentUser={currentUser}
                handleStudyMateRequest={handleStudyMateRequest}
                handleAddReply={handleAddReply}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
