import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  QuestionResultDetail,
  SubjectName,
  TestMode,
  TestResultReport,
} from '../types/jee';
import { sanitizeStudentQuestionText } from '../services/StudentQuestionSerializer';
import { MathText } from './MathText';

interface TestResultsViewProps {
  report: TestResultReport;
  onBackToDashboard: () => void;
  onPracticeWeakChapters: (subject: SubjectName, chapters: string[]) => void;
  onRetestMistakes: (
    subject?: SubjectName,
    chapter?: string,
    questionIds?: string[]
  ) => void;
}

type QuestionFilterStatus = 'all' | 'incorrect' | 'correct' | 'unattempted' | 'marked';

function formatSecondsReadable(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m > 0) return `${m}m ${rem}s`;
  return `${rem}s`;
}

function useAnimatedScore(target: number, durationMs = 650): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return value;
}

const SUBJECT_THEMES: Record<
  SubjectName,
  {
    border: string;
    badgeText: string;
    barColor: string;
    glowBg: string;
  }
> = {
  Physics: {
    border: 'border-blue-500/30 hover:border-blue-500/50',
    badgeText: 'text-blue-400',
    barColor: 'bg-blue-500',
    glowBg: 'from-blue-500/10 to-transparent',
  },
  Chemistry: {
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    badgeText: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    glowBg: 'from-emerald-500/10 to-transparent',
  },
  Mathematics: {
    border: 'border-amber-500/30 hover:border-amber-500/50',
    badgeText: 'text-amber-400',
    barColor: 'bg-amber-500',
    glowBg: 'from-amber-500/10 to-transparent',
  },
};

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  report,
  onBackToDashboard,
  onPracticeWeakChapters,
  onRetestMistakes,
}) => {
  const [statusFilter, setStatusFilter] = useState<QuestionFilterStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | SubjectName>('ALL');
  const [activeSolutionQuestion, setActiveSolutionQuestion] =
    useState<QuestionResultDetail | null>(null);

  const animatedMarks = useAnimatedScore(report.totalMarks, 650);

  const incorrectBySubject = useMemo(() => {
    const grouped: Record<SubjectName, QuestionResultDetail[]> = {
      Physics: [],
      Chemistry: [],
      Mathematics: [],
    };
    for (const q of report.questionResults) {
      if (q.result === 'incorrect') {
        grouped[q.subject].push(q);
      }
    }
    return grouped;
  }, [report.questionResults]);

  // Questions that had a previous attempt (especially in a Mistake Retest)
  const retestComparisonStats = useMemo(() => {
    const questionsWithPreviousAttempt = report.questionResults.filter(
      (q) =>
        q.historySnapshot.previousResult === 'incorrect' ||
        q.historySnapshot.previouslyIncorrectNowCorrected ||
        (q.historySnapshot.attemptsTimeline && q.historySnapshot.attemptsTimeline.length > 1)
    );
    const fixedCount = questionsWithPreviousAttempt.filter((q) => q.result === 'correct').length;
    const stillWrongCount = questionsWithPreviousAttempt.filter(
      (q) => q.result === 'incorrect'
    ).length;
    return {
      totalCompared: questionsWithPreviousAttempt.length,
      fixedCount,
      stillWrongCount,
      questionsWithPreviousAttempt,
    };
  }, [report.questionResults]);

  // Actionable chapters to work on: include formal weakChapters + any chapter where student got questions wrong
  const actionableChapters = useMemo(() => {
    const map = new Map<string, typeof report.chapterResults[0]>();
    for (const wc of report.weakChapters) {
      map.set(`${wc.subject}::${wc.chapter}`, wc);
    }
    for (const ch of report.chapterResults) {
      if (ch.incorrect > 0 && !map.has(`${ch.subject}::${ch.chapter}`)) {
        map.set(`${ch.subject}::${ch.chapter}`, ch);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.incorrect - a.incorrect || a.accuracy - b.accuracy);
  }, [report.weakChapters, report.chapterResults]);

  const filteredQuestions = useMemo(() => {
    return report.questionResults.filter((q) => {
      if (subjectFilter !== 'ALL' && q.subject !== subjectFilter) return false;
      if (statusFilter === 'incorrect') return q.result === 'incorrect';
      if (statusFilter === 'correct') return q.result === 'correct';
      if (statusFilter === 'unattempted') return q.result === 'unattempted';
      if (statusFilter === 'marked') return q.markedForReview;
      return true;
    });
  }, [report.questionResults, statusFilter, subjectFilter]);

  const isRetestMode = report.mode === TestMode.WRONG_QUESTION_RETEST;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-12">
        {/* TOP HERO BAR — "Test complete. Let's see what happened." (Parts 5, 13, 16, 21, 30) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-800/90 pb-7">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-emerald-400">
              <span>
                {isRetestMode
                  ? 'Mistake retest complete · Recovery report'
                  : "Test complete. Let's see what happened."}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-400 font-normal">
                {new Date(report.submittedAt).toLocaleString('en-IN')}
              </span>
              {report.autoSubmitted && (
                <>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-amber-400">Submitted automatically when timer ended</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-semibold text-white tracking-tight">
              {report.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {report.incorrect > 0 ? (
              <button
                type="button"
                onClick={() => onRetestMistakes()}
                className="btn-interactive px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-400/40 rounded-xl shadow-lg shadow-red-950/40 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  Retest {report.incorrect} Mistake{report.incorrect === 1 ? '' : 's'}
                </span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Nothing to retest · 0 mistakes</span>
              </div>
            )}

            <button
              type="button"
              onClick={onBackToDashboard}
              className="btn-interactive px-4 py-3 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* MISTAKE RECOVERY BANNER (Part 25: Previous Attempt vs Retest Comparison) */}
        {retestComparisonStats.totalCompared > 0 && (
          <section className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-blue-950/30 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-card-reveal">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Mistake Recovery Progress</span>
              </div>
              <h2 className="text-2xl font-display text-white">
                You fixed {retestComparisonStats.fixedCount} of{' '}
                {retestComparisonStats.totalCompared} previously missed question
                {retestComparisonStats.totalCompared === 1 ? '' : 's'}.
              </h2>
              <p className="text-xs text-slate-300">
                Every question below shows your previous attempt side-by-side with this retest so you can verify genuine improvement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-center">
                <div className="text-[11px] text-slate-400">Previous ❌ → Retest ✅</div>
                <div className="text-xl font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                  {retestComparisonStats.fixedCount} Fixed
                </div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-slate-950/70 border border-red-500/30 text-center">
                <div className="text-[11px] text-slate-400">Previous ❌ → Retest ❌</div>
                <div className="text-xl font-mono font-bold text-red-400 tabular-nums mt-0.5">
                  {retestComparisonStats.stillWrongCount} Remaining
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRIMARY SCORE & STANDING HERO ("Here's where you stand" — Parts 5 & 13) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-8 rounded-2xl surface-card border border-slate-800 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400">
                  Here&apos;s where you stand
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Time taken: {formatSecondsReadable(report.totalTimeSpentSeconds)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-7 items-baseline">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Total Score</div>
                  <div className="text-5xl sm:text-6xl font-mono font-bold text-white mt-2 tabular-nums tracking-tight">
                    {animatedMarks}
                    <span className="text-2xl text-slate-500 font-normal">
                      {' '}
                      / {report.maxMarks}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 font-mono tabular-nums">
                    Scaled: {report.percentile.normalizedScore300} / 300
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Accuracy</div>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">
                    {report.accuracy}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 font-mono tabular-nums">
                    {report.correct} of {report.attempted} correct
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Predicted Percentile</div>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-blue-400 mt-2 tabular-nums">
                    {report.percentile.available && report.percentile.estimatedPercentile !== null
                      ? report.percentile.estimatedPercentile
                      : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    {report.percentile.confidenceLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Breakdown Strip */}
            <div className="space-y-4 pt-6 border-t border-slate-800/90">
              {/* Multi-segment visual bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden flex">
                {report.correct > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(report.correct / report.totalQuestions) * 100}%` }}
                    title={`Correct: ${report.correct}`}
                  />
                )}
                {report.incorrect > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${(report.incorrect / report.totalQuestions) * 100}%` }}
                    title={`Incorrect: ${report.incorrect}`}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-slate-400 font-sans">Attempted</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {report.attempted}{' '}
                    <span className="text-slate-500 font-normal">/ {report.totalQuestions}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Correct</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{report.correct}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Incorrect</div>
                  <div className="text-lg font-bold text-red-400 mt-0.5">{report.incorrect}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Skipped</div>
                  <div className="text-lg font-bold text-slate-300 mt-0.5">
                    {report.unattempted}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Avg Pace</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5">
                    {formatSecondsReadable(report.avgTimePerAttemptedSeconds)}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{report.percentile.disclaimer}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Actionable Takeaways & Immediate Mistake Remediation */}
          <div className="lg:col-span-5 p-7 rounded-2xl surface-card border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-blue-400">What stood out in this test</div>
              <h2 className="text-xl font-semibold text-white">Key Takeaways</h2>
              <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
                {report.summaryInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {report.incorrect > 0 ? (
              <div className="p-4 rounded-xl bg-red-950/25 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-300">
                    {report.incorrect} mistake{report.incorrect === 1 ? '' : 's'} ready for targeted
                    recovery
                  </span>
                  <span className="text-[11px] font-mono text-red-400 tabular-nums">
                    Only wrong questions
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jump straight into a focused retest containing only the {report.incorrect} question
                  {report.incorrect === 1 ? '' : 's'} you missed in this test.
                </p>
                <button
                  type="button"
                  onClick={() => onRetestMistakes()}
                  className="btn-interactive w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    Retest {report.incorrect} Mistake{report.incorrect === 1 ? '' : 's'} Now
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-1.5">
                <div className="text-sm font-semibold text-emerald-300">Perfect test.</div>
                <p className="text-xs text-slate-300">
                  Nothing to retest — you didn&apos;t miss a single question in this attempt.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SUBJECT BREAKDOWN (Part 14: Visually distinct, cohesive subject cards) */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-display text-white">Subject Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Score contribution, accuracy, and mistake count by subject
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {report.subjectResults.map((subRes) => {
              const theme = SUBJECT_THEMES[subRes.subject];
              return (
                <div
                  key={subRes.subject}
                  className={`p-6 rounded-2xl surface-card bg-gradient-to-b ${theme.glowBg} border ${theme.border} transition-all flex flex-col justify-between space-y-5`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-xs font-semibold ${theme.badgeText}`}>
                          {subRes.subject}
                        </span>
                        <h3 className="text-2xl font-bold text-white mt-0.5">{subRes.subject}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-white tabular-nums">
                          {subRes.marks}{' '}
                          <span className="text-sm text-slate-500 font-normal">
                            / {subRes.maxMarks}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                          MCQ: {subRes.mcqMarks} · Int: {subRes.integerMarks}
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Accuracy</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {subRes.accuracy}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${theme.barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(0, subRes.accuracy))}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                      <div>
                        <div className="text-slate-400 font-sans">Attempted</div>
                        <div className="text-sm font-bold text-slate-100 mt-0.5">
                          {subRes.attempted}/{subRes.totalQuestions}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-sans">Correct</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {subRes.correct}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-sans">Incorrect</div>
                        <div className="text-sm font-bold text-red-400 mt-0.5">
                          {subRes.incorrect}
                        </div>
                      </div>
                    </div>
                  </div>

                  {subRes.incorrect > 0 ? (
                    <button
                      type="button"
                      onClick={() => onRetestMistakes(subRes.subject)}
                      className="btn-interactive w-full py-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-xs font-semibold text-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        Retest {subRes.incorrect} {subRes.subject} Mistake
                        {subRes.incorrect === 1 ? '' : 's'}
                      </span>
                    </button>
                  ) : (
                    <div className="py-2 px-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center text-xs font-medium text-emerald-300">
                      0 mistakes in {subRes.subject}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* AREAS TO WORK ON — ACTIONABLE WEAK CHAPTERS (Part 15 & Part 28) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display text-white">Areas to work on</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chapters where mistakes or low accuracy pulled your score down — click to retest mistakes immediately
              </p>
            </div>
            {report.weakChapters.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onPracticeWeakChapters(
                    report.weakChapters[0].subject,
                    report.weakChapters
                      .filter((w) => w.subject === report.weakChapters[0].subject)
                      .map((w) => w.chapter)
                  )
                }
                className="btn-interactive px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Practice Weak Chapters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {actionableChapters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actionableChapters.map((wc) => (
                <div
                  key={`${wc.subject}-${wc.chapter}`}
                  className="p-5 rounded-2xl surface-card border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-400">{wc.subject}</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        Accuracy: {wc.accuracy}%
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white leading-snug">{wc.chapter}</h3>

                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          wc.accuracy >= 70
                            ? 'bg-emerald-500'
                            : wc.accuracy >= 45
                              ? 'bg-amber-400'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, wc.accuracy))}%` }}
                      />
                    </div>

                    <div className="pt-2 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums text-slate-300">
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Attempted</span>
                        {wc.attempted} / {wc.totalQuestions}
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Correct</span>
                        <span className="text-emerald-400 font-semibold">{wc.correct}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans block text-[11px]">Incorrect</span>
                        <span className="text-red-400 font-semibold">{wc.incorrect}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    {wc.incorrect > 0 && (
                      <button
                        type="button"
                        onClick={() => onRetestMistakes(wc.subject, wc.chapter)}
                        className="btn-interactive flex-1 py-2 px-3 text-xs font-semibold text-white bg-red-600/90 hover:bg-red-500 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>
                          Retest {wc.incorrect} Mistake{wc.incorrect === 1 ? '' : 's'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onPracticeWeakChapters(wc.subject, [wc.chapter])}
                      className="btn-interactive py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                    >
                      Practice Chapter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl surface-card border border-emerald-500/30 text-sm text-emerald-200">
              Strong performance across all tested chapters — no weak chapters flagged in this session.
            </div>
          )}
        </section>

        {/* MISTAKES TO REVIEW OR PERFECT SCORE STATE (Parts 25, 26, 28, 30) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display text-white">
                {report.incorrect > 0
                  ? `Your Mistakes (${report.incorrect})`
                  : 'Zero Mistakes in This Test'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {report.incorrect > 0
                  ? 'Inspect worked derivations or retest any individual question directly'
                  : 'Every question you attempted was answered accurately'}
              </p>
            </div>
            {report.incorrect > 0 && (
              <button
                type="button"
                onClick={() => onRetestMistakes()}
                className="btn-interactive px-4 py-2 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  Retest All {report.incorrect} Mistake{report.incorrect === 1 ? '' : 's'}
                </span>
              </button>
            )}
          </div>

          {report.incorrect === 0 ? (
            <div className="p-8 rounded-2xl surface-card border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-400">Clean sheet</div>
                <h3 className="text-2xl font-display text-white">
                  Perfect test. Nothing to retest.
                </h3>
                <p className="text-sm text-slate-300">
                  You&apos;ve got nothing to fix from this attempt. Review your complete question breakdown below or start a new test.
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToDashboard}
                className="btn-interactive px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold cursor-pointer shrink-0"
              >
                Start Another Test
              </button>
            </div>
          ) : (
            <div className="space-y-7">
              {report.subjects.map((sub) => {
                const wrongList = incorrectBySubject[sub] || [];
                if (wrongList.length === 0) return null;

                return (
                  <div key={sub} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2">
                        <span>{sub}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono">
                          {wrongList.length} mistake{wrongList.length === 1 ? '' : 's'}
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRetestMistakes(sub)}
                        className="text-xs font-semibold text-red-300 hover:text-red-200 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>
                          Retest {sub} Mistakes ({wrongList.length})
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wrongList.map((wq) => (
                        <div
                          key={wq.questionId}
                          className="p-5 rounded-2xl bg-red-950/20 hover:bg-red-950/35 border border-red-500/35 hover:border-red-400/60 transition-all flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-red-300">
                                Question {wq.order} · {wq.chapter}
                              </span>
                              <span className="font-mono text-red-400 tabular-nums">
                                {wq.marksAwarded} mark
                              </span>
                            </div>

                            <div className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                              <MathText text={sanitizeStudentQuestionText(wq.question)} />
                            </div>
                          </div>

                          <div className="pt-3 border-t border-red-500/20 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                              <span className="text-red-300">
                                Your Answer: <strong>{wq.studentAnswer}</strong>
                              </span>
                              <span className="text-emerald-300">
                                Correct: <strong>{wq.correctAnswer}</strong>
                              </span>
                            </div>

                            {/* Attempt History Timeline (Parts 25 & 26) */}
                            {wq.historySnapshot.attemptsTimeline &&
                              wq.historySnapshot.attemptsTimeline.length > 1 && (
                                <div className="p-2 rounded-lg bg-slate-950/70 border border-red-500/20 text-[11px] font-mono flex flex-wrap items-center gap-1.5">
                                  {wq.historySnapshot.attemptsTimeline.map((att, idx) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span className="text-slate-600">→</span>}
                                      <span
                                        className={
                                          att.correct ? 'text-emerald-400' : 'text-red-400'
                                        }
                                      >
                                        {idx === 0 ? 'Attempt 1' : `Retest ${idx}`}:{' '}
                                        {att.correct ? '✅' : '❌'}
                                      </span>
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveSolutionQuestion(wq)}
                                className="text-xs font-semibold text-slate-200 hover:text-white underline cursor-pointer"
                              >
                                View Solution →
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onRetestMistakes(wq.subject, wq.chapter, [wq.questionId])
                                }
                                className="btn-interactive px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retest Q{wq.order}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETE QUESTION-BY-QUESTION BREAKDOWN WITH PREVIOUS vs RETEST STATUS (Parts 25 & 26) */}
        <section className="space-y-5 pt-4 border-t border-slate-800/90">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display text-white">Question-by-Question Review</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect every question, chapter classification, attempt history, and step-by-step derivation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {(['ALL', ...report.subjects] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      subjectFilter === sub
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub === 'ALL' ? 'All Subjects' : sub}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'incorrect', label: 'Incorrect' },
                    { id: 'correct', label: 'Correct' },
                    { id: 'unattempted', label: 'Skipped' },
                    { id: 'marked', label: 'Marked' },
                  ] as Array<{ id: QuestionFilterStatus; label: string }>
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const isWrong = q.result === 'incorrect';
              const isRight = q.result === 'correct';
              const hadPreviousWrong =
                q.historySnapshot.previousResult === 'incorrect' ||
                q.historySnapshot.previouslyIncorrectNowCorrected;

              return (
                <div
                  key={q.questionId}
                  className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                    isWrong
                      ? 'bg-red-950/15 border-red-500/35 hover:border-red-500/50'
                      : isRight
                        ? 'surface-card border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/40 border-slate-800/70'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-white tabular-nums">
                        Question {q.order}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-400 font-semibold">{q.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-200 font-medium">{q.chapter}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400">{q.topic}</span>
                      <span aria-hidden="true">·</span>
                      {isRight && (
                        <span className="text-emerald-400 font-semibold">
                          ✅ Correct (+{q.marksAwarded})
                        </span>
                      )}
                      {isWrong && (
                        <span className="text-red-400 font-semibold">
                          ❌ Incorrect ({q.marksAwarded})
                        </span>
                      )}
                      {q.result === 'unattempted' && (
                        <span className="text-slate-400">○ Skipped (0)</span>
                      )}
                    </div>

                    {/* Explicit Previous Attempt vs Retest Comparison Row (Parts 25 & 26) */}
                    {(hadPreviousWrong ||
                      (q.historySnapshot.attemptsTimeline &&
                        q.historySnapshot.attemptsTimeline.length > 1)) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
                          Previous Attempt:{' '}
                          {q.historySnapshot.previousResult === 'correct' ? '✅' : '❌'}{' '}
                          {q.historySnapshot.previousAnswer
                            ? `(${q.historySnapshot.previousAnswer})`
                            : ''}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span
                          className={`px-2.5 py-1 rounded-md border font-semibold ${
                            isRight
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                              : 'bg-red-950/50 border-red-500/40 text-red-300'
                          }`}
                        >
                          Retest: {isRight ? '✅ Improved' : '❌ Needs Review'}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-slate-200 line-clamp-2 leading-relaxed">
                      <MathText text={sanitizeStudentQuestionText(q.question)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-slate-400 font-sans">Your Answer</div>
                      <div
                        className={`font-bold text-sm mt-0.5 ${
                          isWrong
                            ? 'text-red-400'
                            : isRight
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {q.studentAnswer ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-sans">Correct Answer</div>
                      <div className="font-bold text-sm text-emerald-400 mt-0.5">
                        {q.correctAnswer}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWrong && (
                        <button
                          type="button"
                          onClick={() => onRetestMistakes(q.subject, q.chapter, [q.questionId])}
                          className="btn-interactive px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 font-sans font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retest</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveSolutionQuestion(q)}
                        className="btn-interactive px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-sans font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Solution
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* DETAILED SOLUTION & ATTEMPT TIMELINE MODAL */}
      {activeSolutionQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-page-enter"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl surface-card border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-white">
                  Question {activeSolutionQuestion.order}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-400 font-semibold">
                  {activeSolutionQuestion.subject}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-200 font-medium">
                  {activeSolutionQuestion.chapter}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{activeSolutionQuestion.topic}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSolutionQuestion(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Multi-Attempt Progression Banner (Parts 25 & 26) */}
              {activeSolutionQuestion.historySnapshot.attemptsTimeline &&
                activeSolutionQuestion.historySnapshot.attemptsTimeline.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-300">
                      Your Attempt Progression on This Question
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {activeSolutionQuestion.historySnapshot.attemptsTimeline.map((att, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span className="text-slate-500">→</span>}
                          <span
                            className={`px-2.5 py-1 rounded-lg border ${
                              att.correct
                                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                                : 'bg-red-950/50 border-red-500/40 text-red-300'
                            }`}
                          >
                            {idx === 0 ? 'Attempt 1' : `Retest ${idx}`}: {att.correct ? '✅' : '❌'}{' '}
                            (Ans: {att.answer ?? '—'})
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

              {activeSolutionQuestion.result === 'incorrect' &&
                activeSolutionQuestion.historySnapshot.incorrectCount >= 2 && (
                  <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-xs text-red-200 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>High-Priority Mistake:</strong> You have missed this question{' '}
                      {activeSolutionQuestion.historySnapshot.incorrectCount} times across your
                      attempts.
                    </span>
                  </div>
                )}

              {/* Question Statement */}
              <div className="space-y-3">
                <div className="text-base text-white leading-relaxed">
                  <MathText text={sanitizeStudentQuestionText(activeSolutionQuestion.question)} />
                </div>

                {activeSolutionQuestion.image && (
                  <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 inline-block">
                    <img
                      src={activeSolutionQuestion.image}
                      alt="Question diagram"
                      referrerPolicy="no-referrer"
                      className="max-h-56 w-auto object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Options if MCQ */}
              {activeSolutionQuestion.type === 'mcq' && activeSolutionQuestion.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                    const isCorrectOpt =
                      String(activeSolutionQuestion.correctAnswer).toUpperCase() === letter;
                    const isStudentOpt =
                      String(activeSolutionQuestion.studentAnswer).toUpperCase() === letter;

                    return (
                      <div
                        key={letter}
                        className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
                          isCorrectOpt
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
                            : isStudentOpt && !isCorrectOpt
                              ? 'bg-red-950/40 border-red-500/60 text-red-100'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono font-bold">{letter}.</span>
                        <span className="flex-1">
                          <MathText text={activeSolutionQuestion.options![idx]} />
                        </span>
                        {isCorrectOpt && (
                          <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                            ✓ Correct
                          </span>
                        )}
                        {isStudentOpt && !isCorrectOpt && (
                          <span className="font-mono text-[11px] text-red-400 shrink-0">
                            ✗ Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Answer Comparison Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-slate-400 font-sans">Your Answer</div>
                  <div
                    className={`text-base font-bold mt-0.5 ${
                      activeSolutionQuestion.result === 'correct'
                        ? 'text-emerald-400'
                        : activeSolutionQuestion.result === 'incorrect'
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {activeSolutionQuestion.studentAnswer ?? 'Skipped'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Correct Answer</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {activeSolutionQuestion.correctAnswer}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Time Spent</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {formatSecondsReadable(activeSolutionQuestion.timeSpentSeconds)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-sans">Attempt Record</div>
                  <div className="text-slate-200 mt-0.5">
                    {activeSolutionQuestion.historySnapshot.attemptCount} tries (
                    {activeSolutionQuestion.historySnapshot.correctCount}✓ /{' '}
                    {activeSolutionQuestion.historySnapshot.incorrectCount}✗)
                  </div>
                </div>
              </div>

              {/* Worked Step-by-Step Solution */}
              <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                  <span>Step-by-Step Worked Solution</span>
                  <span className="text-slate-400">Topic: {activeSolutionQuestion.topic}</span>
                </div>
                <div className="text-sm text-slate-200 leading-relaxed">
                  <MathText text={activeSolutionQuestion.solution} block />
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                {activeSolutionQuestion.result === 'incorrect' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const q = activeSolutionQuestion;
                      setActiveSolutionQuestion(null);
                      onRetestMistakes(q.subject, q.chapter, [q.questionId]);
                    }}
                    className="btn-interactive px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retest This Question</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setActiveSolutionQuestion(null)}
                  className="btn-interactive px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
