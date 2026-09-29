import {
  ChapterPerformance,
  DEFAULT_SCORING_CONFIG,
  DEFAULT_WEAKNESS_CONFIG,
  ErrorCategory,
  GeneratedTest,
  MasteryState,
  NormalizedQuestion,
  PercentileEstimate,
  QuestionHistoryRecord,
  QuestionResultDetail,
  ScoringConfig,
  SubjectName,
  SubjectPerformance,
  TestMode,
  TestResultReport,
  WeaknessConfig,
} from '../types/jee';
import { QuestionBankEngine } from './QuestionBankEngine';

export interface BenchmarkAnchor {
  scoreOutOf300: number;
  percentile: number;
}

// Empirical JEE Main Session Benchmark Curve (Configurable)
export const DEFAULT_JEE_BENCHMARK_CURVE: BenchmarkAnchor[] = [
  { scoreOutOf300: 285, percentile: 99.99 },
  { scoreOutOf300: 260, percentile: 99.92 },
  { scoreOutOf300: 235, percentile: 99.75 },
  { scoreOutOf300: 210, percentile: 99.42 },
  { scoreOutOf300: 190, percentile: 98.85 },
  { scoreOutOf300: 175, percentile: 98.10 },
  { scoreOutOf300: 160, percentile: 97.15 },
  { scoreOutOf300: 145, percentile: 95.80 },
  { scoreOutOf300: 130, percentile: 93.90 },
  { scoreOutOf300: 115, percentile: 91.20 },
  { scoreOutOf300: 100, percentile: 87.50 },
  { scoreOutOf300: 85, percentile: 82.10 },
  { scoreOutOf300: 70, percentile: 74.80 },
  { scoreOutOf300: 55, percentile: 64.50 },
  { scoreOutOf300: 40, percentile: 51.20 },
  { scoreOutOf300: 25, percentile: 35.00 },
  { scoreOutOf300: 10, percentile: 18.40 },
  { scoreOutOf300: 0, percentile: 8.50 },
  { scoreOutOf300: -20, percentile: 1.20 },
];

export class PercentileService {
  public static estimate(
    totalMarks: number,
    maxMarks: number,
    benchmarkCurve: BenchmarkAnchor[] = DEFAULT_JEE_BENCHMARK_CURVE
  ): PercentileEstimate {
    if (maxMarks <= 0 || !benchmarkCurve || benchmarkCurve.length < 2) {
      return {
        available: false,
        estimatedPercentile: null,
        normalizedScore300: 0,
        confidenceLabel: 'Benchmark Unconfigured',
        benchmarkName: 'None',
        disclaimer: 'Percentile estimate unavailable until benchmark data is configured.',
      };
    }

    const normalizedScore300 = Number(((totalMarks / maxMarks) * 300).toFixed(1));
    const sorted = [...benchmarkCurve].sort((a, b) => b.scoreOutOf300 - a.scoreOutOf300);

    if (normalizedScore300 >= sorted[0].scoreOutOf300) {
      return {
        available: true,
        estimatedPercentile: sorted[0].percentile,
        normalizedScore300,
        confidenceLabel: maxMarks >= 200 ? 'High (Full Pattern)' : 'Moderate (Scaled Pattern)',
        benchmarkName: 'JEE Main Historical Session Composite (Normalized / 300)',
        disclaimer:
          'Estimated percentile based on configured historical benchmark distributions. Not an official NTA JEE percentile.',
      };
    }

    const lowest = sorted[sorted.length - 1];
    if (normalizedScore300 <= lowest.scoreOutOf300) {
      return {
        available: true,
        estimatedPercentile: lowest.percentile,
        normalizedScore300,
        confidenceLabel: maxMarks >= 200 ? 'High (Full Pattern)' : 'Moderate (Scaled Pattern)',
        benchmarkName: 'JEE Main Historical Session Composite (Normalized / 300)',
        disclaimer:
          'Estimated percentile based on configured historical benchmark distributions. Not an official NTA JEE percentile.',
      };
    }

    let interpolated = 50;
    for (let i = 0; i < sorted.length - 1; i++) {
      const upper = sorted[i];
      const lower = sorted[i + 1];
      if (normalizedScore300 <= upper.scoreOutOf300 && normalizedScore300 >= lower.scoreOutOf300) {
        const ratio =
          (normalizedScore300 - lower.scoreOutOf300) /
          Math.max(1, upper.scoreOutOf300 - lower.scoreOutOf300);
        interpolated = lower.percentile + ratio * (upper.percentile - lower.percentile);
        break;
      }
    }

    return {
      available: true,
      estimatedPercentile: Number(interpolated.toFixed(2)),
      normalizedScore300,
      confidenceLabel: maxMarks >= 200 ? 'High (Full Pattern)' : 'Moderate (Scaled from Subset)',
      benchmarkName: 'JEE Main Historical Session Composite (Normalized / 300)',
      disclaimer:
        'An approximation based on configured historical benchmark data. It is not an official JEE percentile.',
    };
  }
}

