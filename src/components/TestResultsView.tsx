import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import {
  QuestionResultDetail,
  SubjectName,
  TestResultReport,
} from '../types/jee';
import { MathText } from './MathText';

interface TestResultsViewProps {
  report: TestResultReport;
  onBackToDashboard: () => void;
  onPracticeWeakChapters: (subject: SubjectName, chapters: string[]) => void;
  onRetestMistakes: (subject?: SubjectName, chapter?: string) => void;
}

type QuestionFilterStatus = 'all' | 'incorrect' | 'correct' | 'unattempted' | 'marked';

function formatSecondsReadable(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m > 0) return `${m}m ${rem}s`;
  return `${rem}s`;
}

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

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-10">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>TEST COMPLETE</span>
              <span aria-hidden="true">·</span>
              <span>{new Date(report.submittedAt).toLocaleString('en-IN')}</span>
              {report.autoSubmitted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">AUTO-SUBMITTED ON TIMER EXPIRY</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display text-white mt-1">
              {report.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {report.incorrect > 0 && (
              <button
                type="button"
                onClick={() => onRetestMistakes(report.subjects[0])}
                className="px-4 py-2 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retest Mistakes ({report.incorrect})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* RESULTS HEADER: BIG SCORE, ACCURACY, ESTIMATED PERCENTILE (Sections 30, 37, 61) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Primary Score & Percentile Card */}
          <div className="lg:col-span-7 p-7 rounded-xl bg-[#111827] border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-mono text-slate-400">TOTAL SCORE</div>
                <div className="text-4xl sm:text-5xl font-mono font-semibold text-white mt-2 tabular-nums">
                  {report.totalMarks}
                  <span className="text-xl text-slate-500 font-normal">
                    {' '}
                    / {report.maxMarks}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  Normalized: {report.percentile.normalizedScore300} / 300
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-slate-400">OVERALL ACCURACY</div>
                <div className="text-4xl sm:text-5xl font-mono font-semibold text-emerald-400 mt-2 tabular-nums">
                  {report.accuracy}%
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  {report.correct} / {report.attempted} attempted correct
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <span>ESTIMATED PERCENTILE</span>
                </div>
                <div className="text-4xl sm:text-5xl font-mono font-semibold text-blue-400 mt-2 tabular-nums">
                  {report.percentile.available && report.percentile.estimatedPercentile !== null
                    ? report.percentile.estimatedPercentile
                    : '—'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {report.percentile.confidenceLabel}
                </div>
              </div>
            </div>

            {/* Attempt Breakdown Strip */}
            <div className="pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono tabular-nums">
              <div>
                <div className="text-slate-400">Attempted</div>
                <div className="text-base font-semibold text-white mt-0.5">
                  {report.attempted} / {report.totalQuestions}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Correct</div>
                <div className="text-base font-semibold text-emerald-400 mt-0.5">
                  {report.correct}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Incorrect</div>
                <div className="text-base font-semibold text-red-400 mt-0.5">
                  {report.incorrect}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Unattempted</div>
                <div className="text-base font-semibold text-slate-300 mt-0.5">
                  {report.unattempted}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Avg Time / Q</div>
                <div className="text-base font-semibold text-slate-200 mt-0.5">
                  {formatSecondsReadable(report.avgTimePerAttemptedSeconds)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{report.percentile.disclaimer}</span>
            </div>
          </div>

          {/* Data-Driven Summary Insights Card (Section 100) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#111827] border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-xs font-mono text-blue-400">
                PERFORMANCE DIAGNOSTIC SUMMARY
              </div>
              <h2 className="text-lg font-semibold text-white">Key Findings from Your Attempt</h2>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                {report.summaryInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono mt-0.5">0{idx + 1}.</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {report.weakChapters.length > 0 && (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-300">
                  {report.weakChapters.length} weak chapter
                  {report.weakChapters.length === 1 ? '' : 's'} identified
                </div>
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
                  className="px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Practice Weak Chapters →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SUBJECT-WISE RESULTS (Section 32, 122) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Subject-Wise Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {report.subjectResults.map((subRes) => (
              <div
                key={subRes.subject}
                className="p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {subRes.subject.toUpperCase()}
                  </h3>
                  <span className="text-lg font-mono font-semibold text-blue-400 tabular-nums">
                    {subRes.marks} / {subRes.maxMarks}
                  </span>
                </div>

                {/* Accuracy Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Accuracy</span>
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                      {subRes.accuracy}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, subRes.accuracy))}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-slate-400">Attempted</div>
                    <div className="text-slate-100 font-semibold mt-0.5">
                      {subRes.attempted}/{subRes.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Correct</div>
                    <div className="text-emerald-400 font-semibold mt-0.5">{subRes.correct}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Incorrect</div>
                    <div className="text-red-400 font-semibold mt-0.5">{subRes.incorrect}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <span>MCQ Marks: {subRes.mcqMarks}</span>
                  <span>Integer Marks: {subRes.integerMarks}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER-WISE PERFORMANCE & WEAK AREAS (Section 33, 62, 138) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Chapter-Wise Performance & Weakness Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Weakness Score = 0.50×IncorrectRate + 0.25×UnattemptedRate + 0.15×RepeatedMistakeRate + 0.10×DifficultyPenalty (Minimum sample ≥ 2 questions)
              </p>
            </div>
          </div>

          {/* Weak Chapters Highlight Row if any */}
          {report.weakChapters.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-950/25 border border-amber-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono text-amber-300 font-semibold">
                  IDENTIFIED WEAK CHAPTERS REQUIRING REVISION
                </div>
                <span className="text-xs text-slate-400">
                  Click any chapter to retest mistakes or generate a focused practice test
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {report.weakChapters.slice(0, 6).map((wc) => (
                  <div
                    key={`${wc.subject}-${wc.chapter}`}
                    className="p-3.5 rounded-lg bg-[#111827] border border-amber-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-amber-400">{wc.subject}</div>
                      <div className="text-sm font-semibold text-white truncate" title={wc.chapter}>
                        {wc.chapter}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
                        Acc: {wc.accuracy}% · Wrong: {wc.incorrect}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRetestMistakes(wc.subject, wc.chapter)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      Retest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Table */}
          <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Chapter</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-right">Attempted</th>
                  <th className="py-3 px-4 text-right">Correct</th>
                  <th className="py-3 px-4 text-right">Incorrect</th>
                  <th className="py-3 px-4 text-right">Marks</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Weakness Score</th>
                  <th className="py-3 px-4">Diagnostic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {report.chapterResults.map((chap) => (
                  <tr
                    key={`${chap.subject}::${chap.chapter}`}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-100">{chap.chapter}</td>
                    <td className="py-3 px-4 text-slate-400">{chap.subject}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {chap.attempted}/{chap.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                      {chap.correct}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-red-400">
                      {chap.incorrect}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-white">
                      {chap.marks}/{chap.maxMarks}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-200">
                      {chap.accuracy}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                      {(chap.weaknessScore * 100).toFixed(0)} / 100
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {chap.status === 'Weak' && (
                        <span className="text-red-400 font-semibold">▲ Weak Area</span>
                      )}
                      {chap.status === 'Strong' && (
                        <span className="text-emerald-400 font-semibold">● Strong</span>
                      )}
                      {chap.status === 'Moderate' && (
                        <span className="text-blue-400">◆ Moderate</span>
                      )}
                      {chap.status === 'Limited Data' && (
                        <span className="text-slate-500">○ Limited Data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* WRONG QUESTION REVIEW GROUPED BY SUBJECT (Section 34) */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Questions to Review (Incorrect Answers)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Grouped by subject. Click any red-accented question card to open the complete worked solution and mistake analysis.
            </p>
          </div>

          {report.incorrect === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-sm text-emerald-200">
              Zero incorrect answers in this test. Every question you attempted was answered correctly.
            </div>
          ) : (
            <div className="space-y-6">
              {report.subjects.map((sub) => {
                const wrongList = incorrectBySubject[sub] || [];
                if (wrongList.length === 0) return null;

                return (
                  <div key={sub} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-mono font-semibold text-red-300">
                        {sub.toUpperCase()} · {wrongList.length} INCORRECT QUESTION
                        {wrongList.length === 1 ? '' : 'S'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wrongList.map((wq) => (
                        <button
                          key={wq.questionId}
                          type="button"
                          onClick={() => setActiveSolutionQuestion(wq)}
                          className="p-4 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 hover:border-red-400 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-semibold text-red-300">
                                Question {wq.order} · {wq.chapter}
                              </span>
                              <span className="text-red-400 tabular-nums">{wq.marksAwarded} mark</span>
                            </div>

                            <div className="text-xs text-slate-200 line-clamp-2">
                              <MathText text={wq.question} />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-red-500/20 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                              <span className="text-red-300">
                                Your Answer: <strong>{wq.studentAnswer}</strong>
                              </span>
                              <span className="text-emerald-300">
                                Correct: <strong>{wq.correctAnswer}</strong>
                              </span>
                            </div>

                            {wq.historySnapshot.incorrectCount >= 2 && (
                              <div className="text-[11px] font-mono text-amber-300">
                                ⚠ Repeated mistake ({wq.historySnapshot.incorrectCount}× wrong)
                              </div>
                            )}

                            <div className="text-[11px] text-red-200 underline pt-1">
                              View Full Solution & Derivation →
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETE QUESTION-BY-QUESTION ACCURACY LOG & FILTERS (Sections 31, 95, 96, 99) */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Complete Question-Level Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Filter by response state or subject and inspect full worked solutions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(['ALL', ...report.subjects] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      subjectFilter === sub
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sub === 'ALL' ? 'All Subjects' : sub}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'incorrect', label: 'Incorrect' },
                    { id: 'correct', label: 'Correct' },
                    { id: 'unattempted', label: 'Unattempted' },
                    { id: 'marked', label: 'Marked for Review' },
                  ] as Array<{ id: QuestionFilterStatus; label: string }>
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
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

          <div className="space-y-2.5">
            {filteredQuestions.map((q) => {
              const isWrong = q.result === 'incorrect';
              const isRight = q.result === 'correct';

              return (
                <div
                  key={q.questionId}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isWrong
                      ? 'bg-red-950/20 border-red-500/40'
                      : isRight
                        ? 'bg-[#111827] border-slate-800'
                        : 'bg-slate-900/40 border-slate-800/70'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-white tabular-nums">
                        Q{q.order}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-400 font-medium">{q.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{q.chapter}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono uppercase text-slate-400">{q.type}</span>
                      <span aria-hidden="true">·</span>
                      {isRight && (
                        <span className="text-emerald-400 font-semibold">
                          ✓ Correct (+{q.marksAwarded})
                        </span>
                      )}
                      {isWrong && (
                        <span className="text-red-400 font-semibold">
                          ✗ Incorrect ({q.marksAwarded})
                        </span>
                      )}
                      {q.result === 'unattempted' && (
                        <span className="text-slate-400">○ Unattempted (0)</span>
                      )}
                      {q.historySnapshot.previouslyIncorrectNowCorrected && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-300 font-mono font-semibold">
                            ★ Previously incorrect → now correct
                          </span>
                        </>
                      )}
                      {isWrong && q.historySnapshot.incorrectCount >= 2 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300 font-mono">
                            ⚠ Repeated mistake ({q.historySnapshot.incorrectCount}×)
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-sm text-slate-200 line-clamp-2">
                      <MathText text={q.question} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs font-mono tabular-nums">
                    <div>
                      <div className="text-slate-400">Your Answer</div>
                      <div
                        className={`font-semibold ${
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
                      <div className="text-slate-400">Correct Key</div>
                      <div className="font-semibold text-emerald-400">{q.correctAnswer}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSolutionQuestion(q)}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-sans font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      View Full Solution
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* DETAILED SOLUTION & MISTAKE ANALYSIS MODAL (Sections 35, 36, 97, 98, 120) */}
      {activeSolutionQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[90vh] rounded-xl bg-[#111827] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-white">
                  Question {activeSolutionQuestion.order}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-400 font-semibold">
                  {activeSolutionQuestion.subject}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-200">{activeSolutionQuestion.chapter}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 capitalize">
                  Difficulty: {activeSolutionQuestion.difficulty}
                </span>
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
              {/* Repeated Mistake or Mastery Alert */}
              {activeSolutionQuestion.result === 'incorrect' &&
                activeSolutionQuestion.historySnapshot.incorrectCount >= 2 && (
                  <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-200 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Repeated Mistake:</strong> You have answered this question incorrectly{' '}
                      {activeSolutionQuestion.historySnapshot.incorrectCount} times across your test history.
                    </span>
                  </div>
                )}

              {activeSolutionQuestion.historySnapshot.previouslyIncorrectNowCorrected && (
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Mistake Mastered:</strong> Previously incorrect → now answered correctly! This question has been removed from your wrong-question retest pool.
                  </span>
                </div>
              )}

              {/* Question Text & Diagram */}
              <div className="space-y-3">
                <div className="text-base text-white leading-relaxed">
                  <MathText text={activeSolutionQuestion.question} />
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
                        className={`p-3 rounded-lg border text-xs flex items-center gap-3 ${
                          isCorrectOpt
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
                            : isStudentOpt && !isCorrectOpt
                              ? 'bg-red-950/40 border-red-500/60 text-red-100'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono font-semibold">{letter}.</span>
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
                  <div className="text-slate-400">Your Answer</div>
                  <div
                    className={`text-base font-semibold mt-0.5 ${
                      activeSolutionQuestion.result === 'correct'
                        ? 'text-emerald-400'
                        : activeSolutionQuestion.result === 'incorrect'
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {activeSolutionQuestion.studentAnswer ?? 'Unattempted'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Correct Answer</div>
                  <div className="text-base font-semibold text-emerald-400 mt-0.5">
                    {activeSolutionQuestion.correctAnswer}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Time Spent</div>
                  <div className="text-base font-semibold text-slate-200 mt-0.5">
                    {formatSecondsReadable(activeSolutionQuestion.timeSpentSeconds)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Historical Record</div>
                  <div className="text-slate-200 mt-0.5">
                    {activeSolutionQuestion.historySnapshot.attemptCount} tries (
                    {activeSolutionQuestion.historySnapshot.correctCount}✓ /{' '}
                    {activeSolutionQuestion.historySnapshot.incorrectCount}✗)
                  </div>
                </div>
              </div>

              {/* Worked Step-by-Step Solution (Official Question-Bank Solution) */}
              <div className="p-5 rounded-xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                  <span>OFFICIAL QUESTION-BANK WORKED SOLUTION</span>
                  <span>TOPIC: {activeSolutionQuestion.topic.toUpperCase()}</span>
                </div>
                <div className="text-sm text-slate-200 leading-relaxed">
                  <MathText text={activeSolutionQuestion.solution} block />
                </div>
              </div>

              {/* Concept Explanation & Possible Error Type (Section 35 & 36) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSolutionQuestion.explanation && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-mono text-emerald-400">
                      CONCEPTUAL TAKEAWAY
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <MathText text={activeSolutionQuestion.explanation} />
                    </p>
                  </div>
                )}

                {activeSolutionQuestion.result === 'incorrect' &&
                  activeSolutionQuestion.possibleErrorType && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                      <div className="text-xs font-mono text-amber-400">
                        POSSIBLE ERROR TYPE (INFERRED)
                      </div>
                      <div className="text-sm font-semibold text-amber-200">
                        {activeSolutionQuestion.possibleErrorType}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Verify sign conventions, SI unit conversions, and boundary conditions in{' '}
                        {activeSolutionQuestion.chapter}.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
