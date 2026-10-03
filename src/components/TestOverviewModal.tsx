import React, { useState } from 'react';
import { Check, Play, ShieldCheck, Sparkles, X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-page-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pretest-title"
    >
      <div className="w-full max-w-2xl rounded-2xl surface-card border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {mode === TestMode.FULL_SYLLABUS
                  ? 'Full Syllabus Simulation'
                  : mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Targeted Mistake Retest'
                    : 'Custom Chapter Test'}
              </span>
            </div>
            <h2 id="pretest-title" className="text-2xl sm:text-3xl font-display font-semibold text-white">
              Ready to begin?
            </h2>
          </div>
          {!isGenerating && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isGenerating ? (
          /* Polished Test Generation Animation (Part 6 & Part 37) */
          <div className="p-10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto">
              <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>

            <div className="text-center space-y-1.5">
              <div className="text-xs font-semibold text-blue-400">Getting everything ready</div>
              <h3 className="text-2xl sm:text-3xl font-display text-white">
                Generating your test...
              </h3>
            </div>

            <div className="max-w-md mx-auto space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-200 font-medium">
                  Selecting questions ({selectedSubjects.join(' · ')})...
                </span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>

              <div
                className={`p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between transition-opacity duration-200 ${
                  generationStep >= 2 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className="text-slate-200 font-medium">
                  Balancing difficulty & problem archetypes...
                </span>
                {generationStep >= 2 && <Check className="w-4 h-4 text-emerald-400" />}
              </div>

              <div
                className={`p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between transition-opacity duration-200 ${
                  generationStep >= 3 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className="text-slate-200 font-medium">Starting exam clock...</span>
                {generationStep >= 3 && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-xs text-red-200 leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Selected Subjects & Chapters */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300">Your Selected Battlefield</div>
              <div className="grid grid-cols-1 gap-3">
                {selectedSubjects.map((sub) => {
                  const chaps = chaptersBySubject[sub] || [];
                  return (
                    <div
                      key={sub}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{sub}</span>
                        <span className="text-xs font-mono text-blue-400 tabular-nums font-semibold">
                          {mode === TestMode.FULL_SYLLABUS
                            ? 'All Syllabus Chapters'
                            : `${chaps.length} Chapter${chaps.length === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      {mode !== TestMode.FULL_SYLLABUS && chaps.length > 0 && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {chaps.join(' · ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Pattern & Marking Scheme */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">Questions</div>
                <div className="text-lg font-mono font-semibold text-white mt-0.5 tabular-nums">
                  {mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Mistake Pool'
                    : `${totalQuestions} Qs`}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                  {mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Wrong Qs only'
                    : `${totalMcq} MCQ · ${totalInt} Int`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">Duration</div>
                <div className="text-lg font-mono font-semibold text-emerald-400 mt-0.5 tabular-nums">
                  {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Auto-submits at 00:00
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">Difficulty</div>
                <div className="text-lg font-semibold text-white mt-0.5">Balanced</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                  25% E · 50% M · 25% H
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">Marking</div>
                <div className="text-sm font-mono font-semibold text-white mt-1 tabular-nums">
                  MCQ: +4 / -1
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                  Numerical: +4 / 0
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {mode === TestMode.WRONG_QUESTION_RETEST
                  ? 'Contains strictly your previously incorrect questions from the selected chapters. All correct questions are excluded.'
                  : 'Every question is drawn strictly from your selected chapters, capped at 1–2 per problem archetype, with real-time answer autosave.'}
              </span>
            </div>

            {/* Footer Controls */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-interactive px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                className="btn-interactive px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950/50 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Test Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
