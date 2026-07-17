import React, { useState, useEffect } from 'react';
import { HelpCircle, Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Send, Sparkles, UserPlus } from 'lucide-react';
import { type CommentNode } from '../dsa-engine';
import { sendStudyMateRequest, addComment, subscribeToComments } from '../lib/firestoreService';
import { checkRateLimit } from '../utils/rateLimiter';
import { validateContentSafety } from '../utils/safetyFilter';

export const QnAPlatform: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [rootComments, setRootComments] = useState<CommentNode[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtContent, setNewDoubtContent] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const unsub = subscribeToComments((flatComments) => {
      const map = new Map<string, CommentNode>();
      const roots: CommentNode[] = [];

      // Pass 1: Create nodes
      flatComments.forEach(fc => {
        map.set(fc.id!, {
          id: fc.id!,
          authorId: fc.authorId,
          authorAvatarUrl: fc.authorAvatarUrl,
          authorName: fc.authorName,
          authorCollege: fc.authorCollege,
          content: fc.content,
          upvotes: fc.upvotes,
          timestamp: 'Just now', // Could be formatted from fc.createdAt
          isAcceptedAnswer: fc.isAcceptedAnswer,
          children: []
        });
      });

      // Pass 2: Build tree
      flatComments.forEach(fc => {
        const node = map.get(fc.id!);
        if (node) {
          if (fc.parentId) {
            const parent = map.get(fc.parentId);
            if (parent) parent.children.push(node);
          } else {
            roots.push(node);
          }
        }
      });
      setRootComments(roots);
    });
    return () => unsub();
  }, []);

  const handleStudyMateRequest = async (authorId: string) => {
    if (!currentUser?.uid) {
      alert('Please sign in to send Study Mate requests.');
      return;
    }
    if (authorId === currentUser.uid) return;
    try {
      await sendStudyMateRequest(currentUser.uid, authorId);
      alert('Study Mate request sent!');
    } catch (e) {
      console.error(e);
      alert('Failed to send request.');
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    // Safety Layer: Rate Limiting comments (Max 5 comments/replies per minute)
    const rateLimit = checkRateLimit(`add_reply:global_user`, 5, 60000);
    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000);
      alert(`Rate Limit Triggered: Please wait ${remainingSeconds} seconds before replying again.`);
      return;
    }

    // Safety Layer: Content Safety & Moderation filter
    const contentCheck = validateContentSafety(replyText);
    if (!contentCheck.isSafe) {
      alert(`Safety Alert: Your answer contains flagged word: "${contentCheck.flaggedWord}". Please keep posts academic and campus-friendly.`);
      return;
    }

    const isSchool = currentUser?.studentType === 'school';
    const loc = isSchool ? `${currentUser?.schoolClass} • ${currentUser?.board}` : `${currentUser?.college || 'Student'} • ${currentUser?.department || ''}`;

    await addComment({
      parentId,
      authorId: currentUser?.uid || `anon_${Date.now()}`,
      authorAvatarUrl: currentUser?.avatarUrl,
      authorName: currentUser?.name || 'Student Explorer',
      authorCollege: loc,
      content: replyText.trim(),
      upvotes: 0,
    });
    
    setReplyingToId(null);
    setReplyText('');
  };

  const handleAskNewDoubt = async () => {
    if (!newDoubtTitle.trim() || !newDoubtContent.trim()) return;

    // Safety Layer: Rate Limiting comments (Max 5 comments/replies per minute)
    const rateLimit = checkRateLimit(`add_doubt:global_user`, 5, 60000);
    if (!rateLimit.allowed) {
      const remainingSeconds = Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000);
      alert(`Rate Limit Triggered: Please wait ${remainingSeconds} seconds before asking a new doubt.`);
      return;
    }

    // Safety Layer: Content Safety & Moderation filter on Title and Content
    const titleCheck = validateContentSafety(newDoubtTitle);
    const contentCheck = validateContentSafety(newDoubtContent);
    if (!titleCheck.isSafe || !contentCheck.isSafe) {
      const flagged = titleCheck.flaggedWord || contentCheck.flaggedWord;
      alert(`Safety Alert: Your doubt contains flagged word: "${flagged}". Please keep posts academic and campus-friendly.`);
      return;
    }

    const isSchool = currentUser?.studentType === 'school';
    const loc = isSchool ? `${currentUser?.schoolClass} • ${currentUser?.board}` : `${currentUser?.college || 'Student'} • ${currentUser?.department || ''}`;

    await addComment({
      parentId: null,
      authorId: currentUser?.uid || `anon_${Date.now()}`,
      authorAvatarUrl: currentUser?.avatarUrl,
      authorName: currentUser?.name || 'Student Explorer',
      authorCollege: loc,
      content: `${newDoubtTitle} — ${newDoubtContent}`,
      upvotes: 1,
    });
    
    setNewDoubtTitle('');
    setNewDoubtContent('');
    setIsAsking(false);
  };

  const renderCommentNode = (node: CommentNode, depth: number = 0) => {
    const isReplying = replyingToId === node.id;
    return (
      <div
        key={node.id}
        className={`transition-all ${
          depth > 0
            ? 'ml-6 sm:ml-10 border-l-2 border-[#00CFFF]/40 pl-4 mt-4 space-y-3'
            : 'kx-card mb-6 pb-4 p-4 sm:p-5 space-y-4'
        }`}
      >
        {/* Author Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="kx-avatar-ring w-10 h-10 sm:w-11 sm:h-11">
                {node.authorAvatarUrl ? (
                  <img src={node.authorAvatarUrl} alt="" className="w-full h-full rounded-full object-cover bg-black" />
                ) : (
                  <div className="w-full h-full bg-[#000000] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                    {node.authorName[0]}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-black shadow-sm" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                {node.authorName}
                {currentUser?.uid && node.authorId && node.authorId !== currentUser.uid && (
                  <button onClick={() => handleStudyMateRequest(node.authorId!)} className="ml-1 p-1 rounded-full bg-white/5 hover:bg-[#00CFFF]/20 text-[#00CFFF] transition-all border border-white/10 hover:border-[#00CFFF]/40" title="Send Study Mate Request">
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D0D0D] border border-white/20 text-white font-bold shadow-2xs">
                  {node.authorCollege}
                </span>
                {node.isAcceptedAnswer && (
                  <span className="px-2 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/40 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                    Solved
                  </span>
                )}
              </h4>
              <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                <span>{node.timestamp}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Doubt / Reply Content */}
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-white leading-relaxed font-normal">{node.content}</p>
        </div>

        {/* Pure Instagram Action Bar (Like, Comment/Reply, Share, Bookmark) */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => alert('Upvoted!')}
              className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#9B5DE5] transition-all active:scale-90 group/btn"
            >
              <Heart className="w-6 h-6 fill-[#9B5DE5] text-[#9B5DE5] transition-transform group-hover/btn:scale-110" />
              <span>{node.upvotes}</span>
            </button>

            <button
              onClick={() => setReplyingToId(isReplying ? null : node.id)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#4169E1] transition-all active:scale-90"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <span>{isReplying ? 'Cancel' : 'Reply'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Doubt thread link copied!')}
              className="text-white hover:text-[#00CFFF] transition-all active:scale-90"
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => alert('Saved to bookmarked doubts!')}
              className="text-white hover:text-[#00CFFF] transition-all active:scale-90"
            >
              <Bookmark className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 p-4 rounded-[22px] kx-card space-y-3 animate-panelRise">
            <div className="kx-field">
              <textarea
                rows={2}
                placeholder={`Write your answer for ${node.authorName}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-transparent p-3 text-sm text-white placeholder:text-white/30 outline-none resize-none font-medium"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyingToId(null)}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddReply(node.id)}
                className="btn-primary text-xs py-1.5 px-5 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Answer</span>
              </button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {node.children && node.children.length > 0 && (
          <div className="space-y-3">
            {node.children.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      
      {/* Doubts Head & Ask Button */}
      <div className="flex items-center justify-between px-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#00CFFF]" />
          <span>Doubts</span>
        </h1>

        <button
          onClick={() => setIsAsking(!isAsking)}
          className="btn-primary text-xs py-2.5 px-5 font-black shadow-lg shadow-[#00CFFF]/20 flex items-center gap-2 rounded-2xl transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAsking ? 'Close Form' : '+ Ask New Doubt'}</span>
        </button>
      </div>

      {/* Ask New Doubt Box */}
      {isAsking && (
        <div className="p-6 rounded-3xl kx-card shadow-2xl border border-[#00CFFF]/40 space-y-4 bg-slate-900 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#00CFFF]" />
              <span>Post Your Doubt or Code Snippet</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ✓ Peer Broadcast Active
            </span>
          </div>
          
          <div className="kx-field">
            <input
              type="text"
              placeholder="Doubt Title: e.g. 'How to optimize Dijkstra algorithm to O(E log V) using Priority Queue?'"
              value={newDoubtTitle}
              onChange={(e) => setNewDoubtTitle(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none font-medium placeholder:text-white/30"
            />
          </div>
          <div className="kx-field">
            <textarea
              rows={4}
              placeholder="Provide relevant code snippets, stack traces, or exact concepts where you need clarity..."
              value={newDoubtContent}
              onChange={(e) => setNewDoubtContent(e.target.value)}
              className="w-full bg-transparent p-4 text-sm text-white outline-none font-medium placeholder:text-white/30 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAsking(false)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAskNewDoubt}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] via-[#9B5DE5] to-[#4169E1] text-white font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-[#00CFFF]/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Doubt to Peers</span>
            </button>
          </div>
        </div>
      )}

      {/* Doubts Feed */}
      <div className="space-y-6">
        {rootComments.length === 0 && (
          <div className="p-10 rounded-3xl border border-white/10 bg-slate-900/50 text-center space-y-2">
            <HelpCircle className="w-10 h-10 text-[#00CFFF]/40 mx-auto" />
            <p className="text-sm font-bold text-white">No active doubts right now. Be the first to ask one above!</p>
          </div>
        )}
        {rootComments.map((node) => renderCommentNode(node, 0))}
      </div>

    </div>
  );
};
