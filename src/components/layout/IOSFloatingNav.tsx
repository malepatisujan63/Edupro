import React, { useState } from 'react';
import {
  Home,
  Play,
  Share2,
  Search,
  User,
  MessageSquare,
  HelpCircle,
  Bell,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalPlatformTrie, type TrieItem } from '../../dsa-engine';

export type NavTab = 'home' | 'communities' | 'qna' | 'messaging' | 'resources' | 'profile';

interface IOSFloatingNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab, profileId?: string | null) => void;
  onOpenAuth?: () => void;
  onOpenDSAHUD?: () => void;
  onOpenTimer?: () => void;
  onOpenCodeSandbox?: () => void;
  onOpenAIBuddy?: () => void;
  currentUser: { name: string; avatarUrl?: string } | null;
  isNotificationsOpen?: boolean;
  setIsNotificationsOpen?: (val: boolean) => void;
  setIsCreatePostOpen?: (val: boolean) => void;
}

export const IOSFloatingNav: React.FC<IOSFloatingNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  isNotificationsOpen = false,
  setIsNotificationsOpen,
  setIsCreatePostOpen,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ results: TrieItem[]; latencyMs: number; pathString: string } | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 8) setIsVisible(false);
      else if (currentScrollY < lastScrollY.current - 8) setIsVisible(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim()) {
      const res = globalPlatformTrie.searchPrefix(q, 10);
      setSearchResults(res);
    } else {
      setSearchResults(null);
    }
  };


  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: boolean }> = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-5 h-5" /> },
    { id: 'resources', label: 'Notes & Videos', icon: <Play className="w-5 h-5 fill-current" /> },
    { id: 'communities', label: 'Study Hubs', icon: <Share2 className="w-5 h-5" /> },
    { id: 'qna', label: 'Doubt Q&A', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'messaging', label: 'Chat & Audio', icon: <MessageSquare className="w-5 h-5" />, badge: true },
  ];

  return (
    <>
      {/* Koinexa Logo — top-left */}
      <div className="fixed top-3 left-4 sm:left-6 z-40 pointer-events-auto flex items-center">
        <img
          src="/koinexa-banner.png"
          alt="Koinexa"
          className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Unified pill — bottom-center, hides on scroll-down */}
      {/* Outer div handles true centering; inner motion.div handles y scroll-slide only */}
      <div className="fixed bottom-0 left-1/2 z-50 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
        <div className="pointer-events-auto kx-nav-dock p-1.5 flex items-center gap-1 transition-all duration-300 shadow-2xl overflow-visible">

          {/* Main Tab Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  title={tab.label}
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#00CFFF] via-[#4169E1] to-[#9B5DE5] shadow-[0_0_20px_rgba(65,105,225,0.5)] text-white scale-110 font-bold'
                      : 'text-white/75 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  {tab.badge && !isActive && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#9B5DE5] animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bell — icon only */}
          {setIsNotificationsOpen && (
            <motion.button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all ${
                isNotificationsOpen ? 'bg-[#9B5DE5]/20 border border-[#9B5DE5]/40' : 'hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-4 h-4 text-[#9B5DE5]" />
              <AnimatePresence>
                {!isNotificationsOpen && (
                  <motion.span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00CFFF] shadow-[0_0_8px_rgba(0,207,255,0.8)]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search students"
            className="kx-pill-flow w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-white transition-all shrink-0 active:scale-95"
          >
            <Search className="w-4 h-4 text-[#00CFFF]" />
          </button>

          {/* + Post — icon only */}
          {setIsCreatePostOpen && (
            <motion.button
              onClick={() => setIsCreatePostOpen(true)}
              title="Create Post"
              className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #00CFFF 0%, #4169E1 50%, #9B5DE5 100%)', boxShadow: '0 4px 14px rgba(65,105,225,0.4)' }}
              whileHover={{ scale: 1.1, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                  animation: 'shine 3s infinite',
                }}
              />
            </motion.button>
          )}

          {/* Profile */}
          <button
            onClick={() => onSelectTab('profile')}
            title={`Profile: ${currentUser?.name || 'Student'}`}
            className={`kx-pill-flow relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 transition-all ${
              activeTab === 'profile' ? 'active' : ''
            }`}
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover border-2 border-white/30 shadow-sm" />
            ) : (
              <User className="w-5 h-5 text-[#00CFFF]" />
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-[#05050A] absolute -top-0.5 -right-0.5" />
          </button>

        </div>
        </motion.div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-xl rounded-[28px] overflow-hidden animate-scaleUp kx-card">

            <div className="kx-search-header p-4 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#00CFFF] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search student profiles (O(L) Trie)…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent text-white text-sm outline-none font-medium placeholder:text-white/35"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="kx-pill-flow px-3 py-1 text-white text-xs font-bold shrink-0"
              >
                ESC
              </button>
            </div>

            {searchResults && (
              <div className="px-4 py-2 bg-[#0D0D0D] border-b border-white/20 text-xs flex flex-wrap items-center justify-between gap-2 text-white">
                <div>
                  ⚡ <span className="font-bold text-[#00CFFF]">Trie Traversal Path:</span>{' '}
                  <code className="bg-[#111111] px-2 py-0.5 rounded-md text-[11px] font-mono text-white shadow-inner border border-white/20">{searchResults.pathString}</code>
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-[#34C759]">Latency: {searchResults.latencyMs} ms</span>
                  <span className="text-[#4169E1]">Found: {searchResults.results.length} profiles</span>
                </div>
              </div>
            )}

            <div className="max-h-[60vh] overflow-y-auto p-2.5 divide-y divide-white/10">
              {!searchQuery.trim() && (
                <div className="p-8 text-center text-white/60 text-sm">
                  <User className="w-10 h-10 text-[#00CFFF] mx-auto mb-2" />
                  <p className="font-bold text-white">Search Student Profiles</p>
                  <p className="text-xs mt-1 font-normal">
                    Instantly find classmates, seniors, and study partners using $O(L)$ Trie character paths.
                  </p>
                </div>
              )}

              {searchResults?.results.length === 0 && searchQuery.trim() && (
                <div className="p-6 text-center text-white text-sm font-medium">
                  No profile found matching "{searchQuery}".
                </div>
              )}

              {searchResults?.results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    if (item.type === 'user') onSelectTab('profile', item.id);
                    else if (item.type === 'question') onSelectTab('qna');
                    else if (item.type === 'group') onSelectTab('communities');
                    else onSelectTab('resources');
                  }}
                  className="p-3.5 hover:bg-[#0D0D0D] rounded-[20px] transition-all cursor-pointer flex items-center justify-between gap-3 group border border-transparent hover:border-white/20 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00CFFF]/15 border border-[#00CFFF]/30 flex items-center justify-center text-[#00CFFF] font-bold uppercase shadow-sm">
                        {item.title[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#00CFFF] transition-colors flex items-center gap-2">
                        {item.title}
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#111111] text-white border border-white/20">
                          {item.type}
                        </span>
                      </h4>
                      {item.subtitle && <p className="text-xs text-white/60 font-normal">{item.subtitle}</p>}
                    </div>
                  </div>

                  {item.tags && (
                    <div className="flex items-center gap-1">
                      {item.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#4169E1]/10 text-[#4169E1] border border-[#4169E1]/20 font-semibold">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
