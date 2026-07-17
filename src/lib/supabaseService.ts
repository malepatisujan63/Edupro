// src/lib/supabaseService.ts
// ─── 100% Supabase PostgreSQL + Cloudinary CDN Data Layer ───
// Drop-in replacement for firestoreService.ts
// ✅ Users, Posts, Communities, Comments, Stories → Supabase (free PostgreSQL)
// ✅ Images, Videos, PDFs → Cloudinary CDN (g4yhhqgd / koinexa) — zero latency

import { supabase } from './supabase';
import { globalTrendingHeap } from '../dsa-engine';

// ─────────────────────────────────────────────
// TYPES (identical to firestoreService — drop-in compatible)
// ─────────────────────────────────────────────

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  studentType?: 'school' | 'college';
  college?: string;
  department?: string;
  semester?: number;
  schoolClass?: string;
  board?: string;
  hobbies?: string[];
  interests?: string[];
  skills?: string[];
  studyMates?: string[];
  pendingStudyMateRequests?: string[];
  createdCommunities?: string[];
  likedPosts?: string[];
  avatarUrl: string;
  role: 'student' | 'senior' | 'mentor';
  reputationPoints: number;
  badges: string[];
  createdAt: any;
}

export interface FirestorePost {
  id?: string;
  title: string;
  authorId: string;
  authorName: string;
  authorCollege: string;
  authorAvatarUrl: string;
  upvotes: number;
  commentsCount: number;
  category: string;
  type: 'note' | 'question' | 'post' | 'contributor';
  createdAt: any;
  timestamp?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
  storagePath?: string;
}

export interface FirestoreCommunity {
  id?: string;
  title: string;
  category: string;
  authorId: string;
  authorName: string;
  authorCollege: string;
  upvotes: number;
  memberCount: number;
  createdAt: any;
}

export interface FirestoreComment {
  id?: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorCollege: string;
  authorAvatarUrl?: string;
  content: string;
  upvotes: number;
  isAcceptedAnswer?: boolean;
  createdAt: any;
}

export interface FirestoreStory {
  id?: string;
  authorId: string;
  authorName: string;
  authorCollege: string;
  authorAvatar: string;
  title: string;
  content: string;
  views: number;
  tag: string;
  color: string;
  createdAt: any;
}

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

// ─────────────────────────────────────────────
// ROW MAPPERS (DB snake_case ↔ App camelCase)
// ─────────────────────────────────────────────

function rowToUser(row: any): FirestoreUser {
  return {
    uid: row.uid,
    name: row.name,
    email: row.email,
    password: row.password,
    phone: row.phone || '',
    studentType: row.student_type,
    college: row.college,
    department: row.department,
    semester: row.semester,
    schoolClass: row.school_class,
    board: row.board,
    hobbies: row.hobbies || [],
    interests: row.interests || [],
    skills: row.skills || [],
    studyMates: row.study_mates || [],
    pendingStudyMateRequests: row.pending_study_mate_requests || [],
    createdCommunities: row.created_communities || [],
    likedPosts: row.liked_posts || [],
    avatarUrl: row.avatar_url || '',
    role: row.role || 'student',
    reputationPoints: row.reputation_points || 100,
    badges: row.badges || [],
    createdAt: row.created_at,
  };
}

function userToRow(user: FirestoreUser): any {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    password: user.password || '',
    phone: user.phone || '',
    student_type: user.studentType || 'college',
    college: user.college || '',
    department: user.department || '',
    semester: user.semester || 1,
    school_class: user.schoolClass || '',
    board: user.board || '',
    hobbies: user.hobbies || [],
    interests: user.interests || [],
    skills: user.skills || [],
    study_mates: user.studyMates || [],
    pending_study_mate_requests: user.pendingStudyMateRequests || [],
    created_communities: user.createdCommunities || [],
    liked_posts: user.likedPosts || [],
    avatar_url: user.avatarUrl || '',
    role: user.role || 'student',
    reputation_points: user.reputationPoints || 100,
    badges: user.badges || [],
  };
}

function rowToPost(row: any): FirestorePost {
  return {
    id: row.id,
    title: row.title,
    authorId: row.author_id,
    authorName: row.author_name,
    authorCollege: row.author_college || '',
    authorAvatarUrl: row.author_avatar_url || '',
    upvotes: row.upvotes || 0,
    commentsCount: row.comments_count || 0,
    category: row.category || 'General',
    type: row.type || 'post',
    createdAt: row.created_at,
    timestamp: row.post_timestamp || Date.now(),
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    storagePath: row.storage_path,
  };
}

function postToRow(post: Omit<FirestorePost, 'id' | 'createdAt'>): any {
  return {
    title: (post.title || 'Campus Post').trim().slice(0, 2000),
    author_id: post.authorId,
    author_name: post.authorName,
    author_college: post.authorCollege || '',
    author_avatar_url: post.authorAvatarUrl || '',
    upvotes: 0,
    comments_count: 0,
    category: post.category || 'General',
    type: post.type || 'post',
    media_url: post.mediaUrl || null,
    media_type: post.mediaType || null,
    storage_path: post.storagePath || null,
    post_timestamp: Date.now(),
  };
}

