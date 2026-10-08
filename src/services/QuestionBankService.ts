import { NormalizedQuestion, QuestionBankDiagnostics, SubjectName } from '../types/jee';
import { QuestionBankEngine, RawFilePayload } from './QuestionBankEngine';
import { QuestionBankManifest, STATIC_QUESTION_BANK_MANIFEST_URL, QUESTION_BANK_VERSION } from '../data/questionBankManifest';

export interface QuestionBankServiceHealth {
  status: 'ok' | 'degraded' | 'error';
  physics: boolean;
  chemistry: boolean;
  mathematics: boolean;
  totalQuestions: number;
  filesLoaded: number;
  source: 'api' | 'static-manifest' | 'cache';
  version: string;
}

export interface QuestionBankLoadErrorDetails {
  category: 'QUESTION_BANK_FETCH_FAILED' | 'MANIFEST_FETCH_FAILED' | 'CHUNK_FETCH_FAILED' | 'EMPTY_DATABASE';
  sourceUrl?: string;
  httpStatus?: number;
  environment: string;
  message: string;
  attemptsMade: number;
}

const CACHE_KEY_QUESTIONS = `jee_qb_questions_v${QUESTION_BANK_VERSION}`;
const CACHE_KEY_DIAGNOSTICS = `jee_qb_diagnostics_v${QUESTION_BANK_VERSION}`;
const CACHE_KEY_TIMESTAMP = `jee_qb_timestamp_v${QUESTION_BANK_VERSION}`;

class QuestionBankServiceImpl {
  private engine: QuestionBankEngine = new QuestionBankEngine();
  private loaded: boolean = false;
  private loadPromise: Promise<{ questions: NormalizedQuestion[]; diagnostics: QuestionBankDiagnostics }> | null = null;
  private lastError: QuestionBankLoadErrorDetails | null = null;
  private loadSource: 'api' | 'static-manifest' | 'cache' = 'api';

  public isLoaded(): boolean {
    return this.loaded && this.engine.getAllQuestions().length > 0;
  }

  public getLastError(): QuestionBankLoadErrorDetails | null {
    return this.lastError;
  }

  public getLoadSource(): 'api' | 'static-manifest' | 'cache' {
    return this.loadSource;
  }

  public getAllQuestions(): NormalizedQuestion[] {
    return this.engine.getAllQuestions();
  }

  public getQuestionById(id: string): NormalizedQuestion | undefined {
    return this.engine.getQuestionById(id);
  }

  public getQuestionsByIds(ids: string[]): NormalizedQuestion[] {
    const list: NormalizedQuestion[] = [];
    for (const id of ids) {
      const q = this.engine.getQuestionById(id);
      if (q) list.push(q);
    }
    return list;
  }

  public getQuestionsBySubject(subject: SubjectName): NormalizedQuestion[] {
    return this.engine.getQuestionsBySubject(subject);
  }

  public getQuestionsByChapter(subject: SubjectName, chapter: string): NormalizedQuestion[] {
    return this.engine.getQuestionsByChapter(subject, chapter);
  }

  public getDiagnostics(): QuestionBankDiagnostics | null {
    return this.loaded ? this.engine.getDiagnostics() : null;
  }

  /**
   * Health check for production deployment verification (Section 18).
   */
  public async getHealthCheck(): Promise<QuestionBankServiceHealth> {
    const questions = this.engine.getAllQuestions();
    const phys = this.engine.getQuestionsBySubject('Physics').length;
    const chem = this.engine.getQuestionsBySubject('Chemistry').length;
    const math = this.engine.getQuestionsBySubject('Mathematics').length;

    const healthy = questions.length > 0 && phys > 0 && chem > 0 && math > 0;

    return {
      status: healthy ? 'ok' : 'degraded',
      physics: phys > 0,
      chemistry: chem > 0,
      mathematics: math > 0,
      totalQuestions: questions.length,
      filesLoaded: this.engine.getDiagnostics().filesScanned,
      source: this.loadSource,
      version: QUESTION_BANK_VERSION,
    };
  }

