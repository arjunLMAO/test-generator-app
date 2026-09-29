import {
  ErrorCategory,
  QuestionHistoryRecord,
  SubjectName,
  TestResultReport,
} from '../types/jee';

export interface LongitudinalChapterStat {
  subject: SubjectName;
  chapter: string;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  activeMistakesInPool: number;
  correctedCount: number;
  firstTestAccuracy: number | null;
  latestTestAccuracy: number | null;
  improvementDeltaPoints: number | null;
  status: 'Weak' | 'Improving' | 'Strong' | 'Moderate';
}

export interface TrendDataPoint {
  testId: string;
  title: string;
  submittedAt: string;
  dateShort: string;
  rawScore: number;
  maxScore: number;
  normalizedScore300: number;
  accuracy: number;
  estimatedPercentile: number;
  subjectAccuracy: Partial<Record<SubjectName, number>>;
  subjectScoreNormalized100: Partial<Record<SubjectName, number>>;
}

export interface DashboardAnalyticsSummary {
  hasData: boolean;
  testsAttempted: number;
  questionsAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  averageNormalizedScore300: number;
  latestPercentile: number | null;
  strongestSubject: { subject: SubjectName; accuracy: number } | null;
  weakestSubject: { subject: SubjectName; accuracy: number } | null;
  weakestChapter: LongitudinalChapterStat | null;
  strongestChapter: LongitudinalChapterStat | null;
  questionsNeedingReviewCount: number;
  correctedMistakesCount: number;
  subjectBreakdown: Record<
    SubjectName,
    {
      attempted: number;
      correct: number;
      incorrect: number;
      accuracy: number;
      testsCount: number;
    }
  >;
  chapterStats: LongitudinalChapterStat[];
  trendSeries: TrendDataPoint[];
  errorTypeBreakdown: Array<{ category: ErrorCategory; count: number; percentage: number }>;
}

export class LongTermAnalyticsService {
  public static computeAnalytics(
    reports: TestResultReport[],
    historyMap: Record<string, QuestionHistoryRecord>
  ): DashboardAnalyticsSummary {
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    const subjectBreakdown: DashboardAnalyticsSummary['subjectBreakdown'] = {
      Physics: { attempted: 0, correct: 0, incorrect: 0, accuracy: 0, testsCount: 0 },
      Chemistry: { attempted: 0, correct: 0, incorrect: 0, accuracy: 0, testsCount: 0 },
      Mathematics: { attempted: 0, correct: 0, incorrect: 0, accuracy: 0, testsCount: 0 },
    };

    if (sortedReports.length === 0) {
      return {
        hasData: false,
        testsAttempted: 0,
        questionsAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallAccuracy: 0,
        averageNormalizedScore300: 0,
        latestPercentile: null,
        strongestSubject: null,
        weakestSubject: null,
        weakestChapter: null,
        strongestChapter: null,
        questionsNeedingReviewCount: 0,
        correctedMistakesCount: 0,
        subjectBreakdown,
        chapterStats: [],
        trendSeries: [],
        errorTypeBreakdown: [],
      };
    }

    let questionsAttempted = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let normalizedScoreSum = 0;

    const chapterHistoryTrack = new Map<
      string,
      {
        subject: SubjectName;
        chapter: string;
        attempted: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        chronologicalAccuracies: number[];
      }
    >();

    const errorCategoryCount = new Map<ErrorCategory, number>();
    const trendSeries: TrendDataPoint[] = [];

    for (const rep of sortedReports) {
      questionsAttempted += rep.attempted;
      totalCorrect += rep.correct;
      totalIncorrect += rep.incorrect;

      const norm300 = rep.maxMarks > 0 ? (rep.totalMarks / rep.maxMarks) * 300 : 0;
      normalizedScoreSum += norm300;

      const subAccMap: Partial<Record<SubjectName, number>> = {};
      const subScoreMap: Partial<Record<SubjectName, number>> = {};

      for (const sRes of rep.subjectResults) {
        const sb = subjectBreakdown[sRes.subject];
        sb.attempted += sRes.attempted;
        sb.correct += sRes.correct;
        sb.incorrect += sRes.incorrect;
        sb.testsCount += 1;
        subAccMap[sRes.subject] = sRes.accuracy;
        subScoreMap[sRes.subject] =
          sRes.maxMarks > 0 ? Number(((sRes.marks / sRes.maxMarks) * 100).toFixed(1)) : 0;
      }

      for (const cRes of rep.chapterResults) {
        const key = `${cRes.subject}::${cRes.chapter}`;
        let entry = chapterHistoryTrack.get(key);
        if (!entry) {
          entry = {
            subject: cRes.subject,
            chapter: cRes.chapter,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            chronologicalAccuracies: [],
          };
          chapterHistoryTrack.set(key, entry);
        }
        entry.attempted += cRes.attempted;
        entry.correct += cRes.correct;
        entry.incorrect += cRes.incorrect;
        entry.unattempted += cRes.unattempted;
        if (cRes.attempted > 0) {
          entry.chronologicalAccuracies.push(cRes.accuracy);
        }
      }

      for (const qRes of rep.questionResults) {
        if (qRes.result === 'incorrect' && qRes.possibleErrorType) {
          errorCategoryCount.set(
            qRes.possibleErrorType,
            (errorCategoryCount.get(qRes.possibleErrorType) || 0) + 1
          );
        }
      }

      const d = new Date(rep.submittedAt);
      const dateShort = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });

