import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Search, ExternalLink, CheckCircle2 } from 'lucide-react';
import { globalPlatformTrie, type TrieItem } from '../../dsa-engine';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  citations?: TrieItem[];
}

export const AppleAIBuddy: React.FC<{ isOpen: boolean; onClose: () => void; onNavigateTab: (tab: any) => void }> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_0',
      sender: 'ai',
      text: 'Hello! I am your Apple Glass Campus AI Assistant powered by our O(L) Trie & N-ary Tree. Ask me anything about Data Structures, operating systems semaphores, or student notes in our library!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleAsk = () => {
    if (!input.trim()) return;
    const userText = input;
    const newMsg: Message = { id: `usr_${Date.now()}`, sender: 'user', text: userText };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      // Query our real Trie in O(L)
      const searchRes = globalPlatformTrie.searchPrefix(userText.split(' ')[0] || userText, 4);
      const citations = searchRes.results;

      let aiResp = `I searched our O(L) Trie index and found relevant study sheets and discussions across EduNetwork. `;
      if (userText.toLowerCase().includes('avl') || userText.toLowerCase().includes('tree')) {
        aiResp += `An AVL Tree maintains balance using pointer rotations in O(1) time because changing parent/child pointers does not scale with tree height.`;
      } else if (userText.toLowerCase().includes('os') || userText.toLowerCase().includes('semaphore')) {
        aiResp += `For Operating Systems semaphores, process synchronization prevents race conditions using atomic P (wait) and V (signal) operations. Check our 50-page PDF note below!`;
      } else if (userText.toLowerCase().includes('dijkstra') || userText.toLowerCase().includes('graph')) {
        aiResp += `Dijkstra's shortest path uses our Priority Queue (Min-Heap) to relax graph edges in O(E log V) time.`;
      } else {
        aiResp += `Here are the top keyword matches retrieved in ${searchRes.latencyMs} ms directly from our memory Trie structure:`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiResp,
          citations: citations.length > 0 ? citations : undefined,
        },
      ]);
      setIsThinking(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900/90 dark:bg-black/85 backdrop-blur-3xl border border-white/25 shadow-[0_30px_90px_rgba(0,0,0,0.95)] p-6 space-y-4 text-white relative overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-cyan-300 shadow-inner">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>visionOS Campus AI Assistant</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-[10px] font-mono uppercase">
                  Trie Hooked
                </span>
              </h3>
              <p className="text-xs text-slate-300">Instant answers with live $O(L)$ Trie citations & N-ary Q&A linkage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Grouped Quick Prompts (Segmented neighbor buttons) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {[
            '❓ Explain AVL Tree O(1) Rotations',
            '📚 Operating Systems Semaphores',
            '⚡ Dijkstra vs BFS Graph Paths',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(prompt);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-slate-200 hover:text-white transition-all scale-100 hover:scale-[1.02]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[260px] py-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200'
                    : 'bg-white/15 border-white/25 text-white shadow-inner'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
              </div>

              <div
                className={`max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-white/25 text-white rounded-tr-none border border-white/30 shadow-md font-medium'
                    : 'bg-white/[0.06] text-slate-100 rounded-tl-none border border-white/15 shadow-sm space-y-3'
                }`}
              >
                <p className="font-sans">{msg.text}</p>

                {/* Live Trie Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      Instant Trie Retrieval Matches ($O(L)$):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            onClose();
                            if (c.type === 'note') onNavigateTab('resources');
                            else if (c.type === 'question') onNavigateTab('qna');
                            else if (c.type === 'group') onNavigateTab('communities');
                            else onNavigateTab('home');
                          }}
                          className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">{c.title}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{c.type} • {c.subtitle || 'Study Resource'}</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Traversing Trie & N-ary Tree knowledge...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2 shrink-0 kx-field">
          <input
            type="text"
            placeholder="Ask AI anything about algorithm proofs, notes, or platform queries..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner transition-all"
          />
          <button
            onClick={handleAsk}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-slate-300 flex items-center justify-between px-1">
          <span>⚡ Apple visionOS Glass Extension Hooked into `dsa-engine` singleton memory.</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

      </div>
    </div>
  );
};
