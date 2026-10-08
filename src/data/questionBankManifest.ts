export interface ChapterManifestEntry {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  fileName: string;
  relativePath: string;
  urlPath: string;
  questionCount: number;
  grade?: string;
}

export interface QuestionBankManifest {
  version: string;
  generatedAt: string;
  totalQuestions: number;
  totalFiles: number;
  subjects: {
    Physics: { questionCount: number; chapterCount: number };
    Chemistry: { questionCount: number; chapterCount: number };
    Mathematics: { questionCount: number; chapterCount: number };
  };
  chapters: ChapterManifestEntry[];
}

export const QUESTION_BANK_VERSION = '1.0.0';

export const STATIC_QUESTION_BANK_MANIFEST_URL = '/question-bank/manifest.json';
