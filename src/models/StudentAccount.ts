// src/models/StudentAccount.ts
// ─── OOP: Each logged-in student is a self-contained class instance ───
// Java-style class with encapsulated data + behaviour + fresh DSA per account

import { MaxHeap, type HeapItem } from '../dsa-engine/MaxHeap';
import { Trie, type TrieItem } from '../dsa-engine/Trie';
import { UndoStack, type UndoAction } from '../dsa-engine/StackQueue';
import { type FirestoreUser, type FirestorePost } from '../lib/firestoreService';

// ─── Interfaces (Java-style contracts) ───────────────────────────
export interface IStudentAccount {
  getProfile(): FirestoreUser;
  getPersonalizedFeed(): HeapItem[];
  scoreAndInsertPost(post: FirestorePost, dwellBonus?: number): void;
  syncFeed(posts: FirestorePost[]): void;
  search(query: string): TrieItem[];
  bookmarkPost(post: FirestorePost): void;
  getBookmarks(): FirestorePost[];
  recordDwell(category: string, bonus: number): void;
  getDwellScores(): Record<string, number>;
}

// ─── StudentAccount Class ────────────────────────────────────────
/**
 * Represents a single student user as a fully encapsulated OOP object.
 * Each instance has its OWN DSA engine instances — no shared global singletons.
 *
 * Java equivalent:
 *   public class StudentAccount implements IStudentAccount {
 *     private final MaxHeap<HeapItem> personalFeedHeap;
 *     private final Trie searchTrie;
 *     private final SocialGraph socialGraph;
 *   }
 */
export class StudentAccount implements IStudentAccount {
  // ── Immutable identity
  public readonly uid: string;
  public readonly createdAt: Date;

  // ── Mutable profile data
  private _profile: FirestoreUser;

  // ── Per-account fresh DSA instances (isolated — not shared globally)
  private readonly feedHeap:    MaxHeap<HeapItem>;
  private readonly searchTrie:  Trie;
  private readonly activityLog: UndoStack<UndoAction>;
  // socialGraph and taskQueue will be added when social/background features are wired up

  // ── Behavioural scoring state
  private dwellScores: Record<string, number> = {};
  private bookmarkedPosts: FirestorePost[] = [];

  constructor(profile: FirestoreUser) {
    this.uid        = profile.uid;
    this._profile   = { ...profile };
    this.createdAt  = new Date();

    // Instantiate fresh DSA engines for this account ONLY
    this.feedHeap    = new MaxHeap<HeapItem>();
    this.searchTrie  = new Trie();
    this.activityLog = new UndoStack<UndoAction>(50);

    // Index the student themselves in their own search system
    const isSchool = profile.studentType === 'school';
    const locationInfo = isSchool 
      ? `${profile.schoolClass} • ${profile.board}` 
      : `${profile.college || 'College Student'} • ${profile.department || 'General'}`;

    this.searchTrie.indexItem({
      id:        profile.uid,
      title:     profile.name,
      subtitle:  locationInfo,
      type:      'user',
      tags:      [...(profile.badges || []), ...(profile.skills || []), ...(profile.interests || [])],
      avatarUrl: profile.avatarUrl,
    });
  }

  // ─── Profile Getters / Setters ───────────────────────────────
  public getProfile(): FirestoreUser {
    return { ...this._profile }; // return copy for immutability
  }

  public get name(): string { return this._profile.name; }
  public get email(): string { return this._profile.email; }
  public get avatarUrl(): string { return this._profile.avatarUrl; }

  public updateProfile(partial: Partial<FirestoreUser>): void {
    this._profile = { ...this._profile, ...partial };
  }

  // ─── Feed / DSA Methods ──────────────────────────────────────

  /**
   * Inserts a Firestore post into this account's personal MaxHeap.
   * Score = upvotes * 3 + dwell score * 4 (personalised weighting).
   * Time Complexity: O(log n) per insert
   */
  public scoreAndInsertPost(post: FirestorePost, dwellBonus: number = 0): void {
    const categoryDwell = this.dwellScores[post.category] || 0;
    const personalScore = (post.upvotes * 3) + (categoryDwell * 4) + dwellBonus;

    const heapItem: HeapItem = {
      id:            post.id!,
      title:         post.title,
      authorName:    post.authorName,
      authorCollege: post.authorCollege,
      upvotes:       personalScore,
      commentsCount: post.commentsCount,
      category:      post.category,
      createdAt:     '',
      type:          post.type,
      mediaUrl:      post.mediaUrl,
      mediaType:     post.mediaType,
    };

    this.feedHeap.insert(heapItem);

    // Also index in personal trie for search
    this.searchTrie.indexItem({
      id:       post.id!,
      title:    post.title,
      subtitle: `By ${post.authorName}`,
      type:     post.type === 'question' ? 'question' : 'note',
      tags:     [post.category],
    });
  }

  /**
   * Returns this account's personalised feed, sorted by the heap.
   * Time Complexity: O(n log n) for full sorted extract
   */
  public getPersonalizedFeed(): HeapItem[] {
    return this.feedHeap.getSortedArray();
  }

  /**
   * Sync the heap with the latest Firestore post list.
   * Clears and rebuilds the heap fresh: O(n log n).
   */
  public syncFeed(posts: FirestorePost[]): void {
    this.feedHeap.clear();
    for (const post of posts) {
      this.scoreAndInsertPost(post);
    }
  }

  // ─── Search ─────────────────────────────────────────────────

  /**
   * Fast prefix search for instant suggestions
   */
  public search(query: string): TrieItem[] {
    const result = this.searchTrie.searchPrefix(query);
    return result.results;
  }

  // ─── Dwell Scoring ───────────────────────────────────────────

  public recordDwell(category: string, bonus: number): void {
    this.dwellScores[category] = (this.dwellScores[category] || 0) + bonus;
  }

  public getDwellScores(): Record<string, number> {
    return { ...this.dwellScores };
  }

  // ─── Bookmarks ───────────────────────────────────────────────

  public bookmarkPost(post: FirestorePost): void {
    if (!this.bookmarkedPosts.some((p) => p.id === post.id)) {
      this.bookmarkedPosts.unshift(post);
    }
  }

  public removeBookmark(postId: string): void {
    this.bookmarkedPosts = this.bookmarkedPosts.filter((p) => p.id !== postId);
  }

  public getBookmarks(): FirestorePost[] {
    return [...this.bookmarkedPosts];
  }

  public isBookmarked(postId: string): boolean {
    return this.bookmarkedPosts.some((p) => p.id === postId);
  }

  // ─── Activity Logging ───────────────────────────────────────
  public logAction(action: UndoAction): void {
    this.activityLog.push(action);
  }

  public undoLastAction(): UndoAction | undefined {
    return this.activityLog.pop();
  }

  // ─── Serialisation ──────────────────────────────────────────
  public toJSON(): object {
    return {
      uid:         this.uid,
      name:        this._profile.name,
      email:       this._profile.email,
      heapSize:    this.feedHeap.size,
      bookmarks:   this.bookmarkedPosts.length,
      dwellScores: this.dwellScores,
      createdAt:   this.createdAt.toISOString(),
    };
  }
}
