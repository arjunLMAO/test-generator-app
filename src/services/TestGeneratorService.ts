import {
  AdaptiveWeightConfig,
  DEFAULT_ADAPTIVE_WEIGHTS,
  DEFAULT_SCORING_CONFIG,
  GeneratedTest,
  NormalizedQuestion,
  QuestionHistoryRecord,
  QuestionPaletteStatus,
  QuestionResponseState,
  ScoringConfig,
  SubjectName,
  TestMode,
  TestQuestionAllocation,
  TestStatus,
} from '../types/jee';
import {
  QuestionBankEngine,
  buildQuestionContentFingerprint,
} from './QuestionBankEngine';

export interface TestGenerationRequest {
  userId: string;
  mode: TestMode;
  selectedSubjects: SubjectName[];
  chaptersBySubject?: Partial<Record<SubjectName, string[]>>;
  allowFlexibleCount?: boolean;
  scoringConfig?: ScoringConfig;
  adaptiveWeights?: AdaptiveWeightConfig;
  seed?: string;
}

export interface TestGenerationOutcome {
  success: boolean;
  test?: GeneratedTest;
  error?: string;
  inventoryDetails?: Array<{
    subject: SubjectName;
    availableMcq: number;
    requiredMcq: number;
    availableInteger: number;
    requiredInteger: number;
  }>;
}

// Deterministic seeded PRNG (Mulberry32)
function createSeededRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const CANONICAL_SUBJECT_ORDER: SubjectName[] = ['Physics', 'Chemistry', 'Mathematics'];

export class TestGeneratorService {
  public static orderSubjects(subjects: SubjectName[]): SubjectName[] {
    return CANONICAL_SUBJECT_ORDER.filter((s) => subjects.includes(s));
  }

  public static getDurationForSubjectCount(
    subjectCount: number,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG
  ): number {
    if (subjectCount === 1) return config.oneSubjectDurationSeconds;
    if (subjectCount === 2) return config.twoSubjectDurationSeconds;
    return config.threeSubjectDurationSeconds;
  }

  private static computeQuestionWeight(
    q: NormalizedQuestion,
    history: QuestionHistoryRecord | undefined,
    chapterWeaknessMap: Map<string, number>,
    weights: AdaptiveWeightConfig,
    mode: TestMode
  ): number {
    let base = weights.unseenWeight;
    if (history && history.attemptCount > 0) {
      if (history.masteryState === 'incorrect' || history.lastResult === 'incorrect') {
        base = weights.incorrectWeight;
      } else if (history.masteryState === 'corrected') {
        base = weights.correctedWeight;
      } else if (history.masteryState === 'mastered') {
        base = weights.masteredWeight;
      } else if (history.lastResult === 'correct') {
        base = weights.correctedWeight * 0.7;
      }
    }

    const chapKey = `${q.subject}::${q.chapter}`;
    const chapWeakness = chapterWeaknessMap.get(chapKey) || 0;
    if (chapWeakness > 0.4) {
      base *= mode === TestMode.ADAPTIVE_TEST ? weights.weakChapterBoost * 1.35 : weights.weakChapterBoost;
    }

    return Math.max(0.05, base);
  }

