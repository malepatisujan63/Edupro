import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Clock, BookOpen, Star } from 'lucide-react';
import styles from './FeedFilters.module.css';

interface FeedFiltersProps {
  onFilterChange: (filter: string) => void;
}

const FILTERS = [
  { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
  { id: 'latest', label: 'Latest', icon: <Clock className="w-4 h-4" /> },
  { id: 'academic', label: 'Academic', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
  { id: 'foryou', label: 'For You', icon: <Sparkles className="w-4 h-4" /> },
];

export const FeedFilters: React.FC<FeedFiltersProps> = ({ onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState('foryou');

  const handleSelect = (id: string) => {
    setActiveFilter(id);
    onFilterChange(id);
  };

  return (
    <div className={styles.container}>
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => handleSelect(filter.id)}
          className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.activeText : ''}`}
        >
          {activeFilter === filter.id && (
            <motion.div
              layoutId="activeFilterBg"
              className={styles.activeBg}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={styles.icon}>{filter.icon}</span>
          <span className={styles.label}>{filter.label}</span>
        </button>
      ))}
    </div>
  );
};