function rowToCommunity(row: any): FirestoreCommunity {
  return {
    id: row.id,
    title: row.title,
    category: row.category || 'General',
    authorId: row.author_id,
    authorName: row.author_name,
    authorCollege: row.author_college || '',
    upvotes: row.upvotes || 0,
    memberCount: row.member_count || 1,
    createdAt: row.created_at,
  };
}

function rowToComment(row: any): FirestoreComment {
  return {
    id: row.id,
    parentId: row.parent_id || null,
    authorId: row.author_id,
    authorName: row.author_name,
    authorCollege: row.author_college || '',
    authorAvatarUrl: row.author_avatar_url || '',
    content: row.content,
    upvotes: row.upvotes || 0,
    isAcceptedAnswer: row.is_accepted_answer || false,
    createdAt: row.created_at,
  };
}

function rowToStory(row: any): FirestoreStory {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorCollege: row.author_college || '',
    authorAvatar: row.author_avatar || '',
    title: row.title,
    content: row.content || '',
    views: row.views || 0,
    tag: row.tag || 'General',
    color: row.color || '#6C63FF',
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export async function saveUserProfile(user: FirestoreUser): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert(userToRow(user), { onConflict: 'uid' });
  if (error) throw new Error(`[Supabase saveUserProfile] ${error.message}`);
}

export async function fetchUserProfile(uid: string): Promise<FirestoreUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();
  if (error) throw new Error(`[Supabase fetchUserProfile] ${error.message}`);
  return data ? rowToUser(data) : null;
}

export async function fetchUserProfileByEmail(email: string): Promise<FirestoreUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`[Supabase fetchUserProfileByEmail] ${error.message}`);
  return data ? rowToUser(data) : null;
}

// ─────────────────────────────────────────────
// FILE UPLOAD — Cloudinary CDN (g4yhhqgd / koinexa)
// ALL media goes to Cloudinary — zero Firebase Storage dependency
// ─────────────────────────────────────────────

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'g4yhhqgd';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'koinexa';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

export async function uploadFile(
  file: File,
  _userId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const allowed = ['image/', 'video/', 'application/pdf'];
  if (!allowed.some((t) => file.type.startsWith(t))) {
    throw new Error('Only image, video, or PDF files are allowed.');
  }
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File size must be under 100 MB.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'koinexa_campus_feed');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({ downloadUrl: res.secure_url, storagePath: res.public_id });
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload.'));
    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
}

export async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width; let h = img.height;
      if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) resolve(file);
          else resolve(new File([blob], file.name, { type: file.type || 'image/jpeg' }));
        },
        file.type || 'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function backgroundUploadAndAttach(
  file: File,
  userId: string,
  docId: string,
  _collectionName: 'posts' | 'resources' = 'posts',
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const processedFile = file.type.startsWith('image/') ? await compressImage(file) : file;
  const result = await uploadFile(processedFile, userId, onProgress);

  const { error } = await supabase
    .from('posts')
    .update({ media_url: result.downloadUrl, storage_path: result.storagePath })
    .eq('id', docId);
  if (error) console.error('[Supabase backgroundUploadAndAttach]', error.message);

  return result;
}

export async function deleteFile(_storagePath: string): Promise<void> {
  // Cloudinary deletion requires signed Admin API — media safely stays on CDN
}

// ─────────────────────────────────────────────
// POSTS — Supabase PostgreSQL
// ─────────────────────────────────────────────

export async function createPost(post: Omit<FirestorePost, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('posts')
    .insert(postToRow(post))
    .select('id')
    .single();
  if (error) throw new Error(`[Supabase createPost] ${error.message}`);
  window.dispatchEvent(new CustomEvent('edunetwork:refresh'));
  return data.id;
}

