import fs from 'fs';
import path from 'path';
import { VisualAssetEngine } from '../src/services/VisualAssetEngine';

export interface AuditReport {
  totalQuestions: number;
  questionsContainingDiagramMarkers: number;
  questionsWithValidVisualAssets: number;
  questionsWithMissingVisuals: number;
  questionsWithBrokenVisuals: number;
  questionsWithPlaceholderMetadataExposed: number;
  questionsWithSuspiciousImageMappings: number;
  questionsRepaired: number;
  questionsRequiringManualReview: number;
}

export function runVisualAssetsMigration(): AuditReport {
  const rootDir = process.cwd();
  const qbDir = path.join(rootDir, 'question-bank');

  const report: AuditReport = {
    totalQuestions: 0,
    questionsContainingDiagramMarkers: 0,
    questionsWithValidVisualAssets: 0,
    questionsWithMissingVisuals: 0,
    questionsWithBrokenVisuals: 0,
    questionsWithPlaceholderMetadataExposed: 0,
    questionsWithSuspiciousImageMappings: 0,
    questionsRepaired: 0,
    questionsRequiringManualReview: 0,
  };

  const markerRegex = /\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*([^\]]+)\]/i;
  const globalMarkerRegex = /\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*([^\]]+)\]/gi;
  const trailingHeaderRegex = /(?:\n|<br\s*\/?>|\s)*Question\s+\d+\s+English(?=[.,?;:\s]|$)/gi;

  function processQuestions(questions: any[]): boolean {
    let changed = false;

    for (const q of questions) {
      report.totalQuestions++;
      const rawText = String(q.question || '');
      const rawExpl = String(q.explanation || '');

      const hasMarkerInQ = markerRegex.test(rawText);
      const hasMarkerInExpl = markerRegex.test(rawExpl);
      const hasImgTagInQ = /<img\b[^>]+src\s*=\s*["']([^"']+)["']/i.test(rawText);

      if (hasMarkerInQ || hasMarkerInExpl || hasImgTagInQ) {
        report.questionsContainingDiagramMarkers++;
      }

      // Check if raw text had marker
      if (hasMarkerInQ) {
        const markerMatch = rawText.match(markerRegex);
        const marker = markerMatch ? markerMatch[0] : '';
        q.diagram_ref = markerMatch ? markerMatch[2].trim() : '';
        if (!q.raw_question_text) {
          q.raw_question_text = rawText;
        }

        // Clean question text
        const cleanedText = rawText
          .replace(globalMarkerRegex, '')
          .replace(trailingHeaderRegex, '')
          .trim();

        if (cleanedText !== q.question) {
          q.question = cleanedText;
          changed = true;
          report.questionsRepaired++;
        }

        // Clean explanation
        if (hasMarkerInExpl) {
          q.diagram_explanation_ref = rawExpl.match(markerRegex)?.[0] || '';
          q.explanation = rawExpl.replace(globalMarkerRegex, '').replace(trailingHeaderRegex, '').trim();
          changed = true;
        }

        // Priority 4: Specific known verified PYQ reconstruction (CE-0163 / Question 113)
        if (
          q.id === 'CE-0163' ||
          (q.diagram_ref && /Current Electricity.*Question 113/i.test(q.diagram_ref)) ||
          (q.chapter?.includes('Current') && q.question?.includes('equivalent resistance between') && q.question?.includes('network shown in figure'))
        ) {
          const va = VisualAssetEngine.createWheatstoneBridge113Diagram(q.id);
          q.visualAsset = va;
          q.image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(va.svgContent!)}`;
          q.images = [q.image];
          q.visualRequired = true;
          q.visualStatus = 'verified';
          changed = true;
        }
      }

      // Priority 2: Extract embedded <img> URL if present and image not set
      if (!q.image && hasImgTagInQ) {
        const imgMatch = rawText.match(/<img\b[^>]+src\s*=\s*["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          q.image = imgMatch[1];
          q.images = [imgMatch[1]];
          q.visualRequired = true;
          q.visualStatus = 'verified';
          changed = true;
        }
      }

      // Resolve final visual status
      const currentImg = typeof q.image === 'string' ? q.image.trim() : null;
      const isMetadataString = currentImg && /^\[(image|diagram|figure|graph|reaction|structure):/i.test(currentImg);

      if (isMetadataString) {
        // Fix bug: metadata string must never be used as image
        q.image = null;
        q.images = [];
        report.questionsWithSuspiciousImageMappings++;
        changed = true;
      }

      if (q.visualAsset?.svgContent || (q.image && !isMetadataString)) {
        q.visualRequired = true;
        q.visualStatus = 'verified';
        report.questionsWithValidVisualAssets++;
      } else if (hasMarkerInQ || q.visualRequired || q.isVisualQuestion) {
        q.visualRequired = true;
        q.visualStatus = 'missing';
        q.needs_review = true;
        report.questionsWithMissingVisuals++;
        report.questionsRequiringManualReview++;
      }

      // Check if placeholder metadata is still exposed in question
      if (markerRegex.test(q.question)) {
        report.questionsWithPlaceholderMetadataExposed++;
      }
    }

    return changed;
  }

  function walkAndMigrate(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkAndMigrate(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(full, 'utf-8'));
          if (Array.isArray(content)) {
            const changed = processQuestions(content);
            if (changed) {
              fs.writeFileSync(full, JSON.stringify(content, null, 2), 'utf-8');
            }
          } else if (content && Array.isArray(content.questions)) {
            const changed = processQuestions(content.questions);
            if (changed) {
              fs.writeFileSync(full, JSON.stringify(content, null, 2), 'utf-8');
            }
          }
        } catch {
          // ignore unparseable files
        }
      }
    }
  }

  walkAndMigrate(qbDir);

  // Also migrate the root files
  const rootFiles = fs.readdirSync(rootDir).filter(
    (f) =>
      f.endsWith('.json') &&
      !['package.json', 'tsconfig.json', 'metadata.json', 'bun.lock'].includes(f)
  );

  for (const f of rootFiles) {
    const full = path.join(rootDir, f);
    try {
      const content = JSON.parse(fs.readFileSync(full, 'utf-8'));
      if (content && Array.isArray(content.questions)) {
        const changed = processQuestions(content.questions);
        if (changed) {
          fs.writeFileSync(full, JSON.stringify(content, null, 2), 'utf-8');
        }
      }
    } catch {
      // ignore
    }
  }

  return report;
}

// If run directly via node/tsx
if (require.main === module || process.argv[1]?.includes('migrate-visual-assets')) {
  console.log('Starting Visual Assets Migration & Database Audit...');
  const audit = runVisualAssetsMigration();
  console.log('=== VISUAL ASSET AUDIT REPORT ===');
  console.log('Total questions:', audit.totalQuestions);
  console.log('Questions containing diagram markers:', audit.questionsContainingDiagramMarkers);
  console.log('Questions with valid visual assets:', audit.questionsWithValidVisualAssets);
  console.log('Questions with missing visuals:', audit.questionsWithMissingVisuals);
  console.log('Questions with broken visuals:', audit.questionsWithBrokenVisuals);
  console.log('Questions with placeholder metadata still exposed:', audit.questionsWithPlaceholderMetadataExposed);
  console.log('Questions with suspicious image mappings:', audit.questionsWithSuspiciousImageMappings);
  console.log('Questions repaired:', audit.questionsRepaired);
  console.log('Questions requiring manual review:', audit.questionsRequiringManualReview);
}
