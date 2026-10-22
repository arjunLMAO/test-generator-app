import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  Sliders,
  XCircle,
} from 'lucide-react';
import { SubjectName, TestResultReport } from '../types/jee';
import { MathText } from './MathText';
import { QuestionVisuals } from './VisualDiagramRenderer';
import { sanitizeStudentQuestionText } from '../services/StudentQuestionSerializer';

interface TestResultsViewProps {
  report: TestResultReport;
  onBackToDashboard: () => void;
  onPracticeWeakChapters: (subject: SubjectName, chapters: string[]) => void;
  onRetestMistakes: (sub?: SubjectName, chap?: string, questionIds?: string[]) => void;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  report,
  onBackToDashboard,
  onPracticeWeakChapters,
  onRetestMistakes,
}) => {
  const [filterResult, setFilterResult] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  const toggleSolution = (qid: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qid]: !prev[qid],
    }));
  };

  const filteredQuestions = report.questionResults.filter((q) => {
    if (filterResult !== 'all' && q.result !== filterResult) return false;
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    return true;
  });

  const incorrectQuestions = report.questionResults.filter((q) => q.result === 'incorrect');

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F0F11] text-neutral-900 dark:text-neutral-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Test Performance Report
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {report.title} · Submitted {new Date(report.submittedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {incorrectQuestions.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onRetestMistakes(undefined, undefined, incorrectQuestions.map((q) => q.questionId))
                }
                className="px-4 py-2 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retest {incorrectQuestions.length} Mistakes</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* Primary Metric Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Final Score</div>
            <div className="text-2xl font-bold text-neutral-950 dark:text-white mt-1 font-mono">
              {report.totalMarks}{' '}
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">/ {report.maxMarks}</span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Net marks (+4 / -1)
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Accuracy</div>
            <div className="text-2xl font-bold text-neutral-950 dark:text-white mt-1 font-mono">
              {report.accuracy}%
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              {report.correct} of {report.attempted} attempted
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Time</div>
            <div className="text-2xl font-bold text-neutral-950 dark:text-white mt-1 font-mono">
              {formatDuration(report.totalTimeSpentSeconds)}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Avg {report.avgTimePerAttemptedSeconds}s per question
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Estimated Percentile</div>
            <div className="text-2xl font-bold text-neutral-950 dark:text-white mt-1 font-mono">
              {report.percentile.estimatedPercentile ? `${report.percentile.estimatedPercentile}%ile` : 'N/A'}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate" title={report.percentile.disclaimer}>
              Historical curve estimate
            </div>
          </div>
        </div>

        {/* Question Attempt Breakdown */}
        <div className="p-4 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Total:</span>{' '}
              <strong className="text-neutral-900 dark:text-neutral-100">{report.totalQuestions}</strong>
            </div>
            <div>
              <span className="text-emerald-700 dark:text-emerald-400">Correct:</span>{' '}
              <strong className="text-emerald-800 dark:text-emerald-300">{report.correct}</strong>
            </div>
            <div>
              <span className="text-red-700 dark:text-red-400">Incorrect:</span>{' '}
              <strong className="text-red-800 dark:text-red-300">{report.incorrect}</strong>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Unattempted:</span>{' '}
              <strong className="text-neutral-700 dark:text-neutral-300">{report.unattempted}</strong>
            </div>
          </div>

          {report.summaryInsights && report.summaryInsights.length > 0 && (
            <div className="text-xs text-neutral-600 dark:text-neutral-400 font-sans italic">
              {report.summaryInsights[0]}
            </div>
          )}
        </div>

        {/* Subject-Wise Performance Table */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
            Subject-Wise Breakdown
          </h2>
          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4 font-mono">Score</th>
                  <th className="py-2.5 px-4 font-mono">Accuracy</th>
                  <th className="py-2.5 px-4 font-mono">Attempted</th>
                  <th className="py-2.5 px-4 font-mono">Correct</th>
                  <th className="py-2.5 px-4 font-mono">Incorrect</th>
                  <th className="py-2.5 px-4 font-mono">Time Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {report.subjectResults.map((sub) => (
                  <tr key={sub.subject} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="py-3 px-4 font-medium text-neutral-950 dark:text-white">{sub.subject}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {sub.marks} <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">/ {sub.maxMarks}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-800 dark:text-neutral-200">{sub.accuracy}%</td>
                    <td className="py-3 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                      {sub.attempted} / {sub.totalQuestions}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 font-medium">{sub.correct}</td>
                    <td className="py-3 px-4 font-mono text-red-700 dark:text-red-400 font-medium">{sub.incorrect}</td>
                    <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                      {formatDuration(sub.timeSpentSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Weak Chapters Recommendation */}
        {report.weakChapters && report.weakChapters.length > 0 && (
          <section className="p-5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181B] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Targeted Revision Areas
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Chapters with accuracy below 50% or recurring errors in this test:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {report.weakChapters.map((w) => (
                <div
                  key={`${w.subject}-${w.chapter}`}
                  className="p-3 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{w.subject}</div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{w.chapter}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-mono mt-0.5">
                      {w.incorrect} errors ({w.accuracy}% accuracy)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPracticeWeakChapters(w.subject, [w.chapter])}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                  >
                    Drill Chapter
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detailed Solutions & Question Analysis */}
        <section className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-neutral-950 dark:text-white">
              Questions & Step-by-Step Solutions
            </h2>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded p-1 text-xs">
                {(['all', 'incorrect', 'correct', 'unattempted'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterResult(mode)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                      filterResult === mode
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {report.subjects.length > 1 && (
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {report.subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isExpanded = Boolean(expandedSolutions[q.questionId]);
              return (
                <article
                  key={q.questionId}
                  className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-[#18181B] shadow-xs space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                        Q{q.order}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">·</span>
                      <span className="text-neutral-600 dark:text-neutral-400">{q.subject}</span>
                      <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">·</span>
                      <span className="text-neutral-500 dark:text-neutral-400">{q.chapter}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {q.result === 'correct' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                          ✓ Correct (+4)
                        </span>
                      )}
                      {q.result === 'incorrect' && (
                        <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-medium border border-red-200 dark:border-red-800">
                          ✗ Incorrect ({q.marksAwarded})
                        </span>
                      )}
                      {q.result === 'unattempted' && (
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium border border-neutral-200 dark:border-neutral-700">
                          Unattempted (0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed">
                    <MathText text={sanitizeStudentQuestionText(q.question)} />
                  </div>

                  {/* Visuals if any */}
                  <QuestionVisuals
                    visuals={q.images}
                    visualAsset={q.visualAsset}
                    imageUrl={q.image}
                    subject={q.subject}
                    chapter={q.chapter}
                    visualRequired={q.visualRequired}
                    visualStatus={q.visualStatus}
                    questionOrder={q.order}
                  />

                  {/* Answer Summary Box */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400 font-sans">Your Answer: </span>
                      <strong
                        className={
                          q.result === 'correct'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : q.result === 'incorrect'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                        }
                      >
                        {q.studentAnswer ?? 'None'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400 font-sans">Correct Answer: </span>
                      <strong className="text-neutral-900 dark:text-white">{String(q.correctAnswer)}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400 font-sans">Time: </span>
                      <span className="text-neutral-700 dark:text-neutral-300">{q.timeSpentSeconds}s</span>
                    </div>
                  </div>

                  {/* Toggle Solution Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSolution(q.questionId)}
                      className="text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white underline cursor-pointer"
                    >
                      {isExpanded ? 'Hide Solution' : 'View Step-by-Step Solution'}
                    </button>
                  </div>

                  {/* Solution Area */}
                  {isExpanded && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded text-sm text-neutral-800 dark:text-neutral-200 space-y-2 mt-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Worked Solution
                      </div>
                      <div className="leading-relaxed">
                        <MathText text={q.solution} block />
                      </div>
                      {q.explanation && (
                        <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
                          <MathText text={q.explanation} block />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
