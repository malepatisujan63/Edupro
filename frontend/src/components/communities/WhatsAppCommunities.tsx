import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Hash,
  Send,
  Code2,
  CheckCheck,
  Terminal as TerminalIcon,
  ShieldCheck,
  ChevronLeft,
  ArrowLeft,
  ChevronRight,
  Search,
  Plus,
  UserCheck,
  ExternalLink,
  Play,
  Heart,
  Repeat2,
  Share2,
  Copy,
  Check,
  CornerDownRight,
  X,
  Sparkles,
  Info,
  Smile,
  ChevronDown,
  ChevronUp,
  Flame,
  ThumbsUp,
  Lightbulb,
  FileCode,
  BookOpen,
  Trophy,
  Filter,
  Clock
} from 'lucide-react';
import { Community, Channel, ChatMessage, DirectMessage, StudyMate, Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CreateCommunityModal } from './CreateCommunityModal';
import { AddChannelModal } from './AddChannelModal';
import { validateTextInput } from '../../utils/inputValidator';
import { FlowingBorderGlow } from '../common/FlowingBorderGlow';

// ── AUTHENTIC WHATSAPP CHAT DOODLE BACKGROUND PATTERN ──
const WhatsAppDoodlePattern: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] dark:opacity-[0.025] text-neutral-900 dark:text-neutral-100 select-none"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
  >
    <defs>
      <pattern id="wa-doodles" width="160" height="160" patternUnits="userSpaceOnUse">
        {/* Chat bubble */}
        <path
          d="M 20 20 C 12 20 6 26 6 34 C 6 42 12 48 20 48 L 22 48 L 22 54 L 28 48 L 32 48 C 40 48 46 42 46 34 C 46 26 40 20 32 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="34" r="1.5" fill="currentColor" />
        <circle cx="26" cy="34" r="1.5" fill="currentColor" />
        <circle cx="34" cy="34" r="1.5" fill="currentColor" />

        {/* Coffee cup */}
        <path
          d="M 75 25 L 95 25 L 92 45 C 92 48 88 51 84 51 L 82 51 C 78 51 74 48 74 45 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M 94 28 C 98 28 100 30 100 34 C 100 38 97 40 93 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M 80 18 Q 82 14 80 10" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 86 18 Q 88 14 86 10" fill="none" stroke="currentColor" strokeWidth="1.2" />

        {/* Paper Plane */}
        <path
          d="M 125 20 L 150 28 L 132 45 L 128 35 L 125 20 Z M 132 45 L 130 33 L 146 29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Star */}
        <path
          d="M 28 90 L 31 97 L 38 98 L 33 103 L 34 110 L 28 106 L 22 110 L 23 103 L 18 98 L 25 97 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        {/* Headphones */}
        <path
          d="M 75 95 A 12 12 0 0 1 99 95 L 99 104 C 99 106 97 108 95 108 L 94 108 C 92 108 91 106 91 104 L 91 98 M 75 95 L 75 104 C 75 106 77 108 79 108 L 80 108 C 82 108 83 106 83 104 L 83 98"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Code brackets */}
        <path
          d="M 130 85 L 124 92 L 130 99 M 142 85 L 148 92 L 142 99 M 138 83 L 134 101"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Heart */}
        <path
          d="M 25 138 C 22 133 16 133 16 139 C 16 146 25 152 25 152 C 25 152 34 146 34 139 C 34 133 28 133 25 138 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Clock */}
        <circle cx="85" cy="140" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 85 134 L 85 140 L 89 142" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

        {/* Lightbulb */}
        <path
          d="M 135 132 C 131 132 128 135 128 139 C 128 142 130 144 132 146 L 132 148 L 138 148 L 138 146 C 140 144 142 142 142 139 C 142 135 139 132 135 132 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M 133 150 L 137 150" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wa-doodles)" />
  </svg>
);

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '💡', '👏', '🎯'];

