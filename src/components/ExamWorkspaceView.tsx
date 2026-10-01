import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Grid,
  Keyboard,
  Maximize2,
  Send,
  X,
} from 'lucide-react';
import {
  GeneratedTest,
  NormalizedQuestion,
  QuestionPaletteStatus,
  QuestionResponseState,
  SubjectName,
} from '../types/jee';
import { sanitizeStudentQuestionText } from '../services/StudentQuestionSerializer';
import { MathText } from './MathText';

interface ExamWorkspaceViewProps {
  test: GeneratedTest;
  questionsById: Map<string, NormalizedQuestion>;
  remainingSeconds: number;
  onUpdateResponse: (
    questionId: string,
    updater: (prev: QuestionResponseState) => QuestionResponseState,
    nextOrder?: number,
    nextSubject?: SubjectName
  ) => void;
  onNavigateQuestion: (targetOrder: number) => void;
  onSubmitTest: (autoSubmitted: boolean) => void;
}

function formatExamTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ExamWorkspaceView: React.FC<ExamWorkspaceViewProps> = ({
  test,
  questionsById,
  remainingSeconds,
  onUpdateResponse,
  onNavigateQuestion,
  onSubmitTest,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showShortcutsTip, setShowShortcutsTip] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const currentAllocation = useMemo(() => {
    return (
      test.questions.find((q) => q.order === test.currentQuestionOrder) || test.questions[0]
    );
  }, [test.questions, test.currentQuestionOrder]);

  const currentQuestion = useMemo(() => {
    return questionsById.get(currentAllocation.questionId);
  }, [questionsById, currentAllocation]);

  const currentResponse: QuestionResponseState = useMemo(() => {
    return (
      test.responses[currentAllocation.questionId] || {
        questionId: currentAllocation.questionId,
        answer: null,
        status: QuestionPaletteStatus.VISITED,
        markedForReview: false,
        visited: true,
        timeSpentSeconds: 0,
        lastUpdatedAt: new Date().toISOString(),
      }
    );
  }, [test.responses, currentAllocation.questionId]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [currentAllocation.questionId]);

  // Track per-question time spent every second
  const activeQuestionIdRef = useRef(currentAllocation.questionId);
  activeQuestionIdRef.current = currentAllocation.questionId;

  useEffect(() => {
    const interval = setInterval(() => {
      const qId = activeQuestionIdRef.current;
      onUpdateResponse(qId, (prev) => ({
        ...prev,
        visited: true,
        timeSpentSeconds: (prev.timeSpentSeconds || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [onUpdateResponse]);

  const computePaletteStatus = (
    answer: string | null,
    markedForReview: boolean
  ): QuestionPaletteStatus => {
    const hasAns = answer !== null && String(answer).trim().length > 0;
    if (hasAns && markedForReview) return QuestionPaletteStatus.ANSWERED_MARKED_REVIEW;
    if (hasAns) return QuestionPaletteStatus.ANSWERED;
    if (markedForReview) return QuestionPaletteStatus.MARKED_REVIEW;
    return QuestionPaletteStatus.VISITED;
  };

  const handleSelectMcqOption = (letter: 'A' | 'B' | 'C' | 'D') => {
    onUpdateResponse(currentAllocation.questionId, (prev) => {
      const nextAns = letter;
      return {
        ...prev,
        answer: nextAns,
        visited: true,
        status: computePaletteStatus(nextAns, prev.markedForReview),
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  };

  const handleIntegerInputChange = (val: string) => {
    // Allow digits, optional leading minus, and single decimal point
    if (val !== '' && val !== '-' && val !== '.' && val !== '-.' && !/^-?\d*(\.\d*)?$/.test(val)) {
      return;
    }
    onUpdateResponse(currentAllocation.questionId, (prev) => {
      const nextAns = val.trim() === '' ? null : val;
      return {
        ...prev,
        answer: nextAns,
        visited: true,
        status: computePaletteStatus(nextAns, prev.markedForReview),
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  };

  const handleClearAnswer = () => {
    onUpdateResponse(currentAllocation.questionId, (prev) => ({
      ...prev,
      answer: null,
      visited: true,
      status: computePaletteStatus(null, prev.markedForReview),
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleMarkForReview = () => {
    onUpdateResponse(currentAllocation.questionId, (prev) => {
      const nextMarked = !prev.markedForReview;
      return {
        ...prev,
        markedForReview: nextMarked,
        visited: true,
        status: computePaletteStatus(prev.answer, nextMarked),
        lastUpdatedAt: new Date().toISOString(),
      };
    });
  };

  const handlePrevious = () => {
    if (currentAllocation.order > 1) {
      onNavigateQuestion(currentAllocation.order - 1);
    }
  };

  const handleNext = () => {
    if (currentAllocation.order < test.questions.length) {
      onNavigateQuestion(currentAllocation.order + 1);
    }
  };

  const handleSwitchSubjectTab = (sub: SubjectName) => {
    const firstInSub = test.questions.find((q) => q.subject === sub);
    if (firstInSub) {
      onNavigateQuestion(firstInSub.order);
    }
  };

  // Keyboard shortcuts for exam speed (Section 54)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || zoomedImage) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      const key = e.key.toUpperCase();
      if (currentQuestion?.type === 'mcq') {
        if (key === 'A' || key === 'B' || key === 'C' || key === 'D') {
          e.preventDefault();
          handleSelectMcqOption(key as 'A' | 'B' | 'C' | 'D');
          return;
        }
      }
      if (key === 'M') {
        e.preventDefault();
        handleToggleMarkForReview();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Palette summary statistics
  const paletteCounts = useMemo(() => {
    let answered = 0;
    let unattempted = 0;
    let markedOnly = 0;
    let answeredAndMarked = 0;

    for (const q of test.questions) {
      const r = test.responses[q.questionId];
      const hasAns = r?.answer !== null && r?.answer !== undefined && String(r.answer).trim() !== '';
      const isMarked = Boolean(r?.markedForReview);

      if (hasAns && isMarked) {
        answered++;
        answeredAndMarked++;
      } else if (hasAns) {
        answered++;
      } else if (isMarked) {
        unattempted++;
        markedOnly++;
      } else {
        unattempted++;
      }
    }

    return {
      answered,
      unattempted,
      markedForReviewTotal: markedOnly + answeredAndMarked,
      answeredAndMarked,
      markedOnly,
    };
  }, [test.questions, test.responses]);

  // Timer visual warning state (Section 16)
  const timerState =
    remainingSeconds <= 300
      ? 'critical'
      : remainingSeconds <= 900
        ? 'warning'
        : 'normal';

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-200 flex items-center justify-center p-6">
        Loading question data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* TOP EXAM HEADER (Sections 11, 12, 16, 17) */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-[#0D1320] border-b border-slate-800 flex items-center justify-between gap-3">
        {/* Left: Brand + Test Title */}
        <div className="flex items-center gap-4 min-w-0">
          <span className="text-xl font-display font-semibold text-white whitespace-nowrap shrink-0">
            JEE Test Generator
          </span>
          <span className="hidden xl:inline text-xs text-slate-400 truncate max-w-xs">
            {test.title}
          </span>
        </div>

        {/* Center: Subject Navigation Tabs (Physics | Chemistry | Mathematics) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {test.subjects.map((sub) => {
            const isActive = currentAllocation.subject === sub;
            const subQs = test.questions.filter((q) => q.subject === sub);
            const subAns = subQs.filter((q) => {
              const a = test.responses[q.questionId]?.answer;
              return a !== null && a !== undefined && String(a).trim() !== '';
            }).length;

            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSwitchSubjectTab(sub)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <span>{sub}</span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  ({subAns}/{subQs.length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Countdown Timer + Mobile Palette Button + Submit Test Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold tabular-nums flex items-center gap-1.5 ${
              timerState === 'critical'
                ? 'bg-red-950/70 border-red-500 text-red-200 animate-pulse'
                : timerState === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
            title="Remaining examination time"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatExamTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Open question palette"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Notice Banner for Mistake Retests or Flexible Counts */}
      {test.noticeMessage && (
        <div className="px-6 py-2 bg-blue-950/40 border-b border-blue-500/30 text-xs text-blue-200 flex items-center justify-between">
          <span>{test.noticeMessage}</span>
          <span className="font-medium text-[11px] text-blue-300">
            Autosave Active
          </span>
        </div>
      )}

      {/* MAIN WORKSPACE: LEFT QUESTION AREA + RIGHT SIDEBAR PALETTE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / MAIN QUESTION AREA */}
        <main className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto px-6 py-7 space-y-6">
            {/* Question Metadata Header (Clean exam-authentic header without chapter/topic spoilers) */}
            <div className="pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-400">
                <span className="text-lg font-semibold text-white tracking-tight">
                  Question {currentAllocation.order} <span className="text-slate-500 font-normal">of {test.questions.length}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-blue-400">
                  {currentQuestion.subject}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 font-medium">
                  {currentQuestion.type === 'mcq' ? 'Single Choice (MCQ)' : 'Numerical Value'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                <span className="text-emerald-400 font-semibold">
                  +{currentQuestion.type === 'mcq' ? test.scoringConfig.mcqCorrectMarks : test.scoringConfig.integerCorrectMarks}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-red-400 font-semibold">
                  {currentQuestion.type === 'mcq' ? test.scoringConfig.mcqWrongMarks : test.scoringConfig.integerWrongMarks}
                </span>
                <button
                  type="button"
                  onClick={() => setShowShortcutsTip((p) => !p)}
                  className="ml-2 font-sans text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  title="Keyboard shortcuts"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
              </div>
            </div>

            {showShortcutsTip && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center gap-4">
                <span><strong className="font-mono text-white">A / B / C / D</strong> Select Option</span>
                <span>·</span>
                <span><strong className="font-mono text-white">M</strong> Mark for Review</span>
                <span>·</span>
                <span><strong className="font-mono text-white">← / →</strong> Previous / Next</span>
              </div>
            )}

            {/* Question Statement */}
            <div className="text-base sm:text-lg text-slate-100 leading-relaxed py-2 select-text">
              <MathText text={sanitizeStudentQuestionText(currentQuestion.question)} />
            </div>

            {/* Optional Image / Scientific Diagram with Zoom & Fallback (Section 26, 116) */}
            {currentQuestion.image && (
              <div className="my-4">
                {!imageLoadFailed ? (
                  <div className="relative inline-block max-w-full rounded-xl bg-[#0B1120] border border-slate-800 p-4">
                    <img
                      src={currentQuestion.image}
                      alt={`Diagram for Question ${currentAllocation.order}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImageLoadFailed(true)}
                      className="max-h-64 w-auto object-contain rounded cursor-zoom-in"
                      onClick={() => setZoomedImage(currentQuestion.image!)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(currentQuestion.image!)}
                      className="mt-2 text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Enlarge figure</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
                    Figure reference unavailable ({currentQuestion.chapter} · {currentQuestion.topic}). All required numerical parameters are provided in the problem statement above.
                  </div>
                )}
              </div>
            )}

            {/* ANSWER INPUT AREA: MCQ vs INTEGER TYPE (Section 6, 147) */}
            {currentQuestion.type === 'mcq' && currentQuestion.options ? (
              <div className="space-y-3 pt-2" role="radiogroup" aria-label="MCQ Options">
                {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                  const optionText = currentQuestion.options![idx];
                  const isSelected = currentResponse.answer === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectMcqOption(letter)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500 text-white'
                          : 'bg-[#111827] border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg font-mono text-sm font-semibold flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base flex-1">
                        <MathText text={optionText} />
                      </span>
                      {isSelected && (
                        <span className="text-xs font-mono text-blue-400 shrink-0 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* INTEGER / NUMERICAL TYPE INPUT (Section 6) */
              <div className="p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-4 max-w-md">
                <label
                  htmlFor="integer-answer-input"
                  className="block text-sm font-semibold text-white"
                >
                  Enter your numerical answer
                </label>
                <input
                  id="integer-answer-input"
                  type="text"
                  inputMode="decimal"
                  value={currentResponse.answer ?? ''}
                  onChange={(e) => handleIntegerInputChange(e.target.value)}
                  placeholder="Type integer or decimal value..."
                  className="w-full px-4 py-3 text-lg font-mono bg-[#090D16] border border-slate-700 focus:border-blue-500 rounded-lg text-white placeholder:text-slate-600 focus:outline-none tabular-nums"
                />
                <p className="text-xs text-slate-400">
                  No negative marking applies to Numerical / Integer Answer Type questions. Your response is saved automatically as you type.
                </p>
              </div>
            )}
          </div>

          {/* STICKY BOTTOM EXAM CONTROLS (Sections 14, 92, 93, 115) */}
          <div className="sticky bottom-0 z-20 px-6 py-4 bg-[#0D1320]/95 backdrop-blur border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  currentResponse.markedForReview
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    currentResponse.markedForReview ? 'fill-amber-300' : ''
                  }`}
                />
                <span>
                  {currentResponse.markedForReview
                    ? 'Marked for Review'
                    : 'Mark for Review'}
                </span>
              </button>

              {currentResponse.answer !== null && currentResponse.answer !== '' && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="px-3.5 py-2.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentAllocation.order <= 1}
                onClick={handlePrevious}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentAllocation.order <= 1
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentAllocation.order < test.questions.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Review & Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: QUESTION PALETTE (Sections 13, 91) */}
        <aside className="hidden lg:flex w-80 bg-[#0D1320] border-l border-slate-800 flex-col justify-between shrink-0">
          <QuestionPaletteContent
            test={test}
            currentOrder={currentAllocation.order}
            paletteCounts={paletteCounts}
            onSelectQuestion={(order) => onNavigateQuestion(order)}
          />
        </aside>
      </div>

      {/* MOBILE QUESTION PALETTE DRAWER (Section 55, 114) */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/75 backdrop-blur-xs">
          <div className="w-80 max-w-full bg-[#0D1320] h-full flex flex-col justify-between border-l border-slate-800">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Question Palette</span>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <QuestionPaletteContent
                test={test}
                currentOrder={currentAllocation.order}
                paletteCounts={paletteCounts}
                onSelectQuestion={(order) => {
                  onNavigateQuestion(order);
                  setShowMobilePalette(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ZOOMED DIAGRAM LIGHTBOX */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-[#0B1120] border border-slate-700 p-6 rounded-xl">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={zoomedImage}
              alt="Enlarged question diagram"
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL (Section 17, 94) */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-[#111827] border border-slate-800 p-6 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <div className="text-xs font-mono text-emerald-400">CONFIRM SUBMISSION</div>
              <h2 className="text-xl font-semibold text-white">
                You are about to submit your test.
              </h2>
              <p className="text-xs text-slate-400">
                Once submitted, answers are locked and your full performance report will be generated immediately.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5 text-sm font-mono tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Attempted:</span>
                <span className="font-semibold text-emerald-400">
                  {paletteCounts.answered} / {test.questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Unattempted:</span>
                <span className="font-semibold text-slate-200">
                  {paletteCounts.unattempted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Marked for review:</span>
                <span className="font-semibold text-amber-400">
                  {paletteCounts.markedForReviewTotal}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Time Remaining:</span>
                <span className="text-slate-300">{formatExamTimer(remainingSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  onSubmitTest(false);
                }}
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface QuestionPaletteContentProps {
  test: GeneratedTest;
  currentOrder: number;
  paletteCounts: {
    answered: number;
    unattempted: number;
    markedForReviewTotal: number;
    answeredAndMarked: number;
    markedOnly: number;
  };
  onSelectQuestion: (order: number) => void;
}

const QuestionPaletteContent: React.FC<QuestionPaletteContentProps> = ({
  test,
  currentOrder,
  paletteCounts,
  onSelectQuestion,
}) => {
  return (
    <div className="flex flex-col h-full justify-between p-4 space-y-5 overflow-y-auto">
      <div className="space-y-4">
        {/* Legend & Summary (Section 13, 91) */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-emerald-400 font-semibold">
              Answered: {paletteCounts.answered}
            </span>
            <span className="text-slate-400">
              Remaining: {paletteCounts.unattempted}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400 shrink-0" />
              <span>Answered ({paletteCounts.answered - paletteCounts.answeredAndMarked})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 shrink-0" />
              <span>Not Attempted ({paletteCounts.unattempted - paletteCounts.markedOnly})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-300 shrink-0" />
              <span>Marked ({paletteCounts.markedOnly})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400 shrink-0">
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
              </span>
              <span>Ans + Review ({paletteCounts.answeredAndMarked})</span>
            </div>
          </div>
        </div>

        {/* Questions Grouped by Subject */}
        <div className="space-y-4">
          {test.subjects.map((sub) => {
            const subQuestions = test.questions.filter((q) => q.subject === sub);
            return (
              <div key={sub} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>{sub}</span>
                  <span className="font-mono text-[11px] tabular-nums">
                    Q{subQuestions[0]?.order}–Q{subQuestions[subQuestions.length - 1]?.order}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {subQuestions.map((alloc) => {
                    const resp = test.responses[alloc.questionId];
                    const hasAns =
                      resp?.answer !== null &&
                      resp?.answer !== undefined &&
                      String(resp.answer).trim() !== '';
                    const isMarked = Boolean(resp?.markedForReview);
                    const isCurrent = alloc.order === currentOrder;

                    // Semantic visual state per Section 13:
                    // Grey = Unattempted, Green = Answered, Yellow = Marked for review,
                    // Green + yellow corner indicator = Answered + Marked for review
                    let btnStyle =
                      'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700';
                    if (hasAns && isMarked) {
                      btnStyle =
                        'bg-emerald-600 border-emerald-400 text-white font-semibold';
                    } else if (hasAns) {
                      btnStyle =
                        'bg-emerald-600 border-emerald-400 text-white font-semibold';
                    } else if (isMarked) {
                      btnStyle =
                        'bg-amber-500 border-amber-300 text-slate-950 font-semibold';
                    }

                    return (
                      <button
                        key={alloc.questionId}
                        type="button"
                        onClick={() => onSelectQuestion(alloc.order)}
                        aria-label={`Question ${alloc.order}, ${
                          hasAns && isMarked
                            ? 'Answered and marked for review'
                            : hasAns
                              ? 'Answered'
                              : isMarked
                                ? 'Marked for review'
                                : 'Not attempted'
                        }`}
                        className={`relative h-9 rounded-lg border font-mono text-xs tabular-nums flex items-center justify-center transition-all cursor-pointer ${btnStyle} ${
                          isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0D1320]' : ''
                        }`}
                      >
                        <span>{alloc.order}</span>
                        {hasAns && isMarked && (
                          <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950"
                            title="Answered & Marked for Review"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
