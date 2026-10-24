import {
  AttemptEntry,
  ChapterPerformance,
  DifficultyLevel,
  GeneratedTest,
  MasteryState,
  NormalizedQuestion,
  PercentileEstimate,
  QuestionHistoryRecord,
  QuestionResultDetail,
  SubjectName,
  SubjectPerformance,
  TestResultReport,
} from '../types/jee';
import { QuestionBankEngine } from './QuestionBankEngine';

export class ScoringAndAnalyticsService {
  public static evaluateAndRecordTest(
    test: GeneratedTest,
    qbEngine: QuestionBankEngine,
    currentHistoryMap: Record<string, QuestionHistoryRecord> = {},
    autoSubmitted: boolean = false
  ): { report: TestResultReport; updatedHistoryMap: Record<string, QuestionHistoryRecord> } {
    const updatedHistoryMap: Record<string, QuestionHistoryRecord> = { ...currentHistoryMap };
    const nowIso = new Date().toISOString();

    let totalMarks = 0;
    let maxMarks = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;
    let totalTimeSpent = 0;
    let totalMarkedForReview = 0;
    let totalTimeOnIncorrect = 0;

    const subjectBuckets = new Map<SubjectName, SubjectPerformance>();
    const chapterBuckets = new Map<string, ChapterPerformance>();

    for (const sub of test.subjects) {
      subjectBuckets.set(sub, {
        subject: sub,
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        marks: 0,
        maxMarks: 0,
        mcqMarks: 0,
        integerMarks: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
        avgTimePerQuestionSeconds: 0,
      });
    }

    const questionResults: QuestionResultDetail[] = [];

    for (const alloc of test.questions) {
      const q = qbEngine.getQuestionById(alloc.questionId);
      const resp = test.responses[alloc.questionId];

      const studentAnswer = resp?.answer ? String(resp.answer).trim() : null;
      const isAttempted = Boolean(studentAnswer && studentAnswer.length > 0);
      const isMarked = Boolean(resp?.markedForReview);
      const timeSpent = Math.max(0, resp?.timeSpentSeconds || 0);

      totalTimeSpent += timeSpent;
      if (isMarked) totalMarkedForReview++;

      const subName = alloc.subject;
      const chapterName = q?.chapter || 'General';
      const chapKey = `${subName}::${chapterName}`;

      if (!chapterBuckets.has(chapKey)) {
        chapterBuckets.set(chapKey, {
          subject: subName,
          chapter: chapterName,
          totalQuestions: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
          marks: 0,
          maxMarks: 0,
          accuracy: 0,
          timeSpentSeconds: 0,
          weaknessScore: 0,
          status: 'Limited Data',
          repeatedMistakesCount: 0,
        });
      }

      const subStat = subjectBuckets.get(subName)!;
      const chapStat = chapterBuckets.get(chapKey)!;

      subStat.totalQuestions++;
      subStat.maxMarks += 4;
      subStat.timeSpentSeconds += timeSpent;

      chapStat.totalQuestions++;
      chapStat.maxMarks += 4;
      chapStat.timeSpentSeconds += timeSpent;

      maxMarks += 4;

      let result: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
      let marksAwarded = 0;

      if (!isAttempted) {
        totalUnattempted++;
        subStat.unattempted++;
        chapStat.unattempted++;
        result = 'unattempted';
        marksAwarded = 0;
      } else {
        totalAttempted++;
        subStat.attempted++;
        chapStat.attempted++;

        const isMcq = alloc.type === 'mcq';
        const correctStr = String(q?.correctAnswer ?? '').trim();
        const studentStr = String(studentAnswer).trim();

        const isCorrect = isMcq
          ? studentStr.toUpperCase() === correctStr.toUpperCase()
          : Math.abs(Number(studentStr) - Number(correctStr)) < 0.05;

        if (isCorrect) {
          totalCorrect++;
          subStat.correct++;
          chapStat.correct++;
          result = 'correct';
          marksAwarded = 4;
          if (isMcq) subStat.mcqMarks += 4;
          else subStat.integerMarks += 4;
        } else {
          totalIncorrect++;
          subStat.incorrect++;
          chapStat.incorrect++;
          totalTimeOnIncorrect += timeSpent;
          result = 'incorrect';
          marksAwarded = isMcq ? -1 : 0;
          if (isMcq) subStat.mcqMarks -= 1;
        }
      }

      totalMarks += marksAwarded;
      subStat.marks += marksAwarded;
      chapStat.marks += marksAwarded;

      // Update question history
      const existingHistory: QuestionHistoryRecord = updatedHistoryMap[alloc.questionId] || {
        userId: test.userId || 'student-arjun',
        questionId: alloc.questionId,
        subject: subName,
        chapter: chapterName,
        type: alloc.type,
        attemptCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastAnswer: null,
        lastResult: result,
        lastAttemptedAt: nowIso,
        masteryState: 'unseen' as MasteryState,
        previouslyIncorrectNowCorrected: false,
        attempts: [],
      };

      const wasPreviouslyWrong = existingHistory.lastResult === 'incorrect';
      const prevResult = existingHistory.lastResult;
      const prevAnswer = existingHistory.lastAnswer || (existingHistory.attempts[existingHistory.attempts.length - 1]?.answer || null);

      const newAttemptEntry: AttemptEntry = {
        testId: test.id,
        answer: studentAnswer,
        correct: result === 'correct',
        timestamp: nowIso,
        timeSpentSeconds: timeSpent,
      };

      const newAttemptCount = existingHistory.attemptCount + (isAttempted ? 1 : 0);
      const newCorrectCount = existingHistory.correctCount + (result === 'correct' ? 1 : 0);
      const newIncorrectCount = existingHistory.incorrectCount + (result === 'incorrect' ? 1 : 0);
      const prevMistakes = existingHistory.attempts.filter((a) => !a.correct).length;
      const newRepeatedMistakeCount = prevMistakes + (result === 'incorrect' && wasPreviouslyWrong ? 1 : 0);
      const previouslyCorrected = Boolean(wasPreviouslyWrong && result === 'correct');

      const isNowWrong = result === 'incorrect' ? true : result === 'correct' ? false : wasPreviouslyWrong;

      const newMastery: MasteryState =
        newCorrectCount >= 2 && !isNowWrong
          ? 'mastered'
          : previouslyCorrected
            ? 'corrected'
            : isNowWrong
              ? 'incorrect'
              : newCorrectCount >= 1
                ? 'attempted'
                : 'unseen';

      updatedHistoryMap[alloc.questionId] = {
        ...existingHistory,
        attemptCount: newAttemptCount,
        correctCount: newCorrectCount,
        incorrectCount: newIncorrectCount,
        lastAnswer: studentAnswer,
        lastResult: result,
        lastAttemptedAt: nowIso,
        masteryState: newMastery,
        previouslyIncorrectNowCorrected: previouslyCorrected,
        attempts: [...existingHistory.attempts, newAttemptEntry],
      };

      questionResults.push({
        order: alloc.order,
        questionId: alloc.questionId,
        subject: subName,
        chapter: chapterName,
        topic: q?.topic || chapterName,
        type: alloc.type,
        difficulty: (q?.difficulty || 'medium') as DifficultyLevel,
        question: q?.question || '',
        options: q?.options,
        studentAnswer,
        correctAnswer: q?.correctAnswer ?? '',
        result,
        marksAwarded,
        maxMarks: 4,
        markedForReview: isMarked,
        timeSpentSeconds: timeSpent,
        solution: q?.solution || '',
        explanation: q?.explanation,
        commonMistake: q?.commonMistake,
        possibleErrorType: q?.possibleErrorType,
        image: q?.image,
        images: q?.images,
        visualAsset: q?.visualAsset,
        visualRequired: q?.visualRequired,
        visualStatus: q?.visualStatus,
        rawVisualMetadata: q?.rawVisualMetadata,
        historySnapshot: {
          attemptCount: newAttemptCount,
          correctCount: newCorrectCount,
          incorrectCount: newIncorrectCount,
          repeatedMistakeCount: newRepeatedMistakeCount,
          previouslyIncorrectNowCorrected: previouslyCorrected,
          masteryState: newMastery,
          previousResult: prevResult,
          previousAnswer: prevAnswer,
          attemptsTimeline: existingHistory.attempts,
        },
      });
    }

    // Finalize subject stats
    const subjectResults = Array.from(subjectBuckets.values()).map((s) => ({
      ...s,
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
      avgTimePerQuestionSeconds: s.totalQuestions > 0 ? Math.round(s.timeSpentSeconds / s.totalQuestions) : 0,
    }));

    // Finalize chapter stats
    const chapterResults = Array.from(chapterBuckets.values()).map((c) => {
      const acc = c.attempted > 0 ? Math.round((c.correct / c.attempted) * 100) : 0;
      const weakness = c.attempted > 0 ? (100 - acc) * (c.incorrect + 1) : 0;
      let status: 'Weak' | 'Moderate' | 'Strong' | 'Limited Data' = 'Limited Data';
      if (c.attempted >= 2) {
        if (acc < 50) status = 'Weak';
        else if (acc < 75) status = 'Moderate';
        else status = 'Strong';
      }
      return {
        ...c,
        accuracy: acc,
        weaknessScore: weakness,
        status,
      };
    });

    chapterResults.sort((a, b) => b.weaknessScore - a.weaknessScore);
    const weakChapters = chapterResults.filter((c) => c.status === 'Weak');
    const strongChapters = chapterResults.filter((c) => c.status === 'Strong');

    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const avgTimePerAttempted = totalAttempted > 0 ? Math.round(totalTimeSpent / totalAttempted) : 0;
    const avgTimeOnIncorrect = totalIncorrect > 0 ? Math.round(totalTimeOnIncorrect / totalIncorrect) : 0;

    // Estimate percentile using standard linear interpolation normalized to 300 marks
    const normalizedScore300 = maxMarks > 0 ? Math.max(0, Math.round((totalMarks / maxMarks) * 300)) : 0;
    const estimatedPercentile =
      maxMarks > 0
        ? Math.min(99.9, Math.max(10.0, Number((40 + (normalizedScore300 / 300) * 59.5).toFixed(1))))
        : null;

    const percentile: PercentileEstimate = {
      available: maxMarks >= 100,
      estimatedPercentile,
      normalizedScore300,
      confidenceLabel: maxMarks >= 300 ? 'High Confidence (Full Syllabus Simulation)' : 'Indicative (Scaled)',
      benchmarkName: 'JEE Main Benchmarks',
      disclaimer: 'Estimated percentile based on JEE Main historical score-to-percentile curves.',
    };

    const summaryInsights: string[] = [];
    if (totalCorrect === totalAttempted && totalAttempted > 0) {
      summaryInsights.push('Perfect accuracy achieved on all attempted questions.');
    } else if (accuracy >= 80) {
      summaryInsights.push(`High accuracy of ${accuracy}% across attempted questions.`);
    } else if (accuracy < 50 && totalAttempted > 0) {
      summaryInsights.push('Accuracy fell below 50%. Focus on question selection and avoiding negative marks.');
    }

    if (weakChapters.length > 0) {
      summaryInsights.push(`Revision recommended in ${weakChapters.map((w) => w.chapter).slice(0, 3).join(', ')}.`);
    }

    const report: TestResultReport = {
      testId: test.id,
      userId: test.userId,
      title: test.title,
      mode: test.mode,
      sourceAttemptId: test.sourceAttemptId,
      subjects: test.subjects,
      chaptersBySubject: test.chaptersBySubject,
      submittedAt: nowIso,
      autoSubmitted,
      durationSeconds: test.durationSeconds,
      totalTimeSpentSeconds: totalTimeSpent,
      totalMarks,
      maxMarks,
      totalQuestions: test.questions.length,
      attempted: totalAttempted,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      unattempted: totalUnattempted,
      markedForReviewCount: totalMarkedForReview,
      accuracy,
      avgTimePerAttemptedSeconds: avgTimePerAttempted,
      avgTimeOnIncorrectSeconds: avgTimeOnIncorrect,
      percentile,
      subjectResults,
      chapterResults,
      weakChapters,
      strongChapters,
      questionResults,
      summaryInsights,
      targetScore: test.targetScore,
      targetScoreMet: test.targetScore !== undefined ? totalMarks >= test.targetScore : undefined,
      targetScoreDelta: test.targetScore !== undefined ? totalMarks - test.targetScore : undefined,
      tabSwitchCount: test.tabSwitchCount ?? 0,
    };

    return { report, updatedHistoryMap };
  }
}
