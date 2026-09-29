import {
  ChapterInventory,
  DifficultyLevel,
  ErrorCategory,
  NormalizedQuestion,
  QuestionBankDiagnostics,
  QuestionType,
  QuestionValidationIssue,
  SubjectName,
} from '../types/jee';

export interface RawFilePayload {
  filePath: string;
  content: unknown;
  rawBaseUrl?: string;
}

function normalizeSubject(raw: unknown, filePath: string): SubjectName | null {
  const str = String(raw || '').trim().toLowerCase();
  const pathLower = filePath.toLowerCase();

  if (str.includes('phys') || str === 'p' || pathLower.includes('physics') || pathLower.includes('/phy')) {
    return 'Physics';
  }
  if (str.includes('chem') || str === 'c' || pathLower.includes('chemistry') || pathLower.includes('/chm')) {
    return 'Chemistry';
  }
  if (
    str.includes('math') ||
    str === 'm' ||
    pathLower.includes('mathematics') ||
    pathLower.includes('/math') ||
    pathLower.includes('/mat')
  ) {
    return 'Mathematics';
  }
  return null;
}

function normalizeDifficulty(raw: unknown): DifficultyLevel {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'easy' || s === '1' || s === 'low' || s === 'basic') return 'easy';
  if (s === 'hard' || s === '3' || s === 'high' || s === 'advanced' || s === 'tough') return 'hard';
  return 'medium';
}

function normalizeQuestionType(rawType: unknown, hasOptions: boolean, rawAnswer: unknown): QuestionType | null {
  const s = String(rawType || '').trim().toLowerCase();
  if (s === 'mcq' || s === 'single_choice' || s === 'multiple_choice' || s === 'objective' || s === 'scq') {
    return 'mcq';
  }
  if (
    s === 'integer' ||
    s === 'numerical' ||
    s === 'nat' ||
    s === 'numeric' ||
    s === 'int' ||
    s === 'subjective_integer'
  ) {
    return 'integer';
  }
  if (hasOptions) return 'mcq';
  if (rawAnswer !== undefined && rawAnswer !== null && !Number.isNaN(Number(rawAnswer))) {
    return 'integer';
  }
  return null;
}

function extractOptions(record: Record<string, any>): [string, string, string, string] | null {
  const rawOpts = record.options ?? record.choices ?? record.optionList ?? record.answers;
  if (Array.isArray(rawOpts) && rawOpts.length === 4) {
    const mapped = rawOpts.map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item).trim();
      }
      if (item && typeof item === 'object') {
        return String(item.text ?? item.label ?? item.value ?? item.content ?? '').trim();
      }
      return '';
    });
    if (mapped.every((m) => m.length > 0)) {
      return mapped as [string, string, string, string];
    }
  } else if (rawOpts && typeof rawOpts === 'object' && !Array.isArray(rawOpts)) {
    const a = rawOpts.A ?? rawOpts.a ?? rawOpts['1'] ?? rawOpts.optionA;
    const b = rawOpts.B ?? rawOpts.b ?? rawOpts['2'] ?? rawOpts.optionB;
    const c = rawOpts.C ?? rawOpts.c ?? rawOpts['3'] ?? rawOpts.optionC;
    const d = rawOpts.D ?? rawOpts.d ?? rawOpts['4'] ?? rawOpts.optionD;
    if (a !== undefined && b !== undefined && c !== undefined && d !== undefined) {
      return [String(a).trim(), String(b).trim(), String(c).trim(), String(d).trim()];
    }
  }

  // Check top-level optionA / optionB / optionC / optionD
  const optA = record.optionA ?? record.optA ?? record.A;
  const optB = record.optionB ?? record.optB ?? record.B;
  const optC = record.optionC ?? record.optC ?? record.C;
  const optD = record.optionD ?? record.optD ?? record.D;
  if (optA !== undefined && optB !== undefined && optC !== undefined && optD !== undefined) {
    return [String(optA).trim(), String(optB).trim(), String(optC).trim(), String(optD).trim()];
  }

  return null;
}

function normalizeMcqAnswer(
  rawAns: unknown,
  options: [string, string, string, string] | null
): 'A' | 'B' | 'C' | 'D' | null {
  if (rawAns === undefined || rawAns === null) return null;
  const str = String(rawAns).trim().toUpperCase();
  if (str === 'A' || str === 'B' || str === 'C' || str === 'D') {
    return str;
  }
  if (str === '0' && typeof rawAns === 'number') return 'A';
  if (str === '1' && typeof rawAns === 'number') return 'B';
  if (str === '2' && typeof rawAns === 'number') return 'C';
  if (str === '3' && typeof rawAns === 'number') return 'D';
  if (str === 'OPTION A' || str === '(A)') return 'A';
  if (str === 'OPTION B' || str === '(B)') return 'B';
  if (str === 'OPTION C' || str === '(C)') return 'C';
  if (str === 'OPTION D' || str === '(D)') return 'D';

  // Match against option text
  if (options) {
    const idx = options.findIndex((o) => o.trim().toLowerCase() === String(rawAns).trim().toLowerCase());
    if (idx === 0) return 'A';
    if (idx === 1) return 'B';
    if (idx === 2) return 'C';
    if (idx === 3) return 'D';
  }
  return null;
}