  private static selectBalancedQuestionsForSubject(
    pool: NormalizedQuestion[],
    targetCount: number,
    qType: 'mcq' | 'integer',
    historyMap: Record<string, QuestionHistoryRecord>,
    chapterWeaknessMap: Map<string, number>,
    weights: AdaptiveWeightConfig,
    mode: TestMode,
    rng: () => number,
    globalUsedIds: Set<string>,
    globalUsedFingerprints: Set<string>
  ): NormalizedQuestion[] {
    // Deduplicate candidate pool by both ID and normalized question content fingerprint
    const uniqueTypedPool: NormalizedQuestion[] = [];
    const localSeenIds = new Set<string>(globalUsedIds);
    const localSeenFingerprints = new Set<string>(globalUsedFingerprints);

    for (const q of pool) {
      if (q.type !== qType) continue;
      const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
      if (localSeenIds.has(q.id) || localSeenFingerprints.has(fp)) {
        continue;
      }
      localSeenIds.add(q.id);
      localSeenFingerprints.add(fp);
      uniqueTypedPool.push(q);
    }

    if (uniqueTypedPool.length <= targetCount) {
      return [...uniqueTypedPool];
    }

    // Group by chapter so we distribute evenly across selected chapters
    const byChap = new Map<string, NormalizedQuestion[]>();
    for (const q of uniqueTypedPool) {
      const list = byChap.get(q.chapter) || [];
      list.push(q);
      byChap.set(q.chapter, list);
    }

    const chapters = Array.from(byChap.keys());
    // Shuffle chapters deterministically
    chapters.sort(() => rng() - 0.5);

    // Difficulty targets
    const targetEasy = Math.round(targetCount * weights.targetDifficultyRatio.easy);
    const targetHard = Math.round(targetCount * weights.targetDifficultyRatio.hard);
    const targetMedium = Math.max(0, targetCount - targetEasy - targetHard);

    const diffQuota = {
      easy: targetEasy,
      medium: targetMedium,
      hard: targetHard,
    };

    const selectedIds = new Set<string>(globalUsedIds);
    const selectedFingerprints = new Set<string>(globalUsedFingerprints);
    const selected: NormalizedQuestion[] = [];

    // Weighted picker helper from a candidate array
    const pickWeighted = (candidates: NormalizedQuestion[]): NormalizedQuestion | null => {
      const available = candidates.filter((c) => {
        const fp = buildQuestionContentFingerprint(c.subject, c.question, c.options);
        return !selectedIds.has(c.id) && !selectedFingerprints.has(fp);
      });
      if (available.length === 0) return null;

      // Prefer questions matching remaining difficulty quota if possible
      const matchingDiff = available.filter((c) => diffQuota[c.difficulty] > 0);
      const activePool = matchingDiff.length > 0 ? matchingDiff : available;

      const itemWeights = activePool.map((c) =>
        this.computeQuestionWeight(c, historyMap[c.id], chapterWeaknessMap, weights, mode)
      );
      const totalWeight = itemWeights.reduce((acc, w) => acc + w, 0);
      let roll = rng() * totalWeight;

      for (let i = 0; i < activePool.length; i++) {
        roll -= itemWeights[i];
        if (roll <= 0) {
          return activePool[i];
        }
      }
      return activePool[activePool.length - 1];
    };

    // Round-robin across chapters to guarantee balanced chapter representation
    let safetyCounter = 0;
    while (selected.length < targetCount && safetyCounter < 500) {
      safetyCounter++;
      let addedInPass = false;
      for (const chap of chapters) {
        if (selected.length >= targetCount) break;
        const chapCandidates = byChap.get(chap) || [];
        const picked = pickWeighted(chapCandidates);
        if (picked) {
          const fp = buildQuestionContentFingerprint(picked.subject, picked.question, picked.options);
          selected.push(picked);
          selectedIds.add(picked.id);
          selectedFingerprints.add(fp);
          if (diffQuota[picked.difficulty] > 0) {
            diffQuota[picked.difficulty]--;
          }
          addedInPass = true;
        }
      }
      if (!addedInPass) break;
    }

    return selected;
  }

