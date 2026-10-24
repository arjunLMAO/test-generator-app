import express, { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { ensureQuestionBankSeeded } from './seedQuestionBank';
import { QuestionBankEngine, RawFilePayload } from '../services/QuestionBankEngine';
import { ScoringAndAnalyticsService } from '../services/ScoringAndAnalyticsService';
import { TestGeneratorService, TestGenerationRequest } from '../services/TestGeneratorService';
import {
  DEFAULT_SCORING_CONFIG,
  GeneratedTest,
  QuestionHistoryRecord,
  ScoringConfig,
  TestResultReport,
  TestStatus,
} from '../types/jee';

export interface UserPersistentRecord {
  userId: string;
  name: string;
  email: string;
  targetExam: string;
  activeTest: GeneratedTest | null;
  reports: TestResultReport[];
  historyMap: Record<string, QuestionHistoryRecord>;
  scoringConfig: ScoringConfig;
}

export interface PersistentDatabase {
  users: Record<string, UserPersistentRecord>;
}

const ROOT_DIR = process.cwd();

// Find question bank directory by checking candidate locations (crucial for Vercel & local server)
function resolveQuestionBankDir(): string {
  const candidates = [
    path.join(ROOT_DIR, 'question-bank'),
    path.join(ROOT_DIR, 'public', 'question-bank'),
    path.join(ROOT_DIR, 'dist', 'question-bank'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }
  return candidates[0];
}

const QUESTION_BANK_DIR = resolveQuestionBankDir();

// For persistent database in serverless (uses /tmp if root is read-only)
function resolveDataDir(): string {
  try {
    const defaultData = path.join(ROOT_DIR, 'data');
    fs.mkdirSync(defaultData, { recursive: true });
    return defaultData;
  } catch {
    const tmpData = path.join('/tmp', 'jee-platform-data');
    fs.mkdirSync(tmpData, { recursive: true });
    return tmpData;
  }
}

const DATA_DIR = resolveDataDir();
const DB_FILE = path.join(DATA_DIR, 'jee-platform-db.json');

// In-memory fallback if disk writes are not permitted
let memoryDb: PersistentDatabase = { users: {} };

function loadDatabase(): PersistentDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: PersistentDatabase = { users: {} };
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      } catch {
        // read-only filesystem
      }
      return memoryDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistentDatabase;
    memoryDb = parsed;
    return parsed;
  } catch {
    return memoryDb;
  }
}

function saveDatabase(db: PersistentDatabase): void {
  memoryDb = db;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // serverless read-only filesystem; memoryDb retains state for the lifetime of invocation
  }
}

function getOrCreateUser(db: PersistentDatabase, userId: string): UserPersistentRecord {
  if (!db.users[userId]) {
    db.users[userId] = {
      userId,
      name: 'Arjun Girdhar',
      email: 'girdhar.arjun@gmail.com',
      targetExam: 'JEE Main & Advanced 2027',
      activeTest: null,
      reports: [],
      historyMap: {},
      scoringConfig: { ...DEFAULT_SCORING_CONFIG },
    };
    saveDatabase(db);
  }
  return db.users[userId];
}

