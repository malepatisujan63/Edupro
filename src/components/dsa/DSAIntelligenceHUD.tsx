import React from 'react';
import { Cpu, X, Zap, Database, Share2, HardDrive, Activity, CheckCircle2 } from 'lucide-react';
import {
  globalPlatformTrie,
  globalTrendingHeap,
  globalSocialGraph,
  globalStudyGroupUnionFind,
  globalRegistrationHash,
} from '../../dsa-engine';

interface DSAIntelligenceHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullLab: () => void;
}

export const DSAIntelligenceHUD: React.FC<DSAIntelligenceHUDProps> = ({
  isOpen,
  onClose,
  onOpenFullLab,
}) => {
  if (!isOpen) return null;

  const heapLogs = globalTrendingHeap.getLogs();
  const ufLogs = globalStudyGroupUnionFind.getLogs();
  const hashStats = globalRegistrationHash.getStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🧠 Real-Time DSA & Compression Intelligence Inspector
              </h2>
              <p className="text-xs text-cyan-400">
                Monitoring 9 Data Structures & 12 Cloud Compression Pipelines in active browser memory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenFullLab();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              Open Full Laboratory Page →
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HUD Content Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Search Engine (Trie)</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xl font-bold text-white">$O(L)$ Prefix</p>
              <p className="text-[11px] text-emerald-400 mt-1">Total Indexed: {globalPlatformTrie.totalInserted} nodes</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Trending Priority (Heap)</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-white">$O(\log N)$ Heap</p>
              <p className="text-[11px] text-purple-300 mt-1">Active Posts: {globalTrendingHeap.size} nodes</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Graph Network (BFS/DFS)</span>
                <Share2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-bold text-white">$O(V + E)$ List</p>
              <p className="text-[11px] text-indigo-300 mt-1">Students: {globalSocialGraph.getAllStudents().length} active</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Unique Hash Cache</span>
                <Database className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-xl font-bold text-white">$O(1)$ Hash</p>
              <p className="text-[11px] text-pink-300 mt-1">Users Cached: {hashStats.totalUsersCached} | Collisions: {hashStats.collisionCount}</p>
            </div>
          </div>

          {/* 12-Point Cloud Compression Status Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-purple-950/40 border border-cyan-500/30">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4" />
              <span>12-Point Cloud Storage Optimization Engine Active</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Client-Side WebP/DCT (&gt;90% saved)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>400×300 Responsive Thumbnails</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>IntersectionObserver Lazy Loading</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Redis $O(1)$ 99% Cache Hit Ratio</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Gzip/Brotli API Transfer Encoding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PDF DEFLATE & Trie Keyword Indexing</span>
              </div>
            </div>
          </div>

          {/* Live Algorithmic Step Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Max-Heap Logs */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Recent Max-Heap Operations ($O(\log N)$)</span>
                <span className="text-[10px] text-slate-500">Live Upvotes / Trending</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {heapLogs.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No upvote operations logged yet. Upvote a post on the Home Feed to see real-time heap swaps!</p>
                )}
                {heapLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs">
                    <div className="flex items-center justify-between font-mono font-semibold text-cyan-300 mb-1">
                      <span>[{log.action.toUpperCase()}]</span>
                      <span className="text-[10px] text-emerald-400">{log.timeComplexity}</span>
                    </div>
                    <p className="text-slate-300">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Union-Find Logs */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Union-Find Path Compression ($O(\alpha(N))$)</span>
                <span className="text-[10px] text-slate-500">Study Group Clustering</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ufLogs.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No study group unions logged yet.</p>
                )}
                {ufLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs">
                    <div className="flex items-center justify-between font-mono font-semibold text-indigo-300 mb-1">
                      <span>[{log.action.toUpperCase()}] {log.pathCompressed && '⚡ PATH COMPRESSED'}</span>
                      <span className="text-[10px] text-emerald-400">{log.timeComplexity}</span>
                    </div>
                    <p className="text-slate-300">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