export class ScoringAndAnalyticsService {
  public static isAnswerCorrect(q: NormalizedQuestion, studentAnswer: string | null): boolean {
    if (studentAnswer === null || studentAnswer === undefined || String(studentAnswer).trim() === '') {
      return false;
    }
    const cleanStudent = String(studentAnswer).trim();
    if (q.type === 'mcq') {
      return cleanStudent.toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
    } else {
      const numStudent = Number(cleanStudent);
      const numCorrect = Number(q.correctAnswer);
      if (Number.isNaN(numStudent) || Number.isNaN(numCorrect)) return false;
      return Math.abs(numStudent - numCorrect) <= 0.01;
    }
  }

  public static evaluateAndRecordTest(
    test: GeneratedTest,
    engine: QuestionBankEngine,
    historyMap: Record<string, QuestionHistoryRecord>,
    autoSubmitted = false,
    weaknessConfig: WeaknessConfig = DEFAULT_WEAKNESS_CONFIG
  ): {
    report: TestResultReport;
    updatedHistoryMap: Record<string, QuestionHistoryRecord>;
  } {
    const config: ScoringConfig = test.scoringConfig || DEFAULT_SCORING_CONFIG;
    const submittedAt = new Date().toISOString();
    const updatedHistoryMap: Record<string, QuestionHistoryRecord> = { ...historyMap };

    let totalMarks = 0;
    let maxMarks = 0;
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let markedForReviewCount = 0;
    let totalTimeSpentSeconds = 0;
    let incorrectTimeSum = 0;

    const subjectAccum = new Map<
      SubjectName,
      {
        totalQuestions: number;
        attempted: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        marks: number;
        maxMarks: number;
        mcqMarks: number;
        integerMarks: number;
        timeSpentSeconds: number;
      }
    >();

    for (const sub of test.subjects) {
      subjectAccum.set(sub, {
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        marks: 0,
        maxMarks: 0,
        mcqMarks: 0,
        integerMarks: 0,
        timeSpentSeconds: 0,
      });
    }

    const chapterAccum = new Map<
      string,
      {
        subject: SubjectName;
        chapter: string;
        totalQuestions: number;
        attempted: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        marks: number;
        maxMarks: number;
        timeSpentSeconds: number;
        repeatedMistakesCount: number;
        hardMissedCount: number;
      }
    >();

    const questionResults: QuestionResultDetail[] = [];

    for (const alloc of test.questions) {
      const q = engine.getQuestionById(alloc.questionId);
      if (!q) continue;

      const resp = test.responses[alloc.questionId];
      const rawAns = resp?.answer !== undefined && resp?.answer !== null ? String(resp.answer).trim() : '';
      const hasAnswered = rawAns.length > 0;
      const isMarked = Boolean(resp?.markedForReview);
      const qTime = Math.max(0, Math.round(resp?.timeSpentSeconds || 0));

      if (isMarked) markedForReviewCount++;
      totalTimeSpentSeconds += qTime;

      const qMaxMarks = q.type === 'mcq' ? config.mcqCorrectMarks : config.integerCorrectMarks;
      maxMarks += qMaxMarks;

      let resultState: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
      let marksAwarded = 0;

      if (!hasAnswered) {
        resultState = 'unattempted';
        marksAwarded = q.type === 'mcq' ? config.mcqUnattemptedMarks : config.integerUnattemptedMarks;
        unattempted++;
      } else {
        attempted++;
        const isCorr = this.isAnswerCorrect(q, rawAns);
        if (isCorr) {
          resultState = 'correct';
          marksAwarded = q.type === 'mcq' ? config.mcqCorrectMarks : config.integerCorrectMarks;
          correct++;
        } else {
          resultState = 'incorrect';
          marksAwarded = q.type === 'mcq' ? config.mcqWrongMarks : config.integerWrongMarks;
          incorrect++;
          incorrectTimeSum += qTime;
        }
      }

      totalMarks += marksAwarded;

      // Update question history record
      const prevHist = updatedHistoryMap[q.id];
      const prevIncorrectCount = prevHist?.incorrectCount || 0;
      const prevAttemptCount = prevHist?.attemptCount || 0;
      const prevCorrectCount = prevHist?.correctCount || 0;

      let newAttemptCount = prevAttemptCount;
      let newCorrectCount = prevCorrectCount;
      let newIncorrectCount = prevIncorrectCount;
      let masteryState: MasteryState = prevHist?.masteryState || 'unseen';
      let previouslyIncorrectNowCorrected = false;

      if (hasAnswered) {
        newAttemptCount++;
        if (resultState === 'correct') {
          newCorrectCount++;
          if (prevIncorrectCount > 0) {
            previouslyIncorrectNowCorrected = true;
            masteryState = newCorrectCount >= prevIncorrectCount + 1 ? 'mastered' : 'corrected';
          } else {
            masteryState = newCorrectCount >= 2 ? 'mastered' : 'attempted';
          }
        } else {
          newIncorrectCount++;
          masteryState = 'incorrect';
        }
      }

      const updatedRecord: QuestionHistoryRecord = {
        userId: test.userId,
        questionId: q.id,
        subject: q.subject,
        chapter: q.chapter,
        type: q.type,
        attemptCount: newAttemptCount,
        correctCount: newCorrectCount,
        incorrectCount: newIncorrectCount,
        lastAnswer: hasAnswered ? rawAns : prevHist?.lastAnswer || null,
        lastResult: hasAnswered ? resultState : prevHist?.lastResult || 'unattempted',
        lastAttemptedAt: submittedAt,
        masteryState,
        previouslyIncorrectNowCorrected,
        attempts: [
          ...(prevHist?.attempts || []),
          ...(hasAnswered
            ? [
                {
                  testId: test.id,
                  answer: rawAns,
                  correct: resultState === 'correct',
                  timestamp: submittedAt,
                  timeSpentSeconds: qTime,
                },
              ]
            : []),
        ],
      };

      if (hasAnswered || prevHist) {
        updatedHistoryMap[q.id] = updatedRecord;
      }

      // Accumulate subject stats
      const sAcc = subjectAccum.get(q.subject);
      if (sAcc) {
        sAcc.totalQuestions++;
        sAcc.maxMarks += qMaxMarks;
        sAcc.marks += marksAwarded;
        if (q.type === 'mcq') sAcc.mcqMarks += marksAwarded;
        else sAcc.integerMarks += marksAwarded;
        sAcc.timeSpentSeconds += qTime;
        if (resultState === 'correct') {
          sAcc.attempted++;
          sAcc.correct++;
        } else if (resultState === 'incorrect') {
          sAcc.attempted++;
          sAcc.incorrect++;
        } else {
          sAcc.unattempted++;
        }
      }

      // Accumulate chapter stats
      const chapKey = `${q.subject}::${q.chapter}`;
      let cAcc = chapterAccum.get(chapKey);
      if (!cAcc) {
        cAcc = {
          subject: q.subject,
          chapter: q.chapter,
          totalQuestions: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
          marks: 0,
          maxMarks: 0,
          timeSpentSeconds: 0,
          repeatedMistakesCount: 0,
          hardMissedCount: 0,
        };
        chapterAccum.set(chapKey, cAcc);
      }
      cAcc.totalQuestions++;
      cAcc.maxMarks += qMaxMarks;
      cAcc.marks += marksAwarded;
      cAcc.timeSpentSeconds += qTime;
      if (resultState === 'correct') {
        cAcc.attempted++;
        cAcc.correct++;
      } else if (resultState === 'incorrect') {
        cAcc.attempted++;
        cAcc.incorrect++;
        if (newIncorrectCount >= 2) {
          cAcc.repeatedMistakesCount++;
        }
        if (q.difficulty === 'easy') {
          cAcc.hardMissedCount += 1.5; // Missing an easy question increases weakness score more
        } else {
          cAcc.hardMissedCount += 1.0;
        }
      } else {
        cAcc.unattempted++;
      }

      // Infer possible error type if incorrect
      let inferredError: ErrorCategory | undefined = resp?.errorClassification || q.possibleErrorType;
      if (resultState === 'incorrect' && !inferredError) {
        if (qTime < 15) inferredError = 'Time-pressure error';
        else if (q.type === 'integer') inferredError = 'Calculation mistake';
        else inferredError = 'Conceptual mistake';
      }

      questionResults.push({
        order: alloc.order,
        questionId: q.id,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        studentAnswer: hasAnswered ? rawAns : null,
        correctAnswer: q.correctAnswer,
        result: resultState,
        marksAwarded,
        maxMarks: qMaxMarks,
        markedForReview: isMarked,
        timeSpentSeconds: qTime,
        solution: q.solution,
        explanation: q.explanation,
        commonMistake: q.commonMistake,
        possibleErrorType: inferredError,
        image: q.image,
        historySnapshot: {
          attemptCount: newAttemptCount,
          correctCount: newCorrectCount,
          incorrectCount: newIncorrectCount,
          repeatedMistakeCount: resultState === 'incorrect' ? newIncorrectCount : 0,
          previouslyIncorrectNowCorrected,
          masteryState,
        },
      });
    }

    const overallAccuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;

    const subjectResults: SubjectPerformance[] = [];
    for (const [sub, sAcc] of subjectAccum.entries()) {
      const subAccuracy =
        sAcc.attempted > 0 ? Number(((sAcc.correct / sAcc.attempted) * 100).toFixed(1)) : 0;
      const avgTime =
        sAcc.totalQuestions > 0 ? Math.round(sAcc.timeSpentSeconds / sAcc.totalQuestions) : 0;
      subjectResults.push({
        subject: sub,
        totalQuestions: sAcc.totalQuestions,
        attempted: sAcc.attempted,
        correct: sAcc.correct,
        incorrect: sAcc.incorrect,
        unattempted: sAcc.unattempted,
        marks: sAcc.marks,
        maxMarks: sAcc.maxMarks,
        mcqMarks: sAcc.mcqMarks,
        integerMarks: sAcc.integerMarks,
        accuracy: subAccuracy,
        timeSpentSeconds: sAcc.timeSpentSeconds,
        avgTimePerQuestionSeconds: avgTime,
      });
    }

    const chapterResults: ChapterPerformance[] = [];
    for (const cAcc of chapterAccum.values()) {
      const chapAccuracy =
        cAcc.attempted > 0 ? Number(((cAcc.correct / cAcc.attempted) * 100).toFixed(1)) : 0;
      const incorrectRate = cAcc.totalQuestions > 0 ? cAcc.incorrect / cAcc.totalQuestions : 0;
      const unattemptedRate = cAcc.totalQuestions > 0 ? cAcc.unattempted / cAcc.totalQuestions : 0;
      const repeatedRate =
        cAcc.totalQuestions > 0 ? cAcc.repeatedMistakesCount / cAcc.totalQuestions : 0;
      const diffPenalty =
        cAcc.totalQuestions > 0 ? Math.min(1, cAcc.hardMissedCount / cAcc.totalQuestions) : 0;

      // Documented Weighted Weakness Score (0.00 to 1.00)
      const weaknessScore = Number(
        (
          weaknessConfig.incorrectRateWeight * incorrectRate +
          weaknessConfig.unattemptedRateWeight * unattemptedRate +
          weaknessConfig.repeatedMistakeWeight * repeatedRate +
          weaknessConfig.recencyWeight * diffPenalty
        ).toFixed(3)
      );

      let status: ChapterPerformance['status'] = 'Moderate';
      // Minimum sample size rule: Do not label a chapter weak solely because 1 question was missed in a large test
      const effectiveMinSample =
        test.questions.length < 5 ? 1 : weaknessConfig.minimumSampleSize;

      if (cAcc.totalQuestions < effectiveMinSample) {
        status = 'Limited Data';
      } else if (
        weaknessScore >= weaknessConfig.weakThresholdScore ||
        (cAcc.attempted >= effectiveMinSample && chapAccuracy < 55) ||
        cAcc.incorrect >= 2
      ) {
        status = 'Weak';
      } else if (cAcc.attempted >= effectiveMinSample && chapAccuracy >= 75 && cAcc.incorrect === 0) {
        status = 'Strong';
      } else if (cAcc.attempted >= effectiveMinSample && chapAccuracy >= 80) {
        status = 'Strong';
      }

      chapterResults.push({
        subject: cAcc.subject,
        chapter: cAcc.chapter,
        totalQuestions: cAcc.totalQuestions,
        attempted: cAcc.attempted,
        correct: cAcc.correct,
        incorrect: cAcc.incorrect,
        unattempted: cAcc.unattempted,
        marks: cAcc.marks,
        maxMarks: cAcc.maxMarks,
        accuracy: chapAccuracy,
        timeSpentSeconds: cAcc.timeSpentSeconds,
        weaknessScore,
        status,
        repeatedMistakesCount: cAcc.repeatedMistakesCount,
      });
    }

    chapterResults.sort((a, b) => b.weaknessScore - a.weaknessScore);

    const weakChapters = chapterResults.filter((c) => c.status === 'Weak');
    const strongChapters = chapterResults
      .filter((c) => c.status === 'Strong')
      .sort((a, b) => b.accuracy - a.accuracy);

    const avgTimePerAttemptedSeconds =
      attempted > 0 ? Math.round(totalTimeSpentSeconds / attempted) : 0;
    const avgTimeOnIncorrectSeconds =
      incorrect > 0 ? Math.round(incorrectTimeSum / incorrect) : 0;

    const percentile = PercentileService.estimate(totalMarks, maxMarks);
    const summaryInsights = this.buildDataDrivenInsights(
      subjectResults,
      chapterResults,
      weakChapters,
      attempted,
      correct,
      incorrect,
      avgTimeOnIncorrectSeconds
    );

    const report: TestResultReport = {
      testId: test.id,
      userId: test.userId,
      title: test.title,
      mode: test.mode,
      subjects: test.subjects,
      chaptersBySubject: test.chaptersBySubject,
      submittedAt,
      autoSubmitted,
      durationSeconds: test.durationSeconds,
      totalTimeSpentSeconds,
      totalMarks,
      maxMarks,
      totalQuestions: test.questions.length,
      attempted,
      correct,
      incorrect,
      unattempted,
      markedForReviewCount,
      accuracy: overallAccuracy,
      avgTimePerAttemptedSeconds,
      avgTimeOnIncorrectSeconds,
      percentile,
      subjectResults,
      chapterResults,
      weakChapters,
      strongChapters,
      questionResults,
      summaryInsights,
    };

    return { report, updatedHistoryMap };
  }

