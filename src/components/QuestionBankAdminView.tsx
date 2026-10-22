import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
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
import { QuestionVisuals } from './VisualDiagramRenderer';
import { sanitizeStudentQuestionText } from '../services/StudentQuestionSerializer';

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
  const [importMode, setImportMode] = useState<'upload' | 'git'>('upload');
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
        text: 'Successfully synchronized question bank files from Git.',
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
        text: 'Restored default question bank.',
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
    <div className="min-h-screen bg-white dark:bg-[#0F0F11] text-neutral-900 dark:text-neutral-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
              Question Bank
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Diagnostics, schema validation, and question import controls.
            </p>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={handleReset}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
            <span>Reset to Default Bank</span>
          </button>
        </div>

        {/* Telemetry Strip */}
        <section aria-label="Question Bank Summary" className="space-y-3">
          <h2 className="text-base font-semibold text-neutral-950 dark:text-white">
            Inventory Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Questions</div>
              <div className="text-xl font-mono font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {diagnostics.validQuestionsCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {diagnostics.filesScanned} JSON files
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Physics</div>
              <div className="text-xl font-mono font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {diagnostics.bySubject.Physics.total}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Physics.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Chemistry</div>
              <div className="text-xl font-mono font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {diagnostics.bySubject.Chemistry.total}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Chemistry.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Mathematics</div>
              <div className="text-xl font-mono font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {diagnostics.bySubject.Mathematics.total}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                {diagnostics.bySubject.Mathematics.chaptersCount} Chapters
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Format Split</div>
              <div className="text-base font-mono font-semibold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {totalMcqs} MCQ
              </div>
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1 tabular-nums">
                {totalIntegers} Numerical
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Chapters</div>
              <div className="text-xl font-mono font-bold text-neutral-950 dark:text-white mt-1 tabular-nums">
                {totalChapters}
              </div>
              <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mt-1 tabular-nums">
                Covered
              </div>
            </div>
          </div>
        </section>

        {/* Import Workflow */}
        <section aria-label="Import Question Bank" className="p-5 rounded-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-950 dark:text-white">Import Questions</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Upload JSON chapter files or synchronize from a Git repository.
              </p>
            </div>

            <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs">
              <button
                type="button"
                onClick={() => setImportMode('upload')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  importMode === 'upload'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Upload JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('git')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  importMode === 'git'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <GitBranch className="w-3 h-3" />
                <span>Connect Git</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                  : 'bg-neutral-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {importMode === 'upload' ? (
            <div className="space-y-3">
              <div className="p-6 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-2 bg-neutral-50 dark:bg-neutral-900/40">
                <FolderUp className="w-6 h-6 text-neutral-600 dark:text-neutral-400 mx-auto" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Select JSON question-bank files or a directory
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    Supports question arrays or chapter maps. Formula strings and diagrams are automatically validated.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>{isBusy ? 'Importing...' : 'Choose JSON Files'}</span>
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <FolderUp className="w-3.5 h-3.5" />
                    <span>Upload Folder</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
                <span>
                  Replace existing question bank (uncheck to merge into current questions)
                </span>
              </label>
            </div>
          ) : (
            <form onSubmit={handleGitSync} className="space-y-3 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    required
                    value={gitRepoUrl}
                    onChange={(e) => setGitRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/jee-question-bank"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Subfolder Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={gitSubPath}
                    onChange={(e) => setGitSubPath(e.target.value)}
                    placeholder="e.g. question-bank/"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Access Token (Private repos only)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
                <span>
                  Replace existing questions with repository content
                </span>
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="px-4 py-2 rounded bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium transition-colors cursor-pointer"
              >
                {isBusy ? 'Syncing...' : 'Sync Repository'}
              </button>
            </form>
          )}
        </section>

        {/* Question Inspector */}
        <section aria-label="Question Inspector" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-950 dark:text-white">
                Question Preview
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Inspect questions and mathematical formulas
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
                />
              </div>

              <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs">
                {(['ALL', 'Physics', 'Chemistry', 'Mathematics'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setExplorerSubject(sub)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      explorerSubject === sub
                        ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white font-semibold shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
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
                className="p-4 rounded-lg bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-900 dark:text-white font-semibold">{q.id}</span>
                    <span>·</span>
                    <span className="text-neutral-800 dark:text-neutral-200">{q.subject}</span>
                    <span>·</span>
                    <span className="text-neutral-600 dark:text-neutral-400">{q.chapter}</span>
                    <span>·</span>
                    <span className="uppercase">{q.type}</span>
                    <span>·</span>
                    <span className="capitalize">{q.difficulty}</span>
                  </div>
                  <span className="text-neutral-900 dark:text-white font-medium">Answer: {q.correctAnswer}</span>
                </div>

                <div className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  <MathText text={sanitizeStudentQuestionText(q.question)} />
                </div>

                <QuestionVisuals
                  visuals={q.images}
                  visualAsset={q.visualAsset}
                  imageUrl={q.image}
                  subject={q.subject}
                  chapter={q.chapter}
                  visualRequired={q.visualRequired}
                  visualStatus={q.visualStatus}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
