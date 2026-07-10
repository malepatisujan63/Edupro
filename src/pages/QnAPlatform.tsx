import React, { useState } from 'react';
import { HelpCircle, Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { globalQnATree, type CommentNode } from '../dsa-engine';

export const QnAPlatform: React.FC = () => {
  const [rootComments, setRootComments] = useState<CommentNode[]>(globalQnATree.getRootComments());
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtContent, setNewDoubtContent] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleAddReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const newReply: CommentNode = {
      id: `cmt_${Date.now()}`,
      authorName: 'Aarav Sharma',
      authorCollege: 'IIT Bombay • CSE',
      content: replyText,
      upvotes: 1,
      timestamp: 'Just now',
      children: [],
    };

    const success = globalQnATree.addReply(parentId, newReply);
    if (success) {
      setRootComments(globalQnATree.getRootComments());
      setReplyingToId(null);
      setReplyText('');
    }
  };

  const handleAskNewDoubt = () => {
    if (!newDoubtTitle.trim() || !newDoubtContent.trim()) return;
    const newRoot: CommentNode = {
      id: `cmt_root_${Date.now()}`,
      authorName: 'Aarav Sharma',
      authorCollege: 'IIT Bombay • CSE',
      content: `${newDoubtTitle} — ${newDoubtContent}`,
      upvotes: 1,
      timestamp: 'Just now',
      children: [],
    };
    globalQnATree.addRootComment(newRoot);
    setRootComments(globalQnATree.getRootComments());
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
            ? 'ml-6 sm:ml-10 border-l-2 border-[#E1306C]/40 pl-4 mt-4 space-y-3'
            : 'pb-8 border-b border-white/15 space-y-4 pt-4'
        }`}
      >
        {/* Author Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E1306C] via-[#FD1D1D] to-[#FCB045] p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#121212] rounded-full flex items-center justify-center font-extrabold text-sm text-white">
                  {node.authorName[0]}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-[#121212] shadow-sm" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                {node.authorName}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-white/20 text-white font-bold shadow-2xs">
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
              className="flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#FD1D1D] transition-all active:scale-90 group/btn"
            >
              <Heart className="w-6 h-6 fill-[#FD1D1D] text-[#FD1D1D] transition-transform group-hover/btn:scale-110" />
              <span>{node.upvotes}</span>
            </button>

            <button
              onClick={() => setReplyingToId(isReplying ? null : node.id)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-[#833AB4] transition-all active:scale-90"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <span>{isReplying ? 'Cancel' : 'Reply'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Doubt thread link copied!')}
              className="text-white hover:text-[#E1306C] transition-all active:scale-90"
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => alert('Saved to bookmarked doubts!')}
              className="text-white hover:text-[#E1306C] transition-all active:scale-90"
            >
              <Bookmark className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 p-4 rounded-[22px] glass-card border border-white/20 space-y-3 animate-panelRise shadow-md">
            <textarea
              rows={2}
              placeholder={`Write your answer or solution for ${node.authorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-[#121212]/90 border border-white/20 rounded-[16px] p-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[#E1306C] focus:bg-[#181818] shadow-inner font-medium"
            />
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
          <HelpCircle className="w-6 h-6 text-[#E1306C]" />
          <span>Doubts</span>
        </h1>

        <button
          onClick={() => setIsAsking(!isAsking)}
          className="btn-primary text-xs py-2 px-4 font-bold shadow-md flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAsking ? 'Close Form' : 'Ask Doubt'}</span>
        </button>
      </div>

      {/* Ask New Doubt Box */}
      {isAsking && (
        <div className="p-6 rounded-[28px] glass-card shadow-2xl space-y-4 animate-panelRise border border-white/20">
          <h3 className="text-base font-bold text-white">
            Post your Doubt or Coding Question
          </h3>
          <input
            type="text"
            placeholder="Doubt Title: e.g. 'How does Dijkstra algorithm handle negative edge weights?'"
            value={newDoubtTitle}
            onChange={(e) => setNewDoubtTitle(e.target.value)}
            className="w-full bg-[#121212]/90 border border-white/20 rounded-[18px] px-4 py-3 text-sm text-white focus:border-[#E1306C] focus:bg-[#181818] outline-none shadow-inner font-medium placeholder:text-white/50"
          />
          <textarea
            rows={4}
            placeholder="Provide code snippets, context, or exact error logs where you are stuck..."
            value={newDoubtContent}
            onChange={(e) => setNewDoubtContent(e.target.value)}
            className="w-full bg-[#121212]/90 border border-white/20 rounded-[18px] p-4 text-sm text-white focus:border-[#E1306C] focus:bg-[#181818] outline-none shadow-inner font-medium placeholder:text-white/50"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAsking(false)}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleAskNewDoubt}
              className="btn-primary text-xs py-2 px-6"
            >
              Post Doubt →
            </button>
          </div>
        </div>
      )}

      {/* Doubts Feed */}
      <div className="space-y-6">
        {rootComments.map((node) => renderCommentNode(node, 0))}
      </div>

    </div>
  );
};