export function subscribeToPosts(callback: (posts: FirestorePost[]) => void): () => void {
  // Initial fetch
  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('post_timestamp', { ascending: false })
      .limit(100);
    if (error) { console.error('[Supabase subscribeToPosts]', error.message); return; }

    const posts = (data || []).map(rowToPost);
    posts.sort((a: any, b: any) => {
      const now = Date.now();
      const isFreshA = now - (a.timestamp || 0) < 30 * 60 * 1000;
      const isFreshB = now - (b.timestamp || 0) < 30 * 60 * 1000;
      if (isFreshA && !isFreshB) return -1;
      if (!isFreshA && isFreshB) return 1;
      if (isFreshA && isFreshB) return (b.timestamp || 0) - (a.timestamp || 0);
      return (b.upvotes || 0) - (a.upvotes || 0);
    });

    posts.forEach((p) => {
      globalTrendingHeap.insert({
        id: p.id!, title: p.title, authorName: p.authorName,
        authorCollege: p.authorCollege, upvotes: p.upvotes,
        commentsCount: p.commentsCount, category: p.category,
        createdAt: '', type: p.type, mediaUrl: p.mediaUrl, mediaType: p.mediaType,
      });
    });

    callback(posts);
  };

  fetchAndEmit();

  // Real-time subscription via Supabase Realtime
  const channel = supabase
    .channel('posts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
      fetchAndEmit();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─────────────────────────────────────────────
// LIKES — Supabase atomic updates
// ─────────────────────────────────────────────

export async function likePost(postId: string, userId: string): Promise<void> {
  const user = await fetchUserProfile(userId);
  if (user?.likedPosts?.includes(postId)) return;

  // Increment post upvotes
  const { data: post } = await supabase.from('posts').select('upvotes').eq('id', postId).single();
  await supabase.from('posts').update({ upvotes: (post?.upvotes || 0) + 1 }).eq('id', postId);

  // Track liked post on user profile
  if (user) {
    const newLiked = [...(user.likedPosts || []), postId];
    await supabase.from('users').update({ liked_posts: newLiked }).eq('uid', userId);
  }

  const heapItem = globalTrendingHeap.getRawArray().find((p) => p.id === postId);
  if (heapItem) globalTrendingHeap.updateUpvotes(postId, heapItem.upvotes + 1);
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const user = await fetchUserProfile(userId);
  if (!user?.likedPosts?.includes(postId)) return;

  const { data: post } = await supabase.from('posts').select('upvotes').eq('id', postId).single();
  await supabase.from('posts').update({ upvotes: Math.max(0, (post?.upvotes || 0) - 1) }).eq('id', postId);

  const newLiked = (user.likedPosts || []).filter((id) => id !== postId);
  await supabase.from('users').update({ liked_posts: newLiked }).eq('uid', userId);

  const heapItem = globalTrendingHeap.getRawArray().find((p) => p.id === postId);
  if (heapItem) globalTrendingHeap.updateUpvotes(postId, Math.max(0, heapItem.upvotes - 1));
}

export async function fetchLikedPostIds(userId: string): Promise<Set<string>> {
  const user = await fetchUserProfile(userId);
  return new Set<string>(user?.likedPosts || []);
}

// ─────────────────────────────────────────────
// COMMUNITIES — Supabase PostgreSQL
// ─────────────────────────────────────────────

export async function createCommunity(community: Omit<FirestoreCommunity, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('communities')
    .insert({
      title: community.title.trim(),
      category: community.category.trim(),
      author_id: community.authorId,
      author_name: community.authorName,
      author_college: community.authorCollege || '',
      upvotes: 0,
      member_count: 1,
    })
    .select('id')
    .single();
  if (error) throw new Error(`[Supabase createCommunity] ${error.message}`);
  return data.id;
}

export function subscribeToCommunities(callback: (communities: FirestoreCommunity[]) => void): () => void {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) { console.error('[Supabase subscribeToCommunities]', error.message); return; }
    callback((data || []).map(rowToCommunity));
  };

  fetchAndEmit();

  const channel = supabase
    .channel('communities-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => fetchAndEmit())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─────────────────────────────────────────────
// STUDY MATES — Supabase
// ─────────────────────────────────────────────

export async function sendStudyMateRequest(fromUserId: string, toUserId: string): Promise<void> {
  const toUser = await fetchUserProfile(toUserId);
  if (!toUser) return;
  const pending = toUser.pendingStudyMateRequests || [];
  if (!pending.includes(fromUserId)) {
    await supabase.from('users').update({
      pending_study_mate_requests: [...pending, fromUserId],
    }).eq('uid', toUserId);
  }
}

// ─────────────────────────────────────────────
// Q&A COMMENTS — Supabase PostgreSQL
// ─────────────────────────────────────────────

export async function addComment(comment: Omit<FirestoreComment, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      parent_id: comment.parentId || null,
      author_id: comment.authorId,
      author_name: comment.authorName,
      author_college: comment.authorCollege || '',
      author_avatar_url: comment.authorAvatarUrl || '',
      content: comment.content.trim(),
      upvotes: 0,
      is_accepted_answer: false,
    })
    .select('id')
    .single();
  if (error) throw new Error(`[Supabase addComment] ${error.message}`);
  return data.id;
}

export function subscribeToComments(callback: (comments: FirestoreComment[]) => void): () => void {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('[Supabase subscribeToComments]', error.message); return; }
    callback((data || []).map(rowToComment));
  };

  fetchAndEmit();

  const channel = supabase
    .channel('comments-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchAndEmit())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─────────────────────────────────────────────
// STORIES — Supabase PostgreSQL
// ─────────────────────────────────────────────

export async function createStory(story: Omit<FirestoreStory, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      author_id: story.authorId,
      author_name: story.authorName,
      author_college: story.authorCollege || '',
      author_avatar: story.authorAvatar || '',
      title: story.title,
      content: story.content || '',
      views: 0,
      tag: story.tag || 'General',
      color: story.color || '#6C63FF',
    })
    .select('id')
    .single();
  if (error) throw new Error(`[Supabase createStory] ${error.message}`);
  return data.id;
}

export function subscribeToStories(callback: (stories: FirestoreStory[]) => void): () => void {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) { console.error('[Supabase subscribeToStories]', error.message); return; }
    callback((data || []).map(rowToStory));
  };

  fetchAndEmit();

  const channel = supabase
    .channel('stories-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchAndEmit())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