  /**
   * Central Question Bank Loading Pipeline (Section 1, 5, 6, 10, 21, 22).
   * 1. Attempts API endpoint /api/question-bank
   * 2. If API fails or 404s (e.g. Vercel static deployment), switches to CDN manifest & static JSON files
   * 3. Normalizes authentic JEE Main PYQs through QuestionBankEngine
   * 4. Includes controlled 3-attempt retry with backoff
   * 5. Never falls back to mock questions
   */
  public async loadQuestionBank(options?: {
    forceReload?: boolean;
    onProgress?: (loadedChapters: number, totalChapters: number, statusMsg: string) => void;
  }): Promise<{ questions: NormalizedQuestion[]; diagnostics: QuestionBankDiagnostics }> {
    if (this.isLoaded() && !options?.forceReload) {
      return {
        questions: this.engine.getAllQuestions(),
        diagnostics: this.engine.getDiagnostics(),
      };
    }

    if (this.loadPromise && !options?.forceReload) {
      return this.loadPromise;
    }

    this.loadPromise = this.executeLoadPipeline(options);
    try {
      const result = await this.loadPromise;
      return result;
    } finally {
      this.loadPromise = null;
    }
  }

  private async executeLoadPipeline(options?: {
    forceReload?: boolean;
    onProgress?: (loadedChapters: number, totalChapters: number, statusMsg: string) => void;
  }): Promise<{ questions: NormalizedQuestion[]; diagnostics: QuestionBankDiagnostics }> {
    const environment = typeof process !== 'undefined' && process.env?.NODE_ENV ? process.env.NODE_ENV : 'production';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      options?.onProgress?.(0, 62, `Loading question bank (attempt ${attempts}/${maxAttempts})...`);

      // TIER 1: Try Backend Server / Serverless API route (/api/question-bank)
      try {
        const apiRes = await fetch('/api/question-bank', {
          headers: { Accept: 'application/json' },
        });

        if (apiRes.ok) {
          const contentType = apiRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await apiRes.json();
            if (data && Array.isArray(data.questions) && data.questions.length > 500) {
              this.engine = new QuestionBankEngine();
              // Ingest the raw questions
              this.engine.ingestFiles([
                {
                  filePath: 'api/all-questions.json',
                  content: { questions: data.questions, chapter: 'Full Syllabus' },
                },
              ]);
              this.loaded = true;
              this.loadSource = 'api';
              this.lastError = null;
              this.cacheToStorage(data.questions, data.diagnostics || this.engine.getDiagnostics());
              return {
                questions: this.engine.getAllQuestions(),
                diagnostics: data.diagnostics || this.engine.getDiagnostics(),
              };
            }
          }
        } else {
          console.warn(
            `[QuestionBankService] /api/question-bank returned status ${apiRes.status}. Falling back to production CDN manifest.`
          );
        }
      } catch (apiErr: any) {
        console.warn(
          `[QuestionBankService] /api/question-bank fetch failed (${apiErr.message || apiErr}). Falling back to production CDN manifest.`
        );
      }

