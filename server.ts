import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ensureQuestionBankSeeded } from './src/server/seedQuestionBank';
import { QuestionBankEngine, RawFilePayload } from './src/services/QuestionBankEngine';
import { ScoringAndAnalyticsService } from './src/services/ScoringAndAnalyticsService';
import { TestGeneratorService, TestGenerationRequest } from './src/services/TestGeneratorService';
import {
  DEFAULT_SCORING_CONFIG,
  GeneratedTest,
  QuestionHistoryRecord,
  ScoringConfig,
  TestResultReport,
  TestStatus,
} from './src/types/jee';

const PORT = 3000;
const ROOT_DIR = process.cwd();
const QUESTION_BANK_DIR = path.join(ROOT_DIR, 'question-bank');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'jee-platform-db.json');

interface UserPersistentRecord {
  userId: string;
  name: string;
  email: string;
  targetExam: string;
  activeTest: GeneratedTest | null;
  reports: TestResultReport[];
  historyMap: Record<string, QuestionHistoryRecord>;
  scoringConfig: ScoringConfig;
}

interface PersistentDatabase {
  users: Record<string, UserPersistentRecord>;
}

function loadDatabase(): PersistentDatabase {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial: PersistentDatabase = { users: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as PersistentDatabase;
  } catch {
    return { users: {} };
  }
}

function saveDatabase(db: PersistentDatabase): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
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

function scanQuestionBankDirectory(dirPath: string): RawFilePayload[] {
  const results: RawFilePayload[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const walk = (currentDir: string) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
        try {
          const text = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(text);
          const relPath = path.relative(QUESTION_BANK_DIR, fullPath);
          results.push({ filePath: relPath, content: parsed });
        } catch (err) {
          results.push({
            filePath: path.relative(QUESTION_BANK_DIR, fullPath),
            content: [{ id: `MALFORMED_${entry.name}`, question: '' }],
          });
        }
      }
    }
  };

  walk(dirPath);
  return results;
}

