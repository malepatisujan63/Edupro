import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Building2,
  Plus,
  Search,
  Copy,
  Check,
  X,
  Users,
  Bell,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Code2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Send,
  FileText,
  UserCheck,
  UserX,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Hash,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Trophy,
  Terminal,
  RotateCcw,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Flame,
  CheckCheck
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import confetti from 'canvas-confetti';
import {
  Classroom,
  ClassroomJoinRequest,
  ClassroomPost,
  ClassroomMessage,
  ClassroomQuiz,
  ClassroomProblem,
  QuizQuestion,
  ClassroomComment,
  ClassroomChannel,
  CodeEvalResult
} from '../../types';
import { CreateSubjectModal } from './CreateSubjectModal';
import { JoinSubjectModal } from './JoinSubjectModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { YoutubeIcon } from '../icons/YoutubeIcon';

type ScopedTab = 'feed' | 'community' | 'contests' | 'challenges';

const sanitizeBlueGradient = (grad?: string): string => {
  if (!grad || /purple|pink|fuchsia|violet|rose|emerald|amber|orange/i.test(grad)) {
    return 'from-[#0A3D78] via-[#0B254E] to-[#051329]';
  }
  return grad;
};

const extractYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

interface ClassroomHubProps {
  initialClassroomId?: string | null;
}

