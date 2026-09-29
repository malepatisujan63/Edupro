import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, CheckCircle2, Code2, AlertCircle, FileText } from 'lucide-react';
import { SampleCase } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProblemUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemUploaded: () => void;
}

export const ProblemUploadModal: React.FC<ProblemUploadModalProps> = ({
  isOpen,
  onClose,
  onProblemUploaded,
}) => {
  const { authFetch, user, openAuthModal } = useAuth();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [category, setCategory] = useState('Algorithms');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9');

  // 3 Sample Cases (with input, output, explanation)
  const [sampleCases, setSampleCases] = useState<SampleCase[]>([
    { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'Because nums[0] + nums[1] == 9, return 0 1.' },
    { input: '3\n3 2 4\n6', output: '1 2', explanation: 'Because nums[1] + nums[2] == 6, return 1 2.' },
    { input: '2\n3 3\n6', output: '0 1', explanation: 'Because nums[0] + nums[1] == 6, return 0 1.' },
  ]);

  // Hidden test cases (must be >= 20 total)
  const [testCasesText, setTestCasesText] = useState<string>(
    `# Enter test cases in format: Input === ExpectedOutput (one per line or block)
# Minimum 20 test cases required for robust LeetCode judging.
5\\n1 5 3 7 9\\n12 === 1 3
5\\n10 20 30 40 50\\n70 === 1 4
4\\n-1 -2 -3 -4\\n-5 === 1 2
4\\n-10 7 15 3\\n-7 === 0 3
6\\n0 4 3 0 1 2\\n0 === 0 3
5\\n100 200 500 400 300\\n600 === 0 2
6\\n1 2 3 4 5 6\\n11 === 4 5
5\\n-5 1 2 3 8\\n3 === 0 4
4\\n25 35 45 55\\n80 === 0 3
5\\n9 4 1 8 5\\n10 === 0 2
5\\n10 15 3 7 20\\n22 === 1 3
4\\n-100 0 100 50\\n0 === 0 2
5\\n2 4 6 8 10\\n18 === 3 4
4\\n12 18 24 30\\n42 === 0 3
5\\n7 11 13 17 19\\n30 === 1 3
4\\n500 1000 1500 2000\\n2500 === 0 3
6\\n1 3 5 7 9 11\\n14 === 2 4
5\\n8 2 15 6 3\\n5 === 1 4
4\\n4 6 8 10\\n14 === 1 2
5\\n3 5 7 9 11\\n16 === 2 3`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateSample = (idx: number, field: keyof SampleCase, val: string) => {
    setSampleCases((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const parseTestCases = () => {
    const lines = testCasesText.split('\n');
    const cases: { input: string; expected_output: string }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.includes('===')) {
        const [inp, outp] = trimmed.split('===');
        cases.push({
          input: inp.trim().replace(/\\n/g, '\n'),
          expected_output: outp.trim().replace(/\\n/g, '\n'),
        });
      }
    }
    return cases;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and problem description are required.');
      return;
    }

    const hiddenCases = parseTestCases();
    const totalCasesCount = sampleCases.length + hiddenCases.length;

    if (totalCasesCount < 20) {
      setError(`Minimum 20 test cases required for judging. Currently have ${sampleCases.length} sample + ${hiddenCases.length} hidden = ${totalCasesCount} total.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/problems/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          difficulty,
          category,
          description: description.trim(),
          constraints: constraints.trim(),
          sample_cases: sampleCases,
          test_cases: hiddenCases,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onProblemUploaded();
        onClose();
      } else {
        setError(data.error || 'Failed to upload problem.');
      }
    } catch {
      setError('Server unreachable. Please check backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentHiddenCount = parseTestCases().length;
  const totalCount = sampleCases.length + currentHiddenCount;

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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ios-blue to-[#0071e3] text-white flex items-center justify-center shadow-lg shadow-ios-blue/30 border border-white/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--x-text)] tracking-tight">Upload Contest Problem</h3>
              <p className="text-xs text-[var(--x-subtext)]">LeetCode contest standard: 3 sample cases + min 20 hidden test cases</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--x-surface-hover)] flex items-center justify-center text-[var(--x-subtext)] hover:text-[var(--x-text)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Problem Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Trapping Rain Water"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Problem Statement & Description</label>
            <textarea
              rows={3}
              required
              placeholder="Given an array of integers... return the maximum water trapped."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Constraints</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-[#0A84FF] dark:text-purple-300 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
            />
          </div>

          {/* 3 SAMPLE TEST CASES (INPUT, OUTPUT, EXPLANATION) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
              3 Sample Test Cases (Visible with Explanations)
            </h4>

            {sampleCases.map((sc, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2.5 shadow-sm">
                <span className="text-xs font-bold text-[var(--x-text)] flex items-center gap-1.5 font-mono">
                  Sample Case {i + 1}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1">Input</span>
                    <textarea
                      rows={2}
                      required
                      value={sc.input}
                      onChange={(e) => handleUpdateSample(i, 'input', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1">Expected Output</span>
                    <textarea
                      rows={2}
                      required
                      value={sc.output}
                      onChange={(e) => handleUpdateSample(i, 'output', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--x-subtext)] block mb-1">Explanation</span>
                  <input
                    type="text"
                    required
                    value={sc.explanation}
                    onChange={(e) => handleUpdateSample(i, 'explanation', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* MINIMUM 20 TEST CASES UPLOAD (INPUT FORMAT & OUTPUT FORMAT) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Hidden Test Cases (Minimum 20 Required)
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                totalCount >= 20
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {totalCount} Total ({currentHiddenCount} hidden + 3 sample)
              </span>
            </div>
            <p className="text-[11px] text-[var(--x-subtext)] font-mono">
              Format: <code className="text-[#0A84FF]">Input === Output</code> (one case per line)
            </p>
            <textarea
              rows={8}
              required
              value={testCasesText}
              onChange={(e) => setTestCasesText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-emerald-600 dark:text-emerald-300 placeholder-[var(--x-subtext)] focus:outline-none focus:border-[#0A84FF] leading-relaxed"
            />
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
              <span>{isSubmitting ? 'Uploading Problem...' : 'Publish Contest Problem'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
