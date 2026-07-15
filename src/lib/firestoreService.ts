// src/lib/firestoreService.ts
// ─── All Firestore + Firebase Storage operations for EduNetwork ───

import {
  collection, doc, setDoc, getDoc, addDoc,
  onSnapshot, query, orderBy, limit,
  serverTimestamp, getDocs, where, runTransaction, arrayUnion, arrayRemove
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { globalTrendingHeap } from '../dsa-engine';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  password?: string; // Optional stored password for email/password login flow
  phone: string;
  
  // Extended Profile Data
  studentType?: 'school' | 'college';
  
  // College Specific
  college?: string;
  department?: string;
  semester?: number;
  
  // School Specific
  schoolClass?: string;
  board?: string;
  
  // Common details
  hobbies?: string[];
  interests?: string[];
  skills?: string[];

  // Social & Community
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
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
  storagePath?: string;   // Firebase Storage path for deletion later
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

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

/** Save a new user profile to Firestore after registration */
export async function saveUserProfile(user: FirestoreUser): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), {
    ...user,
    createdAt: serverTimestamp(),
  });
}

/** Fetch existing user profile by Firebase UID */
export async function fetchUserProfile(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) return { uid, ...snap.data() } as FirestoreUser;
  return null;
}

/** Fetch user profile by Email for custom email/password authentication */
export async function fetchUserProfileByEmail(email: string): Promise<FirestoreUser | null> {
  const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { uid: doc.id, ...doc.data() } as FirestoreUser;
  }
  return null;
}

// ─────────────────────────────────────────────
// FILE UPLOAD — Firebase Storage
// ─────────────────────────────────────────────

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Upload a file to Firebase Storage under /posts/{userId}/{timestamp}_{filename}
 * Returns the public download URL and storage path.
 * Security: only authenticated users can upload; max 50MB; image/video/pdf only.
 */
export async function uploadFile(
  file: File,
  userId: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  // Client-side type guard (Storage Rules enforce server-side too)
  const allowed = ['image/', 'video/', 'application/pdf'];
  if (!allowed.some((t) => file.type.startsWith(t))) {
    throw new Error('Only image, video, or PDF files are allowed.');
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File size must be under 50 MB.');
  }

  const path = `posts/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef = storageRef(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      (error) => reject(new Error(`Upload failed: ${error.message}`)),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadUrl, storagePath: path });
      }
    );
  });
}

/** Delete a file from Firebase Storage by its storage path */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    await deleteObject(storageRef(storage, storagePath));
  } catch {
    // ignore if already deleted
  }
}

// ─────────────────────────────────────────────
// POSTS — Firestore
// ─────────────────────────────────────────────

/**
 * Create a new post in Firestore.
 * Also inserts into the in-memory MaxHeap for instant feed sorting.
 */
export async function createPost(post: Omit<FirestorePost, 'id' | 'createdAt'>): Promise<string> {
  // Sanitise input
  const sanitised = {
    ...post,
    title: post.title.trim().slice(0, 2000),
    upvotes: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'posts'), sanitised);

  window.dispatchEvent(new CustomEvent('edunetwork:refresh'));
  return docRef.id;
}

/**
 * Subscribe to live post feed from Firestore (top 50 by upvotes).
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToPosts(
  callback: (posts: FirestorePost[]) => void
): () => void {
  const q = query(
    collection(db, 'posts'),
    orderBy('upvotes', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const posts: FirestorePost[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestorePost, 'id'>),
    }));

    // Sync into in-memory MaxHeap for DSA-based re-sorting
    posts.forEach((p) => {
      globalTrendingHeap.insert({
        id: p.id!,
        title: p.title,
        authorName: p.authorName,
        authorCollege: p.authorCollege,
        upvotes: p.upvotes,
        commentsCount: p.commentsCount,
        category: p.category,
        createdAt: '',
        type: p.type,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
      });
    });

    callback(posts);
  });
}

// ─────────────────────────────────────────────
// LIKES — User Profile Array + Post Upvotes Transaction
// ─────────────────────────────────────────────

/**
 * Like a post using a Firestore transaction to ensure atomic upvote increment
 * and user profile array update.
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post does not exist!');

    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data() as FirestoreUser;
    
    // Prevent duplicate likes
    if (userData.likedPosts && userData.likedPosts.includes(postId)) return;

    // Increment post upvotes
    const newUpvotes = (postDoc.data().upvotes || 0) + 1;
    transaction.update(postRef, { upvotes: newUpvotes });
    
    // Add to user's liked array
    transaction.update(userRef, { likedPosts: arrayUnion(postId) });
  });

  // Update in-memory heap
  const heapItem = globalTrendingHeap.getRawArray().find((p) => p.id === postId);
  if (heapItem) globalTrendingHeap.updateUpvotes(postId, heapItem.upvotes + 1);
}

/**
 * Unlike a post (atomic decrement and array remove)
 */
export async function unlikePost(postId: string, userId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) throw new Error('Post does not exist!');

    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data() as FirestoreUser;
    
    if (!userData.likedPosts || !userData.likedPosts.includes(postId)) return;

    const newUpvotes = Math.max(0, (postDoc.data().upvotes || 0) - 1);
    transaction.update(postRef, { upvotes: newUpvotes });
    transaction.update(userRef, { likedPosts: arrayRemove(postId) });
  });

  const heapItem = globalTrendingHeap.getRawArray().find((p) => p.id === postId);
  if (heapItem) globalTrendingHeap.updateUpvotes(postId, Math.max(0, heapItem.upvotes - 1));
}

/**
 * Fetch all post IDs liked by a given user in O(1) reads.
 */
export async function fetchLikedPostIds(userId: string): Promise<Set<string>> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    const data = userDoc.data() as FirestoreUser;
    if (data.likedPosts) return new Set(data.likedPosts);
  }
  return new Set<string>();
}

// ─────────────────────────────────────────────
// COMMUNITIES — Firestore
// ─────────────────────────────────────────────

export async function createCommunity(community: Omit<FirestoreCommunity, 'id' | 'createdAt'>): Promise<string> {
  const sanitised = {
    ...community,
    title: community.title.trim(),
    category: community.category.trim(),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'communities'), sanitised);
  return docRef.id;
}

export function subscribeToCommunities(callback: (communities: FirestoreCommunity[]) => void): () => void {
  const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const comms: FirestoreCommunity[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreCommunity, 'id'>),
    }));
    callback(comms);
  });
}

// ─────────────────────────────────────────────
// STUDY MATES & CONNECTIONS — Firestore
// ─────────────────────────────────────────────

export async function sendStudyMateRequest(fromUserId: string, toUserId: string): Promise<void> {
  const reqRef = doc(db, 'friendRequests', `${fromUserId}_${toUserId}`);
  await setDoc(reqRef, {
    fromId: fromUserId,
    toId: toUserId,
    status: 'PENDING',
    createdAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// Q&A COMMENTS — Firestore
// ─────────────────────────────────────────────

export async function addComment(comment: Omit<FirestoreComment, 'id' | 'createdAt'>): Promise<string> {
  const sanitised = {
    ...comment,
    content: comment.content.trim(),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'qna_comments'), sanitised);
  return docRef.id;
}

export function subscribeToComments(callback: (comments: FirestoreComment[]) => void): () => void {
  const q = query(collection(db, 'qna_comments'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const comments: FirestoreComment[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FirestoreComment, 'id'>),
    }));
    callback(comments);
  });
}
