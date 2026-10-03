import React, { useMemo } from 'react';
import {
  ArrowRight,
  Clock,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { DashboardAnalyticsSummary } from '../services/LongTermAnalyticsService';
import {
  GeneratedTest,
  QuestionBankDiagnostics,
  SubjectName,
  TestResultReport,
} from '../types/jee';
import { ActiveNavTab } from './Navbar';

interface LandingDashboardViewProps {
  diagnostics: QuestionBankDiagnostics;
  analytics: DashboardAnalyticsSummary;
  activeTest: GeneratedTest | null;
  recentReport: TestResultReport | null;
  remainingActiveTestSeconds: number;
  onStartFullSyllabusOverview: () => void;
  onOpenChapterSelector: (presetSubject?: SubjectName, presetChapter?: string) => void;
  onResumeActiveTest: () => void;
  onDiscardActiveTest: () => void;
  onOpenReport: (testId: string) => void;
  onRetestMistakes: (subject?: SubjectName, chapter?: string) => void;
  onNavigateTab: (tab: ActiveNavTab) => void;
}

function formatDurationClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

export const LandingDashboardView: React.FC<LandingDashboardViewProps> = ({
  diagnostics,
  analytics,
  activeTest,
  recentReport,
  remainingActiveTestSeconds,
  onStartFullSyllabusOverview,
  onOpenChapterSelector,
  onResumeActiveTest,
  onDiscardActiveTest,
  onOpenReport,
  onRetestMistakes,
  onNavigateTab,
}) => {
  const totalChapters =
    diagnostics.bySubject.Physics.chaptersCount +
    diagnostics.bySubject.Chemistry.chaptersCount +
    diagnostics.bySubject.Mathematics.chaptersCount;

  const greeting = useMemo(() => getTimeGreeting(), []);

  return (
    <div className="relative min-h-screen bg-[#080C14] text-slate-100 overflow-hidden">
      {/* Subtle Ambient Glow & Mathematical Vector Backdrop (Part 34) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-45"
      >
        <svg
          className="w-full h-[760px]"
          viewBox="0 0 1440 760"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="jee-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path
                d="M 64 0 L 0 0 0 64"
                fill="none"
                stroke="rgba(148,163,184,0.05)"
                strokeWidth="1"
              />
            </pattern>
            <radialGradient id="hero-glow" cx="38%" cy="22%" r="55%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.18)" />
              <stop offset="55%" stopColor="rgba(16,185,129,0.06)" />
              <stop offset="100%" stopColor="rgba(8,12,20,0)" />
            </radialGradient>
          </defs>
          <rect width="1440" height="760" fill="url(#jee-grid)" />
          <rect width="1440" height="760" fill="url(#hero-glow)" />

          <ellipse
            cx="1140"
            cy="230"
            rx="270"
            ry="115"
            transform="rotate(-16 1140 230)"
            stroke="rgba(59,130,246,0.18)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
          <ellipse
            cx="1140"
            cy="230"
            rx="175"
            ry="225"
            transform="rotate(24 1140 230)"
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="1"
          />
          <circle cx="1140" cy="230" r="5" fill="rgba(59,130,246,0.5)" />
          <circle cx="905" cy="304" r="3.5" fill="rgba(16,185,129,0.6)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 pt-8 pb-20 space-y-16">
        {/* Active Unfinished Test Recovery Banner */}
        {activeTest && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-card-reveal">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Test in progress</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatDurationClock(remainingActiveTestSeconds)} left
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">{activeTest.title}</h2>
              <p className="text-xs text-slate-300">
                {activeTest.subjects.join(' · ')} · {activeTest.questions.length} Questions · Responses saved automatically
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onDiscardActiveTest}
                className="btn-interactive px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
              <button
                type="button"
                onClick={onResumeActiveTest}
                className="btn-interactive px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Test</span>
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY HERO COMMAND CENTER (Parts 3, 4, 35: Clear visual hierarchy, not equal-sized boxes) */}
        <section className="pt-2 space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-blue-400">
              <span>{greeting}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-300 font-medium">
                {totalChapters} Chapters · {diagnostics.validQuestionsCount.toLocaleString()} Curated Questions
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight text-white leading-[1.05]">
              Ready for your <span className="italic font-normal text-blue-300">next test?</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Simulate full JEE exam conditions, drill specific chapters with category-diverse questions, or fix your past mistakes directly.
            </p>
          </div>

          {/* ASYMMETRIC PRIMARY ACTION LAYOUT (Part 3 & Part 35) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* DOMINANT PRIMARY CARD (7 Cols): FULL SYLLABUS TEST */}
            <div className="lg:col-span-7 group relative rounded-2xl surface-card bg-gradient-to-br from-blue-950/35 via-[#111827] to-[#0D1320] border border-blue-500/30 hover:border-blue-400/70 p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Complete JEE Simulation</span>
                  </span>
                  <span className="font-mono font-semibold text-blue-300 tabular-nums">
                    75 Questions · 300 Marks
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
                    Full Syllabus Test
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    Simulate real examination conditions across Physics, Chemistry, and Mathematics. Strictly capped at 1–2 questions per problem archetype so every question tests a fresh concept.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Subjects</div>
                    <div className="font-semibold text-white text-sm mt-0.5">
                      Physics · Chem · Math
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Format</div>
                    <div className="font-mono font-semibold text-white text-sm mt-0.5 tabular-nums">
                      60 MCQ + 15 Int
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Duration</div>
                    <div className="font-mono font-semibold text-emerald-400 text-sm mt-0.5 tabular-nums">
                      3 Hours (180m)
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  +4 / -1 for MCQ · +4 / 0 for Numerical
                </span>
                <button
                  type="button"
                  onClick={onStartFullSyllabusOverview}
                  className="btn-interactive px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950/50 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>Start Full Syllabus Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RIGHT STACK (5 Cols): CHAPTER TEST + MY MISTAKES */}
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
              {/* CHAPTER TEST CARD */}
              <div className="flex-1 rounded-2xl surface-card border border-slate-800 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400">Targeted Practice</span>
                    <span className="font-mono text-slate-400 tabular-nums">1–3 Subjects</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-white">
                    Chapter Test
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pick your battlefield. Choose 1, 2, or all 3 subjects and drill the exact chapters you want to master today.
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    25 Qs per subject · 1–3 hrs
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenChapterSelector()}
                    className="btn-interactive px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <span>Choose Chapters</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* MY MISTAKES / RETEST CARD */}
              <div
                className={`rounded-2xl surface-card border p-6 flex flex-col justify-between transition-all duration-200 ${
                  analytics.questionsNeedingReviewCount > 0
                    ? 'border-red-500/40 hover:border-red-400/70 bg-gradient-to-br from-red-950/25 to-[#111827] hover:-translate-y-0.5'
                    : 'border-slate-800/90'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        analytics.questionsNeedingReviewCount > 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      Mistake Recovery Queue
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {analytics.questionsNeedingReviewCount} unresolved
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-semibold text-white">
                    {analytics.questionsNeedingReviewCount > 0
                      ? `You have ${analytics.questionsNeedingReviewCount} mistake${
                          analytics.questionsNeedingReviewCount === 1 ? '' : 's'
                        } waiting to be fixed.`
                      : 'No active mistakes in your queue.'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analytics.questionsNeedingReviewCount > 0
                      ? 'Launch a focused test containing only the questions you previously got wrong.'
                      : 'Take a test to populate your personal mistake-recovery queue.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {analytics.correctedMistakesCount} previously fixed
                  </span>
                  {analytics.questionsNeedingReviewCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onRetestMistakes()}
                      className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        Retest {analytics.questionsNeedingReviewCount} Mistake
                        {analytics.questionsNeedingReviewCount === 1 ? '' : 's'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-400">All caught up</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY SECTION: RECENT PERFORMANCE & WEAK AREAS (Parts 3, 35, 36) */}
        <section className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display text-white">Your recent performance</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live progress, weak areas, and recent test attempts
              </p>
            </div>
            {analytics.hasData && (
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="btn-interactive px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl whitespace-nowrap cursor-pointer"
              >
                Open Full Analytics →
              </button>
            )}
          </div>

          {!analytics.hasData ? (
            /* Empty State with Personality (Part 36) */
            <div className="p-8 rounded-2xl surface-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="text-xs font-semibold text-blue-400">Your story starts here.</div>
                <h3 className="text-2xl font-display text-white">
                  Take your first test and your performance data will appear here.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Once you submit a Full Syllabus or Chapter Test, this space unlocks your accuracy trajectory, priority weak chapters, and one-click mistake retests.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenChapterSelector()}
                  className="btn-interactive px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl whitespace-nowrap cursor-pointer"
                >
                  Pick a Chapter
                </button>
                <button
                  type="button"
                  onClick={onStartFullSyllabusOverview}
                  className="btn-interactive px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl whitespace-nowrap cursor-pointer"
                >
                  Take Your First Test
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Focal 4-Metric Strip + Actionable Recent Test / Weak Area Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl surface-card border border-slate-800">
                  <div className="text-xs text-slate-400">Tests Completed</div>
                  <div className="text-3xl font-mono font-bold text-white mt-1.5 tabular-nums">
                    {analytics.testsAttempted}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.questionsAttempted} questions attempted
                  </div>
                </div>

                <div className="p-5 rounded-2xl surface-card border border-slate-800">
                  <div className="text-xs text-slate-400">Overall Accuracy</div>
                  <div className="text-3xl font-mono font-bold text-emerald-400 mt-1.5 tabular-nums">
                    {analytics.overallAccuracy}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.totalCorrect} correct · {analytics.totalIncorrect} wrong
                  </div>
                </div>

                <div className="p-5 rounded-2xl surface-card border border-slate-800">
                  <div className="text-xs text-slate-400">Avg Scaled Score</div>
                  <div className="text-3xl font-mono font-bold text-blue-400 mt-1.5 tabular-nums">
                    {analytics.averageNormalizedScore300}
                    <span className="text-sm text-slate-500 font-normal"> / 300</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                    Latest %ile: {analytics.latestPercentile ?? '—'}
                  </div>
                </div>

                <div className="p-5 rounded-2xl surface-card border border-slate-800">
                  <div className="text-xs text-slate-400">Strongest Subject</div>
                  <div className="text-2xl font-bold text-white mt-1.5 truncate">
                    {analytics.strongestSubject ? analytics.strongestSubject.subject : '—'}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 font-mono tabular-nums">
                    {analytics.strongestSubject
                      ? `${analytics.strongestSubject.accuracy}% accuracy`
                      : 'Need more attempts'}
                  </div>
                </div>
              </div>

              {/* Recent Test & Weak Area Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {recentReport && (
                  <div className="p-6 rounded-2xl surface-card border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-blue-400">
                        Latest Attempt ·{' '}
                        {new Date(recentReport.submittedAt).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-lg font-semibold text-white">{recentReport.title}</div>
                      <div className="text-xs text-slate-300 font-mono tabular-nums">
                        Score: {recentReport.totalMarks}/{recentReport.maxMarks} · Accuracy:{' '}
                        {recentReport.accuracy}% · Mistakes: {recentReport.incorrect}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenReport(recentReport.testId)}
                        className="btn-interactive px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl whitespace-nowrap cursor-pointer"
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                )}

                {analytics.weakestChapter && (
                  <div className="p-6 rounded-2xl surface-card border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-amber-400">
                        Priority Area to Work On · {analytics.weakestChapter.subject}
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {analytics.weakestChapter.chapter}
                      </div>
                      <div className="text-xs text-slate-300 font-mono tabular-nums">
                        Accuracy: {analytics.weakestChapter.accuracy}% · Unresolved Mistakes:{' '}
                        {analytics.weakestChapter.activeMistakesInPool}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {analytics.weakestChapter.activeMistakesInPool > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onRetestMistakes(
                              analytics.weakestChapter!.subject,
                              analytics.weakestChapter!.chapter
                            )
                          }
                          className="btn-interactive px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl whitespace-nowrap cursor-pointer"
                        >
                          Retest {analytics.weakestChapter.activeMistakesInPool} Mistake
                          {analytics.weakestChapter.activeMistakesInPool === 1 ? '' : 's'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenChapterSelector(
                            analytics.weakestChapter!.subject,
                            analytics.weakestChapter!.chapter
                          )
                        }
                        className="btn-interactive px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl whitespace-nowrap cursor-pointer"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SUBJECT SYLLABUS EXPLORER */}
        <section className="space-y-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display text-white">Explore by Subject</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jump directly into Physics, Chemistry, or Mathematics chapter selection
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('question-bank')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Question Bank ({diagnostics.filesScanned} files)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((sub) => {
              const info = diagnostics.bySubject[sub];
              return (
                <div
                  key={sub}
                  className="p-6 rounded-2xl surface-card border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{sub}</h3>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {info.chaptersCount} Chapters
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-slate-400 font-sans">Questions</div>
                      <div className="text-base font-bold text-slate-100 mt-0.5">{info.total}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-sans">MCQ</div>
                      <div className="text-base font-bold text-blue-400 mt-0.5">{info.mcq}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-sans">Numerical</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {info.integer}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChapterSelector(sub)}
                    className="btn-interactive w-full py-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Select {sub} Chapters →
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quiet Footer */}
        <footer className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>JEE Test Generator — Adaptive Examination & Analytics Platform</div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigateTab('question-bank')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Question Bank
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigateTab('history')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Test History
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Analytics
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
