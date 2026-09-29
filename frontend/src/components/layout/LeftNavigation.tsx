import React from 'react';
import {
  Home,
  GraduationCap,
  Trophy,
  MessageSquare,
  Search,
  User,
  Bell,
  Plus,
  ShieldCheck,
  Sun,
  Moon,
  LucideIcon
} from 'lucide-react';
import { NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
  onOpenNotifications,
  onOpenCreatePost,
  unreadNotificationsCount = 0,
}) => {
  const { user, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col justify-between py-6 select-none bg-[var(--x-bg)]/85 backdrop-blur-md border-r border-[var(--x-border)] shadow-none w-[68px] xl:w-[76px] 2xl:w-[84px] transition-colors duration-200">
        {/* Top Spacer / Theme Toggle */}
        <div className="flex flex-col items-center">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-10 h-10 2xl:w-11 2xl:h-11 flex items-center justify-center text-neutral-400 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400 transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 2xl:w-5.5 2xl:h-5.5 transition-transform hover:rotate-45" strokeWidth={1.75} />
            ) : (
              <Moon className="w-5 h-5 2xl:w-5.5 2xl:h-5.5 text-slate-700 dark:text-slate-300 transition-transform hover:-rotate-12" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Middle Navigation Icons */}
        <nav className="flex-1 flex flex-col justify-center items-center gap-2 2xl:gap-3">
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
                className={`w-10 h-10 2xl:w-11 2xl:h-11 flex items-center justify-center transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent ${
                  isActive
                    ? 'text-[#0A84FF] dark:text-[#38a6ff]'
                    : 'text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white'
                }`}
              >
                <Icon
                  className="w-5 h-5 2xl:w-[22px] 2xl:h-[22px] transition-colors duration-200"
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
              </button>
            );
          })}

          {/* Create Post Plus Button */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else if (onOpenCreatePost) {
                onOpenCreatePost();
              }
            }}
            title="Create Post"
            className="w-10 h-10 2xl:w-11 2xl:h-11 rounded-full flex items-center justify-center bg-[var(--x-accent)] text-black hover:bg-[var(--x-accent-hover)] shadow-md hover:shadow-cyan-500/25 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none mt-2"
          >
            <Plus className="w-5 h-5 2xl:w-5.5 2xl:h-5.5 stroke-[2.4]" strokeWidth={2.4} />
          </button>
        </nav>

        {/* Bottom Notification Bell */}
        {user && onOpenNotifications ? (
          <div className="flex flex-col justify-center items-center">
            <button
              onClick={onOpenNotifications}
              title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Notifications` : 'Notifications'}
              className="relative w-10 h-10 2xl:w-11 2xl:h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent"
            >
              <Bell className="w-5 h-5 2xl:w-5.5 2xl:h-5.5" strokeWidth={1.75} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0A84FF] ring-2 ring-[var(--x-bg)]" />
              )}
            </button>
          </div>
        ) : (
          <div className="h-2" />
        )}
      </aside>

      {/* ── MOBILE & TABLET PORTRAIT NAVIGATION (BOTTOM FIXED BAR: < lg) ── */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 pb-[env(safe-area-inset-bottom)] bg-[var(--x-bg)]/90 backdrop-blur-2xl border-t border-[var(--x-border)] flex-row items-center justify-between sm:justify-around px-2 sm:px-6 select-none overflow-x-auto no-scrollbar transition-colors duration-200">
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
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent ${
                isActive
                  ? 'text-[#0A84FF] dark:text-[#38a6ff]'
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

        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-neutral-400 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400 active:scale-90 transition-all duration-200 ease-out cursor-pointer select-none bg-transparent"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" strokeWidth={1.75} />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
          )}
        </button>

        {/* Mobile Create Post Plus Button */}
        <button
          onClick={() => {
            if (!user) {
              openAuthModal('login');
            } else if (onOpenCreatePost) {
              onOpenCreatePost();
            }
          }}
          title="Create Post"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--x-accent)] text-black hover:bg-[var(--x-accent-hover)] active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none"
        >
          <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.4]" strokeWidth={2.4} />
        </button>

        {/* Mobile Notification Bell */}
        {user && onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Notifications` : 'Notifications'}
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-all duration-200 ease-out cursor-pointer select-none active:scale-90 bg-transparent"
          >
            <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={1.75} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0A84FF] ring-2 ring-[var(--x-bg)]" />
            )}
          </button>
        )}
      </nav>
    </>
  );
};