export function scanQuestionBankDirectory(dirPath: string): RawFilePayload[] {
  const results: RawFilePayload[] = [];
  const seenFiles = new Set<string>();

  // 1. Sync any authentic JSON question files uploaded directly to project root explorer
  try {
    const rootFiles = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    for (const entry of rootFiles) {
      if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.json') &&
        !['package.json', 'tsconfig.json', 'metadata.json', 'bun.lock'].includes(entry.name)
      ) {
        const fullPath = path.join(ROOT_DIR, entry.name);
        try {
          const text = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(text);
          if (parsed && (Array.isArray(parsed) || parsed.questions || parsed.chapter)) {
            const sub = parsed.subject;
            let targetSubDir = 'physics';
            if (sub === 'Chemistry') targetSubDir = 'chemistry';
            else if (sub === 'Mathematics') targetSubDir = 'mathematics';
            const targetDir = path.join(dirPath, targetSubDir);
            try {
              fs.mkdirSync(targetDir, { recursive: true });
              const destPath = path.join(targetDir, entry.name);
              if (!fs.existsSync(destPath)) {
                fs.copyFileSync(fullPath, destPath);
              }
            } catch {
              // ignore read-only
            }
          }
        } catch {
          // ignore unparseable root file
        }
      }
    }
  } catch {
    // ignore
  }

  const candidateDirs = [
    dirPath,
    path.join(ROOT_DIR, 'public', 'question-bank'),
    path.join(ROOT_DIR, 'question-bank'),
  ];

  for (const baseDir of candidateDirs) {
    if (!fs.existsSync(baseDir)) continue;

    const walk = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (
            entry.isFile() &&
            entry.name.toLowerCase().endsWith('.json') &&
            entry.name.toLowerCase() !== 'manifest.json' &&
            entry.name.toLowerCase() !== 'vercel.json'
          ) {
            const relPath = path.relative(baseDir, fullPath);
            const normKey = relPath.toLowerCase().replace(/\\/g, '/');
            if (seenFiles.has(normKey)) continue;
            seenFiles.add(normKey);
            try {
              const text = fs.readFileSync(fullPath, 'utf-8');
              const parsed = JSON.parse(text);
              results.push({ filePath: relPath, content: parsed });
            } catch {
              results.push({
                filePath: relPath,
                content: [{ id: `MALFORMED_${entry.name}`, question: '' }],
              });
            }
          }
        }
      } catch {
        // ignore read error
      }
    };

    walk(baseDir);
  }

  return results;
}

export interface AppServerContext {
  app: Express;
  qbEngine: QuestionBankEngine;
  db: PersistentDatabase;
}

