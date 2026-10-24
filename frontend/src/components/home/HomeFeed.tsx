import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  UserCheck,
  ExternalLink,
  Clock,
  Plus,
  Trophy,
  Send,
  Play,
  Share2,
  Trash2,
  Bell
} from 'lucide-react';
import { Post, Comment, User } from '../../types';
import { YoutubeIcon } from '../icons/YoutubeIcon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserProfileModal } from '../profile/UserProfileModal';
import { SharePostModal } from './SharePostModal';

const extractYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

interface HomeFeedProps {
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [pendingReqUsers, setPendingReqUsers] = useState<Record<string, boolean>>({});

  const fetchPosts = async () => {
    try {
      const res = await authFetch('/api/posts');
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handleToggleStudymate = async (targetUserId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const post = posts.find((p) => p.user_id === targetUserId);
    if (post?.is_studymate || pendingReqUsers[targetUserId]) {
      setSelectedProfileUserId(targetUserId);
      return;
    }
    try {
      const res = await authFetch('/api/studymates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.status === 'accepted') {
          setPosts((prev) =>
            prev.map((p) =>
              p.user_id === targetUserId ? { ...p, is_studymate: true } : p
            )
          );
        } else {
          setPendingReqUsers((prev) => ({ ...prev, [targetUserId]: true }));
        }
      }
    } catch (err) {
      console.error('Studymate request failed:', err);
    }
  };

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      setDeletingPostId(postId);
      const res = await authFetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(data.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await authFetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_liked: data.liked, likes_count: data.likes_count } : p
          )
        );
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await authFetch(`/api/posts/${postId}/repost`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, reposts_count: data.reposts_count } : p
          )
        );
      }
    } catch (err) {
      console.error('Repost failed:', err);
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await authFetch(`/api/posts/${postId}/comments`);
        const data = await res.json();
        if (data.success) {
          setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newCommentText.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await authFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newCommentText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
          )
        );
        setNewCommentText('');
        setCommentError(null);
      } else {
        setCommentError(data.error || 'Failed to add reply');
      }
    } catch (err) {
      console.error('Add comment failed:', err);
      setCommentError('Network error while posting reply');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const ts = parseFloat(timestamp) * 1000;
    if (isNaN(ts)) return 'Just now';
    const diffHours = Math.floor((Date.now() - ts) / (1000 * 3600));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60)));
      return `${diffMins}m`;
    }
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full min-h-screen lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] flex flex-col bg-[var(--x-bg)] text-[var(--x-text)] transition-colors duration-200">
      {/* ── FULL-WIDTH VIEWPORT HEADER (BORDERLESS, SLEEK & CLEAN) ── */}
      <header className="w-full sticky top-0 z-40 bg-[var(--x-bg)]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        {/* Top Left: Sleek & Stylish Home in Times New Roman */}
        <div className="flex items-center">
          <h1
            className="text-3xl sm:text-4xl font-light tracking-wide text-[var(--x-text)] select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Home
          </h1>
        </div>

        {/* Top Right of Viewport: Notifications & Post Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user && (
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  window.dispatchEvent(new CustomEvent('open-notifications'));
                }
              }}
              title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Notifications` : 'Notifications'}
              className="relative p-2 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-all cursor-pointer flex items-center justify-center border border-[var(--x-border)] active:scale-95"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0A84FF] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[var(--x-bg)]">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                window.dispatchEvent(new CustomEvent('open-create-post'));
              }
            }}
            className="x-btn-accent text-xs sm:text-sm px-5 py-2 font-bold cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Post</span>
          </button>
        </div>
      </header>

      {/* ── CENTRAL POST TIMELINE CONTAINER ── */}
      <div className="w-full flex justify-center flex-1">
        <main className="w-full max-w-[650px] min-h-screen flex flex-col pb-28 lg:pb-12">
          {/* Tabs: For you / Studymates */}
          <div className="sticky top-[57px] z-30 bg-[var(--x-header-bg)] backdrop-blur-md border-b border-[var(--x-border)] grid grid-cols-2">
            <button
              onClick={() => setFeedTab('forYou')}
              className={`py-3.5 text-sm font-bold flex flex-col items-center justify-center relative hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer ${
                feedTab === 'forYou' ? 'text-[var(--x-text)]' : 'text-[var(--x-subtext)]'
              }`}
            >
              <span>For you</span>
              {feedTab === 'forYou' && (
                <div className="absolute bottom-0 h-1 w-14 bg-[var(--x-accent)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setFeedTab('following')}
              className={`py-3.5 text-sm font-bold flex flex-col items-center justify-center relative hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer ${
                feedTab === 'following' ? 'text-[var(--x-text)]' : 'text-[var(--x-subtext)]'
              }`}
            >
              <span>Studymates</span>
              {feedTab === 'following' && (
                <div className="absolute bottom-0 h-1 w-16 bg-[var(--x-accent)] rounded-full" />
              )}
            </button>
          </div>

          {/* ── FEED POSTS STREAM (CONTINUOUS X TIMELINE) ── */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-[var(--x-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--x-subtext)] font-medium">Loading timeline...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 px-4">
              <p className="text-[var(--x-text)] text-base font-bold">No posts yet</p>
              <p className="text-[var(--x-subtext)] text-sm mt-1">Be the first to share an academic insight or problem discussion!</p>
            </div>
          ) : (
            posts
              .filter((p) => feedTab === 'forYou' || p.is_studymate || p.is_self)
              .map((post) => {
                const isLong = post.content && post.content.length > 200;
                const isExpanded = expandedPosts[post.id];

                const detectedVideoId = extractYouTubeVideoId(post.youtube_url) || extractYouTubeVideoId(post.content);
                const effectiveImageUrl = post.image_url || (detectedVideoId ? `https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg` : null);
                const effectiveYoutubeUrl = post.youtube_url || (detectedVideoId ? `https://www.youtube.com/watch?v=${detectedVideoId}` : null);

                return (
                  <article
                    key={post.id}
                    className="p-4 sm:p-5 border-b border-[var(--x-border)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer flex gap-3 sm:gap-3.5"
                  >
                    {/* Left Avatar */}
                    <img
                      src={post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_name}`}
                      alt={post.user_name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfileUserId(post.user_id);
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--x-surface)] object-cover flex-shrink-0 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500/40 transition-all"
                    />

                    {/* Right Tweet Content & Actions */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row: Name, Handle, Timestamp, Connect Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileUserId(post.user_id);
                            }}
                            className="font-bold text-[15px] text-[var(--x-text)] truncate hover:underline cursor-pointer"
                          >
                            {post.user_name}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileUserId(post.user_id);
                            }}
                            className="text-[14px] text-[var(--x-subtext)] truncate hover:underline cursor-pointer"
                          >
                            {post.user_handle}
                          </span>
                          <span className="text-[14px] text-[var(--x-subtext)]">·</span>
                          <span className="text-[14px] text-[var(--x-subtext)] hover:underline cursor-pointer whitespace-nowrap">
                            {formatDate(post.created_at)}
                          </span>
                        </div>

                        {/* X-style Pill Connect Button */}
                        {!post.is_self && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStudymate(post.user_id);
                            }}
                            className={
                              post.is_studymate
                                ? 'x-btn-secondary text-xs px-3 py-1 flex items-center gap-1 text-emerald-400 border-emerald-500/40 cursor-pointer'
                                : pendingReqUsers[post.user_id]
                                ? 'x-btn-secondary text-xs px-3 py-1 flex items-center gap-1 text-amber-400 border-amber-500/40 cursor-pointer'
                                : 'x-btn-primary text-xs px-3.5 py-1 flex items-center gap-1 cursor-pointer'
                            }
                          >
                            {post.is_studymate ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Studymate</span>
                              </>
                            ) : pendingReqUsers[post.user_id] ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span>Requested</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Connect</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Button for Author or Faculty */}
                        {(post.is_self || post.user_id === user?.id || user?.role === 'university') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            disabled={deletingPostId === post.id}
                            title="Delete this post"
                            className="p-1.5 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer select-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Body Content */}
                      <div className="text-[15px] text-[var(--x-text)] leading-[1.38] mt-1.5 whitespace-pre-line break-words">
                        {isLong && !isExpanded ? (
                          <>
                            <span>{post.content.slice(0, 200).trim()}... </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPosts((prev) => ({ ...prev, [post.id]: true }));
                              }}
                              className="text-[var(--x-accent)] hover:underline cursor-pointer font-medium text-[14px]"
                            >
                              Show more
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{post.content}</span>
                            {isLong && (
                              <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPosts((prev) => ({ ...prev, [post.id]: false }));
                              }}
                              className="text-[var(--x-accent)] hover:underline ml-2 cursor-pointer font-medium text-[13px]"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Hashtags */}
                    {post.tags && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                        {post.tags.split(',').map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[var(--x-accent)] hover:underline cursor-pointer text-[14px] font-medium"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Curator Recommendation Box */}
                    {post.why_recommend && (
                      <div className="mt-3 p-3 rounded-2xl bg-[var(--x-surface)] border border-[var(--x-border)] text-[13px] text-[var(--x-text-secondary)]">
                        <span className="text-[10px] font-bold tracking-wider text-[var(--x-accent)] uppercase block mb-0.5">
                          Curator's Note
                        </span>
                        <p className="italic leading-snug">
                          "{post.why_recommend}"
                        </p>
                      </div>
                    )}

                    {/* Media Attachment Card */}
                    {(effectiveImageUrl || effectiveYoutubeUrl) && (
                      <div className="mt-3.5 rounded-2xl overflow-hidden bg-[var(--x-surface)] border border-[var(--x-border)] w-full">
                        <div className="relative w-full aspect-video sm:max-h-[380px] overflow-hidden group/media flex items-center justify-center bg-black/20">
                          {effectiveImageUrl ? (
                            <img
                              src={effectiveImageUrl}
                              alt={post.title || 'Post attachment'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-105"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (target.src.includes('maxresdefault.jpg')) {
                                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                } else if (target.src.includes('hqdefault.jpg')) {
                                  target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--x-surface)] text-[var(--x-subtext)]">
                              <YoutubeIcon className="w-16 h-16 text-red-500/80" />
                            </div>
                          )}

                          {effectiveYoutubeUrl && (
                            <a
                              href={effectiveYoutubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 flex items-center justify-center media-scrim transition-colors"
                            >
                              <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/media:scale-110 transition-transform btn-keep-white">
                                <Play className="w-6 h-6 fill-current translate-x-0.5" />
                              </div>
                            </a>
                          )}

                          {(post.post_type === 'youtube_course' || effectiveYoutubeUrl) && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg video-badge backdrop-blur-sm text-[10px] font-bold uppercase flex items-center gap-1.5 shadow pointer-events-none">
                              <YoutubeIcon className="w-3.5 h-3.5 text-[#FF3B30]" />
                              <span>YouTube Video</span>
                            </div>
                          )}
                          {post.post_type === 'hackathon' && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-bold uppercase flex items-center gap-1 shadow pointer-events-none">
                              <Trophy className="w-3 h-3" />
                              <span>Contest</span>
                            </div>
                          )}
                        </div>

                        {(post.title || post.course_url || effectiveYoutubeUrl) && (
                          <div className="p-3 bg-[var(--x-surface)] border-t border-[var(--x-border)] flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {post.title && (
                                <p className="text-sm font-bold text-[var(--x-text)] truncate">{post.title}</p>
                              )}
                              <span className="text-[12px] text-[var(--x-subtext)] truncate block">
                                {effectiveYoutubeUrl || post.course_url || 'koinexa.edu'}
                              </span>
                            </div>
                            {effectiveYoutubeUrl && (
                              <a
                                href={effectiveYoutubeUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="x-btn-primary text-xs px-3.5 py-1.5"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Watch</span>
                              </a>
                            )}
                            {post.course_url && !effectiveYoutubeUrl && (
                              <a
                                href={post.course_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="x-btn-secondary text-xs px-3.5 py-1.5"
                              >
                                <span>Visit</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── X ACTION ICONS ROW (Reply, Repost, Like, Share) ── */}
                    <div className="flex items-center justify-between max-w-md mt-3.5 text-[var(--x-subtext)] text-xs select-none">
                      {/* 1. Comment */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComments(post.id);
                        }}
                        className={`flex items-center gap-1 group cursor-pointer ${
                          activeCommentsPostId === post.id ? 'text-[var(--x-accent)]' : 'hover:text-[var(--x-accent)]'
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-[var(--x-accent-light)] transition-colors">
                          <MessageCircle className="w-[17px] h-[17px]" />
                        </div>
                        <span className="text-[13px]">{post.comments_count > 0 ? post.comments_count : ''}</span>
                      </button>

                      {/* 2. Repost */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRepost(post.id);
                        }}
                        className="flex items-center gap-1 group cursor-pointer hover:text-[#00ba7c]"
                      >
                        <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                          <Repeat2 className="w-[17px] h-[17px]" />
                        </div>
                        <span className="text-[13px]">{post.reposts_count > 0 ? post.reposts_count : ''}</span>
                      </button>

                      {/* 3. Like */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        className={`flex items-center gap-1 group cursor-pointer ${
                          post.is_liked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                          <Heart className={`w-[17px] h-[17px] ${post.is_liked ? 'fill-[#f91880]' : ''}`} />
                        </div>
                        <span className="text-[13px]">{post.likes_count > 0 ? post.likes_count : ''}</span>
                      </button>

                      {/* 4. Share */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            openAuthModal('login');
                            return;
                          }
                          setShareModalPost(post);
                        }}
                        title="Share Post to Chats"
                        className="flex items-center gap-1 group cursor-pointer hover:text-emerald-500"
                      >
                        <div className="p-2 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                          <Share2 className="w-[17px] h-[17px]" />
                        </div>
                      </button>

                      {/* 5. Delete (Author or Faculty) */}
                      {(post.is_self || post.user_id === user?.id || user?.role === 'university') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          disabled={deletingPostId === post.id}
                          title="Delete Post"
                          className="flex items-center gap-1 group cursor-pointer hover:text-rose-500"
                        >
                          <div className="p-2 rounded-full group-hover:bg-rose-500/10 transition-colors">
                            <Trash2 className="w-[17px] h-[17px]" />
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Inline Replies Thread */}
                    <AnimatePresence>
                      {activeCommentsPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-[var(--x-border)] space-y-3 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {(commentsMap[post.id] || []).map((c) => (
                              <div key={c.id} className="flex gap-2.5 py-1.5">
                                <img
                                  src={c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_name}`}
                                  alt={c.user_name}
                                  className="w-7 h-7 rounded-full bg-[var(--x-surface)] flex-shrink-0 object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-bold text-[var(--x-text)] truncate">{c.user_name}</span>
                                    <span className="text-[var(--x-subtext)] text-[12px]">· {formatDate(c.created_at)}</span>
                                  </div>
                                  <p className="text-[13.5px] text-[var(--x-text)] mt-0.5 leading-relaxed break-words">{c.comment_text}</p>
                                </div>
                              </div>
                            ))}
                            {(!commentsMap[post.id] || commentsMap[post.id].length === 0) && (
                              <div className="py-2 text-xs text-[var(--x-subtext)]">
                                No replies yet. Be the first to reply!
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="Post your reply"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                              className="flex-1 px-4 py-2 rounded-full bg-[var(--x-surface)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[var(--x-accent)]"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={isSubmittingComment || !newCommentText.trim()}
                              className="x-btn-accent text-xs px-4 py-2 disabled:opacity-40"
                            >
                              <Send className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                          {commentError && (
                            <p className="text-[11px] text-rose-500 font-medium px-2 pt-1">
                              {commentError}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
      </div>

      {/* User Profile Inspector Modal */}
      <UserProfileModal
        userId={selectedProfileUserId}
        isOpen={!!selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
        onStartDirectChat={(targetUser: User) => {
          window.dispatchEvent(new CustomEvent('open-direct-chat', { detail: targetUser }));
          window.location.hash = '#/communities';
        }}
      />

      {/* Share Post to Chats Modal */}
      <SharePostModal
        post={shareModalPost}
        isOpen={!!shareModalPost}
        onClose={() => setShareModalPost(null)}
        onShareSuccess={() => {
          if (shareModalPost) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === shareModalPost.id ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p
              )
            );
          }
        }}
      />
    </div>
  );
};

