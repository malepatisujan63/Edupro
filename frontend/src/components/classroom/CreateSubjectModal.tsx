import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Classroom } from '../../types';
import { validateTextInput } from '../../utils/inputValidator';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: (classroom: Classroom) => void;
}

const GRADIENTS = [
  { label: 'Sapphire Ocean', val: 'from-[#0b244d] via-[#0d346e] to-[#081830]' },
  { label: 'Cobalt Frost', val: 'from-[#0047AB] via-[#0052cc] to-[#0a192f]' },
  { label: 'Cyber Azure', val: 'from-[#0066cc] via-[#0077b6] to-[#03045e]' },
  { label: 'Deep Midnight Blue', val: 'from-[#0a192f] via-[#112240] to-[#020c1b]' },
];

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubjectCreated
}) => {
  const { user, authFetch } = useAuth();

  const [name, setName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [university, setUniversity] = useState(user?.college || 'IIT Madras');
  const [description, setDescription] = useState('');
  const [coverGradient, setCoverGradient] = useState(GRADIENTS[0].val);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClassroom, setCreatedClassroom] = useState<Classroom | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const checkText = `${name} ${subjectCode} ${department} ${description}`.trim();
    const val = validateTextInput(checkText);
    if (!val.isValid) {
      setError(val.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subject_code: subjectCode.trim().toUpperCase(),
          department: department.trim(),
          university: university.trim(),
          description: description.trim(),
          cover_gradient: coverGradient
        })
      });

      const data = await res.json();
      if (data.success && data.classroom) {
        setCreatedClassroom(data.classroom);
        onSubjectCreated(data.classroom);
      } else {
        setError(data.error || 'Failed to create classroom');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!createdClassroom?.id) return;
    navigator.clipboard.writeText(createdClassroom.id);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 bg-[var(--x-surface)] border border-[var(--x-border)] shadow-2xl z-10 space-y-5 overflow-hidden text-[var(--x-text)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#38a6ff]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--x-text)] tracking-tight">
                  {createdClassroom ? 'Subject Created!' : 'Create New Subject'}
                </h3>
                <p className="text-[11px] text-[var(--x-subtext)]">
                  {createdClassroom
                    ? 'Unique 32-character ID generated for student enrollment'
                    : 'University faculty portal • Generate 32-character ID'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--x-subtext)] hover:text-[var(--x-text)] hover:bg-[var(--x-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {createdClassroom ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-blue-400/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--x-subtext)] font-medium">Subject</span>
                  <span className="text-xs font-bold text-[#38a6ff]">{createdClassroom.subject_code}</span>
                </div>
                <h4 className="text-sm font-semibold text-white">{createdClassroom.name}</h4>
                <p className="text-xs text-[var(--x-subtext)]">{createdClassroom.university} • {createdClassroom.department}</p>
              </div>

              {/* 32-character ID Callout */}
              <div className="p-4 rounded-2xl bg-[#0A84FF]/10 border border-[#0A84FF]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#38a6ff]">
                    32-Character Unique Classroom ID
                  </span>
                  <span className="text-[10px] text-blue-200/70 font-mono">32 chars</span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] font-mono text-xs sm:text-sm text-[var(--x-text)] break-all select-all flex items-center justify-between gap-2">
                  <span>{createdClassroom.id}</span>
                </div>

                <p className="text-[11px] text-blue-200/60 leading-relaxed">
                  Share this 32-character ID with students. When they search and click <span className="text-white font-medium">Join</span>, you will receive a notification to Accept or Decline them.
                </p>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071e3] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95"
                >
                  {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{hasCopied ? 'Copied 32-Character ID!' : 'Copy 32-Character ID'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl x-btn-secondary text-xs font-semibold transition-all cursor-pointer"
              >
                Done & Go to Subjects
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Distributed Operating Systems"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">Code</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                    placeholder="CS401"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] uppercase focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science & Engineering"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">University / Institute</label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="IIT Madras"
                    className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">Description & Syllabus Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline syllabus, weekly lab assignments, and prerequisites..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all resize-none"
                />
              </div>

              {/* Theme Gradient Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--x-subtext)] block pl-1">Subject Banner Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setCoverGradient(g.val)}
                      className={`h-10 rounded-xl bg-gradient-to-r ${g.val} border-2 transition-all cursor-pointer ${
                        coverGradient === g.val ? 'border-white scale-105 shadow-md ring-2 ring-[#0A84FF]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-2xl bg-[#0A84FF] hover:bg-[#0071e3] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 cursor-pointer disabled:opacity-50 mt-2 active:scale-95 transition-all"
              >
                <span>{isSubmitting ? 'Creating Subject...' : 'Create Subject & Generate 32-Char ID'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
