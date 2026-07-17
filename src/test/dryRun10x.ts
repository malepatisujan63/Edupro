// src/test/dryRun10x.ts
// ─── 10x End-to-End Dry Run & Verification Harness for EduNetwork ───
// Rigorously tests every single engine across 10 sequential simulations.

import { MaxHeap, type HeapItem } from '../dsa-engine/MaxHeap';
import { Trie } from '../dsa-engine/Trie';
import { SocialGraph } from '../dsa-engine/Graph';
import { hashPassword, verifyPassword } from '../utils/authHasher';
import { StudentAccount } from '../models/StudentAccount';

async function run10xVerification() {
  console.log('🚀 Starting 10x End-to-End Dry Run & Verification Suite...');
  console.log('─────────────────────────────────────────────────────────────────');

  let passedIterations = 0;
  const TOTAL_ITERATIONS = 10;

  for (let iter = 1; iter <= TOTAL_ITERATIONS; iter++) {
    const startTime = Date.now();
    try {
      // ── Test 1: Authentication & Identity Hashing ($O(1)$ BCrypt/SHA)
      const mockUserEmail = `sujan_${iter}@gmail.com`;
      const plainPassword = `SecureCampusPass#2026_${iter}`;
      const hashed = await hashPassword(plainPassword);
      
      const isMatch = await verifyPassword(plainPassword, hashed);
      const isBadMatch = await verifyPassword('WrongPassword123', hashed);
      if (!isMatch || isBadMatch) {
        throw new Error(`[Iter ${iter}] Auth Hasher failed password validation!`);
      }

      // ── Test 2: StudentAccount OOP Instantiation & Dwell Tracking ($O(1)$ Hash Map)
      const mockProfile = {
        uid: `usr_${iter}`,
        id: `usr_${iter}`,
        name: `Student Sujan #${iter}`,
        email: mockUserEmail,
        password: hashed,
        phone: '9876543210',
        studentType: 'college' as const,
        college: 'Koinexa Campus',
        department: 'Computer Science',
        semester: 6,
        schoolClass: '',
        board: '',
        skills: ['DSA', 'React', 'TypeScript', 'Node.js'],
        hobbies: ['Coding', 'Chess'],
        interests: ['System Design', 'AI'],
        studyMates: [],
        pendingStudyMateRequests: [],
        createdCommunities: [],
        avatarUrl: `https://ui-avatars.com/api/?name=Student+Sujan`,
        role: 'student' as const,
        reputationPoints: 100 + (iter * 10),
        badges: ['Verified Student'],
        createdAt: new Date().toISOString(),
      };

      const account = new StudentAccount(mockProfile);
      
      // Simulate dwell tracking over categories
      account.recordDwell('DSA & Algorithms', 15);
      account.recordDwell('Operating Systems', 10);
      account.recordDwell('Web Development', 25);
      const dwellScores = account.getDwellScores();
      if (dwellScores['DSA & Algorithms'] !== 15 || dwellScores['Web Development'] !== 25) {
        throw new Error(`[Iter ${iter}] Dwell Hash Table failed to accumulate scores!`);
      }

      // ── Test 3: Max-Heap Priority Ranking ($O(K \log N)$)
      const directHeap = new MaxHeap<{ id: string; upvotes: number; title: string }>();
      directHeap.insert({ id: 'h1', upvotes: 10, title: 'Low Priority' });
      directHeap.insert({ id: 'h2', upvotes: 999, title: 'High Priority' });
      const topDirect = directHeap.extractMax();
      if (!topDirect || topDirect.id !== 'h2') {
        throw new Error(`[Iter ${iter}] Direct MaxHeap failed extractMax ordering!`);
      }

      const mockPosts = [
        { id: `p_${iter}_1`, title: 'OS Deadlock Notes', category: 'Operating Systems', upvotes: 10, authorId: 'u2', authorName: 'Alice', authorCollege: 'Koinexa', type: 'note', createdAt: Date.now() },
        { id: `p_${iter}_2`, title: 'DSA Dynamic Programming', category: 'DSA & Algorithms', upvotes: 50, authorId: 'u3', authorName: 'Bob', authorCollege: 'Koinexa', type: 'post', createdAt: Date.now() - 3600000 },
        { id: `p_${iter}_3`, title: 'Vite React Architecture', category: 'Web Development', upvotes: 100, authorId: `usr_${iter}`, authorName: `Student Sujan #${iter}`, authorCollege: 'Koinexa', type: 'post', createdAt: Date.now() },
      ];

      for (const p of mockPosts) {
        account.scoreAndInsertPost(p as any);
      }
      
      const rankedFeed: HeapItem[] = account.getPersonalizedFeed();
      if (rankedFeed.length !== 3) {
        throw new Error(`[Iter ${iter}] Max-Heap failed to return exactly 3 ranked items (got ${rankedFeed.length})`);
      }
      // Top post should have highest priority/upvotes
      if (rankedFeed[0].upvotes < rankedFeed[1].upvotes || rankedFeed[1].upvotes < rankedFeed[2].upvotes) {
        throw new Error(`[Iter ${iter}] Max-Heap priority order violation: ${rankedFeed[0].upvotes} < ${rankedFeed[1].upvotes}`);
      }

      // ── Test 4: Prefix Trie Search Engine ($O(L)$)
      const trie = new Trie();
      trie.indexItem({ id: `i_${iter}_1`, title: 'Koinexa Cloudinary CDN Guide', subtitle: 'Zero-Lag Media Engine', type: 'post', tags: ['CDN', 'Cloudinary'] });
      trie.indexItem({ id: `i_${iter}_2`, title: 'Koinexa Campus Feed', subtitle: 'Social Network', type: 'post', tags: ['Social'] });
      trie.indexItem({ id: `i_${iter}_3`, title: 'Operating Systems Virtual Memory', subtitle: 'Academic Notes', type: 'note', tags: ['OS'] });

      const searchResults = trie.searchPrefix('Koin').results;
      if (!searchResults || searchResults.length !== 2) {
        throw new Error(`[Iter ${iter}] Trie search for 'Koin' expected 2 matches, got ${searchResults?.length}`);
      }

      // ── Test 5: Social & Study Circle Graph Adjacency ($O(V + E)$)
      const graph = new SocialGraph();
      graph.addStudent({ id: `usr_${iter}`, name: `Student Sujan #${iter}`, college: 'Koinexa', department: 'Computer Science', semester: 6, avatarUrl: '', role: 'student', reputationPoints: 100, badges: [] });
      graph.addStudent({ id: 'mate_1', name: 'Rohan Sharma', college: 'Koinexa', department: 'Computer Science', semester: 6, avatarUrl: '', role: 'student', reputationPoints: 100, badges: [] });
      graph.addStudent({ id: 'mate_2', name: 'Priya Patel', college: 'Koinexa', department: 'Data Science', semester: 6, avatarUrl: '', role: 'student', reputationPoints: 100, badges: [] });
      
      graph.addConnection(`usr_${iter}`, 'mate_1');
      graph.addConnection('mate_1', 'mate_2');

      const pathRes = graph.bfsPath(`usr_${iter}`, 'mate_2');
      if (!pathRes.path || pathRes.path.length !== 3 || pathRes.path[0] !== `usr_${iter}` || pathRes.path[2] !== 'mate_2') {
        throw new Error(`[Iter ${iter}] Graph shortest path calculation failed! Got: ${JSON.stringify(pathRes.path)}`);
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ [Iteration ${iter}/10] PASS (${elapsed}ms) — Auth: ✔️ | Dwell Hash: ✔️ | Max-Heap: ✔️ | Trie: ✔️ | Graph: ✔️`);
      passedIterations++;
    } catch (err: any) {
      console.error(`❌ [Iteration ${iter}/10] FAILED:`, err.message);
      break;
    }
  }

  console.log('─────────────────────────────────────────────────────────────────');
  if (passedIterations === TOTAL_ITERATIONS) {
    console.log(`🎉 ALL 10 DRY RUN SIMULATIONS PASSED (100% Reliability)!`);
  } else {
    console.error(`💥 Dry run stopped after ${passedIterations} passed iterations.`);
    if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.exit) {
      (globalThis as any).process.exit(1);
    }
  }
}

run10xVerification();
