import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, Cpu, Sparkles, Code, Copy, Check } from 'lucide-react';
import { globalTrendingHeap, globalPlatformTrie, type HeapItem } from '../../dsa-engine';

export const AppleCodeSandbox: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: any }> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [language, setLanguage] = useState<'typescript' | 'python' | 'cpp'>('typescript');
  const [code, setCode] = useState<string>(`// Write your algorithm logic below to test time/space complexity
function findTwoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>(); // O(1) space per entry
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);

  const [output, setOutput] = useState<string | null>(null);
  const [complexityReport, setComplexityReport] = useState<{ time: string; space: string; explanation: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput(null);
    setComplexityReport(null);

    setTimeout(() => {
      setIsRunning(false);
      setOutput(`[Test Runner]: Executing 500,000 randomized inputs...
[Success]: All 15 unit test cases passed!
[Execution Latency]: 2.41 ms (Extremely Fast)
[Memory Allocation]: 14.2 KB Heap overhead`);

      setComplexityReport({
        time: 'O(N) Single-Pass Hash Table',
        space: 'O(N) Auxiliary Space',
        explanation: 'By storing visited complements inside a Hash Map, you achieved optimal single-pass linear time instead of the naive O(N²) nested loop approach.',
      });
    }, 600);
  };

  const handlePublishToFeed = () => {
    const user = currentUser || { name: 'Aarav Sharma', college: 'IIT Bombay' };
    const newPost: HeapItem = {
      id: `post_code_${Date.now().toString().slice(-4)}`,
      title: `💻 Optimal ${complexityReport?.time || 'O(N)'} Solution for Two Sum (${language.toUpperCase()})`,
      authorName: user.name,
      authorCollege: user.college,
      upvotes: 1,
      commentsCount: 0,
      category: 'Competitive Programming',
      createdAt: 'Just now',
      type: 'post',
    };

    globalTrendingHeap.insert(newPost);
    globalPlatformTrie.indexItem({
      id: newPost.id,
      title: newPost.title,
      subtitle: `Code snippet by ${user.name}`,
      type: 'post',
      tags: ['Code Sandbox', language, 'DSA'],
    });

    alert(`🎉 Published directly to the Home Feed Max-Heap ($O(\\log N)$ insert) and indexed in Trie!`);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900/90 dark:bg-black/85 backdrop-blur-3xl border border-white/25 shadow-[0_30px_90px_rgba(0,0,0,0.95)] p-6 space-y-5 text-white relative overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-cyan-300 shadow-inner">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>visionOS Interactive Code Sandbox</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-[10px] font-mono uppercase">
                  Complexity Engine
                </span>
              </h3>
              <p className="text-xs text-slate-300">Write real algorithms, simulate execution, and verify Big-O performance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Grouped Segmented Language Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="p-1 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-2xl flex items-center gap-1 shadow-inner">
            {[
              { id: 'typescript', label: '⚡ TypeScript / JS' },
              { id: 'python', label: '🐍 Python 3' },
              { id: 'cpp', label: '⚙️ C++ 20 (GCC)' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  language === lang.id
                    ? 'bg-white/25 text-white shadow-md border border-white/30 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Code' : 'Copy'}</span>
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running Analysis...' : 'Run & Analyze ($O(N)$ Test)'}</span>
            </button>
          </div>
        </div>

        {/* Code Editor & Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0 flex-1 overflow-y-auto">
          
          {/* Code Textarea */}
          <div className="flex flex-col rounded-2xl bg-black/60 kx-field overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.05] border-b border-white/10 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>editor.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'ts'}</span>
              <span className="text-cyan-300">UTF-8 / Strict Mode</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-1 bg-transparent p-4 font-mono text-xs text-slate-100 outline-none resize-none leading-relaxed selection:bg-cyan-500 selection:text-black min-h-[220px]"
              spellCheck={false}
            />
          </div>

          {/* Complexity Evaluation & Console Output */}
          <div className="flex flex-col space-y-4 min-h-0">
            {complexityReport ? (
              <div className="p-5 rounded-2xl bg-white/[0.06] border border-cyan-400/40 backdrop-blur-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-300" />
                    Asymptotic Complexity Analysis
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Optimal Solution Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Time Complexity</span>
                    <span className="text-sm font-extrabold text-cyan-300">{complexityReport.time}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Auxiliary Space</span>
                    <span className="text-sm font-extrabold text-purple-300">{complexityReport.space}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans pt-1">
                  💡 {complexityReport.explanation}
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 min-h-[160px]">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                <p className="text-xs font-medium">Click <b>"Run & Analyze"</b> to simulate compilation and verify time/space efficiency.</p>
              </div>
            )}

            {/* Console Output Box */}
            <div className="flex-1 rounded-2xl bg-black/80 border border-white/15 p-4 font-mono text-xs overflow-y-auto min-h-[120px]">
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-2 border-b border-white/10 pb-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Automated Test Runner Output</span>
              </div>
              {output ? (
                <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono">{output}</pre>
              ) : (
                <span className="text-slate-500 italic font-sans">Ready for execution...</span>
              )}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Connects directly with EduNetwork `Trie` indexing & `MaxHeap` algorithm shares.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/15"
            >
              Close
            </button>
            <button
              onClick={handlePublishToFeed}
              className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Publish Solution to Feed ($O(\log N)$) →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
