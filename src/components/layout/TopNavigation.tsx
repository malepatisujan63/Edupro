import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus } from 'lucide-react';
import styles from './TopNavigation.module.css';

interface TopNavigationProps {
  currentUser: any;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (val: boolean) => void;
  setIsCreatePostOpen: (val: boolean) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentUser,
  isNotificationsOpen,
  setIsNotificationsOpen,
  setIsCreatePostOpen,
}) => {
  if (!currentUser) return null;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className={styles.capsule}>
        <motion.button
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className={`${styles.navButton} ${isNotificationsOpen ? styles.active : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-4 h-4 text-[#9B5DE5]" />
          <span className="hidden sm:inline">Notifications</span>
          
          <AnimatePresence>
            {!isNotificationsOpen && (
              <motion.span 
                className={styles.notificationDot}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={() => setIsCreatePostOpen(true)}
          className={styles.postButton}
          whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span>Post</span>
          <div className={styles.postButtonGlow} />
        </motion.button>
      </div>
    </motion.div>
  );
};
