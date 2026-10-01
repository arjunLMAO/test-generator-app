import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Layers,
  Play,
  RotateCcw,
  Sliders,
  Target,
  Trash2,
  TrendingUp,
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

  return (
    <div className="relative min-h-screen bg-[#090D16] text-slate-100 overflow-hidden">
      {/* Decorative Scientific Blueprint & Vector Geometry Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-35"
      >
        <svg
          className="w-full h-[760px] stroke-slate-800/70"
          viewBox="0 0 1440 760"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="jee-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
            </pattern>
            <radialGradient id="hero-glow" cx="50%" cy="30%" r="55%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.16)" />
              <stop offset="60%" stopColor="rgba(30,58,138,0.05)" />
              <stop offset="100%" stopColor="rgba(9,13,22,0)" />
            </radialGradient>
          </defs>
          <rect width="1440" height="760" fill="url(#jee-grid)" />
          <rect width="1440" height="760" fill="url(#hero-glow)" />

          {/* Orbital ellipses & projectile trajectory arcs */}
          <ellipse
            cx="1140"
            cy="240"
            rx="260"
            ry="110"
            transform="rotate(-18 1140 240)"
            stroke="rgba(59,130,246,0.22)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
          <ellipse
            cx="1140"
            cy="240"
            rx="170"
            ry="220"
            transform="rotate(24 1140 240)"
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="1"
          />
          <circle cx="1140" cy="240" r="5" fill="rgba(59,130,246,0.5)" />
          <circle cx="910" cy="314" r="3.5" fill="rgba(16,185,129,0.6)" />
          <circle cx="1290" cy="148" r="4" fill="rgba(245,158,11,0.5)" />

          {/* Parabolic kinematic trajectory */}
          <path
            d="M 80 560 Q 410 120 740 560"
            stroke="rgba(59,130,246,0.18)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <line
            x1="80"
            y1="560"
            x2="230"
            y2="360"
            stroke="rgba(16,185,129,0.28)"
            strokeWidth="1.5"
          />
          {/* Subtle mathematical coordinates */}
          <text
            x="1050"
            y="95"
            fill="rgba(148,163,184,0.28)"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
          >
            ∫₀^π sin(kx) dx · H_max = u²sin²θ / 2g
          </text>
          <text
            x="112"
            y="140"
            fill="rgba(148,163,184,0.25)"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
          >
            ΔG° = -nFE°cell · det(A - λI) = 0
          </text>
        </svg>
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 pt-8 pb-20 space-y-16">
        {/* Active Unfinished Test Recovery Banner (Section 82) */}
        {activeTest && (
          <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>You have an unfinished test in progress</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Time remaining: {formatDurationClock(remainingActiveTestSeconds)}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white">{activeTest.title}</h2>
              <p className="text-xs text-slate-300">
                {activeTest.subjects.join(' · ')} · {activeTest.questions.length} Questions · Autosaved
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onDiscardActiveTest}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Discard Test
              </button>
              <button
                type="button"
                onClick={onResumeActiveTest}
                className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Test
              </button>
            </div>
          </div>
        )}

        {/* HERO SECTION (Section 20) */}
        <section className="pt-4 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-blue-400">
              <span>{totalChapters} Chapters Indexed</span>
              <span aria-hidden="true">·</span>
              <span>{diagnostics.validQuestionsCount.toLocaleString()} Curated Questions</span>
              <span aria-hidden="true">·</span>
              <span>Category-Balanced Exam Builder</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight text-white leading-[1.06]">
              JEE prep, built <span className="italic font-normal text-blue-300">around you.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Generate category-diverse mock tests across any chapter, pinpoint conceptual blind spots, and turn every mistake into lasting mastery.
            </p>
          </div>

          {/* TWO DOMINANT PRIMARY MODE CARDS (Section 1, 2, 20) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* OPTION A: FULL SYLLABUS TEST */}
            <div className="group relative rounded-2xl bg-[#111827] border border-slate-800 hover:border-blue-500/60 p-7 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 shadow-lg shadow-black/20">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Complete Mock Examination</span>
                  <span className="text-blue-400 font-semibold tabular-nums">300 Marks</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    Full Syllabus Test
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Complete JEE-pattern examination balanced across all {totalChapters} available chapters in Physics, Chemistry, and Mathematics.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Subjects</div>
                    <div className="font-semibold text-slate-100 mt-0.5">Phys · Chem · Math</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Structure</div>
                    <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums">
                      75 Questions
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      60 MCQ + 15 Integer
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Duration</div>
                    <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums">
                      3 Hours
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      180:00 Clock
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-7 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  20 MCQ + 5 Integer per subject
                </span>
                <button
                  type="button"
                  onClick={onStartFullSyllabusOverview}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>Start Full Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* OPTION B: SELECT CHAPTERS */}
            <div className="group relative rounded-2xl bg-[#111827] border border-slate-800 hover:border-emerald-500/60 p-7 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 shadow-lg shadow-black/20">
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Targeted Chapter Practice</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">1–3 Hours</span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    Select Chapters
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Choose 1, 2, or all 3 subjects and pick the exact chapters you want to practise. Strictly constrained to your selected chapters.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">1 Subject</div>
                    <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums">
                      25 Questions
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      1 Hour · 100 Marks
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">2 Subjects</div>
                    <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums">
                      50 Questions
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      2 Hours · 200 Marks
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">3 Subjects</div>
                    <div className="font-mono font-semibold text-slate-100 mt-0.5 tabular-nums">
                      75 Questions
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      3 Hours · 300 Marks
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-7 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Strict chapter-only verification
                </span>
                <button
                  type="button"
                  onClick={() => onOpenChapterSelector()}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>Build My Test</span>
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* STUDENT PERFORMANCE COMMAND CENTER (Sections 67-69) */}
        <section className="space-y-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Student Performance Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time telemetry from your completed tests and question-level attempt history
              </p>
            </div>
            {analytics.hasData && (
              <div className="flex items-center gap-3">
                {analytics.questionsNeedingReviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onRetestMistakes()}
                    className="px-3.5 py-2 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retest My Mistakes ({analytics.questionsNeedingReviewCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigateTab('analytics')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Open Full Analytics
                </button>
              </div>
            )}
          </div>

          {!analytics.hasData ? (
            /* Honest Empty State for Brand-New Student (Section 69 & 141) */
            <div className="p-8 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="text-xs font-semibold text-blue-400">Ready when you are</div>
                <h3 className="text-lg font-semibold text-white">
                  Your performance dashboard will appear after your first test.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Take a Full Syllabus Mock or select specific chapters to begin tracking subject accuracy, chapter weakness scores, and mistake-recovery queues.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenChapterSelector()}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Take a Chapter Test
                </button>
                <button
                  type="button"
                  onClick={onStartFullSyllabusOverview}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Take Your First Test
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Primary Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Tests Taken</div>
                  <div className="text-2xl font-mono font-semibold text-white mt-1 tabular-nums">
                    {analytics.testsAttempted}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.questionsAttempted} Qs attempted
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Overall Accuracy</div>
                  <div className="text-2xl font-mono font-semibold text-emerald-400 mt-1 tabular-nums">
                    {analytics.overallAccuracy}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.totalCorrect} correct · {analytics.totalIncorrect} wrong
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Avg Scaled Score</div>
                  <div className="text-2xl font-mono font-semibold text-blue-400 mt-1 tabular-nums">
                    {analytics.averageNormalizedScore300}
                    <span className="text-sm text-slate-500 font-normal"> / 300</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                    Est. %ile: {analytics.latestPercentile ?? '—'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Strongest Subject</div>
                  <div className="text-lg font-semibold text-white mt-1 truncate">
                    {analytics.strongestSubject ? analytics.strongestSubject.subject : '—'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono tabular-nums">
                    {analytics.strongestSubject
                      ? `${analytics.strongestSubject.accuracy}% accuracy`
                      : 'Need attempts'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Weakest Chapter</div>
                  <div
                    className="text-sm font-semibold text-amber-300 mt-1.5 truncate"
                    title={analytics.weakestChapter?.chapter}
                  >
                    {analytics.weakestChapter ? analytics.weakestChapter.chapter : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.weakestChapter
                      ? `${analytics.weakestChapter.accuracy}% acc · ${analytics.weakestChapter.subject}`
                      : 'No weak chapter'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="text-xs text-slate-400">Needs Review</div>
                  <div className="text-2xl font-mono font-semibold text-red-400 mt-1 tabular-nums">
                    {analytics.questionsNeedingReviewCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                    {analytics.correctedMistakesCount} previously corrected
                  </div>
                </div>
              </div>

              {/* Recent Test & Weak Chapter Action Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recentReport && (
                  <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 font-mono">
                        MOST RECENT TEST · {new Date(recentReport.submittedAt).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-base font-semibold text-white">{recentReport.title}</div>
                      <div className="text-xs text-slate-300 font-mono tabular-nums">
                        Score: {recentReport.totalMarks}/{recentReport.maxMarks} · Accuracy:{' '}
                        {recentReport.accuracy}% · Est. Percentile:{' '}
                        {recentReport.percentile.estimatedPercentile ?? '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenReport(recentReport.testId)}
                      className="px-3.5 py-2 text-xs font-semibold text-blue-300 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      View Report
                    </button>
                  </div>
                )}

                {analytics.weakestChapter && (
                  <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-amber-400 font-mono">
                        PRIORITY FOCUS CHAPTER · {analytics.weakestChapter.subject.toUpperCase()}
                      </div>
                      <div className="text-base font-semibold text-white">
                        {analytics.weakestChapter.chapter}
                      </div>
                      <div className="text-xs text-slate-300 font-mono tabular-nums">
                        Accuracy: {analytics.weakestChapter.accuracy}% · Active Mistakes:{' '}
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
                          className="px-3 py-2 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Retest Mistakes
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
                        className="px-3 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Practice Chapter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* QUESTION BANK COVERAGE BY SUBJECT (Section 22, 109, 110) */}
        <section className="space-y-5 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Live Question Bank Inventory</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamically indexed from your JSON question bank repository ({diagnostics.filesScanned} JSON files)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('question-bank')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Question Bank & Git Sync</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((sub) => {
              const info = diagnostics.bySubject[sub];
              return (
                <div
                  key={sub}
                  className="p-5 rounded-xl bg-[#111827] border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{sub}</h3>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {info.chaptersCount} Chapters
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-slate-400">Total</div>
                      <div className="text-base font-semibold text-slate-100 mt-0.5">
                        {info.total}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">MCQ</div>
                      <div className="text-base font-semibold text-blue-400 mt-0.5">
                        {info.mcq}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Integer</div>
                      <div className="text-base font-semibold text-emerald-400 mt-0.5">
                        {info.integer}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChapterSelector(sub)}
                    className="w-full py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Select {sub} Chapters →
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW THE ADAPTIVE REVISION SYSTEM WORKS (Section 22) */}
        <section className="space-y-6 pt-4 border-t border-slate-800/80">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Closed-Loop JEE Preparation Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Designed around the core improvement cycle: Test → Analyse → Identify Weakness → Retest Mistakes → Master
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-xs font-mono text-blue-400">01. Balanced Selection</div>
              <h3 className="text-sm font-semibold text-white">
                Strict Chapter & Pattern Enforcement
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every subject receives 20 MCQs and 5 Integer questions distributed evenly across your selected chapters with calibrated Easy/Medium/Hard difficulty ratios.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-xs font-mono text-emerald-400">02. Real Exam Mode</div>
              <h3 className="text-sm font-semibold text-white">
                Continuous Autosave & Palette Tracking
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distraction-free testing workspace with live subject switching, distinct Answered/Review palette states, keyboard shortcuts, and server-backed timer persistence.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-xs font-mono text-amber-400">03. Weakness Scoring</div>
              <h3 className="text-sm font-semibold text-white">
                Chapter Diagnostics & Worked Solutions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post-test reports compute chapter weakness scores from incorrect rates, unattempted rates, and repeated mistakes—paired with step-by-step LaTeX derivations.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
              <div className="text-xs font-mono text-red-400">04. Mistake Retesting</div>
              <h3 className="text-sm font-semibold text-white">
                Strict Correct-Answer Exclusion
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated mistake retests pull exclusively from your previously incorrect questions while strictly excluding questions you have already answered correctly.
              </p>
            </div>
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
              Question Bank Diagnostics
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
              Long-Term Analytics
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
