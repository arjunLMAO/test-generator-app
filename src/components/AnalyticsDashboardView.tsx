import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { DashboardAnalyticsSummary } from '../services/LongTermAnalyticsService';
import { QuestionHistoryRecord, SubjectName } from '../types/jee';

interface AnalyticsDashboardViewProps {
  analytics: DashboardAnalyticsSummary;
  historyMap: Record<string, QuestionHistoryRecord>;
  onStartFullTest: () => void;
  onPracticeChapter: (subject: SubjectName, chapter: string) => void;
  onRetestMistakes: (subject?: SubjectName, chapter?: string) => void;
  onOpenReport: (testId: string) => void;
}

type TrendMetric = 'accuracy' | 'score' | 'percentile';

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  analytics,
  historyMap,
  onStartFullTest,
  onPracticeChapter,
  onRetestMistakes,
  onOpenReport,
}) => {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('accuracy');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | SubjectName>('ALL');
  const [chapterSubjectFilter, setChapterSubjectFilter] = useState<'ALL' | SubjectName>('ALL');

  const masteryCounts = useMemo(() => {
    const counts = {
      incorrect: 0,
      corrected: 0,
      mastered: 0,
      attempted: 0,
    };
    for (const h of Object.values(historyMap)) {
      if (h.masteryState === 'incorrect') counts.incorrect++;
      else if (h.masteryState === 'corrected') counts.corrected++;
      else if (h.masteryState === 'mastered') counts.mastered++;
      else if (h.masteryState === 'attempted') counts.attempted++;
    }
    return counts;
  }, [historyMap]);

  const filteredChapters = useMemo(() => {
    if (chapterSubjectFilter === 'ALL') return analytics.chapterStats;
    return analytics.chapterStats.filter((c) => c.subject === chapterSubjectFilter);
  }, [analytics.chapterStats, chapterSubjectFilter]);

  // Compute chart points for Performance Trend Graph (Section 40)
  const chartPoints = useMemo(() => {
    return analytics.trendSeries.map((pt) => {
      let yVal = 0;
      let unit = '';
      if (subjectFilter === 'ALL') {
        if (trendMetric === 'accuracy') {
          yVal = pt.accuracy;
          unit = '%';
        } else if (trendMetric === 'score') {
          yVal = pt.normalizedScore300;
          unit = ' / 300';
        } else {
          yVal = pt.estimatedPercentile;
          unit = ' %ile';
        }
      } else {
        if (trendMetric === 'score') {
          yVal = pt.subjectScoreNormalized100[subjectFilter] ?? 0;
          unit = ' / 100';
        } else {
          yVal = pt.subjectAccuracy[subjectFilter] ?? 0;
          unit = '%';
        }
      }
      return {
        ...pt,
        yVal,
        unit,
      };
    });
  }, [analytics.trendSeries, trendMetric, subjectFilter]);

  if (!analytics.hasData) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto p-10 rounded-xl bg-[#111827] border border-slate-800 text-center space-y-5">
          <div className="text-xs font-mono text-blue-400">LONG-TERM ANALYTICS ENGINE</div>
          <h1 className="text-3xl font-display text-white">
            Your performance dashboard will appear after your first test.
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Vectra JEE never populates charts with fabricated scores. Complete a Full Syllabus or Chapter Test to unlock longitudinal accuracy trends, chapter improvement deltas, and mistake-recovery queues.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartFullTest}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              Take Your First Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maxY =
    trendMetric === 'score' && subjectFilter === 'ALL' ? 300 : 100;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="text-xs font-mono text-blue-400">
              LONGITUDINAL TELEMETRY · CROSS-TEST ANALYTICS
            </div>
            <h1 className="text-3xl sm:text-4xl font-display text-white mt-1">
              Performance & Mastery Analytics
            </h1>
            <p className="text-sm text-slate-400">
              Aggregated across {analytics.testsAttempted} completed test
              {analytics.testsAttempted === 1 ? '' : 's'} and {analytics.questionsAttempted}{' '}
              question responses.
            </p>
          </div>

          {analytics.questionsNeedingReviewCount > 0 && (
            <button
              type="button"
              onClick={() => onRetestMistakes()}
              className="px-4 py-2.5 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                Retest All Unresolved Mistakes ({analytics.questionsNeedingReviewCount})
              </span>
            </button>
          )}
        </div>

        {/* OVERALL SUMMARY STRIP (Section 39) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Tests Attempted</div>
            <div className="text-2xl font-mono font-semibold text-white mt-1 tabular-nums">
              {analytics.testsAttempted}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Questions Attempted</div>
            <div className="text-2xl font-mono font-semibold text-white mt-1 tabular-nums">
              {analytics.questionsAttempted}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Overall Accuracy</div>
            <div className="text-2xl font-mono font-semibold text-emerald-400 mt-1 tabular-nums">
              {analytics.overallAccuracy}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Avg Scaled Score</div>
            <div className="text-2xl font-mono font-semibold text-blue-400 mt-1 tabular-nums">
              {analytics.averageNormalizedScore300}
              <span className="text-xs text-slate-500"> / 300</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Mistakes in Queue</div>
            <div className="text-2xl font-mono font-semibold text-red-400 mt-1 tabular-nums">
              {analytics.questionsNeedingReviewCount}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
            <div className="text-xs text-slate-400">Mistakes Corrected</div>
            <div className="text-2xl font-mono font-semibold text-emerald-300 mt-1 tabular-nums">
              {analytics.correctedMistakesCount}
            </div>
          </div>
        </section>

        {/* PERFORMANCE TREND GRAPH (Section 40) */}
        <section className="p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Performance Trend Over Time</h2>
              <p className="text-xs text-slate-400">
                Switch between Accuracy, Normalized Score, and Estimated Percentile across subjects
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Metric Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(
                  [
                    { id: 'accuracy', label: 'Accuracy' },
                    { id: 'score', label: 'Score' },
                    { id: 'percentile', label: 'Percentile Estimate' },
                  ] as Array<{ id: TrendMetric; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTrendMetric(m.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      trendMetric === m.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Subject Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      subjectFilter === sub
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub === 'ALL' ? 'All' : sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Time-Series Line Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] h-64 relative">
              <svg
                viewBox="0 0 800 220"
                className="w-full h-full overflow-visible"
                aria-label="Performance trend chart"
              >
                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 185 - ratio * 150;
                  const labelVal = Math.round(ratio * maxY);
                  return (
                    <g key={idx}>
                      <line
                        x1="50"
                        y1={y}
                        x2="770"
                        y2={y}
                        stroke="rgba(148,163,184,0.12)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="40"
                        y={y + 4}
                        textAnchor="end"
                        fill="#64748B"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="10"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Plot Line & Points */}
                {chartPoints.length > 0 && (
                  <>
                    {chartPoints.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        points={chartPoints
                          .map((pt, i) => {
                            const x =
                              50 +
                              (i / Math.max(1, chartPoints.length - 1)) * 700;
                            const clamped = Math.max(0, Math.min(maxY, pt.yVal));
                            const y = 185 - (clamped / maxY) * 150;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />
                    )}

                    {chartPoints.map((pt, i) => {
                      const x =
                        chartPoints.length === 1
                          ? 400
                          : 50 + (i / (chartPoints.length - 1)) * 700;
                      const clamped = Math.max(0, Math.min(maxY, pt.yVal));
                      const y = 185 - (clamped / maxY) * 150;

                      return (
                        <g
                          key={pt.testId}
                          className="cursor-pointer"
                          onClick={() => onOpenReport(pt.testId)}
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#3B82F6"
                            stroke="#090D16"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            fill="#E2E8F0"
                            fontFamily="JetBrains Mono, monospace"
                            fontSize="10"
                          >
                            {pt.yVal}
                            {pt.unit}
                          </text>
                          <text
                            x={x}
                            y="206"
                            textAnchor="middle"
                            fill="#94A3B8"
                            fontFamily="JetBrains Mono, monospace"
                            fontSize="10"
                          >
                            {pt.dateShort}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          </div>
        </section>

        {/* SUBJECT PERFORMANCE BREAKDOWN & QUESTION MASTERY (Section 39, 10) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject Breakdown */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold text-white">Cumulative Subject Performance</h2>
            <div className="space-y-4">
              {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((sub) => {
                const sb = analytics.subjectBreakdown[sub];
                return (
                  <div
                    key={sub}
                    className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">{sub}</span>
                      <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                        {sb.accuracy}% Accuracy
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, sb.accuracy)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                      <span>Attempted: {sb.attempted}</span>
                      <span>Correct: {sb.correct}</span>
                      <span>Incorrect: {sb.incorrect}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Mastery State & Mistake Categories */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#111827] border border-slate-800 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Question Mastery & Error Taxonomy
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Mastered (2+ ✓)</div>
                  <div className="text-lg font-semibold text-emerald-400 mt-0.5">
                    {masteryCounts.mastered}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Corrected (✗ → ✓)</div>
                  <div className="text-lg font-semibold text-blue-400 mt-0.5">
                    {masteryCounts.corrected}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Needs Review (✗)</div>
                  <div className="text-lg font-semibold text-red-400 mt-0.5">
                    {masteryCounts.incorrect}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Attempted (1× ✓)</div>
                  <div className="text-lg font-semibold text-slate-200 mt-0.5">
                    {masteryCounts.attempted}
                  </div>
                </div>
              </div>
            </div>

            {analytics.errorTypeBreakdown.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300">
                  Most Frequent Possible Error Types
                </div>
                {analytics.errorTypeBreakdown.slice(0, 4).map((err) => (
                  <div
                    key={err.category}
                    className="flex items-center justify-between text-xs font-mono tabular-nums"
                  >
                    <span className="text-slate-300 font-sans">{err.category}</span>
                    <span className="text-amber-400">
                      {err.count} ({err.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CHAPTER PERFORMANCE, IMPROVEMENT DELTAS & RETEST MISTAKES FLOW (Sections 63, 65) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Chapter-Level Mastery & Dedicated Mistake Retests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Retest My Mistakes strictly selects previously incorrect questions from that chapter and excludes all correct ones.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setChapterSubjectFilter(sub)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    chapterSubjectFilter === sub
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub === 'ALL' ? 'All Subjects' : sub}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Chapter</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-right">Attempted</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Cross-Test Delta</th>
                  <th className="py-3 px-4 text-right">Mistakes in Pool</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredChapters.map((c) => (
                  <tr
                    key={`${c.subject}::${c.chapter}`}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-white">{c.chapter}</td>
                    <td className="py-3.5 px-4 text-slate-400">{c.subject}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {c.attempted} ({c.correct}✓ / {c.incorrect}✗)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                      {c.accuracy}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {c.improvementDeltaPoints !== null ? (
                        <span
                          className={
                            c.improvementDeltaPoints >= 0
                              ? 'text-emerald-400 font-semibold'
                              : 'text-red-400'
                          }
                        >
                          {c.improvementDeltaPoints >= 0 ? '+' : ''}
                          {c.improvementDeltaPoints} percentage points
                        </span>
                      ) : (
                        <span className="text-slate-500">1 test baseline</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {c.activeMistakesInPool > 0 ? (
                        <span className="text-red-400 font-semibold">
                          {c.activeMistakesInPool} wrong
                        </span>
                      ) : (
                        <span className="text-emerald-400">0 wrong</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.activeMistakesInPool > 0 && (
                          <button
                            type="button"
                            onClick={() => onRetestMistakes(c.subject, c.chapter)}
                            className="px-2.5 py-1.5 rounded bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 font-semibold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Retest My Mistakes ({c.activeMistakesInPool})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPracticeChapter(c.subject, c.chapter)}
                          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-colors whitespace-nowrap cursor-pointer"
                        >
                          New Practice Test
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