  public static generateTest(
    engine: QuestionBankEngine,
    request: TestGenerationRequest,
    historyMap: Record<string, QuestionHistoryRecord> = {}
  ): TestGenerationOutcome {
    const scoringConfig = request.scoringConfig || DEFAULT_SCORING_CONFIG;
    const adaptiveWeights = request.adaptiveWeights || DEFAULT_ADAPTIVE_WEIGHTS;
    const seed = request.seed || `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const rng = createSeededRandom(seed);

    const orderedSubjects = this.orderSubjects(
      request.mode === TestMode.FULL_SYLLABUS
        ? ['Physics', 'Chemistry', 'Mathematics']
        : request.selectedSubjects
    );

    if (orderedSubjects.length === 0) {
      return {
        success: false,
        error: 'Please select at least one subject (Physics, Chemistry, or Mathematics) to generate a test.',
      };
    }

    // Build chapter map per subject
    const effectiveChaptersBySubject: Partial<Record<SubjectName, string[]>> = {};
    const diag = engine.getDiagnostics();

    for (const sub of orderedSubjects) {
      if (request.mode === TestMode.FULL_SYLLABUS) {
        const allSubChapters = diag.chapterInventories
          .filter((c) => c.subject === sub)
          .map((c) => c.chapter);
        effectiveChaptersBySubject[sub] = allSubChapters;
      } else {
        const requestedChaps = request.chaptersBySubject?.[sub] || [];
        if (requestedChaps.length === 0) {
          return {
            success: false,
            error: `No chapters selected for ${sub}. Please select at least one chapter in ${sub} or deselect the subject.`,
          };
        }
        effectiveChaptersBySubject[sub] = requestedChaps;
      }
    }

    // Compute chapter weakness map from history
    const chapterWeaknessMap = new Map<string, number>();
    const chapMistakeCounts = new Map<string, { wrong: number; total: number }>();
    for (const rec of Object.values(historyMap)) {
      const key = `${rec.subject}::${rec.chapter}`;
      const cur = chapMistakeCounts.get(key) || { wrong: 0, total: 0 };
      cur.total += rec.attemptCount;
      cur.wrong += rec.incorrectCount;
      chapMistakeCounts.set(key, cur);
    }
    for (const [key, val] of chapMistakeCounts.entries()) {
      if (val.total > 0) {
        chapterWeaknessMap.set(key, val.wrong / val.total);
      }
    }

    // Handle Dedicated Wrong-Question Retest Mode (Strict Exclusion of Correct Questions)
    if (request.mode === TestMode.WRONG_QUESTION_RETEST) {
      const correctQuestionIds = new Set<string>();
      const incorrectQuestionIds = new Set<string>();

      for (const rec of Object.values(historyMap)) {
        if (rec.lastResult === 'correct' || rec.masteryState === 'corrected' || rec.masteryState === 'mastered') {
          correctQuestionIds.add(rec.questionId);
        } else if (rec.lastResult === 'incorrect' || rec.masteryState === 'incorrect') {
          incorrectQuestionIds.add(rec.questionId);
        }
      }

      const allocations: TestQuestionAllocation[] = [];
      const retestUsedIds = new Set<string>();
      const retestUsedFingerprints = new Set<string>();
      let orderCounter = 1;

      for (const sub of orderedSubjects) {
        const allowedChapters = new Set(effectiveChaptersBySubject[sub] || []);
        const subPool = engine
          .getQuestionsBySubject(sub)
          .filter((q) => {
            const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
            return (
              allowedChapters.has(q.chapter) &&
              incorrectQuestionIds.has(q.id) &&
              !correctQuestionIds.has(q.id) &&
              !retestUsedIds.has(q.id) &&
              !retestUsedFingerprints.has(fp)
            );
          });

        const mcqs = subPool.filter((q) => q.type === 'mcq').slice(0, scoringConfig.mcqCountPerSubject);
        const ints = subPool.filter((q) => q.type === 'integer').slice(0, scoringConfig.integerCountPerSubject);

        for (const q of [...mcqs, ...ints]) {
          const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
          if (retestUsedIds.has(q.id) || retestUsedFingerprints.has(fp)) continue;
          retestUsedIds.add(q.id);
          retestUsedFingerprints.add(fp);
          allocations.push({
            questionId: q.id,
            order: orderCounter++,
            subject: q.subject,
            chapter: q.chapter,
            type: q.type,
            difficulty: q.difficulty,
          });
        }
      }

      if (allocations.length === 0) {
        return {
          success: false,
          error:
            'No previously incorrect questions are remaining in the selected chapters. All attempted questions in this selection have been answered correctly.',
        };
      }

      const requestedStandardTotal =
        orderedSubjects.length * (scoringConfig.mcqCountPerSubject + scoringConfig.integerCountPerSubject);
      const noticeMessage =
        allocations.length < requestedStandardTotal
          ? `Only ${allocations.length} previous mistake${allocations.length === 1 ? ' is' : 's are'} available in the selected chapter(s). All previously correct questions have been strictly excluded.`
          : 'Dedicated Mistake Retest: Contains only questions you previously answered incorrectly.';

      const durationSeconds = Math.max(
        900,
        Math.round((allocations.length / 25) * scoringConfig.oneSubjectDurationSeconds)
      );

      const test = this.constructTestEntity(
        request,
        orderedSubjects,
        effectiveChaptersBySubject,
        allocations,
        durationSeconds,
        diag.version,
        seed,
        scoringConfig,
        noticeMessage
      );

      return { success: true, test };
    }

    // Standard Full Syllabus, Chapter Test, or Adaptive Test
    const inventoryDetails: TestGenerationOutcome['inventoryDetails'] = [];
    let hasInventoryShortfall = false;

    for (const sub of orderedSubjects) {
      const allowedChapters = new Set(effectiveChaptersBySubject[sub] || []);
      const subQuestions = engine
        .getQuestionsBySubject(sub)
        .filter((q) => allowedChapters.has(q.chapter));

      const availMcq = subQuestions.filter((q) => q.type === 'mcq').length;
      const availInt = subQuestions.filter((q) => q.type === 'integer').length;

      inventoryDetails.push({
        subject: sub,
        availableMcq: availMcq,
        requiredMcq: scoringConfig.mcqCountPerSubject,
        availableInteger: availInt,
        requiredInteger: scoringConfig.integerCountPerSubject,
      });

      if (
        availMcq < scoringConfig.mcqCountPerSubject ||
        availInt < scoringConfig.integerCountPerSubject
      ) {
        hasInventoryShortfall = true;
      }
    }

    if (hasInventoryShortfall && !request.allowFlexibleCount) {
      const shortfallMessages = inventoryDetails
        .filter(
          (d) => d.availableMcq < d.requiredMcq || d.availableInteger < d.requiredInteger
        )
        .map(
          (d) =>
            `${d.subject} selection currently has ${d.availableMcq} valid MCQs and ${d.availableInteger} valid Integer questions (Requested: ${d.requiredMcq} MCQs + ${d.requiredInteger} Integer).`
        )
        .join(' ');

      return {
        success: false,
        error: `Not enough valid questions are available in the selected chapter(s) to create the standard ${orderedSubjects.length * 25}-question test. ${shortfallMessages}`,
        inventoryDetails,
      };
    }

    // Select questions per subject in canonical order: Physics -> Chemistry -> Mathematics
    const allocations: TestQuestionAllocation[] = [];
    const globalUsedIds = new Set<string>();
    const globalUsedFingerprints = new Set<string>();
    let orderCounter = 1;

    for (const sub of orderedSubjects) {
      const allowedChapters = new Set(effectiveChaptersBySubject[sub] || []);
      const subPool = engine
        .getQuestionsBySubject(sub)
        .filter((q) => {
          const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
          return (
            allowedChapters.has(q.chapter) &&
            !globalUsedIds.has(q.id) &&
            !globalUsedFingerprints.has(fp)
          );
        });

      const selectedMcqs = this.selectBalancedQuestionsForSubject(
        subPool,
        scoringConfig.mcqCountPerSubject,
        'mcq',
        historyMap,
        chapterWeaknessMap,
        adaptiveWeights,
        request.mode,
        rng,
        globalUsedIds,
        globalUsedFingerprints
      );

      for (const q of selectedMcqs) {
        globalUsedIds.add(q.id);
        globalUsedFingerprints.add(
          buildQuestionContentFingerprint(q.subject, q.question, q.options)
        );
      }

      const selectedInts = this.selectBalancedQuestionsForSubject(
        subPool,
        scoringConfig.integerCountPerSubject,
        'integer',
        historyMap,
        chapterWeaknessMap,
        adaptiveWeights,
        request.mode,
        rng,
        globalUsedIds,
        globalUsedFingerprints
      );

      for (const q of selectedInts) {
        globalUsedIds.add(q.id);
        globalUsedFingerprints.add(
          buildQuestionContentFingerprint(q.subject, q.question, q.options)
        );
      }

      for (const q of [...selectedMcqs, ...selectedInts]) {
        allocations.push({
          questionId: q.id,
          order: orderCounter++,
          subject: q.subject,
          chapter: q.chapter,
          type: q.type,
          difficulty: q.difficulty,
        });
      }
    }

    // Strict Pre-Test Validation Gate (Section 4)
    const validationError = this.validateGeneratedAllocations(
      allocations,
      orderedSubjects,
      effectiveChaptersBySubject,
      engine
    );
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const durationSeconds = this.getDurationForSubjectCount(orderedSubjects.length, scoringConfig);
    const noticeMessage = hasInventoryShortfall
      ? `Configured with available chapter inventory (${allocations.length} questions).`
      : undefined;

    const test = this.constructTestEntity(
      request,
      orderedSubjects,
      effectiveChaptersBySubject,
      allocations,
      durationSeconds,
      diag.version,
      seed,
      scoringConfig,
      noticeMessage
    );

    return { success: true, test };
  }

  private static validateGeneratedAllocations(
    allocations: TestQuestionAllocation[],
    selectedSubjects: SubjectName[],
    chaptersBySubject: Partial<Record<SubjectName, string[]>>,
    engine: QuestionBankEngine
  ): string | null {
    if (allocations.length === 0) {
      return 'Generated question set is empty.';
    }
    const allowedSubjects = new Set(selectedSubjects);
    const seenIds = new Set<string>();
    const seenFingerprints = new Set<string>();

    for (const item of allocations) {
      if (seenIds.has(item.questionId)) {
        return `Validation failed: Duplicate question ID "${item.questionId}" in generated test.`;
      }
      seenIds.add(item.questionId);

      const q = engine.getQuestionById(item.questionId);
      if (!q) {
        return `Validation failed: Question "${item.questionId}" does not exist in the question bank.`;
      }
      const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
      if (seenFingerprints.has(fp)) {
        return `Validation failed: Duplicate question content detected for "${q.id}" in generated test.`;
      }
      seenFingerprints.add(fp);
      if (!allowedSubjects.has(q.subject)) {
        return `Validation failed: Question "${q.id}" belongs to unselected subject "${q.subject}".`;
      }
      const allowedChaps = new Set(chaptersBySubject[q.subject] || []);
      if (!allowedChaps.has(q.chapter)) {
        return `Validation failed: Question "${q.id}" belongs to unselected chapter "${q.chapter}" in ${q.subject}.`;
      }
      if (q.type !== 'mcq' && q.type !== 'integer') {
        return `Validation failed: Question "${q.id}" has invalid type "${q.type}".`;
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === '') {
        return `Validation failed: Question "${q.id}" is missing a verified answer key.`;
      }
    }
    return null;
  }

  private static constructTestEntity(
    request: TestGenerationRequest,
    orderedSubjects: SubjectName[],
    chaptersBySubject: Partial<Record<SubjectName, string[]>>,
    allocations: TestQuestionAllocation[],
    durationSeconds: number,
    questionBankVersion: string,
    seed: string,
    scoringConfig: ScoringConfig,
    noticeMessage?: string
  ): GeneratedTest {
    const testId = `TEST-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const responses: Record<string, QuestionResponseState> = {};
    const nowIso = new Date().toISOString();

    for (let i = 0; i < allocations.length; i++) {
      const alloc = allocations[i];
      responses[alloc.questionId] = {
        questionId: alloc.questionId,
        answer: null,
        status: i === 0 ? QuestionPaletteStatus.VISITED : QuestionPaletteStatus.NOT_VISITED,
        markedForReview: false,
        visited: i === 0,
        timeSpentSeconds: 0,
        lastUpdatedAt: nowIso,
      };
    }

    let title = 'JEE Full Syllabus Mock Examination';
    if (request.mode === TestMode.CHAPTER_TEST) {
      const totalChaps = Object.values(chaptersBySubject).reduce(
        (sum, arr) => sum + (arr ? arr.length : 0),
        0
      );
      title = `${orderedSubjects.join(' + ')} Chapter Test (${totalChaps} Chapter${totalChaps === 1 ? '' : 's'})`;
    } else if (request.mode === TestMode.WRONG_QUESTION_RETEST) {
      title = `${orderedSubjects.join(' + ')} Mistake Retest`;
    } else if (request.mode === TestMode.ADAPTIVE_TEST) {
      title = `${orderedSubjects.join(' + ')} Adaptive Weakness Practice`;
    }

    return {
      id: testId,
      userId: request.userId,
      title,
      mode: request.mode,
      subjects: orderedSubjects,
      chaptersBySubject,
      startTime: nowIso,
      durationSeconds,
      status: TestStatus.IN_PROGRESS,
      questionBankVersion,
      generationSeed: seed,
      questions: allocations,
      responses,
      currentQuestionOrder: 1,
      activeSubject: orderedSubjects[0],
      noticeMessage,
      scoringConfig,
    };
  }
}
