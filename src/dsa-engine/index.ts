import { NaryCommentTree } from './Trees';

export * from './Trie';
export * from './MaxHeap';
export * from './Graph';
export * from './UnionFind';
export * from './Trees';
export * from './StackQueue';
export * from './HashMapSet';
export * from './CompressionAlgorithms';

export const globalQnATree = new NaryCommentTree();

/**
 * No-op: synthetic data removed for production.
 * Real data is loaded from Firebase Firestore via firestoreService.ts
 */
export function preloadPlatformData(): void {
  // Production: all data comes from Firestore — no mock data loaded
}

export const globalCommunities: any[] = [
  {
    id: 'c1',
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    authorName: 'Aarav Sharma',
    upvotes: 120,
    memberCount: 45
  },
  {
    id: 'c2',
    title: 'Full Stack Web Dev',
    category: 'Computer Science',
    authorName: 'EduNetwork Admin',
    upvotes: 89,
    memberCount: 120
  }
];

