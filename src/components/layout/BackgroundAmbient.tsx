import React from 'react';
import { motion } from 'framer-motion';
import styles from './BackgroundAmbient.module.css';

export const BackgroundAmbient: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Deep space background */}
      <div className={styles.baseBg} />
      
      {/* Noise Texture for premium feel */}
      <div className={styles.noise} />
      
      {/* Floating Animated Orbs */}
      <motion.div 
        className={styles.orb1}
        animate={{ 
          x: [0, 50, 0], 
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        className={styles.orb2}
        animate={{ 
          x: [0, -40, 0], 
          y: [0, 40, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div 
        className={styles.orb3}
        animate={{ 
          x: [0, 30, -20, 0], 
          y: [0, 20, -10, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