export function createApp(): AppServerContext {
  try {
    ensureQuestionBankSeeded(QUESTION_BANK_DIR);
  } catch {
    // ignore in read-only environment
  }

  const rawFiles = scanQuestionBankDirectory(QUESTION_BANK_DIR);
  let qbEngine = new QuestionBankEngine(rawFiles);
  let db = loadDatabase();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // CORS headers if accessed in distributed environments
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Serve static files from question-bank directory
  if (fs.existsSync(QUESTION_BANK_DIR)) {
    app.use('/question-bank', express.static(QUESTION_BANK_DIR));
  }
  const publicQbDir = path.join(ROOT_DIR, 'public', 'question-bank');
  if (fs.existsSync(publicQbDir)) {
    app.use('/question-bank', express.static(publicQbDir));
  }

  // 0. Production Health Check (Section 18)
  app.get('/api/question-bank/health', (_req, res) => {
    const questions = qbEngine.getAllQuestions();
    const diag = qbEngine.getDiagnostics();
    const physicsCount = qbEngine.getQuestionsBySubject('Physics').length;
    const chemistryCount = qbEngine.getQuestionsBySubject('Chemistry').length;
    const mathCount = qbEngine.getQuestionsBySubject('Mathematics').length;

    const isHealthy =
      questions.length > 0 && physicsCount > 0 && chemistryCount > 0 && mathCount > 0;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      environment: process.env.NODE_ENV || 'production',
      physics: physicsCount > 0,
      chemistry: chemistryCount > 0,
      mathematics: mathCount > 0,
      totalQuestions: questions.length,
      filesLoaded: diag.filesScanned,
      subjects: {
        Physics: physicsCount,
        Chemistry: chemistryCount,
        Mathematics: mathCount,
      },
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Get Question Bank + Diagnostics (Re-scans if new files were added on disk)
  app.get('/api/question-bank', (_req, res) => {
    const currentFiles = scanQuestionBankDirectory(QUESTION_BANK_DIR);
    if (currentFiles.length !== qbEngine.getDiagnostics().filesScanned) {
      qbEngine.ingestFiles(currentFiles);
    }
    res.json({
      questions: qbEngine.getAllQuestions(),
      diagnostics: qbEngine.getDiagnostics(),
    });
  });

  // 2. Import Uploaded JSON Files into Question Bank
  app.post('/api/question-bank/import-files', (req, res) => {
    try {
      const { files, replaceExisting } = req.body as {
        files: Array<{ filePath: string; content: unknown }>;
        replaceExisting?: boolean;
      };

      if (!files || !Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: 'No files provided for ingestion.' });
        return;
      }

      for (const item of files) {
        const cleanRelPath = item.filePath.replace(/^(\.\.[\/\\])+/, '');
        const targetPath = path.join(QUESTION_BANK_DIR, cleanRelPath);
        const targetDir = path.dirname(targetPath);
        try {
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(targetPath, JSON.stringify(item.content, null, 2), 'utf-8');
        } catch {
          // ignore
        }
      }

      if (replaceExisting) {
        const reloaded = scanQuestionBankDirectory(QUESTION_BANK_DIR);
        qbEngine = new QuestionBankEngine(reloaded);
      } else {
        qbEngine.ingestFiles(files as RawFilePayload[]);
      }

      res.json({
        success: true,
        diagnostics: qbEngine.getDiagnostics(),
        questionsCount: qbEngine.getAllQuestions().length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to import files.' });
    }
  });

  // 3. Reset to standard catalog
  app.post('/api/question-bank/reset', (_req, res) => {
    try {
      ensureQuestionBankSeeded(QUESTION_BANK_DIR);
      const reloaded = scanQuestionBankDirectory(QUESTION_BANK_DIR);
      qbEngine = new QuestionBankEngine(reloaded);
      res.json({
        success: true,
        message: 'Question bank reset to standard syllabus catalogue.',
        diagnostics: qbEngine.getDiagnostics(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset question bank.' });
    }
  });

  // 4. Question Bank Stats
  app.get('/api/question-bank/stats', (_req, res) => {
    res.json(qbEngine.getDiagnostics());
  });

  // 5. Query Filtered Questions
  app.post('/api/question-bank/query', (req, res) => {
    const { subjects, chapters, difficulties, types, limit } = req.body;
    let list = qbEngine.getAllQuestions();

    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      list = list.filter((q) => subjects.includes(q.subject));
    }
    if (chapters && Array.isArray(chapters) && chapters.length > 0) {
      list = list.filter((q) => chapters.includes(q.chapter));
    }
    if (difficulties && Array.isArray(difficulties) && difficulties.length > 0) {
      list = list.filter((q) => difficulties.includes(q.difficulty));
    }
    if (types && Array.isArray(types) && types.length > 0) {
      list = list.filter((q) => types.includes(q.type));
    }

    if (typeof limit === 'number' && limit > 0) {
      list = list.slice(0, limit);
    }

    res.json({ count: list.length, questions: list });
  });

  // 6. Get Student State
  app.get('/api/student/:userId/state', (req, res) => {
    db = loadDatabase();
    const user = getOrCreateUser(db, req.params.userId);

    // If an active in-progress test was created before categorical diversification,
    // automatically regenerate it with the diverse category-capped engine
    if (
      user.activeTest &&
      user.activeTest.questions.length > 0 &&
      !user.activeTest.questions[0].category
    ) {
      const regen = TestGeneratorService.generateTest(
        qbEngine,
        {
          userId: user.userId,
          mode: user.activeTest.mode,
          selectedSubjects: user.activeTest.subjects,
          chaptersBySubject: user.activeTest.chaptersBySubject,
          allowFlexibleCount: true,
          scoringConfig: user.activeTest.scoringConfig || user.scoringConfig,
        },
        user.historyMap
      );
      if (regen.success && regen.test) {
        user.activeTest = regen.test;
        saveDatabase(db);
      }
    }

    res.json(user);
  });

  // 7. Generate Test
  app.post('/api/tests/generate', (req, res) => {
    db = loadDatabase();
    const genReq = req.body as TestGenerationRequest;
    const user = getOrCreateUser(db, genReq.userId || 'student-arjun');

    let targetQuestionIds = genReq.targetQuestionIds;
    if (
      genReq.mode === 'WRONG_QUESTION_RETEST' &&
      (!targetQuestionIds || targetQuestionIds.length === 0) &&
      genReq.sourceAttemptId
    ) {
      const sourceReport = user.reports.find((r) => r.testId === genReq.sourceAttemptId);
      if (sourceReport) {
        targetQuestionIds = sourceReport.questionResults
          .filter((q) => {
            if (q.result !== 'incorrect') return false;
            if (genReq.selectedSubjects && genReq.selectedSubjects.length > 0) {
              if (!genReq.selectedSubjects.includes(q.subject)) return false;
            }
            const allowedChaps = genReq.chaptersBySubject?.[q.subject];
            if (allowedChaps && allowedChaps.length > 0 && !allowedChaps.includes(q.chapter)) {
              return false;
            }
            return true;
          })
          .map((q) => q.questionId);
      }
    }

    const outcome = TestGeneratorService.generateTest(
      qbEngine,
      {
        ...genReq,
        targetQuestionIds,
        scoringConfig: genReq.scoringConfig || user.scoringConfig,
      },
      user.historyMap
    );

    if (!outcome.success || !outcome.test) {
      res.status(400).json(outcome);
      return;
    }

    user.activeTest = outcome.test;
    saveDatabase(db);
    res.json(outcome);
  });

  // 8. Autosave Active Test State
  app.put('/api/tests/:testId/autosave', (req, res) => {
    db = loadDatabase();
    const { userId = 'student-arjun', responses, currentQuestionOrder, activeSubject } = req.body;
    const user = getOrCreateUser(db, userId);

    if (!user.activeTest || user.activeTest.id !== req.params.testId) {
      res.status(404).json({ error: 'Active test not found or already submitted.' });
      return;
    }

    if (responses) {
      user.activeTest.responses = responses;
    }
    if (typeof currentQuestionOrder === 'number') {
      user.activeTest.currentQuestionOrder = currentQuestionOrder;
    }
    if (activeSubject) {
      user.activeTest.activeSubject = activeSubject;
    }

    saveDatabase(db);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  });

  // 9. Discard Active Test
  app.delete('/api/tests/:testId', (req, res) => {
    db = loadDatabase();
    const userId = String(req.query.userId || 'student-arjun');
    const user = getOrCreateUser(db, userId);

    if (user.activeTest && user.activeTest.id === req.params.testId) {
      user.activeTest = null;
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  // 10. Submit & Authoritatively Score Test (Idempotent)
  app.post('/api/tests/:testId/submit', (req, res) => {
    db = loadDatabase();
    const {
      userId = 'student-arjun',
      testSnapshot,
      autoSubmitted = false,
    } = req.body as {
      userId?: string;
      testSnapshot?: GeneratedTest;
      autoSubmitted?: boolean;
    };

    const user = getOrCreateUser(db, userId);

    // Idempotency check: if already in reports, return existing immutable report
    const existingReport = user.reports.find((r) => r.testId === req.params.testId);
    if (existingReport) {
      res.json({
        report: existingReport,
        historyMap: user.historyMap,
        alreadySubmitted: true,
      });
      return;
    }

    const targetTest = testSnapshot || user.activeTest;
    if (!targetTest || targetTest.id !== req.params.testId) {
      res.status(400).json({ error: 'Test data not found or mismatched test ID.' });
      return;
    }

    const { report, updatedHistoryMap } = ScoringAndAnalyticsService.evaluateAndRecordTest(
      targetTest,
      qbEngine,
      user.historyMap,
      autoSubmitted
    );

    user.historyMap = updatedHistoryMap;
    user.reports.unshift(report);

    if (user.activeTest && user.activeTest.id === targetTest.id) {
      user.activeTest = null;
    }

    saveDatabase(db);

    res.json({
      report,
      historyMap: user.historyMap,
      alreadySubmitted: false,
    });
  });

  return { app, qbEngine, db };
}
