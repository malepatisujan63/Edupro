import React, { useState } from 'react';
import {
  Cpu,
  Share2,
  GitMerge,
  Database,
  Search,
  CheckCircle2,
  Play,
  HardDrive,
  Activity,
  Terminal,
} from 'lucide-react';
import {
  globalPlatformTrie,
  globalTrendingHeap,
  globalSocialGraph,
  globalStudyGroupUnionFind,
  globalUndoStack,
  globalNotificationQueue,
  globalRegistrationHash,
} from '../dsa-engine';

export const DSALaboratory: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'trie' | 'heap' | 'graph' | 'unionfind' | 'compression' | 'hash'>('trie');
  const [prefixInput, setPrefixInput] = useState('a');
  const [bfsStartNode, setBfsStartNode] = useState('usr_1');
  const [bfsResult, setBfsResult] = useState<string[]>([]);

  // Trie test
  const trieSearchRes = globalPlatformTrie.searchPrefix(prefixInput, 15);

  // Graph BFS test
  const handleRunBFS = () => {
    const order = globalSocialGraph.runBFS(bfsStartNode);
    setBfsResult(order);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-8 pb-32">
      
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Cpu className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Interactive Computer Science Playground</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            🧠 DSA & Compression Intelligence Laboratory
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Every feature on EduNetwork is directly powered by an explicit, optimized data structure. Inspect real-time memory allocations, time complexities, and mathematical compression steps directly below!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 space-y-1 font-mono shrink-0">
          <p className="text-cyan-400 font-bold">⚡ Active In-Memory Engine:</p>
          <p>• Trie Nodes: {globalPlatformTrie.totalInserted} indexed</p>
          <p>• Max-Heap Size: {globalTrendingHeap.size} elements</p>
          <p>• Graph Edges: {globalSocialGraph.getAllStudents().length} students</p>
          <p>• HashSet Buckets: {globalRegistrationHash.getStats().totalUsersCached} active</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="segmented-glass-group flex-wrap pb-2 border-b border-white/10">
        {[
          { id: 'trie', label: '1. Trie ($O(L)$ Search)', icon: <Search className="w-4 h-4 text-cyan-300" /> },
          { id: 'heap', label: '2. Max-Heap ($O(\\log N)$ Trending)', icon: <Activity className="w-4 h-4 text-purple-300" /> },
          { id: 'graph', label: '3. Graph BFS/DFS ($O(V+E)$)', icon: <Share2 className="w-4 h-4 text-indigo-300" /> },
          { id: 'unionfind', label: '4. Union-Find ($O(\\alpha(N))$)', icon: <GitMerge className="w-4 h-4 text-emerald-300" /> },
          { id: 'compression', label: '5. 12-Point Cloud Compression', icon: <HardDrive className="w-4 h-4 text-pink-300" /> },
          { id: 'hash', label: '6. HashMap & Stack/Queue', icon: <Database className="w-4 h-4 text-amber-300" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedAlgo(t.id as any)}
            className={selectedAlgo === t.id ? 'segmented-glass-btn-active flex items-center gap-2' : 'segmented-glass-btn flex items-center gap-2'}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Trie Search Inspector */}
      {selectedAlgo === 'trie' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fadeIn">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <span>Prefix Tree (Trie) Live Traversal Engine</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a student types into the search bar, we do NOT loop through all database records ($O(N \cdot L)$). Instead, our Trie steps down exact character pointers $O(L)$ where $L$ is the prefix length.
            </p>

            <div>
              <label className="text-xs font-semibold text-cyan-300 block mb-1">Test Prefix Input:</label>
              <input
                type="text"
                value={prefixInput}
                onChange={(e) => setPrefixInput(e.target.value)}
                placeholder="Type 'a', 'dsa', 'op'..."
                className="kx-input-flow font-mono"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/20 text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>Traversal Path:</span>
                <code className="bg-slate-800 px-2 py-0.5 rounded font-mono">{trieSearchRes.pathString}</code>
              </div>
              <div className="flex items-center justify-between">
                <span>Execution Latency:</span>
                <span className="text-emerald-400 font-bold">{trieSearchRes.latencyMs} ms (Sub-millisecond)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Matched Nodes:</span>
                <span className="text-purple-400 font-bold">{trieSearchRes.results.length} items found</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trie Prefix Match Results</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {trieSearchRes.results.map((res) => (
                <div key={res.id} className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">{res.title}</p>
                    <p className="text-slate-400 text-[11px]">{res.subtitle}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] uppercase">
                    {res.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Max-Heap Priority Inspector */}
      {selectedAlgo === 'heap' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <span>Max-Heap Array Representation & Heapify Operations</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                For any node at index $i$, Left Child is $2i + 1$ and Right Child is $2i + 2$. Highest upvotes bubble to root `[0]` in $O(\log N)$.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30">
              Total Heap Nodes: {globalTrendingHeap.size}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {globalTrendingHeap.getRawArray().map((item, idx) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-white/10 relative overflow-hidden group space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Index [{idx}]</span>
                  <span className="text-pink-400 font-bold">❤️ {item.upvotes} upvotes</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                <p className="text-[10px] text-slate-400">{item.authorName} ({item.category})</p>
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Parent: {idx === 0 ? 'ROOT' : `[${Math.floor((idx - 1) / 2)}]`}</span>
                  <span>Left: [{2 * idx + 1 < globalTrendingHeap.size ? 2 * idx + 1 : 'null'}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Graph BFS/DFS Inspector */}
      {selectedAlgo === 'graph' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <span>Breadth-First Search (BFS) Friend Recommendation Traversal</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              BFS explores classmates layer by layer ($O(V + E)$). By starting at any student node, we discover study partners within 2 to 3 degrees of separation!
            </p>

            <div className="flex items-center gap-3">
              <select
                value={bfsStartNode}
                onChange={(e) => setBfsStartNode(e.target.value)}
                className="bg-slate-800 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none flex-1"
              >
                {globalSocialGraph.getAllStudents().map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.college})</option>
                ))}
              </select>
              <button
                onClick={handleRunBFS}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run BFS ($O(V+E)$)</span>
              </button>
            </div>

            {bfsResult.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase">BFS Discovery Sequence:</h4>
                <div className="flex flex-wrap gap-2">
                  {bfsResult.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-white font-medium">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Social Graph Adjacency List ($O(1)$ lookup per node)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {globalSocialGraph.getAllStudents().map((s) => {
                const friends = globalSocialGraph.getFriends(s.id);
                return (
                  <div key={s.id} className="p-3 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{s.name} ({s.department})</span>
                      <span className="text-indigo-400 font-mono">{friends.length} connections</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {friends.map((f) => (
                        <span key={f.id} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-white/10">
                          ↔ {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Union-Find */}
      {selectedAlgo === 'unionfind' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl space-y-4 animate-fadeIn">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-emerald-400" />
            <span>Disjoint Set (Union-Find) Path Compression Log</span>
          </h3>
          <p className="text-xs text-slate-300">
            Path compression attaches accessed nodes directly to the root (`parent[x] = root`), reducing tree height to nearly 1 (`Amortized O(α(N))` inverse Ackermann function).
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {globalStudyGroupUnionFind.getLogs().map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-white/5 text-xs flex items-center justify-between gap-4 font-mono">
                <div className="space-y-1">
                  <p className="font-bold text-emerald-300">[{log.action.toUpperCase()}] {log.description}</p>
                  <p className="text-[10px] text-slate-400">Elements: {log.elementA} {log.elementB && `+ ${log.elementB}`} | Root: {log.rootA}</p>
                </div>
                <span className="px-2 py-1 rounded bg-slate-900 text-emerald-400 font-bold shrink-0">{log.timeComplexity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: 12-Point Compression */}
      {selectedAlgo === 'compression' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-pink-500/30 shadow-2xl space-y-6 animate-fadeIn">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-pink-400" />
            <span>Complete 12-Point Cloud Storage Optimization Pipeline</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-200">
            {[
              { title: '1. Multi-Format Image Transcode', desc: 'JPEG DCT + WebP + AVIF transformation reducing 10MB to ~800KB' },
              { title: '2. 400×300 Responsive Thumbnails', desc: 'Client-side Canvas downscale prior to upload ($O(W \\times H)$)' },
              { title: '3. Video H.264 / HEVC Transcode', desc: 'Motion estimation + quantization for lecture videos' },
              { title: '4. Client-Side WebP Compression', desc: 'Saves 90% bandwidth before hitting Cloudinary CDN' },
              { title: '5. IntersectionObserver Lazy Load', desc: 'Only loads images/diagrams when visible in DOM viewport' },
              { title: '6. Pagination / Infinite Scroll', desc: 'Slices feed arrays in chunks of 10 (`posts.slice(0, count)`)' },
              { title: '7. Gzip / Brotli API Encoding', desc: 'Reduces JSON REST payload sizes by 70-85%' },
              { title: '8. PDF DEFLATE Object Compression', desc: 'Strips duplicate streams & embeds Huffman coded tables' },
              { title: '9. Redis $O(1)$ In-Memory Cache', desc: 'Caches user profiles, feed objects & authentication tokens' },
              { title: '10. Direct Audio Voice Notes', desc: 'HTML5 MediaRecorder API records directly to WebM/AAC blobs' },
              { title: '11. Signed URL Presigned Uploads', desc: 'Bypasses backend memory completely, uploading straight to cloud' },
              { title: '12. Background Worker TaskQueue', desc: 'Asynchronous FIFO processing for PDF indexing & transcoding' },
            ].map((pt, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
                <h4 className="font-bold text-pink-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{pt.title}</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: HashMap & Stack/Queue */}
      {selectedAlgo === 'hash' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>HashMap ($O(1)$ Unique Registration Check)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Our unique email and mobile number verification uses <code>Set&lt;string&gt;</code> and <code>Map&lt;string, User&gt;</code> with $O(1)$ expected lookup.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 text-xs space-y-2 text-slate-300 font-mono">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span>Total Users Cached:</span>
                <span>{globalRegistrationHash.getStats().totalUsersCached} buckets</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Hash Collisions Detected:</span>
                <span>{globalRegistrationHash.getStats().collisionCount} collisions</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Stack ($O(1)$ LIFO Undo) & Queue ($O(1)$ FIFO Tasks)</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <p className="font-bold text-cyan-300">⚡ UndoStack Size: {globalUndoStack.size} items</p>
                <p className="text-[11px] text-slate-400">Navigation dock &lt; &gt; buttons pop the top of stack to revert post likes/deletions.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <p className="font-bold text-purple-300">⚡ Background TaskQueue Size: {globalNotificationQueue.size} active tasks</p>
                <p className="text-[11px] text-slate-400">Asynchronously indexes large PDFs and transcodes voice notes without blocking the UI thread.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

