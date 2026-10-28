import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Filter,
  HelpCircle,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ChapterInventory,
  QuestionBankDiagnostics,
  QuestionHistoryRecord,
  SubjectName,
} from '../types/jee';

export type MasteryTier =
  | 'mastered'
  | 'proficient'
  | 'developing'
  | 'needs_attention'
  | 'unattempted';

export interface ChapterMasteryRecord {
  subject: SubjectName;
  chapter: string;
  totalBankQuestions: number;
  mcqCount: number;
  integerCount: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  activeMistakes: number;
  accuracy: number;
  coveragePercent: number;
  tier: MasteryTier;
  tierLabel: string;
}

interface ChapterMasteryViewProps {
  diagnostics: QuestionBankDiagnostics;
  historyMap: Record<string, QuestionHistoryRecord>;
  onPracticeChapter: (subject: SubjectName, chapter: string) => void;
  onRetestMistakes: (subject?: SubjectName, chapter?: string) => void;
  onStartFullTest: () => void;
  onOpenChapterSelector: (subject?: SubjectName) => void;
}

const ALL_SUBJECTS: SubjectName[] = ['Physics', 'Chemistry', 'Mathematics'];

export const ChapterMasteryView: React.FC<ChapterMasteryViewProps> = ({
  diagnostics,
  historyMap,
  onPracticeChapter,
  onRetestMistakes,
  onStartFullTest,
  onOpenChapterSelector,
}) => {
  const [activeSubjectTab, setActiveSubjectTab] = useState<'ALL' | SubjectName>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | MasteryTier>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'3-column' | 'single-column'>('3-column');

  // Compute mastery stats for every chapter in diagnostics
  const chapterMasteryList = useMemo<ChapterMasteryRecord[]>(() => {
    // Group history records by subject and chapter
    const historyStatsByChapter = new Map<
      string,
      { attempted: number; correct: number; incorrect: number; activeMistakes: number }
    >();

    for (const rec of Object.values(historyMap)) {
      if (!rec || !rec.chapter) continue;
      const key = `${rec.subject}::${rec.chapter}`;
      const cur = historyStatsByChapter.get(key) || {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        activeMistakes: 0,
      };

      if (rec.attemptCount > 0) {
        cur.attempted += 1;
        if (rec.lastResult === 'correct') {
          cur.correct += 1;
        } else if (rec.lastResult === 'incorrect' || rec.masteryState === 'incorrect') {
          cur.incorrect += 1;
          cur.activeMistakes += 1;
        }
      }
      historyStatsByChapter.set(key, cur);
    }

    return diagnostics.chapterInventories.map((inv) => {
      const key = `${inv.subject}::${inv.chapter}`;
      const stats = historyStatsByChapter.get(key) || {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        activeMistakes: 0,
      };

      const attempted = stats.attempted;
      const correct = stats.correct;
      const incorrect = stats.incorrect;
      const activeMistakes = stats.activeMistakes;
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const coveragePercent =
        inv.totalQuestions > 0 ? Math.min(100, Math.round((attempted / inv.totalQuestions) * 100)) : 0;

      let tier: MasteryTier = 'unattempted';
      let tierLabel = 'Unattempted';

      if (attempted === 0) {
        tier = 'unattempted';
        tierLabel = 'Unattempted';
      } else if (accuracy >= 80 && attempted >= 5) {
        tier = 'mastered';
        tierLabel = 'Mastered';
      } else if (accuracy >= 65) {
        tier = 'proficient';
        tierLabel = 'Proficient';
      } else if (accuracy >= 45) {
        tier = 'developing';
        tierLabel = 'Developing';
      } else {
        tier = 'needs_attention';
        tierLabel = 'Needs Attention';
      }

      return {
        subject: inv.subject,
        chapter: inv.chapter,
        totalBankQuestions: inv.totalQuestions,
        mcqCount: inv.mcqCount,
        integerCount: inv.integerCount,
        attemptedCount: attempted,
        correctCount: correct,
        incorrectCount: incorrect,
        activeMistakes,
        accuracy,
        coveragePercent,
        tier,
        tierLabel,
      };
    });
  }, [diagnostics.chapterInventories, historyMap]);

  // Overall Global Statistics
  const overallStats = useMemo(() => {
    let totalQuestionsAttempted = 0;
    let totalCorrect = 0;
    let totalActiveMistakes = 0;
    const tierCounts: Record<MasteryTier, number> = {
      mastered: 0,
      proficient: 0,
      developing: 0,
      needs_attention: 0,
      unattempted: 0,
    };

    for (const chap of chapterMasteryList) {
      totalQuestionsAttempted += chap.attemptedCount;
      totalCorrect += chap.correctCount;
      totalActiveMistakes += chap.activeMistakes;
      tierCounts[chap.tier]++;
    }

    const overallAccuracy =
      totalQuestionsAttempted > 0 ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) : 0;

    return {
      totalChapters: chapterMasteryList.length,
      totalQuestionsAttempted,
      totalActiveMistakes,
      overallAccuracy,
      tierCounts,
    };
  }, [chapterMasteryList]);

  // Subject-wise Grouped Mastery
  const subjectGroups = useMemo(() => {
    const groups: Record<
      SubjectName,
      {
        chapters: ChapterMasteryRecord[];
        totalAttempted: number;
        totalCorrect: number;
        masteredCount: number;
        needsAttentionCount: number;
        avgAccuracy: number;
      }
    > = {
      Physics: {
        chapters: [],
        totalAttempted: 0,
        totalCorrect: 0,
        masteredCount: 0,
        needsAttentionCount: 0,
        avgAccuracy: 0,
      },
      Chemistry: {
        chapters: [],
        totalAttempted: 0,
        totalCorrect: 0,
        masteredCount: 0,
        needsAttentionCount: 0,
        avgAccuracy: 0,
      },
      Mathematics: {
        chapters: [],
        totalAttempted: 0,
        totalCorrect: 0,
        masteredCount: 0,
        needsAttentionCount: 0,
        avgAccuracy: 0,
      },
    };

    for (const chap of chapterMasteryList) {
      const g = groups[chap.subject];
      if (g) {
        g.chapters.push(chap);
        g.totalAttempted += chap.attemptedCount;
        g.totalCorrect += chap.correctCount;
        if (chap.tier === 'mastered') g.masteredCount++;
        if (chap.tier === 'needs_attention') g.needsAttentionCount++;
      }
    }

    for (const sub of ALL_SUBJECTS) {
      const g = groups[sub];
      g.avgAccuracy =
        g.totalAttempted > 0 ? Math.round((g.totalCorrect / g.totalAttempted) * 100) : 0;
    }

    return groups;
  }, [chapterMasteryList]);

  // Filtered chapters for display
  const filterChapter = (chap: ChapterMasteryRecord) => {
    if (activeSubjectTab !== 'ALL' && chap.subject !== activeSubjectTab) return false;
    if (tierFilter !== 'ALL' && chap.tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!chap.chapter.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const getTierBadge = (tier: MasteryTier) => {
    switch (tier) {
      case 'mastered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Mastered</span>
          </span>
        );
      case 'proficient':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Proficient</span>
          </span>
        );
      case 'developing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Developing</span>
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>Needs Practice</span>
          </span>
        );
      case 'unattempted':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            <HelpCircle className="w-3 h-3 text-neutral-400" />
            <span>Unattempted</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F0F11] text-neutral-900 dark:text-neutral-100 py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                Chapter Mastery
              </h1>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
              Subject-wise syllabus tracking. Mastery levels are computed from your previous test attempts, accuracy, and mistake recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onStartFullTest}
              className="px-3.5 py-1.5 text-xs font-medium text-white dark:text-neutral-950 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded transition-colors cursor-pointer"
            >
              Start Full Test
            </button>
            <button
              type="button"
              onClick={() => onOpenChapterSelector()}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            >
              Select Chapters →
            </button>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Mastered Chapters</div>
            <div className="text-2xl font-bold font-mono text-neutral-950 dark:text-white mt-1">
              {overallStats.tierCounts.mastered}{' '}
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                / {overallStats.totalChapters}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              ≥80% accuracy (5+ Qs)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">In Progress</div>
            <div className="text-2xl font-bold font-mono text-neutral-950 dark:text-white mt-1">
              {overallStats.tierCounts.proficient + overallStats.tierCounts.developing}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              {overallStats.tierCounts.proficient} proficient · {overallStats.tierCounts.developing} developing
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Needs Attention</div>
            <div className="text-2xl font-bold font-mono text-neutral-950 dark:text-white mt-1">
              {overallStats.tierCounts.needs_attention}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              {overallStats.totalActiveMistakes} active mistakes in pool
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Unattempted</div>
            <div className="text-2xl font-bold font-mono text-neutral-950 dark:text-white mt-1">
              {overallStats.tierCounts.unattempted}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              Ready for first practice
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg">
          {/* Subject-Wise Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => {
              const isSelected = activeSubjectTab === sub;
              const count =
                sub === 'ALL'
                  ? chapterMasteryList.length
                  : subjectGroups[sub]?.chapters.length || 0;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setActiveSubjectTab(sub)}
                  className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <span>{sub === 'ALL' ? 'All Subjects' : sub}</span>
                  <span className="font-mono text-[11px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search & Tier Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200 cursor-pointer"
            >
              <option value="ALL">All Mastery Tiers</option>
              <option value="mastered">★ Mastered (≥80%)</option>
              <option value="proficient">◆ Proficient (65-79%)</option>
              <option value="developing">▲ Developing (45-64%)</option>
              <option value="needs_attention">● Needs Practice (&lt;45%)</option>
              <option value="unattempted">○ Unattempted (0 Qs)</option>
            </select>
          </div>
        </div>

        {/* SUBJECT-WISE CHAPTERS SECTION:
            PHYSICS | CHEMISTRY | MATHEMATICS
            Directly matching user prompt:
            physics      chemistry        mathematics
            and below it it shows the list of chapters and mastery level.
        */}
        <div className="space-y-6">
          <div
            className={`grid gap-6 ${
              activeSubjectTab === 'ALL'
                ? 'grid-cols-1 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}
          >
            {ALL_SUBJECTS.filter((sub) =>
              activeSubjectTab === 'ALL' ? true : sub === activeSubjectTab
            ).map((subject) => {
              const group = subjectGroups[subject];
              const displayedChapters = group.chapters.filter(filterChapter);

              return (
                <div
                  key={subject}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181B] overflow-hidden flex flex-col"
                >
                  {/* Subject Column Header */}
                  <div className="p-4 bg-neutral-50 dark:bg-[#141416] border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-neutral-950 dark:text-white tracking-tight">
                        {subject}
                      </h2>
                      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {group.chapters.length} Chapters
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 text-[11px] font-mono tabular-nums">
                      <div>
                        <div className="text-neutral-500 dark:text-neutral-400 font-sans">Accuracy</div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {group.totalAttempted > 0 ? `${group.avgAccuracy}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 dark:text-neutral-400 font-sans">Mastered</div>
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {group.masteredCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 dark:text-neutral-400 font-sans">Attempted</div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                          {group.totalAttempted} Qs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of Chapters for this Subject */}
                  <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[750px]">
                    {displayedChapters.length === 0 ? (
                      <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                        No chapters match current filter.
                      </div>
                    ) : (
                      displayedChapters.map((chap) => {
                        return (
                          <div
                            key={chap.chapter}
                            className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors space-y-2"
                          >
                            {/* Chapter Title & Mastery Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h3 className="text-xs font-semibold text-neutral-950 dark:text-white leading-snug">
                                  {chap.chapter}
                                </h3>
                                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                                  {chap.totalBankQuestions} Bank Qs ({chap.mcqCount} MCQ · {chap.integerCount} Num)
                                </div>
                              </div>
                              <div className="shrink-0">{getTierBadge(chap.tier)}</div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="space-y-1">
                              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
                                {chap.attemptedCount > 0 ? (
                                  <>
                                    <div
                                      style={{
                                        width: `${(chap.correctCount / chap.totalBankQuestions) * 100}%`,
                                      }}
                                      className="h-full bg-emerald-600 dark:bg-emerald-400"
                                      title={`Correct: ${chap.correctCount}`}
                                    />
                                    <div
                                      style={{
                                        width: `${(chap.incorrectCount / chap.totalBankQuestions) * 100}%`,
                                      }}
                                      className="h-full bg-red-500 dark:bg-red-400"
                                      title={`Incorrect: ${chap.incorrectCount}`}
                                    />
                                  </>
                                ) : (
                                  <div className="h-full bg-neutral-300 dark:bg-neutral-700 w-0" />
                                )}
                              </div>

                              {/* Progress Text */}
                              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                                <span>
                                  {chap.attemptedCount > 0
                                    ? `${chap.attemptedCount} attempted · ${chap.accuracy}% acc`
                                    : 'Not attempted yet'}
                                </span>
                                <span>
                                  {chap.activeMistakes > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                      {chap.activeMistakes} mistake{chap.activeMistakes > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-1 flex items-center justify-between gap-2 border-t border-neutral-200/50 dark:border-neutral-800/80">
                              {chap.activeMistakes > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => onRetestMistakes(chap.subject, chap.chapter)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Retest {chap.activeMistakes} mistakes</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                                  {chap.attemptedCount > 0 ? 'Queue clear' : 'Untapped'}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => onPracticeChapter(chap.subject, chap.chapter)}
                                className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer flex items-center gap-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/90"
                              >
                                <span>Practise</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
