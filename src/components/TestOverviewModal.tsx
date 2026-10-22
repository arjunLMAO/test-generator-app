import React, { useState } from 'react';
import { Check, Play, ShieldCheck, X } from 'lucide-react';
import { SubjectName, TestMode } from '../types/jee';

interface TestOverviewModalProps {
  mode: TestMode;
  selectedSubjects: SubjectName[];
  chaptersBySubject: Partial<Record<SubjectName, string[]>>;
  allowFlexibleCount?: boolean;
  onConfirmStart: () => Promise<void>;
  onClose: () => void;
  errorMessage?: string | null;
}

export const TestOverviewModal: React.FC<TestOverviewModalProps> = ({
  mode,
  selectedSubjects,
  chaptersBySubject,
  onConfirmStart,
  onClose,
  errorMessage,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const subjectCount = selectedSubjects.length;
  const totalQuestions = subjectCount * 25;
  const totalMcq = subjectCount * 20;
  const totalInt = subjectCount * 5;
  const durationHours = subjectCount;

  const handleLaunch = async () => {
    setIsGenerating(true);
    setGenerationStep(1);
    await new Promise((r) => setTimeout(r, 200));
    setGenerationStep(2);
    await new Promise((r) => setTimeout(r, 200));
    setGenerationStep(3);
    await new Promise((r) => setTimeout(r, 160));
    await onConfirmStart();
    setIsGenerating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-page-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pretest-title"
    >
      <div className="w-full max-w-xl rounded-lg bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 shadow-xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {mode === TestMode.FULL_SYLLABUS
                ? 'Full Syllabus Test'
                : mode === TestMode.WRONG_QUESTION_RETEST
                  ? 'Mistake Retest'
                  : 'Chapter Test'}
            </div>
            <h2 id="pretest-title" className="text-xl font-bold text-neutral-950 dark:text-white">
              Test Overview
            </h2>
          </div>
          {!isGenerating && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isGenerating ? (
          <div className="p-8 space-y-6">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin mx-auto" />

            <div className="text-center space-y-1">
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Preparing session</div>
              <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                Generating your test...
              </h3>
            </div>

            <div className="max-w-md mx-auto space-y-2 text-xs">
              <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  Selecting questions ({selectedSubjects.join(' · ')})...
                </span>
                <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
              </div>

              <div
                className={`p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between transition-opacity duration-200 ${
                  generationStep >= 2 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  Balancing difficulty & problem types...
                </span>
                {generationStep >= 2 && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
              </div>

              <div
                className={`p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between transition-opacity duration-200 ${
                  generationStep >= 3 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Initializing exam environment...</span>
                {generationStep >= 3 && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 rounded bg-neutral-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Selected Subjects & Chapters */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Selected Subjects & Chapters</div>
              <div className="grid grid-cols-1 gap-2">
                {selectedSubjects.map((sub) => {
                  const chaps = chaptersBySubject[sub] || [];
                  return (
                    <div
                      key={sub}
                      className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{sub}</span>
                        <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 font-medium">
                          {mode === TestMode.FULL_SYLLABUS
                            ? 'All Syllabus Chapters'
                            : `${chaps.length} Chapter${chaps.length === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      {mode !== TestMode.FULL_SYLLABUS && chaps.length > 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {chaps.join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Pattern & Marking Scheme */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Questions</div>
                <div className="text-base font-mono font-semibold text-neutral-950 dark:text-white mt-0.5 tabular-nums">
                  {mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Mistakes'
                    : `${totalQuestions} Qs`}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                  {mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Wrong Qs only'
                    : `${totalMcq} MCQ · ${totalInt} Int`}
                </div>
              </div>

              <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Duration</div>
                <div className="text-base font-mono font-semibold text-neutral-950 dark:text-white mt-0.5 tabular-nums">
                  {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Timed session
                </div>
              </div>

              <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Difficulty</div>
                <div className="text-base font-semibold text-neutral-950 dark:text-white mt-0.5">Balanced</div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                  25% E · 50% M · 25% H
                </div>
              </div>

              <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Marking</div>
                <div className="text-xs font-mono font-semibold text-neutral-950 dark:text-white mt-0.5 tabular-nums">
                  MCQ: +4 / -1
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                  Num: +4 / 0
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
              <span>
                {mode === TestMode.WRONG_QUESTION_RETEST
                  ? 'Contains strictly questions from your selected scope that you previously answered incorrectly.'
                  : 'Questions are selected strictly from the specified chapters with automatic autosave.'}
              </span>
            </div>

            {/* Footer Controls */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                className="px-4 py-2 text-xs font-medium text-white dark:text-neutral-950 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Test</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