  private static buildDataDrivenInsights(
    subjectResults: SubjectPerformance[],
    chapterResults: ChapterPerformance[],
    weakChapters: ChapterPerformance[],
    attempted: number,
    correct: number,
    incorrect: number,
    avgTimeOnIncorrectSeconds: number
  ): string[] {
    const insights: string[] = [];

    if (attempted === 0) {
      insights.push(
        'No questions were attempted in this session. Attempt questions to generate accuracy and mistake diagnostics.'
      );
      return insights;
    }

    const attemptedSubjects = subjectResults.filter((s) => s.attempted > 0);
    if (attemptedSubjects.length > 1) {
      const sortedByAcc = [...attemptedSubjects].sort((a, b) => b.accuracy - a.accuracy);
      const bestSub = sortedByAcc[0];
      const mostWrongSub = [...subjectResults].sort((a, b) => b.incorrect - a.incorrect)[0];

      insights.push(
        `Your ${bestSub.subject} accuracy was strongest in this test at ${bestSub.accuracy}% (${bestSub.correct}/${bestSub.attempted} correct).`
      );
      if (mostWrongSub.incorrect > 0) {
        insights.push(
          `${mostWrongSub.subject} contributed the largest number of incorrect answers (${mostWrongSub.incorrect} wrong, costing ${Math.abs(mostWrongSub.incorrect)} negative marks in MCQs).`
        );
      }
    } else if (attemptedSubjects.length === 1) {
      const s = attemptedSubjects[0];
      insights.push(
        `In ${s.subject}, you achieved ${s.accuracy}% accuracy with ${s.correct} correct and ${s.incorrect} incorrect out of ${s.attempted} attempted questions.`
      );
    }

    if (weakChapters.length > 0) {
      const worstChap = weakChapters[0];
      insights.push(
        `${worstChap.chapter} (${worstChap.subject}) recorded the highest weakness score (${(worstChap.weaknessScore * 100).toFixed(0)}/100) with ${worstChap.accuracy}% accuracy among chapters with sufficient attempts.`
      );
    }

    if (incorrect > 0 && avgTimeOnIncorrectSeconds > 0) {
      const mins = Math.floor(avgTimeOnIncorrectSeconds / 60);
      const secs = avgTimeOnIncorrectSeconds % 60;
      const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      insights.push(
        `You spent an average of ${timeFormatted} on incorrect questions (${incorrect} total mistakes).`
      );
    }

    return insights;
  }
}