export const ClassroomHub: React.FC<ClassroomHubProps> = ({ initialClassroomId }) => {
  const { user, authFetch, openAuthModal } = useAuth();
  const { theme } = useTheme();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [activeScopedTab, setActiveScopedTab] = useState<ScopedTab>('feed');

  useEffect(() => {
    if (initialClassroomId && classrooms.length > 0) {
      const match = classrooms.find((c) => c.id === initialClassroomId);
      if (match) {
        setSelectedClassroom(match);
      }
    }
  }, [initialClassroomId, classrooms]);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Faculty pending requests list (global across subjects)
  const [allPendingRequests, setAllPendingRequests] = useState<ClassroomJoinRequest[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ─── TAB 1: FEED STATES ──────────────────────────────────────────
  const [posts, setPosts] = useState<ClassroomPost[]>([]);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'announcement' | 'lecture' | 'resource' | 'youtube_course'>('announcement');
  const [newPostYoutube, setNewPostYoutube] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [newPostAttachment, setNewPostAttachment] = useState('');
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, ClassroomComment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ─── TAB 2: COMMUNITY STATES (CHANNELS & CHAT) ───────────────────
  const [channels, setChannels] = useState<ClassroomChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ClassroomChannel | null>(null);
  const [channelMessages, setChannelMessages] = useState<ClassroomMessage[]>([]);
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'general' | 'announcement' | 'doubts'>('general');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatSnippet, setChatSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── TAB 3: CONTESTS STATES ──────────────────────────────────────
  const [quizzes, setQuizzes] = useState<ClassroomQuiz[]>([]);
  const [isNewQuizOpen, setIsNewQuizOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState(45);
  const [newQuizTotalMarks, setNewQuizTotalMarks] = useState(100);
  const [newQuizQ1Text, setNewQuizQ1Text] = useState('');
  const [newQuizQ1Opt0, setNewQuizQ1Opt0] = useState('');
  const [newQuizQ1Opt1, setNewQuizQ1Opt1] = useState('');
  const [newQuizQ1Opt2, setNewQuizQ1Opt2] = useState('');
  const [newQuizQ1Opt3, setNewQuizQ1Opt3] = useState('');
  const [newQuizQ1Correct, setNewQuizQ1Correct] = useState(0);
  const [isPublishingQuiz, setIsPublishingQuiz] = useState(false);

  // Student Quiz Runner Modal
  const [activeQuizToTake, setActiveQuizToTake] = useState<ClassroomQuiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizStatuses, setQuizStatuses] = useState<Record<string, 'answered' | 'not_answered' | 'review'>>({});
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(0);
  const [isQuizTimerActive, setIsQuizTimerActive] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // ─── TAB 4: CHALLENGES / LABS STATES ─────────────────────────────
  const [problems, setProblems] = useState<ClassroomProblem[]>([]);
  const [problemDifficultyFilter, setProblemDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [isNewProblemOpen, setIsNewProblemOpen] = useState(false);
  const [newProbTitle, setNewProbTitle] = useState('');
  const [newProbSlug, setNewProbSlug] = useState('');
  const [newProbDifficulty, setNewProbDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newProbCategory, setNewProbCategory] = useState('Data Structures');
  const [newProbDesc, setNewProbDesc] = useState('');
  const [newProbConstraints, setNewProbConstraints] = useState('');
  const [newProbSampleInput, setNewProbSampleInput] = useState('');
  const [newProbSampleOutput, setNewProbSampleOutput] = useState('');
  const [newProbStarterCode, setNewProbStarterCode] = useState('def solution(input_data):\n    # Write your solution here\n    pass\n');
  const [isPublishingProblem, setIsPublishingProblem] = useState(false);

  // Student Coding Runner Modal
  const [activeProblemToSolve, setActiveProblemToSolve] = useState<ClassroomProblem | null>(null);
  const [problemCode, setProblemCode] = useState('');
  const [problemLang, setProblemLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [activeLabTab, setActiveLabTab] = useState<'testcases' | 'output'>('testcases');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeRunResult, setCodeRunResult] = useState<CodeEvalResult | null>(null);

  const isFaculty = user?.role === 'university';

  // ─── INITIAL LOAD ────────────────────────────────────────────────
  const loadClassrooms = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await authFetch('/api/classrooms');
      const data = await res.json();
      if (data.success) {
        setClassrooms(data.classrooms || []);
      }

      if (user.role === 'university') {
        fetchFacultyPendingRequests(data.classrooms || []);
      }

      const notifRes = await authFetch('/api/notifications/unread-count');
      const notifData = await notifRes.json();
      if (notifData.success) {
        setUnreadCount(notifData.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load classrooms', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacultyPendingRequests = async (facultyClassrooms: Classroom[]) => {
    try {
      const r = await authFetch('/api/classrooms/my/pending-requests');
      const d = await r.json();
      if (d.success && d.requests) {
        setAllPendingRequests(d.requests);
        return;
      }
    } catch (e) {}

    let collected: ClassroomJoinRequest[] = [];
    for (const c of facultyClassrooms) {
      try {
        const r = await authFetch(`/api/classrooms/${c.id}/requests`);
        const d = await r.json();
        if (d.success && d.requests) {
          collected = [...collected, ...d.requests];
        }
      } catch (e) {}
    }
    setAllPendingRequests(collected);
  };

  useEffect(() => {
    loadClassrooms();
  }, [user]);

  // Load scoped tab data when classroom is selected
  useEffect(() => {
    if (!selectedClassroom) return;
    loadScopedData(selectedClassroom.id);
  }, [selectedClassroom]);

  const loadScopedData = async (classroomId: string) => {
    try {
      // 1. Posts
      const pRes = await authFetch(`/api/classrooms/${classroomId}/posts`);
      const pData = await pRes.json();
      if (pData.success) setPosts(pData.posts || []);

      // 2. Channels
      const cRes = await authFetch(`/api/classrooms/${classroomId}/channels`);
      const cData = await cRes.json();
      if (cData.success && cData.channels) {
        setChannels(cData.channels);
        if (cData.channels.length > 0) {
          setSelectedChannel(cData.channels[0]);
          loadChannelMessages(classroomId, cData.channels[0].id);
        }
      }

      // 3. Quizzes
      const qRes = await authFetch(`/api/classrooms/${classroomId}/quizzes`);
      const qData = await qRes.json();
      if (qData.success) setQuizzes(qData.quizzes || []);

      // 4. Problems
      const probRes = await authFetch(`/api/classrooms/${classroomId}/problems`);
      const probData = await probRes.json();
      if (probData.success) setProblems(probData.problems || []);
    } catch (err) {
      console.error('Failed to load scoped data', err);
    }
  };

  const loadChannelMessages = async (classroomId: string, channelId: string) => {
    try {
      const res = await authFetch(`/api/classrooms/${classroomId}/channels/${channelId}/messages`);
      const data = await res.json();
      if (data.success && data.messages) {
        setChannelMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load channel messages', err);
    }
  };

  // Community Polling Interval (every 3.5s) for rock-solid reliable message transfer
  useEffect(() => {
    if (!selectedClassroom || !selectedChannel || activeScopedTab !== 'community') return;
    const timer = setInterval(() => {
      loadChannelMessages(selectedClassroom.id, selectedChannel.id);
    }, 3500);
    return () => clearInterval(timer);
  }, [selectedClassroom, selectedChannel, activeScopedTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  // Quiz Timer Countdown
  useEffect(() => {
    if (!activeQuizToTake || !isQuizTimerActive || quizSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuizToTake, isQuizTimerActive, quizSecondsLeft]);

  // ─── ACTIONS: GENERAL & SEARCH ───────────────────────────────────
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  const handleFacultyDecision = async (classroomId: string, memberId: string, decision: 'accept' | 'reject') => {
    setActionLoadingId(memberId);
    try {
      const res = await authFetch(`/api/classrooms/${classroomId}/requests/${memberId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: decision, decision })
      });
      const data = await res.json();
      if (data.success) {
        setAllPendingRequests((prev) => prev.filter((r) => r.member_id !== memberId && r.user_id !== memberId));
        await loadClassrooms();
        if (selectedClassroom && selectedClassroom.id.toLowerCase() === classroomId.toLowerCase()) {
          setSelectedClassroom((prev) =>
            prev
              ? {
                  ...prev,
                  student_count: decision === 'accept' ? (prev.student_count || 0) + 1 : prev.student_count
                }
              : null
          );
        }
      } else {
        alert(data.error || 'Failed to update student request');
      }
    } catch (err) {
      console.error('Failed to decide student request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── ACTIONS: TAB 1 FEED ─────────────────────────────────────────
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

  const handleLikePost = async (postId: string) => {
    if (!user || !selectedClassroom) return;
    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts/${postId}/like`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, is_liked: data.liked, likes_count: data.likes_count }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleRepostPost = async (postId: string) => {
    if (!user || !selectedClassroom) return;
    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts/${postId}/repost`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, reposts_count: data.reposts_count }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Repost failed:', err);
    }
  };

  const toggleComments = async (postId: string) => {
    if (!selectedClassroom) return;
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts/${postId}/comments`);
        const data = await res.json();
        if (data.success && data.comments) {
          setCommentsMap((prev) => ({ ...prev, [postId]: data.comments }));
        }
      } catch (err) {
        console.error('Failed to fetch classroom post comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !selectedClassroom || !newCommentText.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newCommentText.trim() })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
          )
        );
        setNewCommentText('');
      } else {
        setCommentError(data.error || 'Failed to post comment');
      }
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      setCommentError(err.message || 'Network error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newPostTitle.trim() || !newPostContent.trim()) return;
    const detectedYt = extractYouTubeVideoId(newPostYoutube) || extractYouTubeVideoId(newPostContent);
    const effectiveYt = newPostYoutube.trim() || (detectedYt ? `https://www.youtube.com/watch?v=${detectedYt}` : undefined);
    const effectiveImg = detectedYt ? `https://img.youtube.com/vi/${detectedYt}/hqdefault.jpg` : undefined;

    setIsPublishingPost(true);
    setPostError(null);
    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          post_type: newPostType,
          youtube_url: effectiveYt,
          image_url: effectiveImg,
          tags: newPostTags.trim() || undefined,
          attachment_url: newPostAttachment.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostYoutube('');
        setNewPostTags('');
        setNewPostAttachment('');
        setIsNewPostOpen(false);
        // Refresh posts
        const pRes = await authFetch(`/api/classrooms/${selectedClassroom.id}/posts`);
        const pData = await pRes.json();
        if (pData.success) setPosts(pData.posts || []);
      } else {
        setPostError(data.error || 'Failed to publish post');
      }
    } catch (err: any) {
      console.error('Failed to publish classroom post', err);
      setPostError(err.message || 'Network error');
    } finally {
      setIsPublishingPost(false);
    }
  };

  // ─── ACTIONS: TAB 2 COMMUNITY ────────────────────────────────────
  const handleSelectChannel = (channel: ClassroomChannel) => {
    setSelectedChannel(channel);
    if (selectedClassroom) {
      loadChannelMessages(selectedClassroom.id, channel.id);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newChannelName.trim()) return;
    setIsCreatingChannel(true);
    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim(),
          channel_type: newChannelType
        })
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setChannels((prev) => [...prev, data.channel]);
        setSelectedChannel(data.channel);
        setNewChannelName('');
        setIsNewChannelModalOpen(false);
        loadChannelMessages(selectedClassroom.id, data.channel.id);
      }
    } catch (err) {
      console.error('Failed to create channel', err);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !selectedChannel) return;
    if (!chatInput.trim() && !chatSnippet.trim()) return;

    setIsSendingMsg(true);
    setChatError(null);
    try {
      const res = await authFetch(
        `/api/classrooms/${selectedClassroom.id}/channels/${selectedChannel.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chatInput.trim() || 'Code snippet shared',
            code_snippet: chatSnippet.trim() || undefined
          })
        }
      );
      const data = await res.json();
      if (data.success && data.message) {
        setChannelMessages((prev) => [...prev, data.message]);
        setChatInput('');
        setChatSnippet('');
        setShowCodeInput(false);
      } else {
        setChatError(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Failed to send message', err);
      setChatError(err.message || 'Network error');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // ─── ACTIONS: TAB 3 CONTESTS ─────────────────────────────────────
  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newQuizTitle.trim() || !newQuizQ1Text.trim()) return;
    setIsPublishingQuiz(true);

    const questions: QuizQuestion[] = [
      {
        id: `q_cq_${Date.now()}_1`,
        section: 'General',
        question_num: 1,
        question: newQuizQ1Text.trim(),
        question_text: newQuizQ1Text.trim(),
        options: [newQuizQ1Opt0, newQuizQ1Opt1, newQuizQ1Opt2, newQuizQ1Opt3],
        correct_index: newQuizQ1Correct,
        correct_option_index: newQuizQ1Correct,
        explanation: 'Standard verified course evaluation answer.'
      }
    ];

    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuizTitle.trim(),
          description: newQuizDesc.trim() || 'Course Assessment Contest',
          duration_minutes: newQuizDuration,
          total_marks: newQuizTotalMarks,
          positive_marks: 4.0,
          negative_marks: 1.0,
          sections: ['General'],
          questions
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewQuizTitle('');
        setNewQuizDesc('');
        setNewQuizQ1Text('');
        setNewQuizQ1Opt0('');
        setNewQuizQ1Opt1('');
        setNewQuizQ1Opt2('');
        setNewQuizQ1Opt3('');
        setIsNewQuizOpen(false);

        const qRes = await authFetch(`/api/classrooms/${selectedClassroom.id}/quizzes`);
        const qData = await qRes.json();
        if (qData.success) setQuizzes(qData.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to create classroom quiz', err);
    } finally {
      setIsPublishingQuiz(false);
    }
  };

  const handleStartQuiz = (q: ClassroomQuiz) => {
    setActiveQuizToTake(q);
    setCurrentQIndex(0);
    setQuizAnswers({});
    setQuizStatuses({});
    setQuizSecondsLeft(q.duration_minutes * 60);
    setIsQuizTimerActive(true);
    setQuizResult(null);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizToTake || !selectedClassroom) return;
    setIsSubmittingQuiz(true);
    setIsQuizTimerActive(false);

    try {
      const timeTaken = (activeQuizToTake.duration_minutes * 60) - quizSecondsLeft;
      const res = await authFetch(
        `/api/classrooms/${selectedClassroom.id}/quizzes/${activeQuizToTake.id}/attempt`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: quizAnswers,
            time_taken_seconds: Math.max(1, timeTaken)
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        // Refresh quizzes
        const qRes = await authFetch(`/api/classrooms/${selectedClassroom.id}/quizzes`);
        const qData = await qRes.json();
        if (qData.success) setQuizzes(qData.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to submit quiz attempt', err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // ─── ACTIONS: TAB 4 CHALLENGES / LABS ────────────────────────────
  const handlePublishProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom || !newProbTitle.trim() || !newProbDesc.trim()) return;
    setIsPublishingProblem(true);

    const generatedSlug = newProbSlug.trim() || newProbTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const sampleCases = [
      {
        input: newProbSampleInput.trim() || '5\n',
        output: newProbSampleOutput.trim() || '10\n',
        explanation: 'Sample test case demonstration.'
      }
    ];

    try {
      const res = await authFetch(`/api/classrooms/${selectedClassroom.id}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProbTitle.trim(),
          slug: generatedSlug,
          difficulty: newProbDifficulty,
          category: newProbCategory.trim(),
          description: newProbDesc.trim(),
          constraints: newProbConstraints.trim() || '1 <= N <= 10^5',
          sample_cases: sampleCases,
          starter_templates: {
            python: newProbStarterCode.trim(),
            javascript: '// Write your solution here\nfunction solution(input) {\n  return 0;\n}\n'
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewProbTitle('');
        setNewProbSlug('');
        setNewProbDesc('');
        setNewProbConstraints('');
        setNewProbSampleInput('');
        setNewProbSampleOutput('');
        setIsNewProblemOpen(false);

        const probRes = await authFetch(`/api/classrooms/${selectedClassroom.id}/problems`);
        const probData = await probRes.json();
        if (probData.success) setProblems(probData.problems || []);
      }
    } catch (err) {
      console.error('Failed to assign classroom problem', err);
    } finally {
      setIsPublishingProblem(false);
    }
  };

  const handleOpenProblem = (prob: ClassroomProblem) => {
    setActiveProblemToSolve(prob);
    const template = prob.starter_templates?.[problemLang] || '# Write your solution here\n';
    setProblemCode(template);
    setCodeRunResult(null);
    setActiveLabTab('testcases');
  };

  const handleRunCode = async () => {
    if (!activeProblemToSolve || !selectedClassroom) return;
    setIsRunningCode(true);
    setActiveLabTab('output');
    try {
      const res = await authFetch(
        `/api/classrooms/${selectedClassroom.id}/problems/${activeProblemToSolve.id}/run`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: problemCode,
            language: problemLang
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setCodeRunResult(data);
        if (data.verdict === 'Accepted') {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      } else {
        setCodeRunResult({
          verdict: 'Compilation Error',
          all_passed: false,
          passed_count: 0,
          total_count: 1,
          avg_time_ms: 0,
          results: [
            {
              case_number: 1,
              passed: false,
              status: 'Compilation Error',
              is_hidden: false,
              input: '',
              expected_output: '',
              actual_output: data.error || 'Execution failed',
              execution_time_ms: 0
            }
          ]
        });
      }
    } catch (err: any) {
      setCodeRunResult({
        verdict: 'Runtime Error',
        all_passed: false,
        passed_count: 0,
        total_count: 1,
        avg_time_ms: 0,
        results: [
          {
            case_number: 1,
            passed: false,
            status: 'Runtime Error',
            is_hidden: false,
            input: '',
            expected_output: '',
            actual_output: err.message || 'Network error running code',
            execution_time_ms: 0
          }
        ]
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSubmitProblemCode = async () => {
    if (!activeProblemToSolve || !selectedClassroom) return;
    setIsSubmittingCode(true);
    setActiveLabTab('output');
    try {
      const res = await authFetch(
        `/api/classrooms/${selectedClassroom.id}/problems/${activeProblemToSolve.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: problemCode,
            language: problemLang
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setCodeRunResult(data.result || data);
        if (data.verdict === 'Accepted') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        setCodeRunResult({
          verdict: 'Compilation Error',
          all_passed: false,
          passed_count: 0,
          total_count: 1,
          avg_time_ms: 0,
          results: [
            {
              case_number: 1,
              passed: false,
              status: 'Compilation Error',
              is_hidden: false,
              input: '',
              expected_output: '',
              actual_output: data.error || 'Submission failed',
              execution_time_ms: 0
            }
          ]
        });
      }
    } catch (err: any) {
      setCodeRunResult({
        verdict: 'Runtime Error',
        all_passed: false,
        passed_count: 0,
        total_count: 1,
        avg_time_ms: 0,
        results: [
          {
            case_number: 1,
            passed: false,
            status: 'Runtime Error',
            is_hidden: false,
            input: '',
            expected_output: '',
            actual_output: err.message || 'Network error submitting code',
            execution_time_ms: 0
          }
        ]
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const formatExamTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[var(--x-bg)] text-[var(--x-text)] pl-0 lg:pl-[68px] xl:pl-[76px] 2xl:pl-[84px] pb-24 lg:pb-0 flex flex-col selection:bg-[#0A84FF]/30 selection:text-white">
      {/* ── FULL-WIDTH VIEWPORT HEADER (BORDERLESS, SLEEK & CLEAN) ── */}
      <header className="w-full sticky top-0 z-30 bg-[var(--x-bg)]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        {/* Top Left: Sleek & Stylish Classroom in Times New Roman */}
        <div className="flex items-center gap-3">
          {selectedClassroom && (
            <button
              onClick={() => setSelectedClassroom(null)}
              title="Back to all subjects"
              className="p-1.5 -ml-1 rounded-full hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1
            className="text-3xl sm:text-4xl font-light tracking-wide text-[var(--x-text)] select-none cursor-pointer hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
            onClick={() => setSelectedClassroom(null)}
          >
            Classroom
          </h1>
        </div>

        {/* Top Right of Viewport: Add Subject (Faculty) / Join Subject (Student) */}
        <div>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else if (isFaculty) {
                setIsCreateModalOpen(true);
              } else {
                setIsJoinModalOpen(true);
              }
            }}
            className="x-btn-accent text-xs sm:text-sm px-5 py-2 font-bold cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isFaculty ? 'Add Subject' : 'Join Subject'}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT OUTLET ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {selectedClassroom ? (
          /* ═════════════════════════════════════════════════════════════════
             SUBJECT ARENA (THE 4 SCOPED TABS)
          ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Subject Hero Card */}
            <div
              className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-indigo-50/70 dark:from-[#0A3D78] dark:via-[#0B254E] dark:to-[#051329] border border-blue-200/80 dark:border-[var(--x-border)] shadow-lg dark:shadow-[0_16px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(10,132,255,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-300/80 to-transparent pointer-events-none opacity-90" />
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-[var(--x-surface)] text-[#38a6ff] font-mono font-extrabold tracking-wider border border-[var(--x-border)]">
                    {selectedClassroom.subject_code}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-800 dark:text-white font-semibold border border-blue-200 dark:border-[var(--x-border)]">
                    {selectedClassroom.university}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-neutral-200/60 dark:bg-white/10 text-neutral-800 dark:text-blue-100">
                    {selectedClassroom.department}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--x-text)] tracking-tight">
                  {selectedClassroom.name}
                </h2>

                <p className="text-xs sm:text-sm text-[var(--x-subtext)] max-w-3xl leading-relaxed">
                  {selectedClassroom.description || 'Welcome to your university subject arena.'}
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 dark:border-white/15 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedClassroom.faculty_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=faculty'}
                      alt="Faculty"
                      className="w-8 h-8 rounded-full bg-[var(--x-surface-hover)] border border-[var(--x-border)] object-cover"
                    />
                    <div>
                      <span className="font-bold text-[var(--x-text)] block">
                        Prof. {selectedClassroom.faculty_name}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-300/70">Course Instructor</span>
                    </div>
                  </div>

                  {/* 32-char ID copy badge */}
                  <button
                    onClick={() => handleCopyId(selectedClassroom.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--x-surface-hover)] text-[var(--x-text)] text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer border border-[var(--x-border)] active:scale-95"
                    title="Click to copy 32-character ID"
                  >
                    <Hash className="w-3.5 h-3.5 text-[#38a6ff]" />
                    <span>ID: {selectedClassroom.id.slice(0, 8)}...{selectedClassroom.id.slice(-8)}</span>
                    {copiedId === selectedClassroom.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-blue-500/70 dark:text-blue-300/60" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Specific Pending Admissions Banner for Faculty */}
            {isFaculty && allPendingRequests.some((r) => r.classroom_id.toLowerCase() === selectedClassroom.id.toLowerCase()) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-orange-50/60 dark:from-amber-500/15 dark:via-[#0c1e3d]/80 dark:to-[#081325]/90 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--x-text)] flex items-center gap-2">
                      <span>Pending Student Admissions</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                        {allPendingRequests.filter((r) => r.classroom_id.toLowerCase() === selectedClassroom.id.toLowerCase()).length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-200/70">
                      Students are waiting for your approval to join {selectedClassroom.name}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {allPendingRequests
                    .filter((r) => r.classroom_id.toLowerCase() === selectedClassroom.id.toLowerCase())
                    .map((req) => (
                      <div
                        key={req.member_id}
                        className="flex items-center gap-2.5 bg-[var(--x-surface-hover)] px-3 py-1.5 rounded-xl border border-[var(--x-border)]"
                      >
                        <img
                          src={req.student_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.student_name}`}
                          alt={req.student_name}
                          className="w-6 h-6 rounded-full bg-[var(--x-surface)] border border-[var(--x-border)] object-cover"
                        />
                        <span className="text-xs font-semibold text-[var(--x-text)]">{req.student_name}</span>
                        <button
                          onClick={() => handleFacultyDecision(req.classroom_id, req.member_id, 'accept')}
                          disabled={actionLoadingId === req.member_id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1 active:scale-95 shadow-sm btn-keep-white"
                        >
                          <Check className="w-3 h-3" />
                          <span>{actionLoadingId === req.member_id ? '...' : 'Accept'}</span>
                        </button>
                        <button
                          onClick={() => handleFacultyDecision(req.classroom_id, req.member_id, 'reject')}
                          disabled={actionLoadingId === req.member_id}
                          className="p-1 rounded-lg bg-neutral-200/70 hover:bg-rose-500/20 text-neutral-600 hover:text-rose-600 dark:bg-white/10 dark:text-rose-300 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                          title="Decline request"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── 4 SCOPED TABS NAVIGATION (MILD BLUE FROST PILL) ── */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--x-surface)] backdrop-blur-2xl border border-[var(--x-border)] max-w-xl mx-auto shadow-lg shadow-black/40">
              {(
                [
                  { id: 'feed', label: 'Subject Feed', icon: BookOpen },
                  { id: 'community', label: 'Discussion Rooms', icon: MessageSquare },
                  { id: 'contests', label: 'Assessments', icon: Award },
                  { id: 'challenges', label: 'Code Labs', icon: Code2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeScopedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveScopedTab(tab.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                      isActive
                        ? 'text-white'
                        : 'text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeClassroomTabPill"
                        className="absolute inset-0 bg-gradient-to-b from-[#42a5ff] via-[#0A84FF] to-[#0062cc] rounded-xl shadow-[0_4px_16px_rgba(10,132,255,0.4)] border border-white/20"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ═════════════════════════════════════════════════════════════
               TAB 1: SUBJECT FEED (HOME FEED PARITY)
            ═════════════════════════════════════════════════════════════ */}
            {activeScopedTab === 'feed' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Faculty Post Creation Button */}
                {isFaculty && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsNewPostOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post to Class Feed</span>
                    </button>
                  </div>
                )}

                {/* Posts Stream */}
                <div className="space-y-5">
                  {posts.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] p-6">
                      <BookOpen className="w-8 h-8 text-blue-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[var(--x-text)]">No posts in this subject feed yet</p>
                      <p className="text-xs text-[var(--x-subtext)] mt-1">
                        {isFaculty
                          ? 'Click "+ Post to Class Feed" to publish lecture slides, announcements, or videos.'
                          : 'Check back soon for instructor updates and study materials.'}
                      </p>
                    </div>
                  ) : (
                    posts.map((p) => {
                      const isLong = p.content && p.content.length > 180;
                      const isExpanded = expandedPosts[p.id];
                      const comments = commentsMap[p.id] || [];

                      return (
                        <article
                          key={p.id}
                          className="p-5 sm:p-6 rounded-[28px] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] backdrop-blur-xl border border-[var(--x-border)] transition-all shadow-lg space-y-3.5"
                        >
                          {/* Post Header: Avatar, Name, Instructor Tag, Relative Time */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.user_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=faculty'}
                                alt={p.user_name}
                                className="w-10 h-10 rounded-full bg-[var(--x-surface)] border border-[var(--x-border)] object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[var(--x-text)]">{p.user_name}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-[#0A84FF]/20 text-[#38a6ff] text-[10px] font-extrabold uppercase border border-[var(--x-border)]">
                                    Instructor
                                  </span>
                                  <span className="text-neutral-500 text-xs">·</span>
                                  <span className="text-xs text-[var(--x-subtext)]">
                                    {formatDate(p.created_at)}
                                  </span>
                                </div>
                                <span className="text-[11px] text-blue-600 dark:text-blue-300 font-medium">
                                  {selectedClassroom.subject_code} Official Update
                                </span>
                              </div>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-[var(--x-border)]">
                              {p.post_type}
                            </span>
                          </div>

                          {/* Post Title */}
                          {p.title && (
                            <h3 className="text-base font-bold text-[var(--x-text)] tracking-tight">
                              {p.title}
                            </h3>
                          )}

                          {/* Post Content with Truncation Algorithm */}
                          <div className="text-[13px] sm:text-[13.5px] text-[var(--x-text)] leading-relaxed whitespace-pre-line break-words">
                            {isLong && !isExpanded ? (
                              <>
                                <span>{p.content.slice(0, 180).trim()}... </span>
                                <button
                                  onClick={() => setExpandedPosts((prev) => ({ ...prev, [p.id]: true }))}
                                  className="text-[#38a6ff] hover:underline cursor-pointer font-medium text-[13px]"
                                >
                                  Show more
                                </button>
                              </>
                            ) : (
                              <>
                                <span>{p.content}</span>
                                {isLong && (
                                  <button
                                    onClick={() => setExpandedPosts((prev) => ({ ...prev, [p.id]: false }))}
                                    className="text-[#38a6ff] hover:underline ml-2 cursor-pointer font-medium text-[12px]"
                                  >
                                    Show less
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Hashtags */}
                          {p.tags && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {p.tags.split(',').map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs font-semibold text-[#38a6ff] hover:underline cursor-pointer"
                                >
                                  #{t.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Rich YouTube Video & Thumbnail Card */}
                          {(() => {
                            const detectedId = extractYouTubeVideoId(p.youtube_url) || extractYouTubeVideoId(p.content);
                            const effectiveThumb = p.image_url || (detectedId ? `https://img.youtube.com/vi/${detectedId}/hqdefault.jpg` : null);
                            const effectiveUrl = p.youtube_url || (detectedId ? `https://www.youtube.com/watch?v=${detectedId}` : null);

                            if (!effectiveThumb && !effectiveUrl) return null;

                            return (
                              <div className="mt-3 rounded-2xl overflow-hidden bg-[var(--x-surface)] border border-[var(--x-border)] w-full shadow-lg">
                                <div className="relative w-full aspect-video sm:max-h-[380px] overflow-hidden group/yt bg-neutral-900 flex items-center justify-center">
                                  {effectiveThumb ? (
                                    <img
                                      src={effectiveThumb}
                                      alt={p.title || 'Lecture video thumbnail'}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover/yt:scale-105"
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
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A3D78]/40 to-[#051329]">
                                      <YoutubeIcon className="w-16 h-16 text-red-500/80" />
                                    </div>
                                  )}

                                  {effectiveUrl && (
                                    <a
                                      href={effectiveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="absolute inset-0 flex items-center justify-center media-scrim transition-colors"
                                    >
                                      <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-black/70 group-hover/yt:scale-110 group-hover/yt:bg-red-600 transition-all btn-keep-white">
                                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                                      </div>
                                    </a>
                                  )}

                                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg video-badge backdrop-blur-sm text-[10px] font-bold uppercase flex items-center gap-1.5 shadow pointer-events-none">
                                    <YoutubeIcon className="w-3.5 h-3.5 text-[#FF3B30]" />
                                    <span>Video Lecture</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-[var(--x-surface)] border-t border-[var(--x-border)] flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-semibold text-[var(--x-text)] truncate">{p.title || 'Video Lecture Resource'}</p>
                                    <p className="text-[11px] text-[var(--x-subtext)] truncate">{effectiveUrl || 'YouTube Video'}</p>
                                  </div>
                                  {effectiveUrl && (
                                    <a
                                      href={effectiveUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3.5 py-1.5 rounded-full bg-[#FF3B30] hover:bg-[#e0342a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 shadow btn-keep-white"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Watch Lecture</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Attachment Link */}
                          {p.attachment_url && (
                            <a
                              href={p.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-[#38a6ff] transition-all border border-[var(--x-border)]"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Course Attachment</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Side-by-Side Action Bar: Comment, Repost, Like, Share */}
                          <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-[var(--x-border)] text-[var(--x-subtext)] text-xs select-none">
                            {/* Comment */}
                            <button
                              onClick={() => toggleComments(p.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[var(--x-surface-hover)] transition-colors group cursor-pointer ${
                                activeCommentsPostId === p.id ? 'text-[#38a6ff]' : 'hover:text-[#38a6ff]'
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-semibold">{p.comments_count || 0}</span>
                            </button>

                            {/* Repost */}
                            <button
                              onClick={() => handleRepostPost(p.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[var(--x-surface-hover)] hover:text-[#00ba7c] transition-colors group cursor-pointer"
                            >
                              <Repeat2 className="w-4 h-4" />
                              <span className="font-semibold">{p.reposts_count || 0}</span>
                            </button>

                            {/* Like */}
                            <button
                              onClick={() => handleLikePost(p.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[var(--x-surface-hover)] transition-colors group cursor-pointer ${
                                p.is_liked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${p.is_liked ? 'fill-[#f91880]' : ''}`} />
                              <span className="font-semibold">{p.likes_count || 0}</span>
                            </button>

                            {/* Share */}
                            <button
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(window.location.href);
                                }
                              }}
                              title="Copy Link to Post"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[var(--x-surface-hover)] hover:text-[#38a6ff] transition-colors group cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Expandable Comments Drawer */}
                          <AnimatePresence>
                            {activeCommentsPostId === p.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-[var(--x-border)] space-y-3 overflow-hidden"
                              >
                                {/* Comment submission input */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddComment(p.id);
                                    }}
                                    placeholder="Add a class comment or ask a doubt..."
                                    className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                                  />
                                  <button
                                    onClick={() => handleAddComment(p.id)}
                                    disabled={isSubmittingComment || !newCommentText.trim()}
                                    className="px-3 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer disabled:opacity-50 btn-keep-white"
                                  >
                                    Post
                                  </button>
                                </div>

                                {commentError && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px]">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                                    <span>{commentError}</span>
                                  </div>
                                )}

                                {/* Comments list */}
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                  {comments.length === 0 ? (
                                    <p className="text-[11px] text-[var(--x-subtext)] italic py-2">No comments yet. Start the discussion!</p>
                                  ) : (
                                    comments.map((c) => (
                                      <div key={c.id} className="p-2.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-[var(--x-text)]">{c.user_name}</span>
                                          <span className="text-[10px] text-[var(--x-subtext)]">{formatDate(c.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-[var(--x-subtext)]">{c.comment_text}</p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               TAB 2: DISCUSSION ROOMS (OUTSIDE COMMUNITIES PARITY)
            ═════════════════════════════════════════════════════════════ */}
            {activeScopedTab === 'community' && (
              <div className="max-w-5xl mx-auto rounded-[32px] bg-[var(--x-surface)]/80 backdrop-blur-2xl border border-[var(--x-border)] h-[620px] flex overflow-hidden shadow-2xl">
                {/* Channels Sidebar on Left */}
                <aside className="w-64 border-r border-[var(--x-border)] bg-[var(--x-surface)] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="p-4 border-b border-[var(--x-border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#38a6ff]" />
                        <span className="font-extrabold text-xs text-[var(--x-text)]">Channels</span>
                      </div>
                      {isFaculty && (
                        <button
                          onClick={() => setIsNewChannelModalOpen(true)}
                          className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-[#38a6ff] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-[var(--x-border)]"
                          title="Faculty Only: Create new discussion channel"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New</span>
                        </button>
                      )}
                    </div>

                    {/* Channels List */}
                    <div className="p-2 space-y-1">
                      {channels.map((chan) => {
                        const isSelected = selectedChannel?.id === chan.id;
                        return (
                          <button
                            key={chan.id}
                            onClick={() => handleSelectChannel(chan)}
                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0A84FF] text-white shadow-md shadow-blue-500/25 btn-keep-white'
                                : 'text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)]'
                            }`}
                          >
                            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            <span className="truncate">{chan.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 border-t border-[var(--x-border)] text-[11px] text-blue-600 dark:text-blue-200/60 text-center font-medium">
                    {isFaculty ? '🏛️ Faculty Creator Controls' : '🎓 Enrolled Student Chat'}
                  </div>
                </aside>

                {/* Active Chat Stream on Right */}
                <section className="flex-1 flex flex-col justify-between bg-[var(--x-bg)]">
                  {/* Channel Header */}
                  <div className="p-4 border-b border-[var(--x-border)] bg-[var(--x-surface)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[#38a6ff]" />
                      <span className="font-bold text-sm text-[var(--x-text)]">
                        {selectedChannel ? selectedChannel.name : 'Select a channel'}
                      </span>
                      <span className="text-xs text-[var(--x-subtext)]">• {channelMessages.length} messages</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Synchronized
                    </span>
                  </div>

                  {/* Messages Log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {channelMessages.length === 0 ? (
                      <div className="py-24 text-center text-[var(--x-subtext)] text-xs">
                        No messages in #{selectedChannel?.name || 'this channel'} yet.
                      </div>
                    ) : (
                      channelMessages.map((m) => {
                        const isSelf = m.user_id === user?.id;
                        const isMsgFaculty = m.role === 'faculty';

                        return (
                          <div
                            key={m.id}
                            className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}
                          >
                            <img
                              src={m.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.user_name}`}
                              alt={m.user_name}
                              className="w-8 h-8 rounded-full bg-[var(--x-surface)] border border-[var(--x-border)] object-cover flex-shrink-0"
                            />
                            <div className={`max-w-[78%] space-y-1 ${isSelf ? 'items-end' : ''}`}>
                              <div className={`flex items-center gap-2 text-[11px] ${isSelf ? 'justify-end' : ''}`}>
                                <span className="font-bold text-[var(--x-text)]">{m.user_name}</span>
                                {isMsgFaculty && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-[#38a6ff] text-[9px] font-extrabold uppercase border border-[var(--x-border)]">
                                    Instructor
                                  </span>
                                )}
                                <span className="text-[var(--x-subtext)]">{formatDate(m.created_at)}</span>
                              </div>

                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isSelf
                                    ? 'bg-[#0A84FF] text-white rounded-tr-none btn-keep-white'
                                    : 'bg-[var(--x-surface)] text-[var(--x-text)] border border-[var(--x-border)] rounded-tl-none'
                                }`}
                              >
                                <p className="whitespace-pre-line">{m.text}</p>
                                {m.code_snippet && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-neutral-900 font-mono text-[11px] text-emerald-300 border border-emerald-500/30 overflow-x-auto">
                                    <pre>{m.code_snippet}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--x-border)] bg-[var(--x-surface)] space-y-2">
                    {chatError && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                        <span>{chatError}</span>
                      </div>
                    )}
                    {showCodeInput && (
                      <textarea
                        rows={3}
                        value={chatSnippet}
                        onChange={(e) => setChatSnippet(e.target.value)}
                        placeholder="Paste code snippet here..."
                        className="w-full px-3 py-2 rounded-xl bg-black/80 border border-emerald-500/30 font-mono text-xs text-emerald-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(!showCodeInput)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          showCodeInput
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                            : 'bg-[var(--x-surface-hover)] border-[var(--x-border)] text-[var(--x-subtext)] hover:text-[var(--x-text)]'
                        }`}
                        title="Toggle Code Snippet"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          isFaculty
                            ? `Broadcast update to #${selectedChannel?.name || 'channel'}...`
                            : `Message #${selectedChannel?.name || 'channel'}...`
                        }
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                      />

                      <button
                        type="submit"
                        disabled={isSendingMsg || (!chatInput.trim() && !chatSnippet.trim())}
                        className="px-4 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 btn-keep-white"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               TAB 3: ASSESSMENTS / CONTESTS (OUTSIDE CONTESTS PARITY)
            ═════════════════════════════════════════════════════════════ */}
            {activeScopedTab === 'contests' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                {isFaculty && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsNewQuizOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95 btn-keep-white"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ New Assessment Contest</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  {quizzes.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] p-6">
                      <Award className="w-8 h-8 text-blue-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[var(--x-text)]">No assessments scheduled yet</p>
                      <p className="text-xs text-[var(--x-subtext)] mt-1">
                        {isFaculty
                          ? 'Publish timed quizzes to test student comprehension with negative marking (+4 / -1).'
                          : 'Your faculty will announce course midterms and assessments here.'}
                      </p>
                    </div>
                  ) : (
                    quizzes.map((q) => (
                      <div
                        key={q.id}
                        className="p-5 sm:p-6 rounded-[28px] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] backdrop-blur-xl border border-[var(--x-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md dark:shadow-lg"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                              Assessment
                            </span>
                            <span className="text-xs text-[var(--x-subtext)] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                              {q.duration_minutes} Mins
                            </span>
                            <span className="text-xs text-[var(--x-subtext)]">• {q.total_marks} Marks</span>
                            <span className="text-xs text-[var(--x-subtext)]">• Marking: +4 / -1</span>
                          </div>

                          <h4 className="text-base font-bold text-[var(--x-text)] tracking-tight">{q.title}</h4>
                          <p className="text-xs text-[var(--x-subtext)]">{q.description}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {q.attempted ? (
                            <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Score: {q.user_score} / {q.total_marks}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartQuiz(q)}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95 btn-keep-white"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start Assessment</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
               TAB 4: CODE LABS / CHALLENGES (OUTSIDE CODE LAB PARITY)
            ═════════════════════════════════════════════════════════════ */}
            {activeScopedTab === 'challenges' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                {isFaculty && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsNewProblemOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95 btn-keep-white"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Assign Lab Challenge</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  {problems.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)] p-6">
                      <Code2 className="w-8 h-8 text-blue-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[var(--x-text)]">No lab challenges assigned yet</p>
                      <p className="text-xs text-[var(--x-subtext)] mt-1">
                        {isFaculty
                          ? 'Click "+ Assign Lab Challenge" to publish programming problems evaluated via sandbox compiler.'
                          : 'Your faculty will assign coding challenges here.'}
                      </p>
                    </div>
                  ) : (
                    problems.map((p) => (
                        <div
                          key={p.id}
                          className="p-5 sm:p-6 rounded-[28px] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] backdrop-blur-xl border border-[var(--x-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md dark:shadow-lg"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  p.difficulty === 'Easy'
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : p.difficulty === 'Medium'
                                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {p.difficulty}
                              </span>
                              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">{p.category}</span>
                              <span className="text-xs text-[var(--x-subtext)]">• Assigned by {p.created_by}</span>
                            </div>

                            <h4 className="text-base font-bold text-[var(--x-text)] tracking-tight">{p.title}</h4>
                            <p className="text-xs text-[var(--x-subtext)] line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenProblem(p)}
                            className="px-5 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95 flex-shrink-0 btn-keep-white"
                          >
                            <Code2 className="w-4 h-4" />
                            <span>Solve Challenge</span>
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             CLASSROOM CATALOG & PORTAL HUB
          ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-8">
            {/* Faculty Pending Join Requests Panel */}
            {isFaculty && allPendingRequests.length > 0 && (
              <div className="p-6 sm:p-7 rounded-[32px] bg-[var(--x-surface)] backdrop-blur-2xl border border-[var(--x-border)] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#38a6ff] font-extrabold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4" />
                    <span>Pending Student Admissions ({allPendingRequests.length})</span>
                  </div>
                  <span className="text-[11px] text-[var(--x-subtext)]">
                    Review and decide student enrollments
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPendingRequests.map((req) => (
                    <div
                      key={req.member_id}
                      className="p-4 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={req.student_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.student_name}`}
                          alt={req.student_name}
                          className="w-10 h-10 rounded-full bg-neutral-900 border border-[var(--x-border)] flex-shrink-0 object-cover"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--x-text)] truncate">
                            {req.student_name}
                          </h4>
                          <p className="text-[11px] text-[var(--x-subtext)] truncate">
                            {req.student_handle} • {req.student_college || 'Student'}
                          </p>
                          <span className="text-[10px] text-blue-600 dark:text-blue-300 font-mono">
                            ID: {req.classroom_id.slice(0, 10)}...
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleFacultyDecision(req.classroom_id, req.member_id, 'accept')}
                          disabled={actionLoadingId === req.member_id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50 btn-keep-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === req.member_id ? 'Accepting...' : 'Accept'}</span>
                        </button>
                        <button
                          onClick={() => handleFacultyDecision(req.classroom_id, req.member_id, 'reject')}
                          disabled={actionLoadingId === req.member_id}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--x-surface)] hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 text-[var(--x-subtext)] text-xs font-bold cursor-pointer border border-[var(--x-border)] active:scale-95 disabled:opacity-50"
                          title="Decline request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subjects Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[var(--x-text)]">
                  {isFaculty ? 'Your Created Subjects' : 'My Enrolled Subjects'}
                </h3>
                <span className="text-xs text-[var(--x-subtext)]">
                  {classrooms.length} {classrooms.length === 1 ? 'subject' : 'subjects'}
                </span>
              </div>

              {isLoading ? (
                <div className="py-20 text-center text-[var(--x-subtext)] text-xs">Loading subjects...</div>
              ) : classrooms.length === 0 ? (
                <div className="py-20 text-center space-y-3 rounded-3xl bg-[var(--x-surface)] border border-[var(--x-border)]">
                  <GraduationCap className="w-8 h-8 text-blue-400/40 mx-auto" />
                  <p className="text-xs text-[var(--x-subtext)]">
                    {isFaculty
                      ? 'No subjects created yet. Click "Add Subject" above to publish your first classroom.'
                      : 'You are not enrolled in any subjects yet. Click "Join Subject" above to enter a 32-digit ID.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {classrooms.map((c) => {
                    const isEnrolled = c.member_status === 'accepted';
                    const isPending = c.member_status === 'pending';

                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (isEnrolled || isFaculty) {
                            setSelectedClassroom(c);
                          }
                        }}
                        className="rounded-[30px] bg-[var(--x-surface)] hover:bg-[var(--x-surface-hover)] backdrop-blur-xl border border-[var(--x-border)] hover:border-blue-400/40 transition-all flex flex-col overflow-hidden group shadow-md dark:shadow-xl cursor-pointer"
                      >
                        {/* Subject Card Banner */}
                        <div
                          className={`p-5 bg-gradient-to-r ${
                            sanitizeBlueGradient(c.cover_gradient)
                          } text-white space-y-2 relative`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-lg bg-[var(--x-surface-hover)] text-[11px] font-mono font-bold tracking-wider text-[#38a6ff] border border-[var(--x-border)]">
                              {c.subject_code}
                            </span>
                            {isPending ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/90 text-black text-[10px] font-extrabold uppercase">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                                {c.university}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-white line-clamp-1 btn-keep-white">
                            {c.name}
                          </h4>
                        </div>

                        {/* Subject Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <p className="text-xs text-[var(--x-subtext)] line-clamp-2 leading-relaxed">
                            {c.description || 'University classroom coursework & syllabus.'}
                          </p>

                          {/* 32-character ID Bar */}
                          <div className="p-2.5 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center justify-between text-[11px] font-mono text-blue-600 dark:text-blue-300">
                            <span className="truncate">
                              ID: {c.id.slice(0, 10)}...{c.id.slice(-6)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(c.id);
                              }}
                              className="p-1 rounded hover:bg-[var(--x-surface-hover)] text-[var(--x-subtext)] hover:text-[var(--x-text)] cursor-pointer"
                              title="Copy 32-digit ID"
                            >
                              {copiedId === c.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="pt-2 border-t border-[var(--x-border)] flex items-center justify-between">
                            <div className="text-[11px] text-[var(--x-subtext)] flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#38a6ff]" />
                              <span>{c.student_count || 0} Enrolled</span>
                            </div>

                            <span className="text-xs font-bold text-[#38a6ff] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              <span>Enter Subject</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── CREATE SUBJECT MODAL ── */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubjectCreated={(newClassroom) => {
          setClassrooms((prev) => [newClassroom, ...prev]);
        }}
      />

      {/* ── JOIN SUBJECT MODAL (STUDENT 32-CHAR ENROLLMENT) ── */}
      <JoinSubjectModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSelectClassroom={(classroom) => {
          setSelectedClassroom(classroom);
        }}
        onJoinSuccess={() => {
          loadClassrooms();
        }}
      />

      {/* ── FACULTY NEW POST MODAL (MILD BLUE FROST) ── */}
      <AnimatePresence>
        {isNewPostOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewPostOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl rounded-[32px] p-6 sm:p-7 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl z-10 space-y-4 text-[var(--x-text)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#38a6ff]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--x-text)]">Create Class Post</h3>
                    <p className="text-[11px] text-[var(--x-subtext)]">Broadcast to enrolled students</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewPostOpen(false)}
                  className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishPost} className="space-y-3">
                {postError && (
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{postError}</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Post Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'announcement', label: 'Announcement' },
                        { id: 'youtube_course', label: 'Video Lecture' },
                        { id: 'resource', label: 'Resource' }
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewPostType(t.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          newPostType === t.id
                            ? 'bg-[#0A84FF] text-white shadow-md btn-keep-white'
                            : 'bg-[var(--x-bg)] text-[var(--x-subtext)] hover:text-[var(--x-text)] border border-[var(--x-border)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Heading / Title</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="e.g. Lecture 06: B-Trees and Concurrency Controls"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                {newPostType === 'youtube_course' && (
                  <div>
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={newPostYoutube}
                      onChange={(e) => setNewPostYoutube(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                )}

                {/* Live YouTube Thumbnail Extraction Preview */}
                {(() => {
                  const modalYtId = extractYouTubeVideoId(newPostYoutube) || extractYouTubeVideoId(newPostContent);
                  if (!modalYtId) return null;
                  return (
                    <div className="p-3 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] flex items-center gap-3">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-[var(--x-surface-hover)] flex-shrink-0 border border-[var(--x-border)]">
                        <img
                          src={`https://img.youtube.com/vi/${modalYtId}/hqdefault.jpg`}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src.includes('hqdefault.jpg')) {
                              target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center media-scrim">
                          <Play className="w-4 h-4 text-white fill-current btn-keep-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-500 font-mono uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Thumbnail Extracted
                        </span>
                        <p className="text-xs text-[var(--x-text)] font-medium truncate mt-0.5">Video ID: {modalYtId}</p>
                        <p className="text-[11px] text-[var(--x-subtext)] truncate">Card will display in the subject feed</p>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Content & Instructions</label>
                  <textarea
                    rows={4}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Provide details, reading material, or instructions..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                    placeholder="Lecture06, Concurrency, Algorithms"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPublishingPost}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/30 btn-keep-white"
                >
                  {isPublishingPost ? 'Publishing...' : 'Publish to Feed'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACULTY NEW CHANNEL MODAL ── */}
      <AnimatePresence>
        {isNewChannelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChannelModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md rounded-[32px] p-6 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl z-10 space-y-4 text-[var(--x-text)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-[#38a6ff]" />
                  <h3 className="text-base font-bold text-[var(--x-text)]">Create Discussion Channel</h3>
                </div>
                <button
                  onClick={() => setIsNewChannelModalOpen(false)}
                  className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Channel Name</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-[var(--x-subtext)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g. project-submissions"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Channel Type</label>
                  <select
                    value={newChannelType}
                    onChange={(e: any) => setNewChannelType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                  >
                    <option value="general">General Discussion</option>
                    <option value="doubts">Doubt Clearing</option>
                    <option value="announcement">Announcements</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingChannel}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer disabled:opacity-50 btn-keep-white"
                >
                  {isCreatingChannel ? 'Creating...' : 'Create Channel'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACULTY NEW QUIZ MODAL ── */}
      <AnimatePresence>
        {isNewQuizOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewQuizOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl rounded-[32px] p-6 bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0A84FF]" />
                  <h3 className="text-base font-bold text-[var(--x-text)]">Create Assessment Contest</h3>
                </div>
                <button
                  onClick={() => setIsNewQuizOpen(false)}
                  className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishQuiz} className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block">Contest Title</label>
                    <input
                      type="text"
                      required
                      value={newQuizTitle}
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="e.g. Midterm: Trees & Graph Theory"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block">Duration (Mins)</label>
                    <input
                      type="number"
                      value={newQuizDuration}
                      onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block">Assessment Question</label>
                  <textarea
                    rows={2}
                    required
                    value={newQuizQ1Text}
                    onChange={(e) => setNewQuizQ1Text(e.target.value)}
                    placeholder="Enter question statement..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newQuizQ1Opt0}
                    onChange={(e) => setNewQuizQ1Opt0(e.target.value)}
                    placeholder="Option A"
                    className="px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                  />
                  <input
                    type="text"
                    required
                    value={newQuizQ1Opt1}
                    onChange={(e) => setNewQuizQ1Opt1(e.target.value)}
                    placeholder="Option B"
                    className="px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                  />
                  <input
                    type="text"
                    required
                    value={newQuizQ1Opt2}
                    onChange={(e) => setNewQuizQ1Opt2(e.target.value)}
                    placeholder="Option C"
                    className="px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                  />
                  <input
                    type="text"
                    required
                    value={newQuizQ1Opt3}
                    onChange={(e) => setNewQuizQ1Opt3(e.target.value)}
                    placeholder="Option D"
                    className="px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--x-subtext)]">Correct Option:</span>
                  {[0, 1, 2, 3].map((idx) => (
                    <label key={idx} className="flex items-center gap-1 text-xs text-[var(--x-text)] cursor-pointer">
                      <input
                        type="radio"
                        name="correct_quiz_opt"
                        checked={newQuizQ1Correct === idx}
                        onChange={() => setNewQuizQ1Correct(idx)}
                      />
                      <span>Option {['A', 'B', 'C', 'D'][idx]}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isPublishingQuiz}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer disabled:opacity-50 btn-keep-white"
                >
                  {isPublishingQuiz ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACULTY NEW PROBLEM MODAL ── */}
      <AnimatePresence>
        {isNewProblemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProblemOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl rounded-[32px] p-6 bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#0A84FF]" />
                  <h3 className="text-base font-bold text-[var(--x-text)]">Assign Lab Challenge</h3>
                </div>
                <button
                  onClick={() => setIsNewProblemOpen(false)}
                  className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishProblem} className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block">Problem Title</label>
                    <input
                      type="text"
                      required
                      value={newProbTitle}
                      onChange={(e) => setNewProbTitle(e.target.value)}
                      placeholder="e.g. Reverse Linked List in K Groups"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block">Difficulty</label>
                    <select
                      value={newProbDifficulty}
                      onChange={(e: any) => setNewProbDifficulty(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={newProbDesc}
                    onChange={(e) => setNewProbDesc(e.target.value)}
                    placeholder="Describe problem statement and requirements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Sample Input</label>
                    <input
                      type="text"
                      value={newProbSampleInput}
                      onChange={(e) => setNewProbSampleInput(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--x-subtext)] block mb-1">Sample Output</label>
                    <input
                      type="text"
                      value={newProbSampleOutput}
                      onChange={(e) => setNewProbSampleOutput(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPublishingProblem}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold cursor-pointer disabled:opacity-50 btn-keep-white"
                >
                  {isPublishingProblem ? 'Assigning...' : 'Assign Challenge'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STUDENT ASSESSMENT RUNNER MODAL ── */}
      <AnimatePresence>
        {activeQuizToTake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl h-[85vh] rounded-[32px] bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] flex flex-col overflow-hidden shadow-2xl z-10"
            >
              {/* Header with Timer */}
              <div className="px-6 py-4 border-b border-[var(--x-border)] bg-[var(--x-surface)] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--x-text)]">{activeQuizToTake.title}</h3>
                  <p className="text-xs text-[var(--x-subtext)]">Marking: +4 for correct, -1 for wrong</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#0A84FF] font-mono text-sm font-extrabold flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatExamTime(quizSecondsLeft)}</span>
                  </div>

                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 btn-keep-white"
                  >
                    {isSubmittingQuiz ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex overflow-hidden">
                {quizResult ? (
                  /* Evaluation Result Card */
                  <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-[var(--x-text)]">Assessment Submitted!</h2>
                    <p className="text-sm text-[var(--x-subtext)]">
                      Your score: <span className="font-extrabold text-[#0A84FF] text-xl">{quizResult.score}</span> / {quizResult.max_marks}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-500 font-semibold">Correct: {quizResult.correct_count}</span>
                      <span className="text-rose-500 font-semibold">Incorrect: {quizResult.incorrect_count}</span>
                      <span className="text-[var(--x-subtext)]">Accuracy: {quizResult.accuracy}%</span>
                    </div>
                    <button
                      onClick={() => setActiveQuizToTake(null)}
                      className="px-6 py-2.5 rounded-xl bg-[#0A84FF] text-white text-xs font-bold cursor-pointer mt-4 btn-keep-white"
                    >
                      Close Assessment
                    </button>
                  </div>
                ) : (
                  /* Active Questions */
                  <div className="flex-1 flex">
                    <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                      {activeQuizToTake.questions && activeQuizToTake.questions[currentQIndex] && (
                        <div className="space-y-4">
                          <span className="text-xs text-[#0A84FF] font-bold uppercase tracking-wider">
                            Question {currentQIndex + 1} of {activeQuizToTake.questions.length}
                          </span>
                          <h4 className="text-base font-semibold text-[var(--x-text)] leading-relaxed">
                            {activeQuizToTake.questions[currentQIndex].question || activeQuizToTake.questions[currentQIndex].question_text}
                          </h4>

                          <div className="space-y-2.5 pt-2">
                            {activeQuizToTake.questions[currentQIndex].options.map((opt, oIdx) => {
                              const qId = activeQuizToTake.questions[currentQIndex].id;
                              const isSelected = quizAnswers[qId] === oIdx;

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => setQuizAnswers((prev) => ({ ...prev, [qId]: oIdx }))}
                                  className={`w-full p-4 rounded-2xl text-xs font-medium text-left flex items-center gap-3 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0A84FF]/15 border border-[#0A84FF] text-[var(--x-text)] shadow-md'
                                      : 'bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-text)] hover:bg-[var(--x-surface-hover)]'
                                  }`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                      isSelected ? 'bg-[#0A84FF] text-white btn-keep-white' : 'bg-[var(--x-surface-hover)] text-[var(--x-subtext)]'
                                    }`}
                                  >
                                    {['A', 'B', 'C', 'D'][oIdx]}
                                  </div>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question Palette Sidebar */}
                    <div className="w-56 border-l border-[var(--x-border)] bg-[var(--x-surface)] p-4 space-y-3">
                      <span className="text-xs font-bold text-[var(--x-text)] block">Question Palette</span>
                      <div className="grid grid-cols-4 gap-2">
                        {activeQuizToTake.questions?.map((q, idx) => {
                          const isAnswered = quizAnswers[q.id] !== undefined;
                          const isCurrent = idx === currentQIndex;

                          return (
                            <button
                              key={q.id}
                              onClick={() => setCurrentQIndex(idx)}
                              className={`h-9 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                isCurrent
                                  ? 'ring-2 ring-blue-500 bg-[#0A84FF] text-white btn-keep-white'
                                  : isAnswered
                                  ? 'bg-emerald-600 text-white btn-keep-white'
                                  : 'bg-[var(--x-bg)] border border-[var(--x-border)] text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)]'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STUDENT CODING RUNNER MODAL ── */}
      <AnimatePresence>
        {activeProblemToSolve && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[88vh] rounded-[32px] bg-[var(--x-surface)] border border-[var(--x-border)] text-[var(--x-text)] flex flex-col overflow-hidden shadow-2xl z-10"
            >
              {/* Top Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--x-border)] bg-[var(--x-surface)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-[#0A84FF]">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--x-text)]">{activeProblemToSolve.title}</h3>
                    <p className="text-xs text-[var(--x-subtext)]">{activeProblemToSolve.category} • {activeProblemToSolve.difficulty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  <select
                    value={problemLang}
                    onChange={(e: any) => {
                      const newLang = e.target.value;
                      setProblemLang(newLang);
                      const t = activeProblemToSolve.starter_templates?.[newLang] || (newLang === 'cpp' ? '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n' : newLang === 'java' ? 'public class Solution {\n    public static void main(String[] args) {\n    }\n}\n' : '# Write your solution here\n');
                      setProblemCode(t);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-bold text-[var(--x-text)] focus:outline-none cursor-pointer"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="cpp">C++ (G++ 17)</option>
                    <option value="java">Java (OpenJDK 17)</option>
                  </select>

                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode || isSubmittingCode}
                    className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md btn-keep-white"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    onClick={handleSubmitProblemCode}
                    disabled={isRunningCode || isSubmittingCode}
                    className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-blue-500/30 btn-keep-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingCode ? 'Judging...' : 'Submit Solution'}</span>
                  </button>

                  <button
                    onClick={() => setActiveProblemToSolve(null)}
                    className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Split Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Problem Statement */}
                <div className="w-1/2 p-6 border-r border-[var(--x-border)] overflow-y-auto space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider">Description</h4>
                    <p className="text-xs text-[var(--x-text)] leading-relaxed whitespace-pre-line">
                      {activeProblemToSolve.description}
                    </p>
                  </div>

                  {activeProblemToSolve.constraints && (
                    <div className="space-y-1.5 pt-2 border-t border-[var(--x-border)]">
                      <h4 className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider">Constraints</h4>
                      <p className="text-xs text-[var(--x-subtext)] font-mono">{activeProblemToSolve.constraints}</p>
                    </div>
                  )}

                  {activeProblemToSolve.sample_cases && (
                    <div className="space-y-2 pt-2 border-t border-[var(--x-border)]">
                      <h4 className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider">Sample Cases</h4>
                      {activeProblemToSolve.sample_cases.map((sc, scIdx) => (
                        <div key={scIdx} className="p-3 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-[var(--x-subtext)] block">Input:</span>
                            <pre className="text-[var(--x-text)]">{sc.input}</pre>
                          </div>
                          <div>
                            <span className="text-[var(--x-subtext)] block">Output:</span>
                            <pre className="text-emerald-600 dark:text-emerald-400 font-semibold">{sc.output}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Editor & Console Output */}
                <div className="w-1/2 flex flex-col">
                  {/* Monaco Editor */}
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      language={problemLang}
                      theme={theme === 'light' ? 'vs' : 'vs-dark'}
                      value={problemCode}
                      onChange={(val) => setProblemCode(val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12 }
                      }}
                    />
                  </div>

                  {/* Bottom Console Panel */}
                  <div className="h-44 border-t border-[var(--x-border)] bg-[var(--x-bg)] p-3 overflow-y-auto font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--x-border)] text-[11px] text-[var(--x-subtext)]">
                      <span>Console & Execution Verdict</span>
                      {codeRunResult && (
                        <span
                          className={`font-bold uppercase ${
                            codeRunResult.verdict === 'Accepted'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {codeRunResult.verdict} ({codeRunResult.passed_count}/{codeRunResult.total_count} Passed)
                        </span>
                      )}
                    </div>

                    <div className="pt-2 text-xs">
                      {isRunningCode ? (
                        <p className="text-[#0A84FF] animate-pulse">Running solution against compiler sandbox...</p>
                      ) : codeRunResult ? (
                        <div className="space-y-1.5">
                          {codeRunResult.results.map((r, rIdx) => (
                            <div key={rIdx} className="space-y-0.5">
                              <p className={r.passed ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                Test Case #{r.case_number}: {r.passed ? 'PASSED' : 'FAILED'}
                              </p>
                              {!r.passed && (
                                <div className="text-[11px] text-[var(--x-subtext)] pl-2">
                                  <p>Expected: {r.expected_output}</p>
                                  <p>Actual: {r.actual_output}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--x-subtext)]">Run code to see sandbox evaluation.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CLASSROOM NOTIFICATION DRAWER ── */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onRefreshUnread={() => {
          loadClassrooms();
        }}
        onSelectClassroom={(cid) => {
          const match = classrooms.find((c) => c.id.toLowerCase() === cid.toLowerCase());
          if (match) setSelectedClassroom(match);
          setIsNotifDrawerOpen(false);
        }}
      />
    </div>
  );
};