export const WhatsAppCommunities: React.FC = () => {
  const { user, authFetch, openAuthModal } = useAuth();
  const { theme } = useTheme();

  // Navigation sub-tab: 'rooms' (Community channels) or 'studymates' (1-on-1 DMs)
  const [activeSubTab, setActiveSubTab] = useState<'rooms' | 'studymates'>('rooms');

  // Filter chips in sidebar
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<string>('all');

  // Community discussion state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>([]);

  // 1-on-1 Study Mate DMs state
  const [studyMates, setStudyMates] = useState<StudyMate[]>([]);
  const [selectedMate, setSelectedMate] = useState<StudyMate | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  // Right Details Info Panel (X-style profile/room sidebar)
  const [showDetailsPane, setShowDetailsPane] = useState(false);

  // Composer & UI state
  const [textInput, setTextInput] = useState('');
  const [codeSnippetInput, setCodeSnippetInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive micro-actions
  const [replyingTo, setReplyingTo] = useState<{ sender: string; text: string } | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);

  // 5-Second Message Stay Period & Flow Glow Timer
  const sendTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    };
  }, []);

  // Load communities
  const fetchCommunities = async () => {
    try {
      const res = await authFetch('/api/communities');
      const data = await res.json();
      if (data.success && data.communities) {
        setCommunities(data.communities);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    }
  };

  // Load study mates
  const fetchStudyMates = async () => {
    try {
      const res = await authFetch('/api/studymates/list');
      const data = await res.json();
      if (data.success && data.studymates) {
        setStudyMates(data.studymates);
      }
    } catch (err) {
      console.error('Failed to fetch study mates:', err);
    }
  };

  // Load channel messages
  const fetchChannelMessages = async (commId: string, chanId: string) => {
    try {
      const res = await authFetch(`/api/communities/${commId}/channels/${chanId}/messages`);
      const data = await res.json();
      if (data.success && data.messages) {
        setCommunityMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch channel messages:', err);
    }
  };

  // Load direct messages
  const fetchDirectMessages = async (mateId: string) => {
    try {
      const res = await authFetch(`/api/direct-messages/${mateId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setDirectMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch direct messages:', err);
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchStudyMates();
  }, [user]);

  // Listen for 'open-direct-chat' event from Profile Modal or elsewhere
  useEffect(() => {
    const handleOpenDirectChat = (e: any) => {
      if (e.detail) {
        setActiveSubTab('studymates');
        setSelectedMate(e.detail);
        setShowMobileChat(true);
        fetchDirectMessages(e.detail.id);
      }
    };
    window.addEventListener('open-direct-chat', handleOpenDirectChat);
    return () => window.removeEventListener('open-direct-chat', handleOpenDirectChat);
  }, []);

  // Poll channel messages
  useEffect(() => {
    if (activeSubTab === 'rooms' && selectedCommunity && selectedChannel) {
      fetchChannelMessages(selectedCommunity.id, selectedChannel.id);
      const interval = setInterval(() => {
        fetchChannelMessages(selectedCommunity.id, selectedChannel.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, selectedCommunity, selectedChannel]);

  // Poll direct messages
  useEffect(() => {
    if (activeSubTab === 'studymates' && selectedMate) {
      fetchDirectMessages(selectedMate.id);
      const interval = setInterval(() => {
        fetchDirectMessages(selectedMate.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab, selectedMate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communityMessages, directMessages, activeSubTab]);

  const handleCopyText = (msgId: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    }
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const existing = prev[msgId] || [];
      const updated = existing.includes(emoji)
        ? existing.filter((e) => e !== emoji)
        : [...existing, emoji];
      return { ...prev, [msgId]: updated };
    });
  };

  const handleStartReply = (sender: string, text: string) => {
    setReplyingTo({ sender, text });
    composerInputRef.current?.focus();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isSending) return;
    if (!textInput.trim() && !codeSnippetInput.trim()) return;

    if (textInput.trim()) {
      const val = validateTextInput(textInput.trim());
      if (!val.isValid) {
        setSendError(val.error || 'Invalid message content');
        return;
      }
    }

    setSendError(null);

    // If replying, embed quote context
    let finalText = textInput.trim();
    if (replyingTo) {
      finalText = `[Replying to ${replyingTo.sender}: "${replyingTo.text.slice(0, 55)}..."]\n${finalText}`;
    }
    const finalSnippet = codeSnippetInput.trim() || undefined;

    // ── THE MESSAGE STAYS IN THE INPUT BAR FOR 5 SECONDS WITH THE FLOW GLOW ──
    setIsSending(true);

    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    sendTimerRef.current = setTimeout(async () => {
      try {
        if (activeSubTab === 'rooms') {
          if (!selectedCommunity || !selectedChannel) return;
          const res = await authFetch(
            `/api/communities/${selectedCommunity.id}/channels/${selectedChannel.id}/messages`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: finalText,
                code_snippet: finalSnippet,
              }),
            }
          );
          const data = await res.json();
          if (data.success && data.message) {
            setCommunityMessages((prev) => [...prev, data.message]);
            setTextInput('');
            setCodeSnippetInput('');
            setShowCodeInput(false);
            setReplyingTo(null);
          } else {
            setSendError(data.error || 'Failed to post message');
          }
        } else {
          if (!selectedMate) return;
          const res = await authFetch(`/api/direct-messages/${selectedMate.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: finalText,
              code_snippet: finalSnippet,
            }),
          });
          const data = await res.json();
          if (data.success && data.message) {
            setDirectMessages((prev) => [...prev, data.message]);
            setTextInput('');
            setCodeSnippetInput('');
            setShowCodeInput(false);
            setReplyingTo(null);
          } else {
            setSendError(data.error || 'Failed to send direct message');
          }
        }
      } catch (err) {
        console.error('Send message failed:', err);
        setSendError('Network error while sending message');
      } finally {
        setIsSending(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }, 5000);
  };

  const categories = ['all', ...Array.from(new Set(communities.map((c) => c.category)))];

  const filteredCommunities = communities.filter((c) => {
    if (roomCategoryFilter !== 'all' && c.category !== roomCategoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.channels?.some((ch) => ch.name.toLowerCase().includes(q))
    );
  });

  const filteredMates = studyMates.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.handle.toLowerCase().includes(q) ||
      m.college?.toLowerCase().includes(q)
    );
  });

  // ── X-STYLE EMBEDDED SHARED POST CARD (RENDERED INSIDE WHATSAPP BUBBLE) ──
  const renderSharedPostCard = (sharedPost?: Post) => {
    if (!sharedPost) return null;
    return (
      <div className="my-2 rounded-2xl bg-black/5 dark:bg-black/40 border border-emerald-500/25 dark:border-emerald-500/35 overflow-hidden text-left max-w-sm transition-all hover:border-emerald-500/50 shadow-xs">
        {/* Author Header Row (X Quoted Tweet Header) */}
        <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={sharedPost.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sharedPost.user_name}`}
              alt={sharedPost.user_name}
              className="w-5 h-5 rounded-full object-cover bg-neutral-200"
            />
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {sharedPost.user_name}
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {sharedPost.user_handle}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-bold uppercase tracking-wider flex-shrink-0">
            Shared Post
          </span>
        </div>

        {/* Media Thumbnail with Video Badge */}
        {sharedPost.image_url && (
          <div className="relative w-full aspect-video max-h-36 overflow-hidden bg-black/25 group/thumb">
            <img
              src={sharedPost.image_url}
              alt={sharedPost.title || 'Shared media'}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
            />
            {sharedPost.youtube_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post Body Snippet */}
        <div className="p-3 space-y-1.5">
          {sharedPost.title && (
            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 tracking-tight">
              {sharedPost.title}
            </p>
          )}
          <p className="text-[11.5px] text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed">
            {sharedPost.content}
          </p>

          {sharedPost.why_recommend && (
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border-l-2 border-emerald-500 text-[10.5px] italic text-emerald-800 dark:text-emerald-300">
              "{sharedPost.why_recommend}"
            </div>
          )}

          {/* Quoted Post Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15 text-[10.5px] text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 font-medium">
                <Heart className="w-3 h-3 text-rose-500" />
                {sharedPost.likes_count}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Repeat2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {sharedPost.reposts_count}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.hash = '#/home';
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View in Home Feed</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const isChatOpen = Boolean(selectedMate || (selectedCommunity && selectedChannel));
  const isCommunityAdmin = Boolean(
    user &&
    selectedCommunity &&
    (selectedCommunity.admin_id === user.id ||
     (selectedCommunity.admin_id && selectedCommunity.admin_id === user.username) ||
     user.role === 'admin')
  );

  return (
    <div className="w-full h-screen pl-0 lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] pb-24 lg:pb-0 flex flex-col bg-white dark:bg-[#000000] text-black dark:text-[#e9edef] overflow-hidden selection:bg-emerald-500/30 selection:text-white transition-colors duration-200">
      {/* ── FULL-WIDTH VIEWPORT HEADER (SLEEK & STYLISH, TIMES NEW ROMAN, ZERO BLUE) ── */}
      <header className="w-full sticky top-0 z-40 bg-white/85 dark:bg-[#000000]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors flex-shrink-0">
        {/* Top Left: Sleek & Stylish Communities in Times New Roman */}
        <div className="flex items-center gap-3">
          {(isChatOpen || selectedCommunity) && (
            <button
              onClick={() => {
                if (selectedChannel) {
                  setSelectedChannel(null);
                } else {
                  setSelectedMate(null);
                  setSelectedCommunity(null);
                  setSelectedChannel(null);
                }
                setShowMobileChat(false);
              }}
              title="Back"
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1
            className="text-3xl sm:text-4xl font-light tracking-wide text-black dark:text-white select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
            onClick={() => {
              setSelectedMate(null);
              setSelectedCommunity(null);
              setSelectedChannel(null);
              setShowMobileChat(false);
            }}
          >
            Communities
          </h1>
        </div>

        {/* Top Right: New Community Button */}
        <div>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="text-xs sm:text-sm px-5 py-2 rounded-full font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Community</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT: SLEEK HR LIST VIEW OR WHATSAPP CHAT ARENA ── */}
      {!isChatOpen ? (
        /* ═════════════════════════════════════════════════════════════════
           SLEEK LIST VIEW (HOME & CLASSROOM STYLE, SLIM BLACK FONT, SEPARATED BY HR)
        ═════════════════════════════════════════════════════════════════ */
        <div className="w-full flex-1 overflow-y-auto flex justify-center no-scrollbar">
          <main className="w-full max-w-[650px] min-h-screen flex flex-col pb-28 lg:pb-12 px-3 sm:px-4 pt-2">
            {selectedCommunity ? (
              /* ═════════════════════════════════════════════════════════════
                 COMMUNITY CHANNELS LIST (SAME SLEEK HR STYLE)
              ═════════════════════════════════════════════════════════════ */
              <div className="flex-1">
                {/* Top Action Bar: Back to Communities + Add Channel (Admin) */}
                <div className="py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCommunity(null);
                      setSelectedChannel(null);
                    }}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-light text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Communities</span>
                  </button>

                  {isCommunityAdmin && (
                    <button
                      onClick={() => setIsAddChannelModalOpen(true)}
                      className="text-xs px-3.5 py-1.5 rounded-full font-medium cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Channel</span>
                    </button>
                  )}
                </div>

                {/* Community Info Header */}
                <div className="py-3 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-2xl flex-shrink-0">
                    {selectedCommunity.avatar || '💬'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-2xl sm:text-3xl font-light tracking-wide text-black dark:text-white truncate"
                      >
                        {selectedCommunity.name}
                      </h2>
                      {isCommunityAdmin && (
                        <span className="text-[10px] font-sans font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {selectedCommunity.category} • {selectedCommunity.members_count} peers {selectedCommunity.channels ? `• ${selectedCommunity.channels.length} channels` : ''}
                    </p>
                    {selectedCommunity.description && (
                      <p className="text-xs font-light text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
                        {selectedCommunity.description}
                      </p>
                    )}
                  </div>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800 my-0" />

                {/* Channels Section Header */}
                <div className="pt-3 pb-2 px-1">
                  <span
                    style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                    className="text-sm font-light italic text-neutral-500 dark:text-neutral-400"
                  >
                    Select a channel to chat
                  </span>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800 my-0" />

                {/* Channel Rows */}
                {(!selectedCommunity.channels || selectedCommunity.channels.length === 0) ? (
                  <div className="text-center py-16 px-4">
                    <p
                      className="text-black dark:text-white text-lg font-light"
                      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                    >
                      No channels yet
                    </p>
                    {isCommunityAdmin && (
                      <button
                        onClick={() => setIsAddChannelModalOpen(true)}
                        className="mt-3 text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Channel</span>
                      </button>
                    )}
                  </div>
                ) : (
                  selectedCommunity.channels.map((chan) => (
                    <React.Fragment key={`chan-row-${chan.id}`}>
                      <div
                        onClick={() => {
                          setActiveSubTab('rooms');
                          setSelectedChannel(chan);
                          setShowMobileChat(true);
                        }}
                        className="py-4 px-2 sm:px-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-lg flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-light">
                            #
                          </div>
                          <div className="min-w-0">
                            <h3
                              style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                              className="text-xl sm:text-2xl font-light tracking-wide text-black dark:text-white truncate group-hover:opacity-75 transition-opacity"
                            >
                              #{chan.name}
                            </h3>
                            <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {chan.channel_type === 'announcement'
                                ? 'Announcements'
                                : chan.channel_type === 'doubts'
                                ? 'Doubts & Solutions'
                                : 'General Discussion'} • Tap to open chat
                            </p>
                          </div>
                        </div>
                      </div>
                      <hr className="border-neutral-200 dark:border-neutral-800 my-0" />
                    </React.Fragment>
                  ))
                )}
              </div>
            ) : (
              /* ═════════════════════════════════════════════════════════════
                 MAIN UNIFIED LIST (CONTACTS & COMMUNITIES TOGETHER)
              ═════════════════════════════════════════════════════════════ */
              <div className="flex-1">
                <hr className="border-neutral-200 dark:border-neutral-800 my-0" />
                {filteredMates.length === 0 && filteredCommunities.length === 0 ? (
                  <div className="text-center py-24 px-4">
                    <p
                      className="text-black dark:text-white text-xl font-light"
                      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                    >
                      No contacts or communities found
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1 font-light">
                      Connect with peers on Home Feed or click "+ New Community" above to create one!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Contacts / Study Mates */}
                    {filteredMates.map((mate) => (
                      <React.Fragment key={`mate-${mate.id}`}>
                        <div
                          onClick={() => {
                            setActiveSubTab('studymates');
                            setSelectedMate(mate);
                            setSelectedCommunity(null);
                            setSelectedChannel(null);
                            setShowMobileChat(true);
                            fetchDirectMessages(mate.id);
                          }}
                          className="py-4 px-2 sm:px-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  mate.avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${mate.name}`
                                }
                                alt={mate.name}
                                className="w-11 h-11 rounded-full object-cover bg-neutral-200 dark:bg-neutral-800 ring-1 ring-emerald-500/30"
                              />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
                            </div>
                            <div className="min-w-0">
                              <h3
                                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                className="text-xl sm:text-2xl font-light tracking-wide text-black dark:text-white truncate group-hover:opacity-75 transition-opacity"
                              >
                                {mate.name}
                              </h3>
                              <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {mate.handle} {mate.college ? `• ${mate.college}` : '• Study Mate'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <hr className="border-neutral-200 dark:border-neutral-800 my-0" />
                      </React.Fragment>
                    ))}

                    {/* Communities */}
                    {filteredCommunities.map((comm) => (
                      <React.Fragment key={`comm-${comm.id}`}>
                        <div
                          onClick={() => {
                            setActiveSubTab('rooms');
                            setSelectedCommunity(comm);
                            setSelectedMate(null);
                            setSelectedChannel(null); // Show channel list!
                          }}
                          className="py-4 px-2 sm:px-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-2xl flex-shrink-0">
                              {comm.avatar || '💬'}
                            </div>
                            <div className="min-w-0">
                              <h3
                                style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                className="text-xl sm:text-2xl font-light tracking-wide text-black dark:text-white truncate group-hover:opacity-75 transition-opacity"
                              >
                                {comm.name}
                              </h3>
                              <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {comm.category} • {comm.members_count} peers {comm.channels ? `• ${comm.channels.length} channels` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <hr className="border-neutral-200 dark:border-neutral-800 my-0" />
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════
           CHAT ARENA (PURE WHITE BACKGROUND, SLEEK ITALIC TIMES NEW ROMAN)
        ═════════════════════════════════════════════════════════════════ */
        <div className="flex-1 w-full flex min-h-0 relative overflow-hidden bg-white">
          <main className="relative z-10 flex-1 h-full flex flex-col min-w-0 min-h-0 bg-white">
            {/* Chat Subheader (Only Back button, Community name & Channel name) */}
            <div className="h-14 px-4 sm:px-6 flex items-center justify-between bg-white border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    if (selectedCommunity) {
                      setSelectedChannel(null);
                    } else {
                      setSelectedMate(null);
                    }
                    setShowMobileChat(false);
                  }}
                  className="p-1.5 -ml-1 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                  title={selectedCommunity ? "Back to channels" : "Back"}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-xs font-light hidden sm:inline">
                    {selectedCommunity ? "Channels" : "Back"}
                  </span>
                </button>

                {activeSubTab === 'rooms' && selectedCommunity && selectedChannel ? (
                  <div
                    onClick={() => setShowDetailsPane(!showDetailsPane)}
                    className="cursor-pointer group flex items-center gap-1.5 min-w-0 select-none py-1"
                    title="Click to view community & channel info"
                  >
                    <h3
                      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                      className="text-xl sm:text-2xl font-light text-black dark:text-white tracking-wide truncate group-hover:opacity-75 transition-opacity"
                    >
                      <span>{selectedCommunity.name}</span>
                      <span className="text-neutral-400 font-light mx-2">/</span>
                      <span className="text-emerald-600 dark:text-emerald-400">#{selectedChannel.name}</span>
                    </h3>
                  </div>
                ) : selectedMate ? (
                  <div
                    onClick={() => setShowDetailsPane(!showDetailsPane)}
                    className="cursor-pointer group flex items-center gap-1.5 min-w-0 select-none py-1"
                    title="Click to view profile info"
                  >
                    <h3
                      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                      className="text-xl sm:text-2xl font-light text-black dark:text-white tracking-wide truncate group-hover:opacity-75 transition-opacity"
                    >
                      {selectedMate.name}
                    </h3>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Chat Stream & Details Pane */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 no-scrollbar">
                {/* Center Date Separator */}
                <div className="flex justify-center my-1">
                  <span
                    style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                    className="px-3.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-[11px] font-light italic text-black dark:text-white shadow-xs select-none"
                  >
                    Today
                  </span>
                </div>

                {activeSubTab === 'rooms' ? (
                  communityMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 dark:text-neutral-400 space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1 shadow-xs">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <p
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-base font-light italic text-black dark:text-white"
                      >
                        Welcome to #{selectedChannel?.name}!
                      </p>
                      <p
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-xs max-w-sm font-light italic text-neutral-500 dark:text-neutral-400"
                      >
                        Be the first to post a question, share academic thoughts, or paste a code snippet.
                      </p>
                    </div>
                  ) : (
                    communityMessages.map((m) => {
                      const isSelf = m.user_name === (user?.name || 'You');
                      const reactions = messageReactions[m.id] || [];
                      return (
                        <div
                          key={m.id}
                          className={`group/msg flex gap-2.5 sm:gap-3 max-w-[88%] sm:max-w-xl relative ${
                            isSelf ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          <img
                            src={
                              m.user_avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${m.user_name}`
                            }
                            alt={m.user_name}
                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 mt-1 object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                          />

                          {/* WhatsApp Chat Bubble */}
                          <div className="relative group/bubble flex flex-col">
                            {/* Floating Micro-Actions */}
                            <div
                              className={`absolute -top-8 ${
                                isSelf ? 'right-0' : 'left-0'
                              } hidden group-hover/msg:flex items-center gap-1 bg-white dark:bg-[#16181c] border border-neutral-200 dark:border-neutral-800 rounded-full px-2 py-0.5 shadow-md z-20 transition-all`}
                            >
                              {QUICK_EMOJIS.slice(0, 3).map((em) => (
                                <button
                                  key={em}
                                  onClick={() => handleAddReaction(m.id, em)}
                                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs transition-transform active:scale-125 cursor-pointer"
                                >
                                  {em}
                                </button>
                              ))}
                              <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
                              <button
                                onClick={() => handleStartReply(m.user_name, m.text)}
                                title="Reply"
                                className="p-1 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                <CornerDownRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCopyText(m.id, m.text)}
                                title="Copy Text"
                                className="p-1 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                {copiedMsgId === m.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Bubble Card - White Background, Sleek Times New Roman Italic Black Text */}
                            <div
                              className={`p-3 sm:p-3.5 rounded-2xl space-y-1.5 text-xs relative overflow-hidden shadow-xs border bg-white ${
                                isSelf
                                  ? 'border-neutral-200/90 rounded-tr-xs'
                                  : 'border-neutral-200/90 rounded-tl-xs'
                              }`}
                            >
                              {!isSelf && (
                                <div
                                  style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                  className="text-xs font-normal italic text-emerald-700 relative z-10 pb-0.5"
                                >
                                  {m.user_name}
                                </div>
                              )}

                              {m.text && (
                                <p
                                  style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                  className="leading-relaxed whitespace-pre-wrap text-[14px] sm:text-[15px] relative z-10 font-light italic text-black"
                                >
                                  {m.text}
                                </p>
                              )}

                              {renderSharedPostCard(m.shared_post)}

                              {m.code_snippet && (
                                <div className="mt-2 rounded-xl bg-neutral-900 border border-neutral-700/50 overflow-hidden text-left font-mono">
                                  <div className="px-3 py-1.5 bg-neutral-800 flex items-center justify-between border-b border-neutral-700/50">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400">code-snippet</span>
                                  </div>
                                  <div className="p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto">
                                    <pre>{m.code_snippet}</pre>
                                  </div>
                                </div>
                              )}

                              <div
                                className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono relative z-10 select-none text-neutral-400"
                              >
                                <span>
                                  {new Date(parseFloat(m.created_at) * 1000).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isSelf && (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                                )}
                              </div>
                            </div>

                            {/* Reactions */}
                            {reactions.length > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {reactions.map((emoji, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-full bg-white dark:bg-[#16181c] border border-neutral-200 dark:border-neutral-700 text-[11px] shadow-xs"
                                  >
                                    {emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  directMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 dark:text-neutral-400 space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1 shadow-xs">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <p
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-base font-light italic text-black dark:text-white"
                      >
                        Chat with {selectedMate?.name}
                      </p>
                      <p
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-xs max-w-sm font-light italic text-neutral-500 dark:text-neutral-400"
                      >
                        Say hello, share solutions, or collaborate on coursework together!
                      </p>
                    </div>
                  ) : (
                    directMessages.map((m) => {
                      const isSelf = m.sender_id === user?.id;
                      const reactions = messageReactions[m.id] || [];
                      return (
                        <div
                          key={m.id}
                          className={`group/msg flex gap-2.5 sm:gap-3 max-w-[88%] sm:max-w-xl relative ${
                            isSelf ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          <img
                            src={
                              m.sender_avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_name}`
                            }
                            alt={m.sender_name}
                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 mt-1 object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                          />

                          <div className="relative group/bubble flex flex-col">
                            {/* Floating Micro-Actions */}
                            <div
                              className={`absolute -top-8 ${
                                isSelf ? 'right-0' : 'left-0'
                              } hidden group-hover/msg:flex items-center gap-1 bg-white dark:bg-[#16181c] border border-neutral-200 dark:border-neutral-800 rounded-full px-2 py-0.5 shadow-md z-20 transition-all`}
                            >
                              {QUICK_EMOJIS.slice(0, 3).map((em) => (
                                <button
                                  key={em}
                                  onClick={() => handleAddReaction(m.id, em)}
                                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs transition-transform active:scale-125 cursor-pointer"
                                >
                                  {em}
                                </button>
                              ))}
                              <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
                              <button
                                onClick={() => handleStartReply(m.sender_name, m.text)}
                                title="Reply"
                                className="p-1 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                <CornerDownRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCopyText(m.id, m.text)}
                                title="Copy Text"
                                className="p-1 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                {copiedMsgId === m.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Bubble Card - White Background, Sleek Times New Roman Italic Black Text */}
                            <div
                              className={`p-3 sm:p-3.5 rounded-2xl space-y-1.5 text-xs relative overflow-hidden shadow-xs border bg-white ${
                                isSelf
                                  ? 'border-neutral-200/90 rounded-tr-xs'
                                  : 'border-neutral-200/90 rounded-tl-xs'
                              }`}
                            >
                              {!isSelf && (
                                <div
                                  style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                  className="text-xs font-normal italic text-emerald-700 relative z-10 pb-0.5"
                                >
                                  {m.sender_name}
                                </div>
                              )}

                              {m.text && (
                                <p
                                  style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                                  className="leading-relaxed whitespace-pre-wrap text-[14px] sm:text-[15px] relative z-10 font-light italic text-black"
                                >
                                  {m.text}
                                </p>
                              )}

                              {renderSharedPostCard(m.shared_post)}

                              {m.code_snippet && (
                                <div className="mt-2 rounded-xl bg-neutral-900 border border-neutral-700/50 overflow-hidden text-left font-mono">
                                  <div className="px-3 py-1.5 bg-neutral-800 flex items-center justify-between border-b border-neutral-700/50">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400">code-snippet</span>
                                  </div>
                                  <div className="p-3 text-[11px] text-emerald-300 font-mono overflow-x-auto">
                                    <pre>{m.code_snippet}</pre>
                                  </div>
                                </div>
                              )}

                              <div
                                className="flex items-center justify-end gap-1 mt-1 text-[10px] font-mono relative z-10 select-none text-neutral-400"
                              >
                                <span>
                                  {new Date(parseFloat(m.created_at) * 1000).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isSelf && (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                                )}
                              </div>
                            </div>

                            {/* Reactions */}
                            {reactions.length > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {reactions.map((emoji, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-full bg-white dark:bg-[#16181c] border border-neutral-200 dark:border-neutral-700 text-[11px] shadow-xs"
                                  >
                                    {emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Slide-in Details Pane (Community & Channel Info) */}
              <AnimatePresence>
                {showDetailsPane && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-neutral-200 bg-white h-full overflow-y-auto p-5 flex-shrink-0"
                  >
                    {/* Header with close button */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                      <span
                        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                        className="text-base font-light italic text-black dark:text-white"
                      >
                        Info
                      </span>
                      <button
                        onClick={() => setShowDetailsPane(false)}
                        className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        title="Close info"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {activeSubTab === 'rooms' && selectedCommunity ? (
                      <div className="space-y-4 pt-3">
                        {/* Community Info */}
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-3xl mx-auto flex items-center justify-center mb-2">
                            {selectedCommunity.avatar || '💬'}
                          </div>
                          <h4
                            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                            className="text-xl font-light text-black dark:text-white"
                          >
                            {selectedCommunity.name}
                          </h4>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {selectedCommunity.category}
                          </span>
                        </div>

                        <hr className="border-neutral-200 dark:border-neutral-800" />

                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                          {selectedCommunity.description || 'Open academic community forum.'}
                        </p>

                        <div className="text-xs space-y-2 font-light text-neutral-500">
                          <div>Members: {selectedCommunity.members_count} peers</div>
                          <div className="flex items-center gap-1.5">
                            <span>Role:</span>
                            {isCommunityAdmin ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium">
                                Admin (Creator)
                              </span>
                            ) : (
                              <span>Member</span>
                            )}
                          </div>
                        </div>

                        {/* Current Channel Info */}
                        {selectedChannel && (
                          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                            <div className="font-medium text-black dark:text-white flex items-center gap-1.5">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">#</span>
                              <span>Current Channel: #{selectedChannel.name}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-light">
                              Type:{' '}
                              {selectedChannel.channel_type === 'announcement'
                                ? 'Announcements & Updates'
                                : selectedChannel.channel_type === 'doubts'
                                ? 'Doubts & Solutions'
                                : 'General Discussion'}
                            </p>
                          </div>
                        )}

                        {/* Channels List */}
                        <div>
                          <div className="text-xs font-light text-neutral-500 mb-1.5">
                            Channels ({selectedCommunity.channels?.length || 0}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedCommunity.channels?.map((ch) => (
                              <button
                                key={ch.id}
                                onClick={() => setSelectedChannel(ch)}
                                className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                                  selectedChannel?.id === ch.id
                                    ? 'bg-emerald-600 text-white font-medium'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-light'
                                }`}
                              >
                                #{ch.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Admin Add Channel */}
                        {isCommunityAdmin && (
                          <div className="pt-2">
                            <button
                              onClick={() => setIsAddChannelModalOpen(true)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Extra Channel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : selectedMate ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <img
                            src={
                              selectedMate.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMate.name}`
                            }
                            alt={selectedMate.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-emerald-500/40 mb-2"
                          />
                          <h4
                            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                            className="text-xl font-light text-black dark:text-white"
                          >
                            {selectedMate.name}
                          </h4>
                          <span className="text-xs text-neutral-400 font-light">
                            {selectedMate.handle}
                          </span>
                        </div>
                        <hr className="border-neutral-200 dark:border-neutral-800" />
                        {selectedMate.college && (
                          <div className="text-xs font-light text-neutral-600 dark:text-neutral-400">
                            College: {selectedMate.college}
                          </div>
                        )}
                        {selectedMate.bio && (
                          <div className="text-xs font-light text-neutral-600 dark:text-neutral-400">
                            {selectedMate.bio}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>

            {/* Code Snippet Drawer */}
            <AnimatePresence>
              {showCodeInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-white dark:bg-[#16181c] border-t border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex-shrink-0"
                >
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4" />
                        Attach Formatted Code Snippet
                      </span>
                      <button
                        onClick={() => setShowCodeInput(false)}
                        className="text-neutral-400 hover:text-black dark:hover:text-white text-xs px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="// Paste your algorithm, function, or snippet here..."
                      value={codeSnippetInput}
                      onChange={(e) => setCodeSnippetInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-neutral-700 text-xs font-mono text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Composer Footer - Pure White, Times New Roman Sleek Italic Text */}
            <div className="p-3 sm:p-4 bg-white border-t border-neutral-200 flex-shrink-0">
              {replyingTo && (
                <div className="mb-2 p-2.5 rounded-2xl bg-white border border-neutral-200 border-l-4 border-l-emerald-500 flex items-center justify-between text-xs shadow-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-emerald-600 block truncate">
                      Replying to {replyingTo.sender}
                    </span>
                    <p
                      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                      className="text-xs text-black truncate mt-0.5 font-light italic"
                    >
                      "{replyingTo.text}"
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 rounded-full text-neutral-400 hover:text-black transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {sendError && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 text-[11px] font-medium">
                  {sendError}
                </div>
              )}

              <div className="relative w-full">
                {/* ── FLOW GLOW ANIMATION (CIRCULAR, NO BREAKS) DURING 5-SECOND SEND DELAY ── */}
                <FlowingBorderGlow isActive={isSending} borderRadius="rounded-full" />

                <form
                  onSubmit={handleSendMessage}
                  className="relative z-10 w-full flex items-center gap-2 sm:gap-3 bg-white p-1.5 sm:p-2 rounded-full border border-neutral-200 shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(!showCodeInput)}
                    disabled={isSending}
                    title="Attach Code"
                    className={`p-2 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                      showCodeInput
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                    } ${isSending ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Code2 className="w-4 h-4" />
                  </button>

                  <input
                    ref={composerInputRef}
                    type="text"
                    placeholder={
                      activeSubTab === 'rooms'
                        ? `Message #${selectedChannel?.name}...`
                        : `Message ${selectedMate?.name}...`
                    }
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isSending}
                    style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
                    className="flex-1 min-w-0 px-2 py-1 bg-transparent text-sm sm:text-base text-black placeholder-neutral-400 focus:outline-none font-light italic"
                  />

                  <button
                    type="submit"
                    disabled={isSending || (!textInput.trim() && !codeSnippetInput.trim())}
                    className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-600/25 flex-shrink-0"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCommunityCreated={(newComm) => {
          setCommunities((prev) => [newComm, ...prev]);
          setSelectedCommunity(newComm);
          setSelectedMate(null);
          setSelectedChannel(null);
        }}
      />

      {/* Add Extra Channel Modal (Admin Only) */}
      {selectedCommunity && (
        <AddChannelModal
          isOpen={isAddChannelModalOpen}
          onClose={() => setIsAddChannelModalOpen(false)}
          communityId={selectedCommunity.id}
          communityName={selectedCommunity.name}
          onChannelAdded={(newChannel) => {
            setSelectedCommunity((prev) => {
              if (!prev) return prev;
              const updatedChannels = [...(prev.channels || []), newChannel];
              return { ...prev, channels: updatedChannels };
            });
            setCommunities((prev) =>
              prev.map((c) =>
                c.id === selectedCommunity.id
                  ? { ...c, channels: [...(c.channels || []), newChannel] }
                  : c
              )
            );
            setSelectedChannel(newChannel);
          }}
        />
      )}
    </div>
  );
};
