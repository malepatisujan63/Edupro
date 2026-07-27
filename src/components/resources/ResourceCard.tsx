import React from 'react';
import { motion } from 'framer-motion';
import { Download, Heart, MessageCircle, Share2, Bookmark, FileText, Play, Zap } from 'lucide-react';
import { type FirestorePost } from '../../lib/supabaseService';
import styles from './ResourceCard.module.css';

interface ResourceCardProps {
  resource: FirestorePost;
  handleInteraction: (category: string, bonus: number) => void;
  index: number;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, handleInteraction, index }) => {
  const authorName = resource.authorName || 'Student Contributor';
  const authorCollege = resource.authorCollege || 'Koinexa Campus';
  const category = resource.category || 'General';
  const format = (resource as any).format || (resource.mediaType === 'video' ? 'Video Lecture' : 'PDF Study Sheet');
  const fileSize = (resource as any).fileSize || '3.2 MB';
  const huffmanRatio = (resource as any).huffmanRatio || 'Huffman Encoded';
  const downloads = (resource as any).downloads || 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={() => handleInteraction(category, 1)}
      onClick={() => handleInteraction(category, 3)}
      className="kx-resource-card"
    >
      <div className={styles.header}>
        <div className={styles.authorGroup}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarInner}>
              {authorName[0]}
            </div>
            <span className={styles.onlineBadge} />
          </div>
          <div>
            <h4 className={styles.authorName}>
              {authorName}
              <span className={styles.collegeBadge}>{authorCollege}</span>
            </h4>
            <p className={styles.metaRow}>
              <span className={styles.categoryBadge}>#{category}</span> • <span>{(resource.createdAt as any) || 'Just now'}</span>
            </p>
          </div>
        </div>

        <span className={styles.formatBadge}>
          {format === 'Video Lecture' ? <Play className="w-3.5 h-3.5 text-[#9B5DE5] fill-current" /> : <FileText className="w-3.5 h-3.5 text-[#4169E1]" />}
          <span>{format}</span>
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.title}>{resource.title}</p>
        
        {resource.mediaUrl && (
          <div className="kx-media-preview">
            {resource.mediaType === 'video' || format === 'Video Lecture' ? (
              <video src={resource.mediaUrl} controls className={styles.mediaElement} />
            ) : (
              <img src={resource.mediaUrl} alt="Resource thumbnail" className={styles.mediaElement} />
            )}
            <div className={styles.compressionBadge}>
              <Zap className="w-3.5 h-3.5 text-[#34C759]" />
              <span>{fileSize} ({huffmanRatio})</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.actionBar}>
        <div className={styles.leftActions}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleInteraction(category, 5); }} className={styles.iconBtn}>
            <Heart className="w-6 h-6 fill-[#9B5DE5] text-[#9B5DE5]" />
            <span>{resource.upvotes || 1}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={styles.iconBtn}>
            <MessageCircle className="w-6 h-6 text-white" />
            <span>{resource.commentsCount || 0}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={styles.downloadBtn}>
            <Download className="w-4 h-4 text-[#34C759]" />
            <span>Download ({downloads})</span>
          </motion.button>
        </div>
        <div className={styles.rightActions}>
          <motion.button whileTap={{ scale: 0.9 }} className={styles.simpleIconBtn}><Share2 className="w-6 h-6" /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={styles.simpleIconBtn}><Bookmark className="w-6 h-6" /></motion.button>
        </div>
      </div>
    </motion.div>
  );
};