      trendSeries.push({
        testId: rep.testId,
        title: rep.title,
        submittedAt: rep.submittedAt,
        dateShort,
        rawScore: rep.totalMarks,
        maxScore: rep.maxMarks,
        normalizedScore300: Number(norm300.toFixed(1)),
        accuracy: rep.accuracy,
        estimatedPercentile: rep.percentile.estimatedPercentile || 0,
        subjectAccuracy: subAccMap,
        subjectScoreNormalized100: subScoreMap,
      });
    }

    for (const sub of ['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]) {
      const sb = subjectBreakdown[sub];
      sb.accuracy = sb.attempted > 0 ? Number(((sb.correct / sb.attempted) * 100).toFixed(1)) : 0;
    }

    // Active mistake pool counts per chapter from question_history
    const activeMistakesByChapter = new Map<string, number>();
    const correctedByChapter = new Map<string, number>();
    let questionsNeedingReviewCount = 0;
    let correctedMistakesCount = 0;

    for (const h of Object.values(historyMap)) {
      const key = `${h.subject}::${h.chapter}`;
      if (h.lastResult === 'incorrect' || h.masteryState === 'incorrect') {
        questionsNeedingReviewCount++;
        activeMistakesByChapter.set(key, (activeMistakesByChapter.get(key) || 0) + 1);
      } else if (h.previouslyIncorrectNowCorrected || h.masteryState === 'corrected' || (h.masteryState === 'mastered' && h.incorrectCount > 0)) {
        correctedMistakesCount++;
        correctedByChapter.set(key, (correctedByChapter.get(key) || 0) + 1);
      }
    }

    const chapterStats: LongitudinalChapterStat[] = [];
    for (const [key, track] of chapterHistoryTrack.entries()) {
      const acc =
        track.attempted > 0 ? Number(((track.correct / track.attempted) * 100).toFixed(1)) : 0;
      const activePool = activeMistakesByChapter.get(key) || 0;
      const corrPool = correctedByChapter.get(key) || 0;

      const firstAcc =
        track.chronologicalAccuracies.length > 0 ? track.chronologicalAccuracies[0] : null;
      const latestAcc =
        track.chronologicalAccuracies.length > 0
          ? track.chronologicalAccuracies[track.chronologicalAccuracies.length - 1]
          : null;
      const delta =
        track.chronologicalAccuracies.length >= 2 && firstAcc !== null && latestAcc !== null
          ? Number((latestAcc - firstAcc).toFixed(1))
          : null;

      let status: LongitudinalChapterStat['status'] = 'Moderate';
      if (delta !== null && delta >= 12 && (latestAcc || 0) >= 65) {
        status = 'Improving';
      } else if (acc < 60 || activePool >= 2) {
        status = 'Weak';
      } else if (acc >= 78 && activePool === 0 && track.attempted >= 2) {
        status = 'Strong';
      }

      chapterStats.push({
        subject: track.subject,
        chapter: track.chapter,
        attempted: track.attempted,
        correct: track.correct,
        incorrect: track.incorrect,
        unattempted: track.unattempted,
        accuracy: acc,
        activeMistakesInPool: activePool,
        correctedCount: corrPool,
        firstTestAccuracy: firstAcc,
        latestTestAccuracy: latestAcc,
        improvementDeltaPoints: delta,
        status,
      });
    }

    chapterStats.sort((a, b) => {
      if (b.activeMistakesInPool !== a.activeMistakesInPool) {
        return b.activeMistakesInPool - a.activeMistakesInPool;
      }
      return a.accuracy - b.accuracy;
    });

    const attemptedSubjects = (['Physics', 'Chemistry', 'Mathematics'] as SubjectName[])
      .map((s) => ({ subject: s, accuracy: subjectBreakdown[s].accuracy, attempted: subjectBreakdown[s].attempted }))
      .filter((s) => s.attempted > 0)
      .sort((a, b) => b.accuracy - a.accuracy);

    const strongestSubject =
      attemptedSubjects.length > 0
        ? { subject: attemptedSubjects[0].subject, accuracy: attemptedSubjects[0].accuracy }
        : null;
    const weakestSubject =
      attemptedSubjects.length > 1
        ? {
            subject: attemptedSubjects[attemptedSubjects.length - 1].subject,
            accuracy: attemptedSubjects[attemptedSubjects.length - 1].accuracy,
          }
        : null;

    const attemptedChapters = chapterStats.filter((c) => c.attempted > 0);
    const weakestChapter =
      attemptedChapters.length > 0
        ? [...attemptedChapters].sort((a, b) => a.accuracy - b.accuracy || b.incorrect - a.incorrect)[0]
        : null;
    const strongestChapter =
      attemptedChapters.length > 0
        ? [...attemptedChapters].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0]
        : null;

    const totalErrorsTracked = Array.from(errorCategoryCount.values()).reduce((s, v) => s + v, 0);
    const errorTypeBreakdown = Array.from(errorCategoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage:
          totalErrorsTracked > 0 ? Number(((count / totalErrorsTracked) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const overallAccuracy =
      questionsAttempted > 0 ? Number(((totalCorrect / questionsAttempted) * 100).toFixed(1)) : 0;
    const averageNormalizedScore300 = Number(
      (normalizedScoreSum / sortedReports.length).toFixed(1)
    );
    const latestPercentile =
      sortedReports[sortedReports.length - 1]?.percentile.estimatedPercentile ?? null;

    return {
      hasData: true,
      testsAttempted: sortedReports.length,
      questionsAttempted,
      totalCorrect,
      totalIncorrect,
      overallAccuracy,
      averageNormalizedScore300,
      latestPercentile,
      strongestSubject,
      weakestSubject,
      weakestChapter,
      strongestChapter,
      questionsNeedingReviewCount,
      correctedMistakesCount,
      subjectBreakdown,
      chapterStats,
      trendSeries,
      errorTypeBreakdown,
    };
  }
}
