import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Sparkles, Send } from 'lucide-react';
import { type CommentNode } from '../dsa-engine';
import { sendStudyMateRequest, addComment, subscribeToComments } from '../lib/supabaseService';
import { checkRateLimit } from '../utils/rateLimiter';
import { validateContentSafety } from '../utils/safetyFilter';
import { QnAThreadAccordion } from '../components/qna/QnAThreadAccordion';

export const QnAPlatform: React.FC<{ currentUser?: any; account?: any }> = ({ currentUser, account }) => {
  const [rootComments, setRootComments] = useState<CommentNode[]>([]);
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtContent, setNewDoubtContent] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const unsub = subscribeToComments((flatComments) => {
      const map = new Map<string, CommentNode>();
      const roots: CommentNode[] = [];

      flatComments.forEach(fc => {
        map.set(fc.id!, {
          id: fc.id!,
          authorId: fc.authorId,
          authorAvatarUrl: fc.authorAvatarUrl,
          authorName: fc.authorName,
          authorCollege: fc.authorCollege,
          content: fc.content,
          upvotes: fc.upvotes,
          timestamp: 'Just now',
          isAcceptedAnswer: fc.isAcceptedAnswer,
          children: []
        });
      });

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
    if (!currentUser?.uid) return alert('Please sign in to send Study Mate requests.');
    if (authorId === currentUser.uid) return;
    try {
      await sendStudyMateRequest(currentUser.uid, authorId);
      alert('Study Mate request sent!');
    } catch (e) {
      alert('Failed to send request.');
    }
  };

  const handleAddReply = async (parentId: string, replyText: string) => {
    const rateLimit = checkRateLimit(`add_reply:global_user`, 5, 60000);
    if (!rateLimit.allowed) {
      return alert(`Rate Limit Triggered: Please wait ${Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000)} seconds.`);
    }

    const contentCheck = validateContentSafety(replyText);
    if (!contentCheck.isSafe) {
      return alert(`Safety Alert: Contains flagged word: "${contentCheck.flaggedWord}".`);
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
    
    if (account) account.recordDwell('DSA & Algorithms', 5);
  };

  const handleAskNewDoubt = async () => {
    if (!newDoubtTitle.trim() || !newDoubtContent.trim()) return;

    const rateLimit = checkRateLimit(`add_doubt:global_user`, 5, 60000);
    if (!rateLimit.allowed) {
      return alert(`Rate Limit Triggered: Please wait ${Math.ceil((rateLimit.resetTimeMs - Date.now()) / 1000)} seconds.`);
    }

    const titleCheck = validateContentSafety(newDoubtTitle);
    const contentCheck = validateContentSafety(newDoubtContent);
    if (!titleCheck.isSafe || !contentCheck.isSafe) {
      return alert(`Safety Alert: Flagged word detected.`);
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
    
    if (account) account.recordDwell('DSA & Algorithms', 10);
    setNewDoubtTitle(''); setNewDoubtContent(''); setIsAsking(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto px-4 py-4 space-y-8 pb-36">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-xl sm:text-2xl font-extrabold kx-text-glow flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#00CFFF]" />
          <span>Doubts</span>
        </h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAsking(!isAsking)}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00CFFF] to-[#4169E1] text-white font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,207,255,0.4)]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAsking ? 'Close Form' : '+ Ask New Doubt'}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isAsking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-3xl bg-[rgba(10,10,15,0.8)] border border-[#00CFFF]/40 space-y-4 backdrop-blur-xl mb-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#00CFFF]" />
                  <span>Post Your Doubt</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ✓ Peer Broadcast Active
                </span>
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Doubt Title..."
                  value={newDoubtTitle}
                  onChange={(e) => setNewDoubtTitle(e.target.value)}
                  className="kx-input-flow"
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Provide context..."
                  value={newDoubtContent}
                  onChange={(e) => setNewDoubtContent(e.target.value)}
                  className="kx-input-flow min-h-[120px] resize-y"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsAsking(false)} className="px-4 py-2.5 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/20">Cancel</button>
                <button onClick={handleAskNewDoubt} className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00CFFF] to-[#4169E1] text-white font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,207,255,0.4)]">
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Doubt</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="space-y-0">
        <AnimatePresence>
          {rootComments.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-10 rounded-3xl border border-white/10 bg-[rgba(10,10,15,0.5)] text-center space-y-2">
              <HelpCircle className="w-10 h-10 text-[#00CFFF]/40 mx-auto" />
              <p className="text-sm font-bold text-white">No active doubts right now. Be the first to ask one above!</p>
            </motion.div>
          ) : (
            rootComments.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <QnAThreadAccordion
                  node={node}
                  currentUser={currentUser}
                  handleStudyMateRequest={handleStudyMateRequest}
                  handleAddReply={handleAddReply}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
