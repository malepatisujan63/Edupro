import { globalPlatformTrie } from './Trie';
import { globalTrendingHeap } from './MaxHeap';
import { globalSocialGraph } from './Graph';
import { globalStudyGroupUnionFind } from './UnionFind';
import { globalSubjectTaxonomy, NaryCommentTree } from './Trees';
import { globalNotificationQueue } from './StackQueue';
import { globalRegistrationHash } from './HashMapSet';

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
 * Preload rich initial sample data into all 9 Data Structures & Compression Engine
 */
export function preloadPlatformData(): void {
  // 1. Preload Students into Graph & Unique Registration Hash
  const students = [
    { id: 'usr_1', name: 'Aarav Sharma', college: 'IIT Bombay', department: 'CSE', semester: 5, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', role: 'student' as const, reputationPoints: 1240, badges: ['DSA Expert', 'Top Contributor'] },
    { id: 'usr_2', name: 'Riya Patel', college: 'BITS Pilani', department: 'ECE', semester: 6, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', role: 'student' as const, reputationPoints: 890, badges: ['AI Enthusiast'] },
    { id: 'usr_3', name: 'Kabir Mehta', college: 'IIT Delhi', department: 'CSE', semester: 7, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'senior' as const, reputationPoints: 3400, badges: ['Mentor', 'Competitive Programming Pro'] },
    { id: 'usr_4', name: 'Ananya Verma', college: 'VIT Vellore', department: 'IT', semester: 4, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'student' as const, reputationPoints: 520, badges: ['Web Dev Lead'] },
    { id: 'usr_5', name: 'Rohan Gupta', college: 'IIT Madras', department: 'CSE', semester: 8, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', role: 'mentor' as const, reputationPoints: 4800, badges: ['Operating Systems Guru', 'Mentor'] },
  ];

  students.forEach((s) => {
    globalSocialGraph.addStudent(s);
    globalRegistrationHash.registerUser(`${s.name.toLowerCase().replace(/\s+/g, '.')}@college.edu`, `+91 98765${s.reputationPoints}`, s);
    globalPlatformTrie.indexItem({
      id: s.id,
      title: s.name,
      subtitle: `${s.college} • ${s.department}`,
      type: 'user',
      tags: s.badges,
      avatarUrl: s.avatarUrl,
    });
  });

  // Graph Connections & Friend Requests
  globalSocialGraph.addConnection('usr_1', 'usr_2');
  globalSocialGraph.addConnection('usr_2', 'usr_3');
  globalSocialGraph.addConnection('usr_3', 'usr_5');
  globalSocialGraph.addConnection('usr_1', 'usr_4');
  globalSocialGraph.sendFriendRequest('usr_4', 'usr_3'); // Pending request from Ananya to Kabir

  // 2. Preload Posts/Notes into Max-Heap & Trie
  const posts = [
    {
      id: 'post_101',
      title: 'Complete Graph Algorithms & Dynamic Programming Cheatsheet (PDF)',
      authorName: 'Kabir Mehta',
      authorCollege: 'IIT Delhi',
      upvotes: 342,
      commentsCount: 48,
      category: 'DSA',
      createdAt: '2 hours ago',
      type: 'note' as const,
      mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    },
    {
      id: 'post_102',
      title: 'Operating Systems Process Synchronization & Semaphores Explained simply',
      authorName: 'Rohan Gupta',
      authorCollege: 'IIT Madras',
      upvotes: 289,
      commentsCount: 31,
      category: 'Operating Systems',
      createdAt: '5 hours ago',
      type: 'note' as const,
      mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    },
    {
      id: 'post_103',
      title: 'Doubt: How does AVL Tree rotation rebalance in O(1) time? Please help with code!',
      authorName: 'Aarav Sharma',
      authorCollege: 'IIT Bombay',
      upvotes: 145,
      commentsCount: 19,
      category: 'DSA',
      createdAt: '1 day ago',
      type: 'question' as const,
    },
    {
      id: 'post_104',
      title: 'Spring Boot + Neo4j Graph DB Architecture for High-Scale Student Feed System',
      authorName: 'Riya Patel',
      authorCollege: 'BITS Pilani',
      upvotes: 198,
      commentsCount: 24,
      category: 'Web Development',
      createdAt: '3 hours ago',
      type: 'post' as const,
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    },
  ];

  posts.forEach((p) => {
    globalTrendingHeap.insert(p);
    globalPlatformTrie.indexItem({
      id: p.id,
      title: p.title,
      subtitle: `By ${p.authorName} (${p.category})`,
      type: p.type === 'question' ? 'question' : 'note',
      tags: [p.category, 'Study Material', 'Notes'],
    });
  });

  // 3. Preload Study Groups into Disjoint Set (Union-Find)
  const groups = [
    { id: 'grp_alpha', name: 'Algo Champions Pod (IITB + BITS)' },
    { id: 'grp_beta', name: 'System Design Club (IITD + IITM)' },
    { id: 'grp_gamma', name: 'Web Dev Mastery Group (VIT)' },
    { id: 'grp_delta', name: 'CP Competitive Coders' },
  ];
  groups.forEach((g) => {
    globalStudyGroupUnionFind.makeSet(g.id, g.name);
    globalPlatformTrie.indexItem({ id: g.id, title: g.name, type: 'group', tags: ['Study Group', 'Collaboration'] });
  });
  // Merge some groups to show connected clusters
  globalStudyGroupUnionFind.union('grp_alpha', 'grp_delta'); // Algo Champions + CP Coders merged

  // 4. Preload Subject Taxonomy BST
  globalSubjectTaxonomy.insert('CS-201', 'Data Structures & Algorithms', 3, 142);
  globalSubjectTaxonomy.insert('CS-301', 'Operating Systems & Kernel Design', 4, 98);
  globalSubjectTaxonomy.insert('CS-302', 'Database Management Systems (Postgres & Neo4j)', 4, 115);
  globalSubjectTaxonomy.insert('CS-401', 'Artificial Intelligence & Deep Learning', 6, 84);
  globalSubjectTaxonomy.insert('CS-202', 'Full Stack Web Development (React & Spring Boot)', 3, 164);
  globalSubjectTaxonomy.insert('CS-101', 'Competitive Programming & Mathematics', 1, 210);

  // 5. Preload Q&A N-ary Tree Comments for Post 103
  globalQnATree.addRootComment({
    id: 'cmt_1',
    authorName: 'Kabir Mehta',
    authorCollege: 'IIT Delhi',
    content: 'An AVL tree rotation only changes 2 to 3 parent/child pointers! Because pointer swaps are O(1) independent of the tree height, rotation is strictly O(1) constant time.',
    upvotes: 42,
    timestamp: '18 hours ago',
    isAcceptedAnswer: true,
    children: [
      {
        id: 'cmt_1_1',
        authorName: 'Aarav Sharma',
        authorCollege: 'IIT Bombay',
        content: 'Thank you so much Kabir! That makes total sense now regarding pointer modifications vs height traversal.',
        upvotes: 12,
        timestamp: '16 hours ago',
        children: [],
      },
    ],
  });

  // 6. Preload Task Queue (Simulated Background Workers)
  globalNotificationQueue.enqueue({
    id: 'task_01',
    title: 'Indexing 40-page Operating Systems PDF Note into Trie',
    type: 'INDEX_PDF',
    status: 'COMPLETED',
    progress: 100,
    timeComplexity: 'O(L) per keyword',
  });
  globalNotificationQueue.enqueue({
    id: 'task_02',
    title: 'Transcoding Voice Note #488 to AAC/WebM via Cloudinary CDN',
    type: 'TRANSCODE_VOICE',
    status: 'COMPLETED',
    progress: 100,
    timeComplexity: 'O(N) audio stream',
  });
  globalNotificationQueue.enqueue({
    id: 'task_03',
    title: 'Generating 400x300 thumbnail for 10MB diagram upload',
    type: 'COMPRESS_IMAGE',
    status: 'PROCESSING',
    progress: 65,
    timeComplexity: 'O(W × H) DCT Quantization',
  });
}