async function startServer() {
  ensureQuestionBankSeeded(QUESTION_BANK_DIR);
  const rawFiles = scanQuestionBankDirectory(QUESTION_BANK_DIR);
  const qbEngine = new QuestionBankEngine(rawFiles);
  let db = loadDatabase();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Serve question bank static images if present
  app.use('/question-bank', express.static(QUESTION_BANK_DIR));

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

      if (!Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: 'No valid JSON files provided for import.' });
        return;
      }

      const customDir = path.join(QUESTION_BANK_DIR, 'user-uploads');
      if (replaceExisting) {
        fs.rmSync(customDir, { recursive: true, force: true });
      }
      fs.mkdirSync(customDir, { recursive: true });

      for (const f of files) {
        const safeName = (f.filePath || `imported-${Date.now()}.json`)
          .replace(/[^a-zA-Z0-9._/-]/g, '_')
          .replace(/^\/+/, '');
        const dest = path.join(customDir, safeName.endsWith('.json') ? safeName : `${safeName}.json`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, JSON.stringify(f.content, null, 2), 'utf-8');
      }

      const updatedRaw = scanQuestionBankDirectory(QUESTION_BANK_DIR);
      const diagnostics = qbEngine.ingestFiles(updatedRaw);

      res.json({
        questions: qbEngine.getAllQuestions(),
        diagnostics,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to import question bank files.' });
    }
  });

  // 3. Connect & Sync Question Bank from GitHub Repository
  app.post('/api/question-bank/import-git', async (req, res) => {
    try {
      const {
        repoUrl,
        branch = '',
        subPath = '',
        replaceExisting = true,
        githubToken = '',
      } = req.body as {
        repoUrl: string;
        branch?: string;
        subPath?: string;
        replaceExisting?: boolean;
        githubToken?: string;
      };

      if (!repoUrl) {
        res.status(400).json({ error: 'Please provide a valid GitHub repository URL.' });
        return;
      }

      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git|\/|$)/i);
      if (!match) {
        res.status(400).json({
          error: 'Repository URL must be a valid GitHub URL (e.g. https://github.com/owner/repo).',
        });
        return;
      }

      const [, owner, repo] = match;
      const headers: Record<string, string> = {
        'User-Agent': 'Vectra-JEE-Platform',
        Accept: 'application/vnd.github+json',
      };
      if (githubToken && githubToken.trim()) {
        headers.Authorization = `Bearer ${githubToken.trim()}`;
      }

      // Resolve branch: try user-specified branch, or inspect repository default_branch, or fallback main/master
      let resolvedBranch = branch.trim();
      if (!resolvedBranch) {
        const repoMetaResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers,
        });
        if (repoMetaResp.ok) {
          const repoMeta = (await repoMetaResp.json()) as { default_branch?: string };
          resolvedBranch = repoMeta.default_branch || 'main';
        } else {
          resolvedBranch = 'main';
        }
      }

      let treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`;
      let treeResp = await fetch(treeUrl, { headers });

      if (!treeResp.ok && resolvedBranch === 'main') {
        resolvedBranch = 'master';
        treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`;
        treeResp = await fetch(treeUrl, { headers });
      }

      if (!treeResp.ok) {
        res.status(400).json({
          error: `Unable to fetch repository tree from GitHub (HTTP ${treeResp.status}). Verify the repository URL, branch ("${resolvedBranch}"), or provide a Personal Access Token if private.`,
        });
        return;
      }

      const treeData = (await treeResp.json()) as {
        tree?: Array<{ path: string; type: string }>;
      };

      const ignoredFiles = new Set([
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'metadata.json',
        'vercel.json',
        'manifest.json',
      ]);

      const cleanSubPath = subPath.trim().replace(/^\/+|\/+$/g, '');
      const jsonNodes = (treeData.tree || []).filter((node) => {
        if (node.type !== 'blob' || !node.path.toLowerCase().endsWith('.json')) return false;
        const baseName = node.path.split('/').pop()?.toLowerCase() || '';
        if (ignoredFiles.has(baseName) || baseName.startsWith('.')) return false;
        if (cleanSubPath && !node.path.startsWith(cleanSubPath)) return false;
        return true;
      });

      if (jsonNodes.length === 0) {
        res.status(400).json({
          error: 'No question JSON files were found in the specified repository and path.',
        });
        return;
      }

      const gitDir = path.join(QUESTION_BANK_DIR, 'git-sync');
      if (replaceExisting) {
        fs.rmSync(gitDir, { recursive: true, force: true });
      }
      fs.mkdirSync(gitDir, { recursive: true });

      let importedFilesCount = 0;
      const targetNodes = jsonNodes.slice(0, 300);
      const batchSize = 15;

      for (let i = 0; i < targetNodes.length; i += batchSize) {
        const batch = targetNodes.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (node) => {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${resolvedBranch}/${node.path}`;
            const fileResp = await fetch(rawUrl, { headers });
            if (fileResp.ok) {
              const text = await fileResp.text();
              const destPath = path.join(gitDir, node.path);
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.writeFileSync(destPath, text, 'utf-8');
              importedFilesCount++;
            }
          })
        );
      }

      const updatedRaw = scanQuestionBankDirectory(QUESTION_BANK_DIR);
      const diagnostics = qbEngine.ingestFiles(updatedRaw);

      res.json({
        importedFilesCount,
        resolvedBranch,
        questions: qbEngine.getAllQuestions(),
        diagnostics,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Git repository synchronization failed.' });
    }
  });

  // 4. Reset Question Bank (Preserves permanent /imported/converted and default 55-chapter bank)
  app.post('/api/question-bank/reset', (_req, res) => {
    fs.rmSync(path.join(QUESTION_BANK_DIR, 'user-uploads'), { recursive: true, force: true });
    fs.rmSync(path.join(QUESTION_BANK_DIR, 'git-sync'), { recursive: true, force: true });
    ensureQuestionBankSeeded(QUESTION_BANK_DIR);
    const updatedRaw = scanQuestionBankDirectory(QUESTION_BANK_DIR);
    const diagnostics = qbEngine.ingestFiles(updatedRaw);
    res.json({
      questions: qbEngine.getAllQuestions(),
      diagnostics,
    });
  });

  // 5. Get Student Persistent State
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

  // 6. Generate Test
  app.post('/api/tests/generate', (req, res) => {
    db = loadDatabase();
    const genReq = req.body as TestGenerationRequest;
    const user = getOrCreateUser(db, genReq.userId || 'student-arjun');

    const outcome = TestGeneratorService.generateTest(
      qbEngine,
      {
        ...genReq,
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

  // 7. Autosave Active Test State
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

  // 8. Discard Active Test
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

  // 9. Submit & Authoritatively Score Test (Idempotent)
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

    const targetTest =
      user.activeTest && user.activeTest.id === req.params.testId
        ? {
            ...user.activeTest,
            responses: testSnapshot?.responses || user.activeTest.responses,
          }
        : testSnapshot;

    if (!targetTest) {
      res.status(404).json({ error: 'Test session not found for submission.' });
      return;
    }

    targetTest.status = autoSubmitted ? TestStatus.AUTO_SUBMITTED : TestStatus.SUBMITTED;
    targetTest.endTime = new Date().toISOString();

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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vectra JEE Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
