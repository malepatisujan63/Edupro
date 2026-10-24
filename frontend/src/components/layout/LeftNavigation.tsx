import React, { useState, useEffect } from 'react';
import {
  Home,
  GraduationCap,
  Trophy,
  MessageSquare,
  Search,
  User,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';
import { NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface LeftNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onOpenNotifications?: () => void;
  onOpenCreatePost?: () => void;
  unreadNotificationsCount?: number;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: LucideIcon;
}

export const LeftNavigation: React.FC<LeftNavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
}) => {
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' ? !!document.fullscreenElement : false
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isFullscreen) {
    return null;
  }

  const profileLabel = user?.role === 'university' ? 'Faculty Profile' : 'Student Profile';

  const navItems: NavItemConfig[] = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'classroom', label: 'University Classroom', icon: GraduationCap },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'communities', label: 'Study Communities', icon: MessageSquare },
    { id: 'search', label: 'Universal Global Search (Ctrl+K)', icon: Search },
    { id: 'profile', label: profileLabel, icon: User },
    ...(user?.role === 'admin' ? [{ id: 'admin' as NavTab, label: 'Veritas-AI Admin Console', icon: ShieldCheck }] : []),
  ];

  const handleClick = (tab: NavTab) => {
    if (tab === 'search') {
      onOpenSearch();
    } else {
      onSelectTab(tab);
    }
  };

  return (
    <>
      {/* ── DESKTOP / LAPTOP / TV / MONITOR NAVIGATION (LEFT FIXED SIDEBAR: lg, xl, 2xl) ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col justify-center py-6 select-none bg-[var(--x-bg)]/85 backdrop-blur-md border-r border-[var(--x-border)] shadow-none w-[68px] xl:w-[76px] 2xl:w-[84px] transition-colors duration-200">
        {/* Navigation Icons Centered Vertically */}
        <nav className="flex flex-col justify-center items-center gap-3.5 2xl:gap-4">
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'challenges' && (activeTab === 'contests' || activeTab === 'codelab'));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                title={item.label}
                className={`w-10 h-10 2xl:w-11 2xl:h-11 flex items-center justify-center transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent rounded-2xl ${
                  isActive
                    ? 'text-[#0A84FF] dark:text-[#38a6ff] bg-blue-500/10'
                    : 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white hover:bg-[var(--x-surface-hover)]'
                }`}
              >
                <Icon
                  className="w-5 h-5 2xl:w-[22px] 2xl:h-[22px] transition-colors duration-200"
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE & TABLET PORTRAIT NAVIGATION (BOTTOM FIXED BAR: < lg) ── */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 pb-[env(safe-area-inset-bottom)] bg-[var(--x-bg)]/90 backdrop-blur-2xl border-t border-[var(--x-border)] flex-row items-center justify-around px-2 sm:px-6 select-none overflow-x-auto no-scrollbar transition-colors duration-200">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'challenges' && (activeTab === 'contests' || activeTab === 'codelab'));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              title={item.label}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent rounded-xl ${
                isActive
                  ? 'text-[#0A84FF] dark:text-[#38a6ff] bg-blue-500/10'
                  : 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
              }`}
            >
              <Icon
                className="w-5 h-5 sm:w-5 sm:h-5 transition-colors duration-150"
                strokeWidth={isActive ? 2.2 : 1.75}
              />
            </button>
          );
        })}
      </nav>
    </>
  );
};