      // TIER 2: Production Static Asset CDN Loader (/question-bank/manifest.json + static chunks)
      try {
        options?.onProgress?.(1, 62, 'Connecting to production question repository...');
        const manifestRes = await fetch(STATIC_QUESTION_BANK_MANIFEST_URL, {
          headers: { Accept: 'application/json' },
        });

        if (manifestRes.ok) {
          const manifest: QuestionBankManifest = await manifestRes.json();
          if (manifest && Array.isArray(manifest.chapters) && manifest.chapters.length > 0) {
            const rawFiles: RawFilePayload[] = [];
            const totalChapters = manifest.chapters.length;
            let loadedCount = 0;

            // Load chapter JSON files in concurrent batches of 6
            const batchSize = 6;
            for (let i = 0; i < manifest.chapters.length; i += batchSize) {
              const batch = manifest.chapters.slice(i, i + batchSize);
              const batchPromises = batch.map(async (entry) => {
                try {
                  const chunkRes = await fetch(entry.urlPath, {
                    headers: { Accept: 'application/json' },
                  });
                  if (!chunkRes.ok) {
                    // Try unencoded fallback url
                    const rawUrl = `/question-bank/${entry.relativePath}`;
                    const fallbackRes = await fetch(rawUrl, {
                      headers: { Accept: 'application/json' },
                    });
                    if (fallbackRes.ok) {
                      const json = await fallbackRes.json();
                      return { filePath: entry.relativePath, content: json };
                    }
                    console.error(`Failed to load ${entry.relativePath}: HTTP ${chunkRes.status}`);
                    return null;
                  }
                  const json = await chunkRes.json();
                  return { filePath: entry.relativePath, content: json };
                } catch (chunkErr) {
                  console.error(`Error loading ${entry.relativePath}:`, chunkErr);
                  return null;
                }
              });

              const batchResults = await Promise.all(batchPromises);
              for (const item of batchResults) {
                if (item) {
                  rawFiles.push(item);
                  loadedCount++;
                }
              }

              options?.onProgress?.(
                loadedCount,
                totalChapters,
                `Loaded ${loadedCount} of ${totalChapters} JEE chapters...`
              );
            }

            if (rawFiles.length > 0) {
              this.engine = new QuestionBankEngine(rawFiles);
              const finalQuestions = this.engine.getAllQuestions();
              if (finalQuestions.length > 500) {
                this.loaded = true;
                this.loadSource = 'static-manifest';
                this.lastError = null;
                this.cacheToStorage(finalQuestions, this.engine.getDiagnostics());
                return {
                  questions: finalQuestions,
                  diagnostics: this.engine.getDiagnostics(),
                };
              }
            }
          }
        }
      } catch (staticErr: any) {
        console.warn(`[QuestionBankService] CDN manifest loader failed:`, staticErr);
      }

      // TIER 3: Check Client LocalStorage Cache before retrying
      const cached = this.loadFromStorage();
      if (cached && cached.questions.length > 500) {
        this.engine = new QuestionBankEngine();
        this.engine.ingestFiles([
          {
            filePath: 'cached/all-questions.json',
            content: { questions: cached.questions, chapter: 'Full Syllabus' },
          },
        ]);
        this.loaded = true;
        this.loadSource = 'cache';
        this.lastError = null;
        return {
          questions: this.engine.getAllQuestions(),
          diagnostics: cached.diagnostics,
        };
      }

      // If failed, wait before retry
      if (attempts < maxAttempts) {
        const delayMs = attempts * 600;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Exhausted all 3 attempts
    const errorDetails: QuestionBankLoadErrorDetails = {
      category: 'QUESTION_BANK_FETCH_FAILED',
      sourceUrl: '/api/question-bank & /question-bank/manifest.json',
      httpStatus: 404,
      environment,
      message:
        'Unable to load the authentic JEE Question Bank after multiple attempts. Verified CDN and API endpoints were unreachable.',
      attemptsMade: attempts,
    };

    this.lastError = errorDetails;
    throw new Error(errorDetails.message);
  }

  private cacheToStorage(questions: NormalizedQuestion[], diagnostics: QuestionBankDiagnostics) {
    try {
      // Don't overwhelm localStorage if quota is tight, but cache sample/metadata
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(CACHE_KEY_TIMESTAMP, new Date().toISOString());
        sessionStorage.setItem(CACHE_KEY_DIAGNOSTICS, JSON.stringify(diagnostics));
      }
    } catch {
      // ignore storage quota error
    }
  }

  private loadFromStorage(): { questions: NormalizedQuestion[]; diagnostics: QuestionBankDiagnostics } | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const diagRaw = sessionStorage.getItem(CACHE_KEY_DIAGNOSTICS);
        const qRaw = sessionStorage.getItem(CACHE_KEY_QUESTIONS);
        if (diagRaw && qRaw) {
          const diagnostics = JSON.parse(diagRaw);
          const questions = JSON.parse(qRaw);
          return { questions, diagnostics };
        }
      }
    } catch {
      // ignore malformed cache
    }
    return null;
  }
}

export const questionBankService = new QuestionBankServiceImpl();
