/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { ChapterSelectorView } from './components/ChapterSelectorView';
import { ExamWorkspaceView } from './components/ExamWorkspaceView';
import { LandingDashboardView } from './components/LandingDashboardView';
import { ActiveNavTab, Navbar } from './components/Navbar';
import { QuestionBankAdminView } from './components/QuestionBankAdminView';
import { TestHistoryView } from './components/TestHistoryView';
import { TestOverviewModal } from './components/TestOverviewModal';
import { TestResultsView } from './components/TestResultsView';
import { LongTermAnalyticsService } from './services/LongTermAnalyticsService';
import { QuestionBankEngine } from './services/QuestionBankEngine';
import { ScoringAndAnalyticsService } from './services/ScoringAndAnalyticsService';
import { TestGeneratorService } from './services/TestGeneratorService';
import {
  GeneratedTest,
  NormalizedQuestion,
  QuestionBankDiagnostics,
  QuestionHistoryRecord,
  QuestionPaletteStatus,
  QuestionResponseState,
  SubjectName,
  TestMode,
  TestResultReport,
  TestStatus,
} from './types/jee';

const USER_ID = 'student-arjun';
const LS_ACTIVE_TEST_KEY = 'vectra_jee_active_test_v1';
const LS_REPORTS_KEY = 'vectra_jee_reports_v1';
const LS_HISTORY_KEY = 'vectra_jee_history_v1';

type ViewScreen =
  | 'dashboard'
  | 'chapters'
  | 'exam'
  | 'results'
  | 'analytics'
  | 'history'
  | 'question-bank';

interface OverviewPendingConfig {
  mode: TestMode;
  selectedSubjects: SubjectName[];
  chaptersBySubject: Partial<Record<SubjectName, string[]>>;
  allowFlexibleCount: boolean;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [diagnostics, setDiagnostics] = useState<QuestionBankDiagnostics | null>(null);

