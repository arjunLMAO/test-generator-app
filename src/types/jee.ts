export type SubjectName = 'Physics' | 'Chemistry' | 'Mathematics';

export type QuestionType = 'mcq' | 'integer';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export enum TestMode {
  FULL_SYLLABUS = 'FULL_SYLLABUS',
  CHAPTER_TEST = 'CHAPTER_TEST',
  WRONG_QUESTION_RETEST = 'WRONG_QUESTION_RETEST',
  ADAPTIVE_TEST = 'ADAPTIVE_TEST',
}

export enum TestStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
  ABANDONED = 'ABANDONED',
}

export enum QuestionPaletteStatus {
  NOT_VISITED = 'NOT_VISITED',
  VISITED = 'VISITED',
  ANSWERED = 'ANSWERED',
  MARKED_REVIEW = 'MARKED_REVIEW',
  ANSWERED_MARKED_REVIEW = 'ANSWERED_MARKED_REVIEW',
}

export type MasteryState = 'unseen' | 'attempted' | 'incorrect' | 'corrected' | 'mastered';

export type ErrorCategory =
  | 'Conceptual mistake'
  | 'Calculation mistake'
  | 'Formula mistake'
  | 'Reading mistake'
  | 'Time-pressure error'
  | 'Sign/unit mistake';

export interface NormalizedQuestion {
  id: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  question: string;
  options?: [string, string, string, string];
  correctAnswer: string | number;
  solution: string;
  explanation?: string;
  commonMistake?: string;
  possibleErrorType?: ErrorCategory;
  image?: string | null;
  source: string;
  sourceFile?: string;
  tags: string[];
  rawSourceId?: string;
}

export interface QuestionValidationIssue {
  id: string;
  sourceFile: string;
  reason:
    | 'missing_answer'
    | 'missing_chapter'
    | 'duplicate_id'
    | 'invalid_question_type'
    | 'malformed_options'
    | 'broken_image'
    | 'missing_solution'
    | 'missing_question_text'
    | 'invalid_subject';
  message: string;
  severity: 'error' | 'warning';
}

export interface ChapterInventory {
  subject: SubjectName;
  chapter: string;
  totalQuestions: number;
  mcqCount: number;
  integerCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  topics: string[];
}

export interface QuestionBankDiagnostics {
  version: string;
  loadedAt: string;
  filesScanned: number;
  totalRawRecords: number;
  validQuestionsCount: number;
  invalidQuestionsCount: number;
  warningsCount: number;
  bySubject: Record<SubjectName, {
    total: number;
    mcq: number;
    integer: number;
    chaptersCount: number;
  }>;
  chapterInventories: ChapterInventory[];
  duplicateIds: string[];
  missingSolutionsCount: number;
  brokenImagesCount: number;
  issues: QuestionValidationIssue[];
}

export interface ScoringConfig {
  mcqCountPerSubject: number;
  integerCountPerSubject: number;
  oneSubjectDurationSeconds: number;
  twoSubjectDurationSeconds: number;
  threeSubjectDurationSeconds: number;
  mcqCorrectMarks: number;
  mcqWrongMarks: number;
  mcqUnattemptedMarks: number;
  integerCorrectMarks: number;
  integerWrongMarks: number;
  integerUnattemptedMarks: number;
}

