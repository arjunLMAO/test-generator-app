import { NormalizedQuestion, QuestionType, SubjectName, VisualAsset, VisualStatus } from '../types/jee';
import { canonicalizeImageUrl } from './VisualAssetResolver';

/**
 * Central whitelist of fields allowed to reach the active examination renderer (Section 15, 41, 60).
 */
export const STUDENT_VISIBLE_QUESTION_FIELDS = [
  'id',
  'order',
  'subject',
  'type',
  'question',
  'options',
  'image',
  'images',
  'visualAsset',
  'visualRequired',
  'visualStatus',
] as const;

/**
 * Strictly forbidden metadata fields that must NEVER exist on student-facing active test questions (Section 15, 41, 42).
 */
export const FORBIDDEN_STUDENT_QUESTION_FIELDS = [
  'chapter',
  'topic',
  'concept',
  'subtopic',
  'category',
  'templateSignature',
  'difficulty',
  'formula',
  'property',
  'method',
  'hint',
  'solution',
  'explanation',
  'correctAnswer',
  'commonMistake',
  'possibleErrorType',
  'tags',
  'source',
  'sourceFile',
  'rawSourceId',
  'rawVisualMetadata',
  'diagram_ref',
  'generationPrompt',
  'generationReason',
] as const;

/**
 * Strict Student-Facing Question Model (Section 15 & 41).
 * Contains ONLY the fields necessary to render and answer the question during an active test.
 */
export interface StudentQuestion {
  id: string;
  order: number;
  subject: SubjectName;
  type: QuestionType;
  question: string;
  options?: [string, string, string, string];
  image?: string | null;
  images?: VisualAsset[] | string[];
  visualAsset?: VisualAsset | null;
  visualRequired?: boolean;
  visualStatus?: VisualStatus;
}

/**
 * Stage C — Student-Facing Question Text Sanitizer (Sections 6, 7, 8, 13, 35, 44, 45, 58).
 * Strips artificial metadata prefixes, chapter/topic parentheticals, and explicit solving hints
 * while preserving legitimate mathematical and scientific problem statements.
 */
export function sanitizeStudentQuestionText(rawText: string): string {
  let text = String(rawText || '').trim();

  // 1. Strip any leading metadata lines such as "Chapter: ...", "Topic: ...", "Concept: ...", "Difficulty: ..."
  text = text.replace(
    /^(?:(?:chapter|topic|subtopic|concept|difficulty|method|formula|property|skill|learning objective)\s*:\s*[^\n]+\n+)+/gi,
    ''
  );

  // 2. Strip trailing or inline Hint / Concept / Method annotations
  text = text.replace(
    /(?:\n+|\s+)(?:hint|concept tested|required concept|suggested approach|method|solution strategy)\s*:\s*[^\n]+$/gi,
    ''
  );

  // 3. Strip artificial seed chapter/topic parentheticals such as:
  //    "in Integral Calculus (King Property in Definite Integrals)"
  //    "studied in Quadratic Equations (Newton Sums & Symmetric Roots)"
  //    "analyzed in Chemical Bonding (VSEPR Geometry)"
  text = text.replace(
    /\s+(?:studied|analyzed|encountered|examined|investigated|operating)?\s*(?:in|under)\s+[A-Z][A-Za-z0-9\s,&()-]{2,55}\s*\([A-Za-z0-9\s,&/+-]{3,65}\)(?=[.,?;:\s]|$)/g,
    ''
  );
  text = text.replace(
    /^(?:In|During|For)\s+(?:a|an)?\s*[A-Z][A-Za-z0-9\s,&-]{2,45}\s+(?:setup|experiment|problem|study|analysis|configuration|process|system|network)\s+(?:investigating|on|of|in)?\s*[A-Za-z0-9\s,&/+-]{0,50}\s*(?:\([A-Za-z0-9\s,&/+-]{2,55}\))?\s*,\s*/i,
    ''
  );
  text = text.replace(
    /^In\s+[A-Z][A-Za-z0-9\s,&-]{2,45}\s*\([A-Za-z0-9\s,&/+-]{2,55}\)\s*,\s*/i,
    ''
  );

  // 4. Strip explicit theorem/property giveaways added at the start or end of synthetic stems
  text = text.replace(
    /^Using\s+(?:the\s+)?(?:King(?:'s)?\s+property|Newton(?:'s)?\s+recurrence|AM-GM\s+inequality|Hess(?:'s)?\s+law|Raoult(?:'s)?\s+law|Nernst\s+equation|De\s+Moivre(?:'s)?\s+theorem)[^,]*,\s*/i,
    ''
  );
  text = text.replace(/\s+by\s+(?:Raoult(?:'s)?\s+law|Hess(?:'s)?\s+law|AM-GM\s+inequality)(?=[.?]|$)/gi, '');
  text = text.replace(/\s+according\s+to\s+Slater(?:'s)?\s+rules(?=[.?]|$)/gi, '');

  // 5. Strip standalone or trailing diagram/image placeholder metadata from student-facing question text (Section 3, 7, 8, 14, 24)
  // while preserving inline placeholders embedded inside matching items/options so cells are not emptied
  text = text.replace(
    /(?:^|\n|<br\s*\/?>|\s+)\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*([^\]]+)\](?:\s*$)/gi,
    ''
  );
  // Strip trailing or standalone "Question \d+ English" artifacts left by scraper linebreaks
  text = text.replace(/(?:\n|<br\s*\/?>|\s)*Question\s+\d+\s+English(?=[.,?;:\s]|$)/gi, '');
  text = text.replace(/(?:\n|<br\s*\/?>|\s)*\[(?:image|diagram|figure|graph|reaction|structure)[\s\S]*?\](?:\s*$)/gi, '');

  // 6. Clean question-level diagram <img> tags
  // These are rendered cleanly in QuestionVisuals with zoom and lightbox;
  // images embedded within <table> cells (e.g. Match List I & II) are strictly preserved.
  if (/<table\b/i.test(text)) {
    // Preserve <img> tags inside <table>...</table>, strip any outside tables
    text = text
      .replace(/^([\s\S]*?)<table/i, (_, pre) => pre.replace(/<img[^>]+>/gi, '') + '<table')
      .replace(/<\/table>([\s\S]*)$/i, (_, post) => '</table>' + post.replace(/<img[^>]+>/gi, ''));
  } else {
    text = text.replace(/<p[^>]*>\s*<img[^>]+>\s*<\/p>/gi, '');
    text = text.replace(/<img[^>]+>/gi, '');
  }

  // Capitalize first letter if a leading clause was stripped cleanly
  if (text.length > 1 && /^[a-z]/.test(text)) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text.trim();
}

/**
 * Runtime & test guard that asserts a student-facing question object contains
 * ZERO forbidden metadata fields and ONLY whitelisted student-visible fields (Section 42 & 60).
 */
export function assertNoMetadataLeak(questionObj: unknown): void {
  if (!questionObj || typeof questionObj !== 'object') {
    throw new Error('Metadata leak check failed: question object is null or not an object.');
  }

  const record = questionObj as Record<string, unknown>;
  const allowedSet = new Set<string>(STUDENT_VISIBLE_QUESTION_FIELDS);

  for (const forbidden of FORBIDDEN_STUDENT_QUESTION_FIELDS) {
    if (forbidden in record && record[forbidden] !== undefined) {
      throw new Error(
        `CRITICAL METADATA LEAK DETECTED: Forbidden field "${forbidden}" was found on student-facing question "${String(record.id || '')}".`
      );
    }
  }

  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) {
      throw new Error(
        `CRITICAL METADATA LEAK DETECTED: Unwhitelisted field "${key}" was found on student-facing question "${String(record.id || '')}".`
      );
    }
  }
}

