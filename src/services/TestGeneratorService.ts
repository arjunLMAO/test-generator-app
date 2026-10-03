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
  buildQuestionTemplateSignature,
  classifyQuestionCategory,
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
  targetQuestionIds?: string[];
  sourceAttemptId?: string;
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

    // Prefer authentic multi-source imported JEE questions over baseline seed questions when both exist
    if (q.sourceFile && q.sourceFile.includes('imported/')) {
      base *= 1.35;
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
    globalUsedFingerprints: Set<string>,
    globalUsedTemplates: Set<string> = new Set(),
    maxPerCategory = 2,
    constraints?: {
      maxQuadraticCount?: number;
      currentQuadraticRef?: { count: number };
      minReactionBased?: number;
    }
  ): NormalizedQuestion[] {
    // Deduplicate candidate pool by ID, content fingerprint, AND structural equation template signature
    const uniqueTypedPool: NormalizedQuestion[] = [];
    const localSeenIds = new Set<string>(globalUsedIds);
    const localSeenFingerprints = new Set<string>(globalUsedFingerprints);
    const localSeenTemplates = new Set<string>(globalUsedTemplates);

    for (const q of pool) {
      if (q.type !== qType) continue;
      const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
      const tmpl =
        q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question);
      if (
        localSeenIds.has(q.id) ||
        localSeenFingerprints.has(fp) ||
        localSeenTemplates.has(tmpl)
      ) {
        continue;
      }
      localSeenIds.add(q.id);
      localSeenFingerprints.add(fp);
      localSeenTemplates.add(tmpl);
      uniqueTypedPool.push(q);
    }

    // Group by chapter and then categorically by question category
    const byChap = new Map<string, NormalizedQuestion[]>();
    for (const q of uniqueTypedPool) {
      const list = byChap.get(q.chapter) || [];
      list.push(q);
      byChap.set(q.chapter, list);
    }

    const minReactionRequired = constraints?.minReactionBased || 0;
    const chapters = Array.from(byChap.keys());
    if (minReactionRequired > 0) {
      chapters.sort((c1, c2) => {
        const c1HasRx = (byChap.get(c1) || []).some(
          (q) => q.isReactionBased || (q.tags && q.tags.includes('reaction-based'))
        );
        const c2HasRx = (byChap.get(c2) || []).some(
          (q) => q.isReactionBased || (q.tags && q.tags.includes('reaction-based'))
        );
        if (c1HasRx && !c2HasRx) return -1;
        if (!c1HasRx && c2HasRx) return 1;
        return rng() - 0.5;
      });
    } else {
      chapters.sort(() => rng() - 0.5);
    }

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
    const selectedTemplates = new Set<string>(globalUsedTemplates);
    const categoryCounts = new Map<string, number>();
    const selected: NormalizedQuestion[] = [];
    let reactionSelectedCount = 0;

    const getCategory = (q: NormalizedQuestion): string =>
      q.category ||
      classifyQuestionCategory(q.subject, q.chapter, q.topic, q.question, q.options);

    const getTemplate = (q: NormalizedQuestion): string =>
      q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question);

    // Weighted picker helper that strictly enforces current category ceiling (Pass 1: max 1, Pass 2: max 2)
    // and strictly enforces MAX 1 per structural equation template signature,
    // plus hard quadratic ceiling and organic reaction quota
    const pickWeightedWithCategoryCap = (
      candidates: NormalizedQuestion[],
      currentCategoryCap: number
    ): NormalizedQuestion | null => {
      const available = candidates.filter((c) => {
        const fp = buildQuestionContentFingerprint(c.subject, c.question, c.options);
        const tmpl = getTemplate(c);
        const cat = getCategory(c);
        const catUsed = categoryCounts.get(cat) || 0;

        // Hard Quadratic constraint: exclude if limit reached
        if (
          constraints?.maxQuadraticCount !== undefined &&
          constraints?.currentQuadraticRef &&
          constraints.currentQuadraticRef.count >= constraints.maxQuadraticCount &&
          (c.chapter === 'Quadratic Equations' || cat.includes('Quadratic Equations'))
        ) {
          return false;
        }

        return (
          !selectedIds.has(c.id) &&
          !selectedFingerprints.has(fp) &&
          !selectedTemplates.has(tmpl) &&
          catUsed < currentCategoryCap
        );
      });
      if (available.length === 0) return null;

      // If we still need reaction-based questions in Chemistry, prioritize reaction questions!
      let reactionPool = available;
      if (reactionSelectedCount < minReactionRequired) {
        const rxOnly = available.filter(
          (c) => c.isReactionBased || (c.tags && c.tags.includes('reaction-based'))
        );
        if (rxOnly.length > 0) {
          reactionPool = rxOnly;
        } else if (currentCategoryCap === 1) {
          // In Pass 1, reserve slots for reaction chapters first
          return null;
        }
      }

      // Prefer categories with 0 selected so far, then matching difficulty quota
      const zeroCatPool = reactionPool.filter((c) => (categoryCounts.get(getCategory(c)) || 0) === 0);
      const basePool = zeroCatPool.length > 0 ? zeroCatPool : reactionPool;
      const matchingDiff = basePool.filter((c) => diffQuota[c.difficulty] > 0);
      const activePool = matchingDiff.length > 0 ? matchingDiff : basePool;

      const itemWeights = activePool.map((c) => {
        let w = this.computeQuestionWeight(c, historyMap[c.id], chapterWeaknessMap, weights, mode);
        // Conceptual boost for hard & very-hard reasoning questions
        if (c.difficulty === 'hard') w *= 1.4;
        if (c.isReactionBased) w *= 1.3;
        if (c.isMultiConcept) w *= 1.25;
        return w;
      });
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

    // Pass 1: Strictly at most 1 question per category across chapters
    // Pass 2: Up to maxPerCategory (2) questions per category across chapters (never exceeding 2!)
    for (let cap = 1; cap <= maxPerCategory; cap++) {
      let safetyCounter = 0;
      while (selected.length < targetCount && safetyCounter < 300) {
        safetyCounter++;
        let addedInPass = false;
        for (const chap of chapters) {
          if (selected.length >= targetCount) break;
          const chapCandidates = byChap.get(chap) || [];
          const picked = pickWeightedWithCategoryCap(chapCandidates, cap);
          if (picked) {
            const fp = buildQuestionContentFingerprint(
              picked.subject,
              picked.question,
              picked.options
            );
            const tmpl = getTemplate(picked);
            const cat = getCategory(picked);

            selected.push(picked);
            selectedIds.add(picked.id);
            selectedFingerprints.add(fp);
            selectedTemplates.add(tmpl);
            categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);

            if (picked.isReactionBased || (picked.tags && picked.tags.includes('reaction-based'))) {
              reactionSelectedCount++;
            }

            if (
              picked.chapter === 'Quadratic Equations' ||
              cat.includes('Quadratic Equations')
            ) {
              if (constraints?.currentQuadraticRef) {
                constraints.currentQuadraticRef.count++;
              }
            }

            if (diffQuota[picked.difficulty] > 0) {
              diffQuota[picked.difficulty]--;
            }
            addedInPass = true;
          }
        }
        if (!addedInPass) break;
      }
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
    const diag = engine.getDiagnostics();

    // Handle Dedicated Wrong-Question Retest Mode FIRST (Parts 16–32: Strict Exclusion of Correct Questions & Exact Attempt Mistakes)
    if (request.mode === TestMode.WRONG_QUESTION_RETEST) {
      let candidateMistakeIds: string[] = [];

      if (request.targetQuestionIds && request.targetQuestionIds.length > 0) {
        // Explicit list of wrong question IDs (e.g. from a completed test attempt, chapter card, or single question review)
        candidateMistakeIds = Array.from(new Set(request.targetQuestionIds.map((id) => String(id).trim()).filter(Boolean)));
      } else {
        // Gather from persistent historyMap filtered by requested subjects & chapters
        const allowedSubSet =
          request.selectedSubjects && request.selectedSubjects.length > 0
            ? new Set(request.selectedSubjects)
            : null;

        const activeMistakeIds: string[] = [];
        const historicalMistakeIds: string[] = [];

        for (const rec of Object.values(historyMap)) {
          if (allowedSubSet && !allowedSubSet.has(rec.subject)) continue;
          const allowedChaps = request.chaptersBySubject?.[rec.subject];
          if (allowedChaps && allowedChaps.length > 0 && !allowedChaps.includes(rec.chapter)) {
            continue;
          }

          if (rec.lastResult === 'incorrect' || rec.masteryState === 'incorrect') {
            activeMistakeIds.push(rec.questionId);
          } else if (rec.incorrectCount > 0 && rec.lastResult !== 'correct') {
            historicalMistakeIds.push(rec.questionId);
          }
        }

        candidateMistakeIds = Array.from(
          new Set(activeMistakeIds.length > 0 ? activeMistakeIds : historicalMistakeIds)
        );
      }

      if (candidateMistakeIds.length === 0) {
        return {
          success: false,
          error: 'No mistakes to retest in this selection.',
        };
      }

      // Validate each question exists in the question bank and deduplicate by ID + content fingerprint (Parts 31 & 32)
      const validRetestQuestions: NormalizedQuestion[] = [];
      const seenIds = new Set<string>();
      const seenFingerprints = new Set<string>();

      for (const qid of candidateMistakeIds) {
        if (seenIds.has(qid)) continue;
        const q = engine.getQuestionById(qid);
        if (!q) {
          // Skip unavailable question gracefully (Part 31)
          continue;
        }
        const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
        if (seenFingerprints.has(fp)) continue;

        seenIds.add(q.id);
        seenFingerprints.add(fp);
        validRetestQuestions.push(q);
      }

      if (validRetestQuestions.length === 0) {
        return {
          success: false,
          error: 'These questions are no longer available in the question bank.',
        };
      }

      // Group and order by canonical subject order (Physics -> Chemistry -> Mathematics)
      const retestSubjects = this.orderSubjects(
        Array.from(new Set(validRetestQuestions.map((q) => q.subject)))
      );
      const retestChaptersBySub: Partial<Record<SubjectName, string[]>> = {};
      const allocations: TestQuestionAllocation[] = [];
      let orderCounter = 1;
      let mcqTotal = 0;
      let intTotal = 0;

      for (const sub of retestSubjects) {
        const subQs = validRetestQuestions.filter((q) => q.subject === sub);
        const subMcqs = subQs.filter((q) => q.type === 'mcq');
        const subInts = subQs.filter((q) => q.type === 'integer');
        const orderedSubQs = [...subMcqs, ...subInts];

        retestChaptersBySub[sub] = Array.from(new Set(orderedSubQs.map((q) => q.chapter)));

        for (const q of orderedSubQs) {
          if (q.type === 'mcq') mcqTotal++;
          else intTotal++;

          allocations.push({
            questionId: q.id,
            order: orderCounter++,
            subject: q.subject,
            chapter: q.chapter,
            type: q.type,
            difficulty: q.difficulty,
            category: q.category,
            templateSignature: q.templateSignature,
          });
        }
      }

      // Appropriate duration scaled to the exact retest questions (Part 24):
      // 2.5 minutes (150s) per MCQ, 3 minutes (180s) per Numerical/Integer, minimum 3 minutes (180s)
      const durationSeconds = Math.max(180, mcqTotal * 150 + intTotal * 180);

      const noticeMessage = `Mistake Retest · ${allocations.length} question${
        allocations.length === 1 ? '' : 's'
      } you previously missed · Fresh attempt`;

      const test = this.constructTestEntity(
        request,
        retestSubjects,
        retestChaptersBySub,
        allocations,
        durationSeconds,
        diag.version,
        seed,
        scoringConfig,
        noticeMessage
      );

      return { success: true, test };
    }

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
    const globalUsedTemplates = new Set<string>();
    let orderCounter = 1;

    for (const sub of orderedSubjects) {
      const allowedChapters = new Set(effectiveChaptersBySubject[sub] || []);
      const subPool = engine
        .getQuestionsBySubject(sub)
        .filter((q) => {
          const fp = buildQuestionContentFingerprint(q.subject, q.question, q.options);
          const tmpl =
            q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question);
          return (
            allowedChapters.has(q.chapter) &&
            !globalUsedIds.has(q.id) &&
            !globalUsedFingerprints.has(fp) &&
            !globalUsedTemplates.has(tmpl)
          );
        });

      // Hard mode special constraints:
      // 1. In mixed Mathematics tests, at most 1 Quadratic Equations question unless specifically testing that chapter alone.
      const isMixedMath =
        sub === 'Mathematics' && (effectiveChaptersBySubject[sub] || []).length > 1;
      const quadraticRef = { count: 0 };
      const maxQuadraticCount = isMixedMath ? 1 : undefined;

      // 2. In full Chemistry mocks (or multi-chapter organic tests), ensure at least 8 reaction-based organic questions.
      const isFullOrMultiChemistry =
        sub === 'Chemistry' && (effectiveChaptersBySubject[sub] || []).length >= 5;
      const targetMcqReaction = isFullOrMultiChemistry ? 7 : 0;

      const subConstraints = {
        maxQuadraticCount,
        currentQuadraticRef: quadraticRef,
        minReactionBased: targetMcqReaction,
      };

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
        globalUsedFingerprints,
        globalUsedTemplates,
        2,
        subConstraints
      );

      for (const q of selectedMcqs) {
        globalUsedIds.add(q.id);
        globalUsedFingerprints.add(
          buildQuestionContentFingerprint(q.subject, q.question, q.options)
        );
        globalUsedTemplates.add(
          q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question)
        );
      }

      const mcqReactionCount = selectedMcqs.filter(
        (q) => q.isReactionBased || (q.tags && q.tags.includes('reaction-based'))
      ).length;

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
        globalUsedFingerprints,
        globalUsedTemplates,
        2,
        {
          maxQuadraticCount,
          currentQuadraticRef: quadraticRef,
          minReactionBased: isFullOrMultiChemistry ? Math.max(2, 8 - mcqReactionCount) : 0,
        }
      );

      for (const q of selectedInts) {
        globalUsedIds.add(q.id);
        globalUsedFingerprints.add(
          buildQuestionContentFingerprint(q.subject, q.question, q.options)
        );
        globalUsedTemplates.add(
          q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question)
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
          category: q.category,
          templateSignature: q.templateSignature,
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
    const seenTemplates = new Set<string>();
    const categoryCounts = new Map<string, number>();

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

      const tmpl =
        q.templateSignature || buildQuestionTemplateSignature(q.subject, q.chapter, q.question);
      if (seenTemplates.has(tmpl)) {
        return `Validation failed: Structural template duplicate detected for "${q.id}" in generated test.`;
      }
      seenTemplates.add(tmpl);

      const catKey = `${q.type}::${
        q.category || classifyQuestionCategory(q.subject, q.chapter, q.topic, q.question, q.options)
      }`;
      const nextCatCount = (categoryCounts.get(catKey) || 0) + 1;
      if (nextCatCount > 2) {
        return `Validation failed: Question category "${catKey}" exceeded maximum allowed limit of 2 questions per test.`;
      }
      categoryCounts.set(catKey, nextCatCount);
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

    // Special hard constraints validation
    const mathChapters = chaptersBySubject['Mathematics'] || [];
    if (mathChapters.length > 1) {
      const quadraticCount = allocations.filter(
        (a) => a.subject === 'Mathematics' && a.chapter === 'Quadratic Equations'
      ).length;
      if (quadraticCount > 1) {
        return `Validation failed: Mixed Mathematics test cannot contain more than 1 Quadratic Equations question (found ${quadraticCount}).`;
      }
    }

    const chemChapters = chaptersBySubject['Chemistry'] || [];
    if (chemChapters.length >= 10) {
      const reactionCount = allocations.filter((a) => {
        if (a.subject !== 'Chemistry') return false;
        const q = engine.getQuestionById(a.questionId);
        return q && (q.isReactionBased || (q.tags && q.tags.includes('reaction-based')));
      }).length;
      if (reactionCount < 8) {
        return `Validation failed: Full Chemistry mock requires at least 8 reaction-based organic chemistry questions (found ${reactionCount}).`;
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
      title = `${orderedSubjects.join(' + ')} Mistake Retest (${allocations.length} Question${
        allocations.length === 1 ? '' : 's'
      })`;
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
      sourceAttemptId: request.sourceAttemptId,
    };
  }
}
