import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, FileText, Code, Zap, Play, UserPlus, ExternalLink } from 'lucide-react';
import { type FirestorePost } from '../../lib/supabaseService';
import styles from './FeedPostCard.module.css';

interface FeedPostCardProps {
  post: FirestorePost;
  currentUser: any;
  isLiked: boolean;
  isLiking: boolean;
  isBookmark: boolean;
  heartBurst: boolean;
  dwellPts: number;
  totalPriorityScore: number;
  handleLikeToggle: (post: FirestorePost) => void;
  handleStudyMateRequest: (authorId: string) => void;
  handleBookmark: (post: FirestorePost) => void;
  recordDwell: (category: string, pts: number) => void;
  setActiveCommentPost: (post: FirestorePost) => void;
}

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

// ── Lazy image with fade-in
const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  return (
    <div className="relative w-full min-h-[200px] bg-[#0A0A0A]">
      {!loaded && !error && <div className="absolute inset-0 skeleton rounded-[18px]" />}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">Failed to load</div>
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

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post, currentUser, isLiked, isLiking, isBookmark, heartBurst, dwellPts, totalPriorityScore,
  handleLikeToggle, handleStudyMateRequest, handleBookmark, recordDwell, setActiveCommentPost
}) => {
  const badge = typeBadge[post.type] || typeBadge.post;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={() => recordDwell(post.category, 1)}
      onClick={() => recordDwell(post.category, 2)}
      className="kx-feed-card"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt="" loading="lazy" />
              ) : (
                <div className={styles.avatarFallback}>{post.authorName[0]?.toUpperCase()}</div>
              )}
            </div>
            <span className={styles.onlineBadge} />
          </div>
          <div>
            <h4 className={styles.authorName}>{post.authorName}</h4>
            <div className={styles.metaRow}>
              <p className={styles.metaText}>
                <span className={styles.category}>#{post.category}</span>
                <span>·</span>
                <span>{getRelativeTime(post.createdAt)}</span>
              </p>
              <span className={styles.priorityBadge}>
                ⚡ Priority: {totalPriorityScore} {dwellPts > 0 && `(+${dwellPts} Dwell)`}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {currentUser?.uid && post.authorId !== currentUser.uid && (
            <button onClick={() => handleStudyMateRequest(post.authorId)} className={styles.addMateBtn} title="Send Study Mate Request">
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          <span className={`${styles.typeBadge} ${badge.bg} ${badge.text}`}>
            {badge.icon}<span className="capitalize">{post.type}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <p className={styles.content}>{post.title}</p>

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <div className={styles.mediaContainer} onDoubleClick={(e) => { e.preventDefault(); if (!isLiked) handleLikeToggle(post); }}>
          <AnimatePresence>
            {heartBurst && (
              <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} exit={{ opacity: 0 }} className={styles.heartBurst}>
                <Heart className="w-20 h-20 fill-[#00CFFF] text-[#00CFFF]" />
              </motion.div>
            )}
          </AnimatePresence>
          <LazyImage src={post.mediaUrl} alt="Post media" className={styles.mediaImage} />
        </div>
      )}

      {post.mediaUrl && post.mediaType === 'video' && (
        <div className={styles.mediaContainer}>
          <video
            src={post.mediaUrl}
            controls preload="none"
            onPlay={() => recordDwell(post.category, 5)}
            onTimeUpdate={(e) => {
              if (Math.floor(e.currentTarget.currentTime) > 0 && Math.floor(e.currentTarget.currentTime) % 6 === 0) {
                recordDwell(post.category, 2);
              }
            }}
            className={styles.mediaImage}
          />
          <div className={styles.videoBadge}>
            <Play className="w-3 h-3" /> Live DSA Watch Tracker
          </div>
        </div>
      )}

      {post.mediaType === 'pdf' && post.mediaUrl && (
        <div className={styles.pdfContainer}>
          <div className={styles.pdfInfo}>
            <div className={styles.pdfIcon}><FileText className="w-5 h-5 text-[#00CFFF]" /></div>
            <div>
              <h4 className="text-xs font-bold text-white">PDF Note</h4>
              <p className="text-[10px] text-[#4169E1] font-mono">Firebase Storage · Secure</p>
            </div>
          </div>
          <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
            <ExternalLink className="w-3.5 h-3.5" />View
          </a>
        </div>
      )}

      {/* Actions */}
      <div className={styles.footer}>
        <div className={styles.actionGroup}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); handleLikeToggle(post); }}
            disabled={isLiking}
            className={`${styles.actionBtn} ${isLiked ? styles.liked : ''} ${isLiking ? styles.disabled : ''}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.upvotes}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setActiveCommentPost(post); }}
            className={styles.actionBtn}
          >
            <MessageCircle className="w-6 h-6" />
            <span>{post.commentsCount}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}?post=${post.id}`).then(() => alert('Link copied!'));
            }}
            className={styles.actionBtn}
          >
            <Share2 className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); handleBookmark(post); }}
          className={`${styles.actionBtn} ${isBookmark ? styles.bookmarked : ''}`}
        >
          {isBookmark ? <BookmarkCheck className="w-6 h-6 fill-current" /> : <Bookmark className="w-6 h-6" />}
        </motion.button>
      </div>
    </motion.article>
  );
};
