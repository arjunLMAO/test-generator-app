import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileJson,
  FolderUp,
  GitBranch,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import {
  NormalizedQuestion,
  QuestionBankDiagnostics,
  SubjectName,
} from '../types/jee';
import { MathText } from './MathText';

interface QuestionBankAdminViewProps {
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
  onImportJsonFiles: (
    files: Array<{ filePath: string; content: unknown }>,
    replaceExisting: boolean
  ) => Promise<void>;
  onImportGitRepo: (
    repoUrl: string,
    branch: string,
    subPath: string,
    replaceExisting: boolean,
    githubToken?: string
  ) => Promise<void>;
  onResetDefaultBank: () => Promise<void>;
}

export const QuestionBankAdminView: React.FC<QuestionBankAdminViewProps> = ({
  questions,
  diagnostics,
  onImportJsonFiles,
  onImportGitRepo,
  onResetDefaultBank,
}) => {
  const [importMode, setImportMode] = useState<'upload' | 'git'>('git');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('');
  const [gitSubPath, setGitSubPath] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [explorerSubject, setExplorerSubject] = useState<'ALL' | SubjectName>('ALL');
  const [explorerSearch, setExplorerSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const totalChapters =
    diagnostics.bySubject.Physics.chaptersCount +
    diagnostics.bySubject.Chemistry.chaptersCount +
    diagnostics.bySubject.Mathematics.chaptersCount;

  const totalMcqs =
    diagnostics.bySubject.Physics.mcq +
    diagnostics.bySubject.Chemistry.mcq +
    diagnostics.bySubject.Mathematics.mcq;

  const totalIntegers =
    diagnostics.bySubject.Physics.integer +
    diagnostics.bySubject.Chemistry.integer +
    diagnostics.bySubject.Mathematics.integer;

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsBusy(true);
    setStatusMessage(null);

    try {
      const parsedPayloads: Array<{ filePath: string; content: unknown }> = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.name.toLowerCase().endsWith('.json')) continue;
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          const relPath = (file as any).webkitRelativePath || file.name;
          parsedPayloads.push({ filePath: relPath, content: json });
        } catch {
          parsedPayloads.push({
            filePath: file.name,
            content: [{ id: `MALFORMED_${file.name}`, question: '' }],
          });
        }
      }

      if (parsedPayloads.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No .json files were found in the selected upload.',
        });
        setIsBusy(false);
        return;
      }

      await onImportJsonFiles(parsedPayloads, replaceExisting);
      setStatusMessage({
        type: 'success',
        text: `Processed ${parsedPayloads.length} JSON file(s). Question bank re-indexed and validated.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to import JSON files.',
      });
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGitSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitRepoUrl.trim()) return;
    setIsBusy(true);
    setStatusMessage(null);
    try {
      await onImportGitRepo(
        gitRepoUrl.trim(),
        gitBranch.trim(),
        gitSubPath.trim(),
        replaceExisting,
        githubToken.trim() || undefined
      );
      setStatusMessage({
        type: 'success',
        text: 'Successfully synchronized all chapter JSON files from your GitHub repository.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Git repository import failed.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleReset = async () => {
    setIsBusy(true);
    setStatusMessage(null);
    try {
      await onResetDefaultBank();
      setStatusMessage({
        type: 'success',
        text: 'Restored default 55-chapter JEE Main & Advanced question bank.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Reset failed.',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (explorerSubject !== 'ALL' && q.subject !== explorerSubject) return false;
        if (explorerSearch.trim() !== '') {
          const term = explorerSearch.toLowerCase();
          return (
            q.id.toLowerCase().includes(term) ||
            q.chapter.toLowerCase().includes(term) ||
            q.topic.toLowerCase().includes(term) ||
            q.question.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .slice(0, 25);
  }, [questions, explorerSubject, explorerSearch]);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 py-8 px-6">
      <div className="max-w-[1240px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="text-xs font-mono text-blue-400">
              QUESTION BANK DIAGNOSTICS · INGESTION & GIT SYNC
            </div>
            <h1 className="text-3xl sm:text-4xl font-display text-white mt-1">
              Question Bank Administration & Validator
            </h1>
            <p className="text-sm text-slate-400">
              Inspect schema normalization diagnostics, upload custom JSON chapter files, or connect a Git repository.
            </p>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={handleReset}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
            <span>Reset Default 55-Chapter Bank</span>
          </button>
        </div>

        {/* DIAGNOSTIC TELEMETRY GRID (Section 70) */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Live Question Bank Health & Inventory
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Total Valid Questions</div>
              <div className="text-2xl font-mono font-semibold text-white mt-1 tabular-nums">
                {diagnostics.validQuestionsCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                {diagnostics.filesScanned} JSON files scanned
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Physics</div>
              <div className="text-2xl font-mono font-semibold text-blue-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Physics.total}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Physics.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Chemistry</div>
              <div className="text-2xl font-mono font-semibold text-emerald-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Chemistry.total}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Chemistry.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Mathematics</div>
              <div className="text-2xl font-mono font-semibold text-amber-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Mathematics.total}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Mathematics.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Question Types</div>
              <div className="text-lg font-mono font-semibold text-white mt-1 tabular-nums">
                {totalMcqs} MCQ
              </div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1 tabular-nums">
                {totalIntegers} Integer Type
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
              <div className="text-xs text-slate-400">Validation Status</div>
              <div className="text-lg font-mono font-semibold text-emerald-400 mt-1 tabular-nums">
                { totalChapters } Chapters
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                Invalid: {diagnostics.invalidQuestionsCount} · Dup: {diagnostics.duplicateIds.length}
              </div>
            </div>
          </div>

          {/* Detailed Validation Counters Row */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Invalid Questions Rejected:</span>
              <span
                className={
                  diagnostics.invalidQuestionsCount > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'
                }
              >
                {diagnostics.invalidQuestionsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Duplicate IDs Detected:</span>
              <span
                className={
                  diagnostics.duplicateIds.length > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'
                }
              >
                {diagnostics.duplicateIds.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Broken Image References:</span>
              <span
                className={
                  diagnostics.brokenImagesCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'
                }
              >
                {diagnostics.brokenImagesCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Missing Solutions:</span>
              <span
                className={
                  diagnostics.missingSolutionsCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'
                }
              >
                {diagnostics.missingSolutionsCount}
              </span>
            </div>
          </div>
        </section>

        {/* IMPORT QUESTION BANK WORKFLOW (Section 71) */}
        <section className="p-6 rounded-xl bg-[#111827] border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Import Question Bank</h2>
              <p className="text-xs text-slate-400">
                Upload your JSON question-bank files/folder or connect a GitHub repository. Automatically normalizes diverse JSON schemas.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setImportMode('upload')}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  importMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JSON Files</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('git')}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  importMode === 'git'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Connect Git Repository</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {importMode === 'upload' ? (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-900/40 text-center space-y-3">
                <FolderUp className="w-8 h-8 text-blue-400 mx-auto" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">
                    Select one or more JSON question files (up to 55+ chapter files)
                  </div>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Supports arrays of questions, chapter wrapper objects, or nested subject maps. Automatically resolves MCQ options, integer answers, and LaTeX formulas.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    multiple
                    onChange={handleFileSelection}
                    className="hidden"
                    id="qb-json-upload"
                  />
                  <label
                    htmlFor="qb-json-upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>{isBusy ? 'Importing & Validating...' : 'Choose JSON Files'}</span>
                  </label>

                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    multiple
                    onChange={handleFileSelection}
                    className="hidden"
                    id="qb-folder-upload"
                  />
                  <label
                    htmlFor="qb-folder-upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>Upload Question-Bank Folder</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-slate-600"
                />
                <span>
                  Replace existing question bank completely (uncheck to merge uploaded chapters into current bank)
                </span>
              </label>
            </div>
          ) : (
            <form onSubmit={handleGitSync} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    required
                    value={gitRepoUrl}
                    onChange={(e) => setGitRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/jee-question-bank"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Branch (Auto-detected if blank)
                  </label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main / master"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Subfolder Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={gitSubPath}
                    onChange={(e) => setGitSubPath(e.target.value)}
                    placeholder="e.g. question-bank/"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    GitHub Personal Access Token (Only if private repo)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... (leave blank for public repos)"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-slate-600"
                />
                <span>
                  Replace existing question bank with this Git repository (makes your Git repo chapters the sole source of truth)
                </span>
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isBusy ? 'Syncing Repository...' : 'Sync Question Bank from Git'}
              </button>
            </form>
          )}
        </section>

        {/* VALIDATION ISSUES LOG (If any invalid records or warnings exist) */}
        {diagnostics.issues.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Validation & Normalization Report ({diagnostics.issues.length})
            </h2>
            <div className="rounded-xl bg-[#111827] border border-slate-800 max-h-60 overflow-y-auto divide-y divide-slate-800 text-xs font-mono">
              {diagnostics.issues.map((iss, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-4">
                  <span
                    className={
                      iss.severity === 'error' ? 'text-red-400 font-semibold' : 'text-amber-400'
                    }
                  >
                    [{iss.severity.toUpperCase()}: {iss.reason}]
                  </span>
                  <span className="text-slate-300 flex-1">{iss.message}</span>
                  <span className="text-slate-500">{iss.sourceFile}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LIVE QUESTION BANK EXPLORER */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Normalized Question Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Verify how imported questions, options, and LaTeX derivations render in the engine
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  placeholder="Search ID, chapter, or text..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#111827] border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setExplorerSubject(sub)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      explorerSubject === sub
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

          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{q.id}</span>
                    <span>·</span>
                    <span className="text-blue-400">{q.subject}</span>
                    <span>·</span>
                    <span className="text-slate-200">{q.chapter}</span>
                    <span>·</span>
                    <span className="uppercase">{q.type}</span>
                    <span>·</span>
                    <span className="capitalize">{q.difficulty}</span>
                  </div>
                  <span className="text-emerald-400">Answer Key: {q.correctAnswer}</span>
                </div>

                <div className="text-sm text-slate-200">
                  <MathText text={q.question} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
