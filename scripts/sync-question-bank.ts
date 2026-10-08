import fs from 'fs';
import path from 'path';

interface ChapterManifestEntry {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  fileName: string;
  relativePath: string;
  urlPath: string;
  questionCount: number;
  grade?: string;
}

interface QuestionBankManifest {
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

const ROOT_DIR = process.cwd();
const SRC_QB_DIR = path.join(ROOT_DIR, 'question-bank');
const PUBLIC_QB_DIR = path.join(ROOT_DIR, 'public', 'question-bank');

function syncAndGenerateManifest(): QuestionBankManifest {
  if (!fs.existsSync(SRC_QB_DIR)) {
    throw new Error(`Source question bank directory not found at ${SRC_QB_DIR}`);
  }

  fs.mkdirSync(PUBLIC_QB_DIR, { recursive: true });

  const subjects = ['physics', 'chemistry', 'mathematics'] as const;
  const manifestChapters: ChapterManifestEntry[] = [];
  let totalQuestions = 0;
  let totalFiles = 0;

  const subjectStats = {
    Physics: { questionCount: 0, chapterCount: 0 },
    Chemistry: { questionCount: 0, chapterCount: 0 },
    Mathematics: { questionCount: 0, chapterCount: 0 },
  };

  for (const sub of subjects) {
    const srcSubDir = path.join(SRC_QB_DIR, sub);
    const pubSubDir = path.join(PUBLIC_QB_DIR, sub);
    fs.mkdirSync(pubSubDir, { recursive: true });

    if (!fs.existsSync(srcSubDir)) continue;

    const files = fs.readdirSync(srcSubDir).filter((f) => f.endsWith('.json'));
    const capitalSubject = (sub.charAt(0).toUpperCase() + sub.slice(1)) as
      | 'Physics'
      | 'Chemistry'
      | 'Mathematics';

    for (const file of files) {
      const srcFile = path.join(srcSubDir, file);
      const pubFile = path.join(pubSubDir, file);

      // Copy file to public/question-bank/<subject>/<file>
      const contentRaw = fs.readFileSync(srcFile, 'utf-8');
      fs.writeFileSync(pubFile, contentRaw, 'utf-8');

      // Parse and gather statistics
      try {
        const parsed = JSON.parse(contentRaw);
        let qCount = 0;
        let chapterName = file.replace(/\.json$/i, '').replace(/\s*questions$/i, '');
        let grade = 'Class 11-12';

        if (Array.isArray(parsed)) {
          qCount = parsed.length;
          if (parsed[0]?.chapter) chapterName = parsed[0].chapter;
          if (parsed[0]?.grade) grade = parsed[0].grade;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.questions)) {
            qCount = parsed.questions.length;
          }
          if (parsed.chapter) chapterName = parsed.chapter;
          if (parsed.grade) grade = parsed.grade;
        }

        totalQuestions += qCount;
        totalFiles++;
        subjectStats[capitalSubject].questionCount += qCount;
        subjectStats[capitalSubject].chapterCount++;

        manifestChapters.push({
          subject: capitalSubject,
          chapter: chapterName,
          fileName: file,
          relativePath: `${sub}/${file}`,
          urlPath: `/question-bank/${sub}/${encodeURIComponent(file)}`,
          questionCount: qCount,
          grade,
        });
      } catch (err) {
        console.error(`Failed to parse ${srcFile}:`, err);
      }
    }
  }

  // Sort chapters cleanly by subject then chapter name
  manifestChapters.sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.chapter.localeCompare(b.chapter);
  });

  const manifest: QuestionBankManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalQuestions,
    totalFiles,
    subjects: subjectStats,
    chapters: manifestChapters,
  };

  const manifestPath = path.join(PUBLIC_QB_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`[Sync] Successfully generated manifest:`);
  console.log(`- Total Questions: ${totalQuestions}`);
  console.log(`- Total Files: ${totalFiles}`);
  console.log(`- Physics: ${subjectStats.Physics.questionCount} questions across ${subjectStats.Physics.chapterCount} chapters`);
  console.log(`- Chemistry: ${subjectStats.Chemistry.questionCount} questions across ${subjectStats.Chemistry.chapterCount} chapters`);
  console.log(`- Mathematics: ${subjectStats.Mathematics.questionCount} questions across ${subjectStats.Mathematics.chapterCount} chapters`);
  console.log(`- Written to: ${manifestPath}`);

  return manifest;
}

syncAndGenerateManifest();
process.exit(0);