function inferChapterFromFilename(filePath: string): string {
  const base = filePath.split(/[/\\]/).pop() || '';
  const withoutExt = base.replace(/\.json$/i, '');
  if (!withoutExt || withoutExt === 'questions' || withoutExt === 'index' || withoutExt === 'bank') {
    return '';
  }
  return withoutExt
    .split(/[-_]+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export class QuestionBankEngine {
  private questions: NormalizedQuestion[] = [];
  private byId = new Map<string, NormalizedQuestion>();
  private bySubject = new Map<SubjectName, NormalizedQuestion[]>();
  private byChapter = new Map<string, NormalizedQuestion[]>();
  private byType = new Map<QuestionType, NormalizedQuestion[]>();
  private byDifficulty = new Map<DifficultyLevel, NormalizedQuestion[]>();
  private diagnostics: QuestionBankDiagnostics;

  constructor(files: RawFilePayload[] = []) {
    this.diagnostics = this.createEmptyDiagnostics();
    if (files.length > 0) {
      this.ingestFiles(files);
    }
  }

  private createEmptyDiagnostics(): QuestionBankDiagnostics {
    return {
      version: 'v1.0.0-empty',
      loadedAt: new Date().toISOString(),
      filesScanned: 0,
      totalRawRecords: 0,
      validQuestionsCount: 0,
      invalidQuestionsCount: 0,
      warningsCount: 0,
      bySubject: {
        Physics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
        Chemistry: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
        Mathematics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      },
      chapterInventories: [],
      duplicateIds: [],
      missingSolutionsCount: 0,
      brokenImagesCount: 0,
      issues: [],
    };
  }

  public ingestFiles(files: RawFilePayload[]): QuestionBankDiagnostics {
    this.questions = [];
    this.byId.clear();
    this.bySubject.clear();
    this.byChapter.clear();
    this.byType.clear();
    this.byDifficulty.clear();

    const issues: QuestionValidationIssue[] = [];
    const duplicateIds: string[] = [];
    let totalRawRecords = 0;
    let missingSolutionsCount = 0;
    let brokenImagesCount = 0;

    const extractRawRecords = (
      node: any,
      filePath: string,
      inheritedSubject?: string,
      inheritedChapter?: string
    ): Array<{ raw: Record<string, any>; filePath: string; inheritedSubject?: string; inheritedChapter?: string }> => {
      if (!node) return [];
      if (Array.isArray(node)) {
        return node
          .filter((item) => item && typeof item === 'object')
          .map((raw) => ({ raw, filePath, inheritedSubject, inheritedChapter }));
      }
      if (typeof node === 'object') {
        const sub = node.subject ?? node.discipline ?? inheritedSubject;
        const chap = node.chapter ?? node.chapterName ?? node.unit ?? inheritedChapter;
        const arrCandidate = node.questions ?? node.items ?? node.data ?? node.records ?? node.problems;
        if (Array.isArray(arrCandidate)) {
          return extractRawRecords(arrCandidate, filePath, sub, chap);
        }
        // Check if it's a single question object directly
        if (node.question || node.questionText || node.statement || node.prompt) {
          return [{ raw: node, filePath, inheritedSubject: sub, inheritedChapter: chap }];
        }
        // Otherwise could be a map of chapters or subjects
        const collected: Array<{
          raw: Record<string, any>;
          filePath: string;
          inheritedSubject?: string;
          inheritedChapter?: string;
        }> = [];
        for (const [key, val] of Object.entries(node)) {
          if (Array.isArray(val) || (val && typeof val === 'object')) {
            const keyAsSub = normalizeSubject(key, '');
            collected.push(
              ...extractRawRecords(
                val,
                filePath,
                keyAsSub || sub,
                keyAsSub ? chap : key
              )
            );
          }
        }
        return collected;
      }
      return [];
    };

    for (const file of files) {
      const extracted = extractRawRecords(file.content, file.filePath);
      for (let idx = 0; idx < extracted.length; idx++) {
        totalRawRecords++;
        const { raw, filePath, inheritedSubject, inheritedChapter } = extracted[idx];

        const rawId =
          raw.id ??
          raw.questionId ??
          raw.qId ??
          raw._id ??
          raw.code ??
          `${filePath.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`;
        const id = String(rawId).trim();

        const subject = normalizeSubject(raw.subject ?? inheritedSubject, filePath);
        if (!subject) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'invalid_subject',
            message: `Question "${id}" has an unrecognized or missing subject.`,
            severity: 'error',
          });
          continue;
        }

        const chapterRaw = raw.chapter ?? raw.chapterName ?? raw.unit ?? inheritedChapter ?? inferChapterFromFilename(filePath);
        const chapter = String(chapterRaw || '').trim();
        if (!chapter) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_chapter',
            message: `Question "${id}" is missing a chapter name.`,
            severity: 'error',
          });
          continue;
        }

        if (this.byId.has(id)) {
          duplicateIds.push(id);
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'duplicate_id',
            message: `Duplicate question ID "${id}" detected in ${filePath}.`,
            severity: 'error',
          });
          continue;
        }

        const questionText = String(
          raw.question ?? raw.questionText ?? raw.statement ?? raw.prompt ?? raw.text ?? ''
        ).trim();
        if (!questionText) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_question_text',
            message: `Question "${id}" has empty question text.`,
            severity: 'error',
          });
          continue;
        }

        const options = extractOptions(raw);
        const rawAnswer =
          raw.correctAnswer ?? raw.answer ?? raw.ans ?? raw.correct_option ?? raw.correct ?? raw.key;
        const qType = normalizeQuestionType(raw.type ?? raw.questionType ?? raw.format, Boolean(options), rawAnswer);

        if (!qType) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'invalid_question_type',
            message: `Question "${id}" has an invalid or unresolvable question type.`,
            severity: 'error',
          });
          continue;
        }

        let normalizedAnswer: string | number | null = null;
        if (qType === 'mcq') {
          if (!options || options.length !== 4) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'malformed_options',
              message: `MCQ "${id}" must have exactly 4 non-empty options.`,
              severity: 'error',
            });
            continue;
          }
          const mcqAns = normalizeMcqAnswer(rawAnswer, options);
          if (!mcqAns) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `MCQ "${id}" is missing a valid correct answer (A, B, C, or D).`,
              severity: 'error',
            });
            continue;
          }
          normalizedAnswer = mcqAns;
        } else {
          // Integer / numerical type
          if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === '') {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `Integer question "${id}" is missing a numeric answer.`,
              severity: 'error',
            });
            continue;
          }
          const numVal = Number(String(rawAnswer).trim());
          if (Number.isNaN(numVal)) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `Integer question "${id}" has non-numeric answer "${rawAnswer}".`,
              severity: 'error',
            });
            continue;
          }
          normalizedAnswer = numVal;
        }

        const solutionText = String(
          raw.solution ?? raw.workedSolution ?? raw.solutionText ?? raw.derivation ?? ''
        ).trim();
        const explanationText = String(
          raw.explanation ?? raw.concept ?? raw.keyConcept ?? ''
        ).trim();

        if (!solutionText) {
          missingSolutionsCount++;
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_solution',
            message: `Question "${id}" has no worked solution; fallback explanation will be used.`,
            severity: 'warning',
          });
        }

        let imageRef: string | null = null;
        const rawImage = raw.image ?? raw.imageUrl ?? raw.diagram ?? raw.figure ?? null;
        if (rawImage && typeof rawImage === 'string' && rawImage.trim().length > 0) {
          const trimmedImg = rawImage.trim();
          if (
            trimmedImg.startsWith('data:image/') ||
            trimmedImg.startsWith('http://') ||
            trimmedImg.startsWith('https://') ||
            trimmedImg.startsWith('/') ||
            /\.(png|jpg|jpeg|webp|svg)$/i.test(trimmedImg)
          ) {
            imageRef = trimmedImg.startsWith('images/') ? `/question-bank/${trimmedImg}` : trimmedImg;
          } else {
            brokenImagesCount++;
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'broken_image',
              message: `Question "${id}" has an unrecognized image reference "${trimmedImg}".`,
              severity: 'warning',
            });
          }
        }

        const difficulty = normalizeDifficulty(raw.difficulty ?? raw.level);
        const topic = String(raw.topic ?? raw.subtopic ?? chapter).trim();
        const tags = Array.isArray(raw.tags)
          ? raw.tags.map((t: any) => String(t))
          : [subject, chapter, topic];

        const normalizedQuestion: NormalizedQuestion = {
          id,
          subject,
          chapter,
          topic,
          difficulty,
          type: qType,
          question: questionText,
          options: qType === 'mcq' ? (options as [string, string, string, string]) : undefined,
          correctAnswer: normalizedAnswer,
          solution:
            solutionText ||
            `Correct answer is ${normalizedAnswer}. Apply core principles of ${chapter} (${topic}) to evaluate the expression.`,
          explanation:
            explanationText ||
            `Review the fundamental relations of ${topic} in ${chapter}.`,
          possibleErrorType: (raw.possibleErrorType as ErrorCategory) || 'Conceptual mistake',
          image: imageRef,
          source: String(raw.source ?? 'question_bank'),
          sourceFile: filePath,
          tags,
          rawSourceId: String(raw.id ?? id),
        };

        this.indexQuestion(normalizedQuestion);
      }
    }

    // Build diagnostics
    const chapterMap = new Map<string, ChapterInventory>();
    const subjectChaptersSet: Record<SubjectName, Set<string>> = {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set(),
    };

    const bySubjectSummary: QuestionBankDiagnostics['bySubject'] = {
      Physics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      Chemistry: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      Mathematics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
    };

    for (const q of this.questions) {
      const subSummary = bySubjectSummary[q.subject];
      subSummary.total++;
      if (q.type === 'mcq') subSummary.mcq++;
      else subSummary.integer++;
      subjectChaptersSet[q.subject].add(q.chapter);

      const chapKey = `${q.subject}::${q.chapter}`;
      let inv = chapterMap.get(chapKey);
      if (!inv) {
        inv = {
          subject: q.subject,
          chapter: q.chapter,
          totalQuestions: 0,
          mcqCount: 0,
          integerCount: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          topics: [],
        };
        chapterMap.set(chapKey, inv);
      }
      inv.totalQuestions++;
      if (q.type === 'mcq') inv.mcqCount++;
      else inv.integerCount++;
      if (q.difficulty === 'easy') inv.easyCount++;
      else if (q.difficulty === 'medium') inv.mediumCount++;
      else inv.hardCount++;
      if (q.topic && !inv.topics.includes(q.topic)) {
        inv.topics.push(q.topic);
      }
    }

    bySubjectSummary.Physics.chaptersCount = subjectChaptersSet.Physics.size;
    bySubjectSummary.Chemistry.chaptersCount = subjectChaptersSet.Chemistry.size;
    bySubjectSummary.Mathematics.chaptersCount = subjectChaptersSet.Mathematics.size;

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    this.diagnostics = {
      version: `qb-${this.questions.length}-${files.length}f`,
      loadedAt: new Date().toISOString(),
      filesScanned: files.length,
      totalRawRecords,
      validQuestionsCount: this.questions.length,
      invalidQuestionsCount: errorCount,
      warningsCount: warningCount,
      bySubject: bySubjectSummary,
      chapterInventories: Array.from(chapterMap.values()),
      duplicateIds,
      missingSolutionsCount,
      brokenImagesCount,
      issues,
    };

    return this.diagnostics;
  }

  private indexQuestion(q: NormalizedQuestion): void {
    this.questions.push(q);
    this.byId.set(q.id, q);

    const subList = this.bySubject.get(q.subject) || [];
    subList.push(q);
    this.bySubject.set(q.subject, subList);

    const chapKey = `${q.subject}::${q.chapter}`;
    const chapList = this.byChapter.get(chapKey) || [];
    chapList.push(q);
    this.byChapter.set(chapKey, chapList);

    const typeList = this.byType.get(q.type) || [];
    typeList.push(q);
    this.byType.set(q.type, typeList);

    const diffList = this.byDifficulty.get(q.difficulty) || [];
    diffList.push(q);
    this.byDifficulty.set(q.difficulty, diffList);
  }

  public getAllQuestions(): NormalizedQuestion[] {
    return this.questions;
  }

  public getQuestionById(id: string): NormalizedQuestion | undefined {
    return this.byId.get(id);
  }

  public getQuestionsBySubject(subject: SubjectName): NormalizedQuestion[] {
    return this.bySubject.get(subject) || [];
  }

  public getQuestionsByChapter(subject: SubjectName, chapter: string): NormalizedQuestion[] {
    return this.byChapter.get(`${subject}::${chapter}`) || [];
  }

  public getQuestionsByChapters(
    chaptersBySubject: Partial<Record<SubjectName, string[]>>
  ): NormalizedQuestion[] {
    const result: NormalizedQuestion[] = [];
    for (const [sub, chapters] of Object.entries(chaptersBySubject) as [SubjectName, string[]][]) {
      if (!chapters) continue;
      for (const chap of chapters) {
        const list = this.getQuestionsByChapter(sub, chap);
        result.push(...list);
      }
    }
    return result;
  }

  public getDiagnostics(): QuestionBankDiagnostics {
    return this.diagnostics;
  }
}
