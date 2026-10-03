import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, Search, Sparkles } from 'lucide-react';
import { SubjectName, TestMode, TestResultReport } from '../types/jee';

interface TestHistoryViewProps {
  reports: TestResultReport[];
  onOpenReport: (testId: string) => void;
  onRetestAttemptMistakes: (testId: string) => void;
  onStartNewTest: () => void;
}

function formatDurationMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TestHistoryView: React.FC<TestHistoryViewProps> = ({
  reports,
  onOpenReport,
  onRetestAttemptMistakes,
  onStartNewTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | SubjectName>('ALL');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (subjectFilter !== 'ALL' && !r.subjects.includes(subjectFilter)) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const chaps = Object.values(r.chaptersBySubject)
          .flat()
          .join(' ')
          .toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !chaps.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reports, subjectFilter, searchQuery]);

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto p-10 rounded-2xl surface-card border border-slate-800 text-center space-y-5 animate-card-reveal">
          <div className="text-xs font-semibold text-blue-400">Your Test Archive</div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white">
            No completed tests yet.
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Every test you finish is saved here with your question-by-question responses, subject breakdown, and one-click mistake retests.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartNewTest}
              className="btn-interactive px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950/50 cursor-pointer"
            >
              Start Your First Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Past Attempts & Mistake Remediation</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-semibold text-white">
              Your Test History ({reports.length})
            </h1>
            <p className="text-sm text-slate-400">
              Open any past attempt to review worked solutions, or launch a targeted retest of the exact questions you missed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by chapter or title..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#111827] border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    subjectFilter === sub
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub === 'ALL' ? 'All' : sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="rounded-2xl surface-card border border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-900/60">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Test Session</th>
                <th className="py-3.5 px-5">Coverage</th>
                <th className="py-3.5 px-5 text-right">Score</th>
                <th className="py-3.5 px-5 text-right">Accuracy</th>
                <th className="py-3.5 px-5 text-right">Mistakes</th>
                <th className="py-3.5 px-5 text-right">Time</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredReports.map((rep) => {
                const dateFormatted = new Date(rep.submittedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const allChaps = Object.values(rep.chaptersBySubject).flat().filter(Boolean);
                const chapDisplay =
                  rep.mode === TestMode.FULL_SYLLABUS
                    ? 'Full Syllabus (55 Chapters)'
                    : allChaps.length <= 3
                      ? allChaps.join(' + ')
                      : `${allChaps.slice(0, 2).join(' + ')} + ${allChaps.length - 2} more`;

                const modeLabel =
                  rep.mode === TestMode.WRONG_QUESTION_RETEST
                    ? 'Mistake Retest'
                    : rep.mode === TestMode.FULL_SYLLABUS
                      ? 'Full Syllabus'
                      : 'Chapter Test';

                return (
                  <tr
                    key={rep.testId}
                    onClick={() => onOpenReport(rep.testId)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono text-slate-300 whitespace-nowrap tabular-nums">
                      {dateFormatted}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white text-sm">{rep.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span
                          className={
                            rep.mode === TestMode.WRONG_QUESTION_RETEST
                              ? 'text-red-400 font-semibold'
                              : 'text-blue-400 font-medium'
                          }
                        >
                          {modeLabel}
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{rep.totalQuestions} Qs</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-200 font-semibold">{rep.subjects.join(' · ')}</div>
                      <div className="text-slate-400 mt-0.5 truncate max-w-xs" title={chapDisplay}>
                        {chapDisplay}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right font-mono tabular-nums font-semibold text-white text-sm">
                      {rep.totalMarks} <span className="text-slate-500 text-xs">/ {rep.maxMarks}</span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono tabular-nums font-semibold text-emerald-400">
                      {rep.accuracy}%
                    </td>
                    <td className="py-4 px-5 text-right font-mono tabular-nums">
                      {rep.incorrect > 0 ? (
                        <span className="text-red-400 font-semibold">{rep.incorrect} wrong</span>
                      ) : (
                        <span className="text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>0 wrong</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right font-mono tabular-nums text-slate-300">
                      {formatDurationMinutes(rep.totalTimeSpentSeconds)}
                    </td>
                    <td
                      className="py-4 px-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {rep.incorrect > 0 && (
                          <button
                            type="button"
                            onClick={() => onRetestAttemptMistakes(rep.testId)}
                            className="btn-interactive px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retest ({rep.incorrect})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenReport(rep.testId)}
                          className="btn-interactive px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <span>Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