  const [activeTest, setActiveTest] = useState<GeneratedTest | null>(null);
  const [reports, setReports] = useState<TestResultReport[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, QuestionHistoryRecord>>({});

  const [currentView, setCurrentView] = useState<ViewScreen>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const [chapterPreset, setChapterPreset] = useState<{
    subject?: SubjectName;
    chapter?: string;
  }>({});

  const [overviewConfig, setOverviewConfig] = useState<OverviewPendingConfig | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Build client-side QuestionBankEngine mirror for instant lookups & fallback
  const clientEngine = useMemo(() => {
    const eng = new QuestionBankEngine();
    if (questions.length > 0) {
      eng.ingestFiles([{ filePath: 'server-loaded.json', content: questions }]);
    }
    return eng;
  }, [questions]);

  const questionsById = useMemo(() => {
    const map = new Map<string, NormalizedQuestion>();
    for (const q of questions) {
      map.set(q.id, q);
    }
    return map;
  }, [questions]);

  // Initial load of Question Bank and Student Persistent State
  useEffect(() => {
    let mounted = true;

    async function initializePlatform() {
      setIsLoading(true);
      try {
        const [qbRes, userRes] = await Promise.all([
          fetch('/api/question-bank'),
          fetch(`/api/student/${USER_ID}/state`),
        ]);

        if (!qbRes.ok) {
          throw new Error('Unable to load the JEE Question Bank from server.');
        }

        const qbData = await qbRes.json();
        const userData = userRes.ok ? await userRes.json() : null;

        if (!mounted) return;

        setQuestions(qbData.questions || []);
        setDiagnostics(qbData.diagnostics || null);

        // Merge server state with localStorage fallback if local has newer active test responses
        const lsActiveRaw = localStorage.getItem(LS_ACTIVE_TEST_KEY);
        let recoveredActive: GeneratedTest | null = userData?.activeTest || null;

        if (lsActiveRaw) {
          try {
            const parsedLs = JSON.parse(lsActiveRaw) as GeneratedTest;
            if (
              recoveredActive &&
              parsedLs.id === recoveredActive.id &&
              parsedLs.status === TestStatus.IN_PROGRESS
            ) {
              recoveredActive = {
                ...recoveredActive,
                responses: parsedLs.responses || recoveredActive.responses,
                currentQuestionOrder:
                  parsedLs.currentQuestionOrder || recoveredActive.currentQuestionOrder,
                activeSubject: parsedLs.activeSubject || recoveredActive.activeSubject,
              };
            } else if (!recoveredActive && parsedLs.status === TestStatus.IN_PROGRESS) {
              recoveredActive = parsedLs;
            }
          } catch {
            // ignore malformed local cache
          }
        }

        setActiveTest(recoveredActive);
        setReports(userData?.reports || []);
        setHistoryMap(userData?.historyMap || {});
        setLoadError(null);
      } catch (err: any) {
        if (!mounted) return;
        setLoadError(err?.message || 'Failed to initialize platform.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializePlatform();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync active test to localStorage and debounce server autosave
  const autosaveTimeoutRef = useRef< ReturnType<typeof setTimeout> | null >(null);

  const persistActiveTestState = useCallback((updatedTest: GeneratedTest | null) => {
    if (!updatedTest) {
      localStorage.removeItem(LS_ACTIVE_TEST_KEY);
      return;
    }
    localStorage.setItem(LS_ACTIVE_TEST_KEY, JSON.stringify(updatedTest));

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/tests/${updatedTest.id}/autosave`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          responses: updatedTest.responses,
          currentQuestionOrder: updatedTest.currentQuestionOrder,
          activeSubject: updatedTest.activeSubject,
        }),
      }).catch(() => {
        // Retain local state silently if network is temporarily offline
      });
    }, 350);
  }, []);

  // Update active test response handler
  const handleUpdateResponse = useCallback(
    (
      questionId: string,
      updater: (prev: QuestionResponseState) => QuestionResponseState
    ) => {
      setActiveTest((prevTest) => {
        if (!prevTest) return null;
        const existing = prevTest.responses[questionId] || {
          questionId,
          answer: null,
          status: QuestionPaletteStatus.VISITED,
          markedForReview: false,
          visited: true,
          timeSpentSeconds: 0,
          lastUpdatedAt: new Date().toISOString(),
        };
        const updatedResp = updater(existing);
        const nextTest: GeneratedTest = {
          ...prevTest,
          responses: {
            ...prevTest.responses,
            [questionId]: updatedResp,
          },
        };
        persistActiveTestState(nextTest);
        return nextTest;
      });
    },
    [persistActiveTestState]
  );

  // Navigate to a specific question order inside the active test
  const handleNavigateQuestion = useCallback(
    (targetOrder: number) => {
      setActiveTest((prevTest) => {
        if (!prevTest) return null;
        const targetAlloc = prevTest.questions.find((q) => q.order === targetOrder);
        if (!targetAlloc) return prevTest;

        const existingResp = prevTest.responses[targetAlloc.questionId];
        const nextStatus =
          existingResp?.status === QuestionPaletteStatus.NOT_VISITED
            ? QuestionPaletteStatus.VISITED
            : existingResp?.status || QuestionPaletteStatus.VISITED;

        const nextTest: GeneratedTest = {
          ...prevTest,
          currentQuestionOrder: targetOrder,
          activeSubject: targetAlloc.subject,
          responses: {
            ...prevTest.responses,
            [targetAlloc.questionId]: {
              ...(existingResp || {
                questionId: targetAlloc.questionId,
                answer: null,
                markedForReview: false,
                timeSpentSeconds: 0,
              }),
              visited: true,
              status: nextStatus,
              lastUpdatedAt: new Date().toISOString(),
            },
          },
        };
        persistActiveTestState(nextTest);
        return nextTest;
      });
    },
    [persistActiveTestState]
  );

  // Submit active test (Idempotent, server-scored)
  const isSubmittingRef = useRef(false);

  const handleSubmitTest = useCallback(
    async (autoSubmitted = false) => {
      if (!activeTest || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const testToSubmit = activeTest;
      try {
        const resp = await fetch(`/api/tests/${testToSubmit.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: USER_ID,
            testSnapshot: testToSubmit,
            autoSubmitted,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const newReport: TestResultReport = data.report;
          const newHistory: Record<string, QuestionHistoryRecord> = data.historyMap;

          setReports((prev) => {
            const exists = prev.some((r) => r.testId === newReport.testId);
            const next = exists ? prev : [newReport, ...prev];
            localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(next));
            return next;
          });
          setHistoryMap(newHistory);
          localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(newHistory));
          setActiveTest(null);
          localStorage.removeItem(LS_ACTIVE_TEST_KEY);

          setSelectedReportId(newReport.testId);
          setCurrentView('results');
        } else {
          // Local authoritative fallback if server unreachable
          const { report, updatedHistoryMap } =
            ScoringAndAnalyticsService.evaluateAndRecordTest(
              testToSubmit,
              clientEngine,
              historyMap,
              autoSubmitted
            );
          setReports((prev) => [report, ...prev]);
          setHistoryMap(updatedHistoryMap);
          setActiveTest(null);
          localStorage.removeItem(LS_ACTIVE_TEST_KEY);
          setSelectedReportId(report.testId);
          setCurrentView('results');
        }
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [activeTest, clientEngine, historyMap]
  );

  // Server-backed countdown timer (Section 16)
  useEffect(() => {
    if (!activeTest || activeTest.status !== TestStatus.IN_PROGRESS) {
      setRemainingSeconds(0);
      return;
    }

    const computeRemaining = () => {
      const startMs = new Date(activeTest.startTime).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      return Math.max(0, activeTest.durationSeconds - elapsedSeconds);
    };

    const initialRem = computeRemaining();
    setRemainingSeconds(initialRem);

    if (initialRem <= 0 && currentView === 'exam') {
      handleSubmitTest(true);
      return;
    }

    const timer = setInterval(() => {
      const rem = computeRemaining();
      setRemainingSeconds(rem);
      if (rem <= 0 && currentView === 'exam') {
        clearInterval(timer);
        handleSubmitTest(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, currentView, handleSubmitTest]);

  // Confirm & Generate Test from Overview Modal
  const handleConfirmStartTest = async () => {
    if (!overviewConfig) return;
    setGenerationError(null);

    try {
      const resp = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          mode: overviewConfig.mode,
          selectedSubjects: overviewConfig.selectedSubjects,
          chaptersBySubject: overviewConfig.chaptersBySubject,
          allowFlexibleCount: overviewConfig.allowFlexibleCount,
        }),
      });

      const outcome = await resp.json();
      if (!resp.ok || !outcome.success || !outcome.test) {
        setGenerationError(outcome.error || 'Failed to generate test.');
        return;
      }

      const generated: GeneratedTest = outcome.test;
      setActiveTest(generated);
      persistActiveTestState(generated);
      setOverviewConfig(null);
      setCurrentView('exam');
    } catch {
      // Fallback to client engine if offline
      const outcome = TestGeneratorService.generateTest(
        clientEngine,
        {
          userId: USER_ID,
          mode: overviewConfig.mode,
          selectedSubjects: overviewConfig.selectedSubjects,
          chaptersBySubject: overviewConfig.chaptersBySubject,
          allowFlexibleCount: overviewConfig.allowFlexibleCount,
        },
        historyMap
      );

      if (!outcome.success || !outcome.test) {
        setGenerationError(outcome.error || 'Failed to generate test.');
        return;
      }
      setActiveTest(outcome.test);
      persistActiveTestState(outcome.test);
      setOverviewConfig(null);
      setCurrentView('exam');
    }
  };

  // Discard unfinished test
  const handleDiscardActiveTest = async () => {
    if (!activeTest) return;
    const id = activeTest.id;
    setActiveTest(null);
    localStorage.removeItem(LS_ACTIVE_TEST_KEY);
    await fetch(`/api/tests/${id}?userId=${USER_ID}`, { method: 'DELETE' }).catch(() => {});
  };

  // Trigger Dedicated Wrong-Question Retest (Sections 9, 42, 43, 65, 102)
  const handleInitiateMistakeRetest = (subject?: SubjectName, chapter?: string) => {
    if (!diagnostics) return;

    // Determine which subjects/chapters have unresolved mistakes
    const mistakeChaptersBySub: Partial<Record<SubjectName, Set<string>>> = {};
    for (const rec of Object.values(historyMap)) {
      if (rec.lastResult === 'incorrect' || rec.masteryState === 'incorrect') {
        if (subject && rec.subject !== subject) continue;
        if (chapter && rec.chapter !== chapter) continue;
        if (!mistakeChaptersBySub[rec.subject]) {
          mistakeChaptersBySub[rec.subject] = new Set();
        }
        mistakeChaptersBySub[rec.subject]!.add(rec.chapter);
      }
    }

    const subjectsWithMistakes = (['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).filter(
      (s) => (mistakeChaptersBySub[s]?.size || 0) > 0
    );

    if (subjectsWithMistakes.length === 0) {
      return;
    }

    const chaptersMap: Partial<Record<SubjectName, string[]>> = {};
    for (const s of subjectsWithMistakes) {
      chaptersMap[s] = Array.from(mistakeChaptersBySub[s]!);
    }

    setGenerationError(null);
    setOverviewConfig({
      mode: TestMode.WRONG_QUESTION_RETEST,
      selectedSubjects: subjectsWithMistakes,
      chaptersBySubject: chaptersMap,
      allowFlexibleCount: true,
    });
  };

  // Compute longitudinal analytics from real reports and question history
  const analyticsSummary = useMemo(() => {
    return LongTermAnalyticsService.computeAnalytics(reports, historyMap);
  }, [reports, historyMap]);

  const activeReport = useMemo(() => {
    if (!selectedReportId) return reports[0] || null;
    return reports.find((r) => r.testId === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  const handleOpenFullSyllabusOverview = () => {
    if (!diagnostics) return;
    const allChaptersBySub: Partial<Record<SubjectName, string[]>> = {
      Physics: diagnostics.chapterInventories
        .filter((c) => c.subject === 'Physics')
        .map((c) => c.chapter),
      Chemistry: diagnostics.chapterInventories
        .filter((c) => c.subject === 'Chemistry')
        .map((c) => c.chapter),
      Mathematics: diagnostics.chapterInventories
        .filter((c) => c.subject === 'Mathematics')
        .map((c) => c.chapter),
    };
    setGenerationError(null);
    setOverviewConfig({
      mode: TestMode.FULL_SYLLABUS,
      selectedSubjects: ['Physics', 'Chemistry', 'Mathematics'],
      chaptersBySubject: allChaptersBySub,
      allowFlexibleCount: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-center p-6 space-y-3">
        <div className="text-xs font-mono text-blue-400 tracking-wider">
          INITIALIZING VECTRA JEE ENGINE
        </div>
        <div className="text-xl font-display text-white">
          Indexing 55-Chapter Question Bank & Student Telemetry...
        </div>
      </div>
    );
  }

  if (loadError || !diagnostics) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-sm font-mono text-red-400">QUESTION BANK UNAVAILABLE</div>
        <p className="text-sm text-slate-300 max-w-md text-center">
          {loadError || 'Unable to load the question bank.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      {/* Show Top Navbar on all screens EXCEPT during an active examination */}
      {currentView !== 'exam' && (
        <Navbar
          activeTab={
            currentView === 'results'
              ? 'history'
              : (currentView as ActiveNavTab)
          }
          onSelectTab={(tab) => setCurrentView(tab)}
          hasActiveTest={Boolean(activeTest)}
          onResumeTest={() => setCurrentView('exam')}
          onStartFullTest={handleOpenFullSyllabusOverview}
        />
      )}

      {/* VIEW ROUTER */}
      {currentView === 'dashboard' && (
        <LandingDashboardView
          diagnostics={diagnostics}
          analytics={analyticsSummary}
          activeTest={activeTest}
          recentReport={reports[0] || null}
          remainingActiveTestSeconds={remainingSeconds}
          onStartFullSyllabusOverview={handleOpenFullSyllabusOverview}
          onOpenChapterSelector={(presetSubject, presetChapter) => {
            setChapterPreset({ subject: presetSubject, chapter: presetChapter });
            setCurrentView('chapters');
          }}
          onResumeActiveTest={() => setCurrentView('exam')}
          onDiscardActiveTest={handleDiscardActiveTest}
          onOpenReport={(testId) => {
            setSelectedReportId(testId);
            setCurrentView('results');
          }}
          onRetestMistakes={(sub, chap) => handleInitiateMistakeRetest(sub, chap)}
          onNavigateTab={(tab) => setCurrentView(tab)}
        />
      )}

      {currentView === 'chapters' && (
        <ChapterSelectorView
          diagnostics={diagnostics}
          historyMap={historyMap}
          initialSubject={chapterPreset.subject}
          initialChapter={chapterPreset.chapter}
          onStartChapterTestOverview={(cfg) => {
            setGenerationError(null);
            setOverviewConfig(cfg);
          }}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'exam' && activeTest && (
        <ExamWorkspaceView
          test={activeTest}
          questionsById={questionsById}
          remainingSeconds={remainingSeconds}
          onUpdateResponse={handleUpdateResponse}
          onNavigateQuestion={handleNavigateQuestion}
          onSubmitTest={handleSubmitTest}
        />
      )}

      {currentView === 'results' && activeReport && (
        <TestResultsView
          report={activeReport}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onPracticeWeakChapters={(subject, chapters) => {
            setGenerationError(null);
            setOverviewConfig({
              mode: TestMode.CHAPTER_TEST,
              selectedSubjects: [subject],
              chaptersBySubject: { [subject]: chapters },
              allowFlexibleCount: true,
            });
          }}
          onRetestMistakes={(sub, chap) => handleInitiateMistakeRetest(sub, chap)}
        />
      )}

      {currentView === 'analytics' && (
        <AnalyticsDashboardView
          analytics={analyticsSummary}
          historyMap={historyMap}
          onStartFullTest={handleOpenFullSyllabusOverview}
          onPracticeChapter={(subject, chapter) => {
            setChapterPreset({ subject, chapter });
            setCurrentView('chapters');
          }}
          onRetestMistakes={(sub, chap) => handleInitiateMistakeRetest(sub, chap)}
          onOpenReport={(testId) => {
            setSelectedReportId(testId);
            setCurrentView('results');
          }}
        />
      )}

      {currentView === 'history' && (
        <TestHistoryView
          reports={reports}
          onOpenReport={(testId) => {
            setSelectedReportId(testId);
            setCurrentView('results');
          }}
          onStartNewTest={handleOpenFullSyllabusOverview}
        />
      )}

      {currentView === 'question-bank' && (
        <QuestionBankAdminView
          questions={questions}
          diagnostics={diagnostics}
          onImportJsonFiles={async (files, replaceExisting) => {
            const resp = await fetch('/api/question-bank/import-files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files, replaceExisting }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Import failed');
            setQuestions(data.questions || []);
            setDiagnostics(data.diagnostics || null);
          }}
          onImportGitRepo={async (repoUrl, branch, subPath, replaceExisting, githubToken) => {
            const resp = await fetch('/api/question-bank/import-git', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ repoUrl, branch, subPath, replaceExisting, githubToken }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Git sync failed');
            setQuestions(data.questions || []);
            setDiagnostics(data.diagnostics || null);
          }}
          onResetDefaultBank={async () => {
            const resp = await fetch('/api/question-bank/reset', {
              method: 'POST',
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Reset failed');
            setQuestions(data.questions || []);
            setDiagnostics(data.diagnostics || null);
          }}
        />
      )}

      {/* PRE-TEST OVERVIEW & GENERATION TRANSITION MODAL (Section 18, 75) */}
      {overviewConfig && (
        <TestOverviewModal
          mode={overviewConfig.mode}
          selectedSubjects={overviewConfig.selectedSubjects}
          chaptersBySubject={overviewConfig.chaptersBySubject}
          allowFlexibleCount={overviewConfig.allowFlexibleCount}
          errorMessage={generationError}
          onConfirmStart={handleConfirmStartTest}
          onClose={() => {
            setOverviewConfig(null);
            setGenerationError(null);
          }}
        />
      )}
    </div>
  );
}