/**
 * Converts an internal NormalizedQuestion into a sanitized, metadata-free StudentQuestion
 * safe for rendering in the active examination UI (Sections 14, 15, 40, 41).
 */
export function toStudentQuestion(
  question: NormalizedQuestion,
  order: number
): StudentQuestion {
  const sanitizedQuestion = sanitizeStudentQuestionText(question.question);

  // Deduplicate images with canonical key check
  const rawList: string[] = [];
  if (Array.isArray(question.images)) {
    for (const item of question.images) {
      const anyItem = item as unknown;
      if (typeof anyItem === 'string' && anyItem.trim()) {
        rawList.push(anyItem.trim());
      } else if (anyItem && typeof anyItem === 'object') {
        const obj = anyItem as Record<string, unknown>;
        const u = obj.imageUrl || obj.url || obj.sourceUrl;
        if (typeof u === 'string' && u.trim()) {
          rawList.push(u.trim());
        }
      }
    }
  }
  if (question.image && typeof question.image === 'string') {
    rawList.push(question.image);
  }

  const dedupedImages: string[] = [];
  const seenImgKeys = new Set<string>();
  for (const img of rawList) {
    const k = canonicalizeImageUrl(img);
    const fileMatch = img.match(/(file-[a-z0-9_-]+\.(?:png|jpe?g|svg|webp))/i);
    const fileKey = fileMatch ? `file:${fileMatch[1].toLowerCase()}` : null;
    if (k && !seenImgKeys.has(k) && (!fileKey || !seenImgKeys.has(fileKey))) {
      seenImgKeys.add(k);
      if (fileKey) seenImgKeys.add(fileKey);
      dedupedImages.push(img);
    }
  }

  const studentQuestion: StudentQuestion = {
    id: question.id,
    order,
    subject: question.subject,
    type: question.type,
    question: sanitizedQuestion,
    ...(question.type === 'mcq' && question.options ? { options: question.options } : {}),
    image: question.image ?? null,
    images: dedupedImages,
    visualAsset: question.visualAsset ?? null,
    visualRequired: Boolean(question.visualRequired),
    visualStatus: question.visualStatus ?? (question.image ? 'verified' : 'unverified'),
  };

  assertNoMetadataLeak(studentQuestion);
  return studentQuestion;
}