export interface AdaptiveWeightConfig {
  unseenWeight: number;
  incorrectWeight: number;
  correctedWeight: number;
  masteredWeight: number;
  weakChapterBoost: number;
  targetDifficultyRatio: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface WeaknessConfig {
  incorrectRateWeight: number;
  unattemptedRateWeight: number;
  repeatedMistakeWeight: number;
  recencyWeight: number;
  minimumSampleSize: number;
  weakThresholdScore: number;
}

export interface TestQuestionAllocation {
  questionId: string;
  order: number;
  subject: SubjectName;
  chapter: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  optionOrder?: [number, number, number, number]; // permutation if randomized
}

export interface QuestionResponseState {
  questionId: string;
  answer: string | null;
  status: QuestionPaletteStatus;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
  lastUpdatedAt: string;
  errorClassification?: ErrorCategory;
}

export interface GeneratedTest {
  id: string;
  userId: string;
  title: string;
  mode: TestMode;
  subjects: SubjectName[];
  chaptersBySubject: Partial<Record<SubjectName, string[]>>;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: TestStatus;
  questionBankVersion: string;
  generationSeed: string;
  questions: TestQuestionAllocation[];
  responses: Record<string, QuestionResponseState>;
  currentQuestionOrder: number;
  activeSubject: SubjectName;
  noticeMessage?: string;
  scoringConfig: ScoringConfig;
}

export interface AttemptEntry {
  testId: string;
  answer: string | null;
  correct: boolean;
  timestamp: string;
  timeSpentSeconds: number;
}

export interface QuestionHistoryRecord {
  userId: string;
  questionId: string;
  subject: SubjectName;
  chapter: string;
  type: QuestionType;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  lastAnswer: string | null;
  lastResult: 'correct' | 'incorrect' | 'unattempted';
  lastAttemptedAt: string;
  masteryState: MasteryState;
  previouslyIncorrectNowCorrected: boolean;
  attempts: AttemptEntry[];
}

export interface SubjectPerformance {
  subject: SubjectName;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marks: number;
  maxMarks: number;
  mcqMarks: number;
  integerMarks: number;
  accuracy: number;
  timeSpentSeconds: number;
  avgTimePerQuestionSeconds: number;
}

export interface ChapterPerformance {
  subject: SubjectName;
  chapter: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  marks: number;
  maxMarks: number;
  accuracy: number;
  timeSpentSeconds: number;
  weaknessScore: number;
  status: 'Weak' | 'Moderate' | 'Strong' | 'Limited Data';
  repeatedMistakesCount: number;
}

export interface QuestionResultDetail {
  order: number;
  questionId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  question: string;
  options?: [string, string, string, string];
  studentAnswer: string | null;
  correctAnswer: string | number;
  result: 'correct' | 'incorrect' | 'unattempted';
  marksAwarded: number;
  maxMarks: number;
  markedForReview: boolean;
  timeSpentSeconds: number;
  solution: string;
  explanation?: string;
  commonMistake?: string;
  possibleErrorType?: ErrorCategory;
  image?: string | null;
  historySnapshot: {
    attemptCount: number;
    correctCount: number;
    incorrectCount: number;
    repeatedMistakeCount: number;
    previouslyIncorrectNowCorrected: boolean;
    masteryState: MasteryState;
  };
}

export interface PercentileEstimate {
  available: boolean;
  estimatedPercentile: number | null;
  normalizedScore300: number;
  confidenceLabel: string;
  benchmarkName: string;
  disclaimer: string;
}

export interface TestResultReport {
  testId: string;
  userId: string;
  title: string;
  mode: TestMode;
  subjects: SubjectName[];
  chaptersBySubject: Partial<Record<SubjectName, string[]>>;
  submittedAt: string;
  autoSubmitted: boolean;
  durationSeconds: number;
  totalTimeSpentSeconds: number;
  totalMarks: number;
  maxMarks: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  markedForReviewCount: number;
  accuracy: number;
  avgTimePerAttemptedSeconds: number;
  avgTimeOnIncorrectSeconds: number;
  percentile: PercentileEstimate;
  subjectResults: SubjectPerformance[];
  chapterResults: ChapterPerformance[];
  weakChapters: ChapterPerformance[];
  strongChapters: ChapterPerformance[];
  questionResults: QuestionResultDetail[];
  summaryInsights: string[];
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  mcqCountPerSubject: 20,
  integerCountPerSubject: 5,
  oneSubjectDurationSeconds: 3600,
  twoSubjectDurationSeconds: 7200,
  threeSubjectDurationSeconds: 10800,
  mcqCorrectMarks: 4,
  mcqWrongMarks: -1,
  mcqUnattemptedMarks: 0,
  integerCorrectMarks: 4,
  integerWrongMarks: 0,
  integerUnattemptedMarks: 0,
};

export const DEFAULT_ADAPTIVE_WEIGHTS: AdaptiveWeightConfig = {
  unseenWeight: 1.5,
  incorrectWeight: 2.2,
  correctedWeight: 0.5,
  masteredWeight: 0.12,
  weakChapterBoost: 1.4,
  targetDifficultyRatio: {
    easy: 0.25,
    medium: 0.5,
    hard: 0.25,
  },
};

export const DEFAULT_WEAKNESS_CONFIG: WeaknessConfig = {
  incorrectRateWeight: 0.5,
  unattemptedRateWeight: 0.25,
  repeatedMistakeWeight: 0.15,
  recencyWeight: 0.1,
  minimumSampleSize: 2,
  weakThresholdScore: 0.42,
};
