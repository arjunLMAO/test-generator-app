import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Clock, FileText, Search } from 'lucide-react';
import { SubjectName, TestMode, TestResultReport } from '../types/jee';

interface TestHistoryViewProps {
  reports: TestResultReport[];
  onOpenReport: (testId: string) => void;
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
      <div className="min-h-screen bg-[#090D16] text-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto p-10 rounded-xl bg-[#111827] border border-slate-800 text-center space-y-5">
          <div className="text-xs font-mono text-slate-400">TEST ARCHIVE</div>
          <h1 className="text-3xl font-display text-white">No Completed Tests Yet</h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Every submitted examination is permanently archived here with its immutable question responses, subject scores, and worked solutions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartNewTest}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              Start Your First Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="text-xs font-mono text-blue-400">IMMUTABLE EXAMINATION ARCHIVE</div>
            <h1 className="text-3xl sm:text-4xl font-display text-white mt-1">
              Test History ({reports.length})
            </h1>
            <p className="text-sm text-slate-400">
              Click any previous test session to inspect its full performance report and question-by-question solutions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by chapter or title..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#111827] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
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
        <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900/60">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Test Type & Title</th>
                <th className="py-3.5 px-4">Subjects & Chapters</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-right">Accuracy</th>
                <th className="py-3.5 px-4 text-right">Time Spent</th>
                <th className="py-3.5 px-4 text-right">Est. Percentile</th>
                <th className="py-3.5 px-4 text-right">Report</th>
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

                return (
                  <tr
                    key={rep.testId}
                    onClick={() => onOpenReport(rep.testId)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-mono text-slate-300 whitespace-nowrap tabular-nums">
                      {dateFormatted}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{rep.title}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {rep.mode.replace(/_/g, ' ')} · {rep.totalQuestions} Qs
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-blue-400 font-medium">{rep.subjects.join(' · ')}</div>
                      <div className="text-slate-400 mt-0.5 truncate max-w-xs" title={chapDisplay}>
                        {chapDisplay}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-white">
                      {rep.totalMarks} / {rep.maxMarks}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-emerald-400">
                      {rep.accuracy}%
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-slate-300">
                      {formatDurationMinutes(rep.totalTimeSpentSeconds)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-blue-400 font-semibold">
                      {rep.percentile.estimatedPercentile ?? '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap">
                        <span>Open Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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
