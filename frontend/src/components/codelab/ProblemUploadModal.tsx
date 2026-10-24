import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Code2,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  ClipboardPaste
} from 'lucide-react';
import { SampleCase } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TestCaseEntry {
  id: string;
  input: string;
  expected_output: string;
}

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
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9');

  // Dynamic Sample Cases
  const [sampleCases, setSampleCases] = useState<SampleCase[]>([
    {
      input: '4\n2 7 11 15\n9',
      output: '0 1',
      explanation: 'Because nums[0] + nums[1] == 9, we return indices [0, 1].',
    },
    {
      input: '3\n3 2 4\n6',
      output: '1 2',
      explanation: 'Because nums[1] + nums[2] == 6, we return indices [1, 2].',
    },
  ]);

  // Dynamic Test Cases (Clean Input & Output fields with + button)
  const [testCases, setTestCases] = useState<TestCaseEntry[]>([
    { id: '1', input: '5\n1 5 3 7 9\n12', expected_output: '1 3' },
    { id: '2', input: '5\n10 20 30 40 50\n70', expected_output: '1 4' },
    { id: '3', input: '4\n-1 -2 -3 -4\n-5', expected_output: '1 2' },
    { id: '4', input: '6\n1 2 3 4 5 6\n11', expected_output: '4 5' },
    { id: '5', input: '5\n100 200 500 400 300\n600', expected_output: '0 2' },
  ]);

  // Optional Bulk Import Accordion
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample Cases Handlers
  const handleAddSampleCase = () => {
    setSampleCases((prev) => [
      ...prev,
      { input: '', output: '', explanation: '' },
    ]);
  };

  const handleUpdateSample = (idx: number, field: keyof SampleCase, val: string) => {
    setSampleCases((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveSampleCase = (idx: number) => {
    if (sampleCases.length <= 1) return;
    setSampleCases((prev) => prev.filter((_, i) => i !== idx));
  };

  // Test Cases Handlers (+ Add Test Case, Update, Remove)
  const handleAddTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        input: '',
        expected_output: '',
      },
    ]);
  };

  const handleUpdateTestCase = (idx: number, field: 'input' | 'expected_output', val: string) => {
    setTestCases((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveTestCase = (idx: number) => {
    if (testCases.length <= 1) return;
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quick Bulk Paste Parse
  const handleImportBulk = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const parsed: TestCaseEntry[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.includes('===')) {
        const [inp, outp] = trimmed.split('===');
        parsed.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          input: inp.trim().replace(/\\n/g, '\n'),
          expected_output: outp.trim().replace(/\\n/g, '\n'),
        });
      }
    }
    if (parsed.length > 0) {
      setTestCases((prev) => [...prev, ...parsed]);
      setBulkText('');
      setShowBulkPaste(false);
    }
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

    const validSampleCases = sampleCases.filter((sc) => sc.input.trim() && sc.output.trim());
    if (validSampleCases.length === 0) {
      setError('Please provide at least 1 valid sample case with input and output.');
      return;
    }

    const validTestCases = testCases
      .filter((tc) => tc.input.trim() && tc.expected_output.trim())
      .map((tc) => ({ input: tc.input.trim(), expected_output: tc.expected_output.trim() }));

    if (validTestCases.length === 0) {
      setError('Please provide at least 1 test case with input and expected output.');
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
          duration_minutes: durationMinutes,
          description: description.trim(),
          constraints: constraints.trim(),
          sample_cases: validSampleCases,
          test_cases: validTestCases,
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
      setError('Server unreachable. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCount = sampleCases.length + testCases.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden text-[var(--x-text)] shadow-2xl border border-[var(--x-border)] bg-[var(--x-surface)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--x-border)] bg-[var(--x-surface)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ios-blue to-[#0071e3] text-white flex items-center justify-center shadow-lg shadow-ios-blue/30 border border-white/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--x-text)] tracking-tight">Create & Upload Coding Problem</h3>
              <p className="text-xs text-[var(--x-subtext)]">Structured test case manager with dynamic + button</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title, Difficulty, Category & Exam Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Problem Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Two Sum, Valid Parentheses"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Algorithms, Arrays"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5 flex items-center justify-between">
                <span>Duration</span>
                <span className="text-[10px] text-[#0A84FF] font-mono">mins</span>
              </label>
              <input
                type="number"
                min={5}
                max={300}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                className="w-full px-3 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-sm font-mono font-bold text-[var(--x-text)] text-center focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Problem Statement & Description</label>
            <textarea
              rows={3}
              required
              placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs sm:text-sm text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all placeholder-[var(--x-subtext)] leading-relaxed"
            />
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-xs font-semibold text-[var(--x-subtext)] mb-1.5">Constraints</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
              className="w-full px-4 py-2 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-[#0A84FF] dark:text-purple-300 focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
            />
          </div>

          {/* ── SECTION 1: SAMPLE TEST CASES (VISIBLE WITH EXPLANATIONS) ── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                Sample Test Cases (Visible with Explanations)
              </h4>
              <button
                type="button"
                onClick={handleAddSampleCase}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sample Case</span>
              </button>
            </div>

            <div className="space-y-3">
              {sampleCases.map((sc, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--x-text)] flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                      Sample Case #{i + 1}
                    </span>
                    {sampleCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSampleCase(i)}
                        className="p-1 rounded-lg text-[var(--x-subtext)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove Sample Case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1 font-semibold">Input (stdin)</span>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. 4&#10;2 7 11 15&#10;9"
                        value={sc.input}
                        onChange={(e) => handleUpdateSample(i, 'input', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1 font-semibold">Expected Output (stdout)</span>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. 0 1"
                        value={sc.output}
                        onChange={(e) => handleUpdateSample(i, 'output', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[#0A84FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--x-subtext)] block mb-1 font-semibold">Explanation</span>
                    <input
                      type="text"
                      placeholder="e.g. Because nums[0] + nums[1] == 9, return [0, 1]."
                      value={sc.explanation}
                      onChange={(e) => handleUpdateSample(i, 'explanation', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: STRUCTURED TEST CASES WITH + BUTTON ── */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Evaluation Test Cases (Input & Output)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {testCases.length} Cases
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-[var(--x-subtext)] hover:text-[var(--x-text)] bg-[var(--x-surface-hover)] border border-[var(--x-border)] transition-all cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>{showBulkPaste ? 'Hide Bulk Paste' : 'Bulk Import'}</span>
                  {showBulkPaste ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20 btn-keep-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Test Case</span>
                </button>
              </div>
            </div>

            {/* Bulk Text Import Collapsible */}
            <AnimatePresence>
              {showBulkPaste && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--x-text)]">Bulk Import from Text</span>
                    <span className="text-[10px] text-[var(--x-subtext)] font-mono">Format: Input === Output (one per line)</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="5\n1 2 3 4 5\n9 === 3 4&#10;4\n-1 -2 -3 -4\n-5 === 1 2"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--x-surface)] border border-[var(--x-border)] text-xs font-mono text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleImportBulk}
                      disabled={!bulkText.trim()}
                      className="px-3 py-1 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold hover:bg-[#0071e3] transition-all cursor-pointer disabled:opacity-40"
                    >
                      Parse & Append Cases
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic List of Test Cases */}
            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div
                  key={tc.id}
                  className="p-3.5 rounded-2xl bg-[var(--x-surface-hover)] border border-[var(--x-border)] space-y-2 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--x-surface)] border border-[var(--x-border)] text-[11px] font-mono font-bold text-[var(--x-text)]">
                        Case #{idx + 1}
                      </span>
                    </div>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="p-1 rounded-lg text-[var(--x-subtext)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Test Case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1 font-semibold">
                        Input (stdin)
                      </span>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. 5&#10;1 5 3 7 9&#10;12"
                        value={tc.input}
                        onChange={(e) => handleUpdateTestCase(idx, 'input', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-[var(--x-text)] focus:outline-none focus:border-[#0A84FF] placeholder-[var(--x-subtext)]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--x-subtext)] block font-mono mb-1 font-semibold">
                        Expected Output (stdout)
                      </span>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. 1 3"
                        value={tc.expected_output}
                        onChange={(e) => handleUpdateTestCase(idx, 'expected_output', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--x-bg)] border border-[var(--x-border)] text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[#0A84FF] placeholder-[var(--x-subtext)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* + Add Test Case Button */}
            <button
              type="button"
              onClick={handleAddTestCase}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[#0A84FF]/40 hover:border-[#0A84FF] bg-[#0A84FF]/5 hover:bg-[#0A84FF]/10 text-[#0A84FF] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Add Another Test Case (+ button)</span>
            </button>

            {/* Coverage & Auto-Synthesizer Banner */}
            <div className="p-3 rounded-2xl bg-[var(--x-bg)] border border-[var(--x-border)] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[var(--x-subtext)]">
                  Total Cases: <strong className="text-[var(--x-text)]">{sampleCases.length} sample</strong> + <strong className="text-[var(--x-text)]">{testCases.length} test cases</strong> = <strong className="text-[#0A84FF]">{totalCount} total</strong>
                </span>
              </div>
              <span className="text-[11px] text-[var(--x-subtext)] hidden sm:inline">
                {totalCount < 20 ? '⚡ EdgeCaseSynthesizer active' : '✓ Full coverage'}
              </span>
            </div>
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
              className="ios-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 btn-keep-white shadow-lg shadow-blue-500/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing Problem...' : 'Publish Contest Problem'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
