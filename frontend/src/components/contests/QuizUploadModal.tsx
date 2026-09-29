import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { QuizQuestion } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface QuizUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizUploaded: () => void;
}

export const QuizUploadModal: React.FC<QuizUploadModalProps> = ({
  isOpen,
  onClose,
  onQuizUploaded,
}) => {
  const { authFetch, user, openAuthModal } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('general');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      section: 'General',
      question_num: 1,
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    setQuestions((prev) => [
      ...prev,
      {
        id: `q${nextNum}`,
        section: prev[prev.length - 1]?.section || 'General',
        question_num: nextNum,
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, question_num: i + 1, id: `q${i + 1}` }))
    );
  };

  const handleUpdateQuestion = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIdx].options];
      newOpts[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options: newOpts };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    // Validate
    if (!title.trim()) {
      setError('Please provide a quiz title.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} statement is empty.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError(`Question ${i + 1} has blank options.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Map questions with correct_answer string
      const payloadQuestions = questions.map((q) => ({
        ...q,
        correct_answer: q.options[q.correct_index || 0],
      }));

      const res = await authFetch('/api/quizzes/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          exam_type: examType,
          duration_minutes: durationMinutes,
          questions: payloadQuestions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onQuizUploaded();
        onClose();
      } else {
        setError(data.error || 'Failed to upload quiz');
      }
    } catch {
      setError('Server unreachable. Please check backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl rounded-[32px] overflow-hidden text-[var(--x-text)] shadow-2xl border border-[var(--x-border)] bg-[var(--x-surface)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--x-border)] bg-[var(--x-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--x-text)] tracking-tight">Upload Contest / Quiz</h3>
              <p className="text-xs text-[var(--x-subtext)]">Author custom questions with automatic scoring across all contest domains</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--x-surface-hover)] flex items-center justify-center text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Contest / Quiz Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Full-Stack CS Contest, GATE Networks, or NEET Mock"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Contest Category</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="general">Open Contest / Quiz</option>
                <option value="jee_main">JEE Main / Advanced</option>
                <option value="neet">NEET Examination</option>
                <option value="gate">GATE Engineering</option>
                <option value="dsa_tech">DSA & Tech Interview</option>
                <option value="cs_engg">CS & Programming</option>
                <option value="aptitude">Aptitude & Reasoning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Description / Topics Covered</label>
            <textarea
              rows={2}
              placeholder="Topics covered, guidelines, and scoring details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)]"
            />
          </div>

          {/* Question List Builder */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--x-text)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--x-text)] bg-[var(--x-surface-hover)] border border-[var(--x-border)] transition-all cursor-pointer hover:border-[#0A84FF]"
              >
                <Plus className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-[#0A84FF] border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Section (e.g. General, Physics, DSA)"
                      value={q.section}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'section', e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-semibold text-[var(--x-text)] focus:outline-none w-48 placeholder:[var(--x-subtext)]"
                    />
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-[var(--x-subtext)] hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter question statement (supports plain text & standard mathematical equations)..."
                    value={q.question}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] placeholder-[var(--x-subtext)]"
                  />
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                        q.correct_index === optIdx
                          ? 'border-emerald-500/50 bg-emerald-500/15 shadow-sm'
                          : 'border-[var(--x-border)] bg-[var(--x-bg)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct_${q.id}`}
                        checked={q.correct_index === optIdx}
                        onChange={() => handleUpdateQuestion(qIdx, 'correct_index', optIdx)}
                        className="accent-emerald-500 cursor-pointer w-4 h-4"
                      />
                      <span className="text-xs font-mono font-bold text-[var(--x-subtext)]">
                        {String.fromCharCode(65 + optIdx)}:
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        value={opt}
                        onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-[var(--x-text)] focus:outline-none placeholder-[var(--x-subtext)]"
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <input
                    type="text"
                    placeholder="Explanation / step-by-step formula derivation..."
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--x-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ios-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 btn-keep-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Uploading Quiz...' : 'Publish Quiz'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
