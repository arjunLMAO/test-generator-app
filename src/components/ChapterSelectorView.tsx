import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ChapterInventory,
  DEFAULT_SCORING_CONFIG,
  QuestionBankDiagnostics,
  QuestionHistoryRecord,
  SubjectName,
  TestMode,
} from '../types/jee';

interface ChapterSelectorViewProps {
  diagnostics: QuestionBankDiagnostics;
  historyMap: Record<string, QuestionHistoryRecord>;
  initialSubject?: SubjectName;
  initialChapter?: string;
  onStartChapterTestOverview: (config: {
    mode: TestMode;
    selectedSubjects: SubjectName[];
    chaptersBySubject: Partial<Record<SubjectName, string[]>>;
    allowFlexibleCount: boolean;
  }) => void;
  onCancel: () => void;
}

const ALL_SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Mathematics'];

export const ChapterSelectorView: React.FC<ChapterSelectorViewProps> = ({
  diagnostics,
  historyMap,
  initialSubject,
  initialChapter,
  onStartChapterTestOverview,
  onCancel,
}) => {
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectName[]>(
    initialSubject ? [initialSubject] : ['Physics']
  );

  const [selectedChapters, setSelectedChapters] = useState<Record<SubjectName, string[]>>({
    Physics: initialSubject === 'Physics' && initialChapter ? [initialChapter] : [],
    Chemistry: initialSubject === 'Chemistry' && initialChapter ? [initialChapter] : [],
    Mathematics: initialSubject === 'Mathematics' && initialChapter ? [initialChapter] : [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [allowFlexibleCount, setAllowFlexibleCount] = useState(false);

  useEffect(() => {
    if (initialSubject) {
      setSelectedSubjects((prev) =>
        prev.includes(initialSubject) ? prev : [...prev, initialSubject]
      );
      if (initialChapter) {
        setSelectedChapters((prev) => ({
          ...prev,
          [initialSubject]: prev[initialSubject].includes(initialChapter)
            ? prev[initialSubject]
            : [...prev[initialSubject], initialChapter],
        }));
      }
    }
  }, [initialSubject, initialChapter]);

  // Group chapters dynamically from question bank diagnostics
  const chaptersBySubjectBank = useMemo(() => {
    const grouped: Record<SubjectName, ChapterInventory[]> = {
      Physics: [],
      Chemistry: [],
      Mathematics: [],
    };
    for (const inv of diagnostics.chapterInventories) {
      grouped[inv.subject].push(inv);
    }
    return grouped;
  }, [diagnostics.chapterInventories]);

  // Compute historical accuracy and active mistakes per chapter from real historyMap
  const chapterHistoryStats = useMemo(() => {
    const stats = new Map<
      string,
      { attempted: number; correct: number; activeMistakes: number }
    >();
    for (const rec of Object.values(historyMap)) {
      const key = `${rec.subject}::${rec.chapter}`;
      const cur = stats.get(key) || { attempted: 0, correct: 0, activeMistakes: 0 };
      if (rec.attemptCount > 0) {
        cur.attempted++;
        if (rec.lastResult === 'correct') cur.correct++;
        if (rec.lastResult === 'incorrect' || rec.masteryState === 'incorrect') {
          cur.activeMistakes++;
        }
      }
      stats.set(key, cur);
    }
    return stats;
  }, [historyMap]);

  const toggleSubject = (sub: SubjectName) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(sub)) {
        return prev.filter((s) => s !== sub);
      }
      return ALL_SUBJECTS.filter((s) => [...prev, sub].includes(s));
    });
  };

  const toggleChapter = (sub: SubjectName, chapterName: string) => {
    if (!selectedSubjects.includes(sub)) {
      setSelectedSubjects((prev) => ALL_SUBJECTS.filter((s) => [...prev, sub].includes(s)));
    }
    setSelectedChapters((prev) => {
      const cur = prev[sub] || [];
      const next = cur.includes(chapterName)
        ? cur.filter((c) => c !== chapterName)
        : [...cur, chapterName];
      return { ...prev, [sub]: next };
    });
  };

  const selectAllForSubject = (sub: SubjectName) => {
    if (!selectedSubjects.includes(sub)) {
      setSelectedSubjects((prev) => ALL_SUBJECTS.filter((s) => [...prev, sub].includes(s)));
    }
    const allNames = chaptersBySubjectBank[sub].map((c) => c.chapter);
    setSelectedChapters((prev) => ({ ...prev, [sub]: allNames }));
  };

  const clearSubjectChapters = (sub: SubjectName) => {
    setSelectedChapters((prev) => ({ ...prev, [sub]: [] }));
  };

  // Calculate inventory & validation per selected subject
  const subjectInventorySummary = useMemo(() => {
    return selectedSubjects.map((sub) => {
      const chosenSet = new Set(selectedChapters[sub] || []);
      const matchingInvs = chaptersBySubjectBank[sub].filter((c) => chosenSet.has(c.chapter));
      const mcqAvailable = matchingInvs.reduce((s, c) => s + c.mcqCount, 0);
      const intAvailable = matchingInvs.reduce((s, c) => s + c.integerCount, 0);
      const activeMistakesAvailable = Array.from(chosenSet).reduce((sum, ch) => {
        const st = chapterHistoryStats.get(`${sub}::${ch}`);
        return sum + (st?.activeMistakes || 0);
      }, 0);

      const mcqRequired = DEFAULT_SCORING_CONFIG.mcqCountPerSubject;
      const intRequired = DEFAULT_SCORING_CONFIG.integerCountPerSubject;
      const hasShortfall = mcqAvailable < mcqRequired || intAvailable < intRequired;

      return {
        subject: sub,
        chaptersCount: chosenSet.size,
        mcqAvailable,
        intAvailable,
        mcqRequired,
        intRequired,
        hasShortfall,
        activeMistakesAvailable,
      };
    });
  }, [selectedSubjects, selectedChapters, chaptersBySubjectBank, chapterHistoryStats]);

  const totalSelectedSubjectsCount = selectedSubjects.length;
  const standardQuestionCount = totalSelectedSubjectsCount * 25;
  const durationHours = totalSelectedSubjectsCount;
  const durationFormatted = `${durationHours}:00:00`;

  const totalMistakesInSelection = subjectInventorySummary.reduce(
    (s, item) => s + item.activeMistakesAvailable,
    0
  );

  const anySubjectWithoutChapters = subjectInventorySummary.some((s) => s.chaptersCount === 0);
  const anySubjectWithShortfall = subjectInventorySummary.some(
    (s) => s.chaptersCount > 0 && s.hasShortfall
  );

  const canGenerateStandardTest =
    totalSelectedSubjectsCount > 0 &&
    !anySubjectWithoutChapters &&
    (!anySubjectWithShortfall || allowFlexibleCount);

  const handleGenerateStandard = () => {
    if (!canGenerateStandardTest) return;
    const filteredChapters: Partial<Record<SubjectName, string[]>> = {};
    for (const sub of selectedSubjects) {
      filteredChapters[sub] = selectedChapters[sub];
    }
    onStartChapterTestOverview({
      mode: TestMode.CHAPTER_TEST,
      selectedSubjects,
      chaptersBySubject: filteredChapters,
      allowFlexibleCount,
    });
  };

  const handleGenerateMistakeRetest = () => {
    if (totalSelectedSubjectsCount === 0 || anySubjectWithoutChapters || totalMistakesInSelection === 0) {
      return;
    }
    const filteredChapters: Partial<Record<SubjectName, string[]>> = {};
    for (const sub of selectedSubjects) {
      filteredChapters[sub] = selectedChapters[sub];
    }
    onStartChapterTestOverview({
      mode: TestMode.WRONG_QUESTION_RETEST,
      selectedSubjects,
      chaptersBySubject: filteredChapters,
      allowFlexibleCount: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-8">
        {/* Header (Parts 5 & 9) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-emerald-400">
              Custom Test Builder · Category-Balanced Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-semibold text-white">
              What are we testing today?
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Pick 1 to 3 subjects and choose the exact chapters you want in your test. Only questions from your chosen chapters will appear.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-interactive px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-xl self-start md:self-auto cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 8 COLUMNS: Subject Toggles & Dynamic Chapter Trees */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Subject Selection ("Pick your battlefield") */}
            <div className="p-6 rounded-2xl surface-card border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    1. Pick your battlefield
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Each selected subject adds 25 questions (20 MCQ + 5 Numerical) and 1 hour
                  </p>
                </div>
                <span className="text-xs font-mono text-blue-400 font-semibold tabular-nums">
                  {selectedSubjects.length} of 3 active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {ALL_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  const chapCount = selectedChapters[sub]?.length || 0;
                  const totalSubChaps = chaptersBySubjectBank[sub]?.length || 0;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`btn-interactive p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-blue-950/60 to-slate-900 border-blue-500 text-white shadow-lg shadow-blue-950/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{sub}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <div className="mt-2.5 text-xs font-mono tabular-nums text-slate-400">
                        {chapCount} / {totalSubChaps} chapters selected
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Search & Chapter Selection Tree */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    2. Choose your chapters
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click any chapter card to include or exclude it from this session
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters (e.g. quadratic, shm)..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#111827] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {selectedSubjects.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#111827] border border-slate-800 text-center text-sm text-slate-400">
                  Select at least one subject above to view its chapters.
                </div>
              ) : (
                selectedSubjects.map((sub) => {
                  const subChapters = chaptersBySubjectBank[sub] || [];
                  const filtered = subChapters.filter((c) =>
                    c.chapter.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                    c.topics.some((t) => t.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                  );
                  const chosenList = selectedChapters[sub] || [];

                  return (
                    <div
                      key={sub}
                      className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-slate-900/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-semibold text-white">{sub}</h3>
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            · {chosenList.length} of {subChapters.length} chapters selected
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => selectAllForSubject(sub)}
                            className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                          >
                            Select all {sub}
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={() => clearSubjectChapters(sub)}
                            className="text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                          >
                            Clear {sub}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {filtered.map((chapInv) => {
                          const isChecked = chosenList.includes(chapInv.chapter);
                          const histStat = chapterHistoryStats.get(`${sub}::${chapInv.chapter}`);
                          const hasLowSingleInventory =
                            chapInv.mcqCount < 20 || chapInv.integerCount < 5;

                          return (
                            <div
                              key={chapInv.chapter}
                              onClick={() => toggleChapter(sub, chapInv.chapter)}
                              role="checkbox"
                              aria-checked={isChecked}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  toggleChapter(sub, chapInv.chapter);
                                }
                              }}
                              className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                                isChecked
                                  ? 'bg-blue-950/30 border-blue-500/70 text-white'
                                  : 'bg-slate-900/40 border-slate-800/90 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div
                                className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                  isChecked
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'border-slate-600 bg-transparent'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium leading-snug">
                                  {chapInv.chapter}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                                  <span>{chapInv.totalQuestions} Qs</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{chapInv.mcqCount} MCQ</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{chapInv.integerCount} Int</span>
                                  {hasLowSingleInventory && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-amber-400">
                                        Combine for 25-Q test
                                      </span>
                                    </>
                                  )}
                                </div>
                                {histStat && histStat.attempted > 0 && (
                                  <div className="mt-1 flex items-center gap-2 text-[11px] font-mono tabular-nums">
                                    <span className="text-emerald-400">
                                      Attempted: {histStat.attempted}
                                    </span>
                                    {histStat.activeMistakes > 0 && (
                                      <span className="text-red-400">
                                        · {histStat.activeMistakes} previous mistake
                                        {histStat.activeMistakes === 1 ? '' : 's'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: Sticky Configuration Summary Panel (Part 9: "Ready? Generate Test") */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="p-6 rounded-2xl surface-card border border-slate-800 space-y-6">
              <div>
                <div className="text-xs font-semibold text-blue-400">Ready?</div>
                <h2 className="text-2xl font-display text-white mt-0.5">
                  Your Test Blueprint
                </h2>
              </div>

              {/* Subject Breakdown */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
                {ALL_SUBJECTS.map((sub) => {
                  const isSubSelected = selectedSubjects.includes(sub);
                  const count = isSubSelected ? selectedChapters[sub]?.length || 0 : 0;
                  return (
                    <div key={sub} className="flex items-center justify-between">
                      <span className={isSubSelected ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                        {sub}
                      </span>
                      <span
                        className={`font-mono tabular-nums ${
                          isSubSelected && count > 0
                            ? 'text-blue-400 font-semibold'
                            : isSubSelected
                              ? 'text-amber-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {count} chapter{count === 1 ? '' : 's'} selected
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Question Count & Duration */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Questions</span>
                  <span className="text-xl font-mono font-semibold text-white tabular-nums">
                    {standardQuestionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Duration</span>
                  <span className="text-lg font-mono font-semibold text-emerald-400 tabular-nums flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {durationFormatted}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 tabular-nums">
                  20 MCQ + 5 Integer per selected subject
                </div>
              </div>

              {/* Validation & Inventory Warnings (Sections 52, 104, 108) */}
              {totalSelectedSubjectsCount === 0 && (
                <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Select at least one subject to configure a test.</span>
                </div>
              )}

              {anySubjectWithoutChapters && (
                <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Please select at least one chapter for every active subject (
                    {subjectInventorySummary
                      .filter((s) => s.chaptersCount === 0)
                      .map((s) => s.subject)
                      .join(', ')}
                    ).
                  </span>
                </div>
              )}

              {anySubjectWithShortfall && !anySubjectWithoutChapters && (
                <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Insufficient Single-Chapter Inventory</div>
                      {subjectInventorySummary
                        .filter((s) => s.hasShortfall)
                        .map((s) => (
                          <p key={s.subject} className="mt-1 text-amber-200/90 leading-relaxed">
                            {s.subject} selection currently has{' '}
                            <span className="font-mono font-semibold">{s.mcqAvailable} MCQs</span> and{' '}
                            <span className="font-mono font-semibold">{s.intAvailable} Integer</span>{' '}
                            questions (Requested: 20 MCQs + 5 Integer).
                          </p>
                        ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-2 pt-2 border-t border-amber-500/30 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowFlexibleCount}
                      onChange={(e) => setAllowFlexibleCount(e.target.checked)}
                      className="mt-0.5 rounded border-slate-600"
                    />
                    <span>
                      Allow creating a shorter test using the exact available questions in this chapter
                    </span>
                  </label>
                </div>
              )}

              {/* Primary CTA: Generate Chapter Test */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!canGenerateStandardTest}
                  onClick={handleGenerateStandard}
                  className={`btn-interactive w-full py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    canGenerateStandardTest
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Generate Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Dedicated Wrong-Question Retest CTA */}
                {totalMistakesInSelection > 0 && !anySubjectWithoutChapters && (
                  <button
                    type="button"
                    onClick={handleGenerateMistakeRetest}
                    className="btn-interactive w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-red-600/90 hover:bg-red-500 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      Retest {totalMistakesInSelection} Mistake
                      {totalMistakesInSelection === 1 ? '' : 's'} in Selection
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
