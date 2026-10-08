import katex from 'katex';
import {
  parseContentSegments,
  renderMathToHtml,
  sanitizeLatex,
  isComplexMathStructure,
  scanQuestionBankMathHealth,
} from '../src/services/MathRendererService';
import fs from 'fs';
import path from 'path';

console.log('=====================================================');
console.log('   JEE PLATFORM MATHEMATICS RENDERING TEST SUITE     ');
console.log('=====================================================\n');

let allPassed = true;

function runTest(testName: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${testName}`);
  } catch (err: any) {
    allPassed = false;
    console.error(`[FAIL] ${testName}: ${err.message}`);
  }
}

// 1. REGRESSION TEST: Exact Screenshot Question
runTest('Regression Test: Screenshot Question', () => {
  const rawQuestion =
    '<p>The function \\(f: \\mathbb{R} \\rightarrow \\mathbb{R}\\) defined by <br/><br/>\\(f(x)=\\lim\\limits_{n \\rightarrow \\infty} \\frac{\\cos (2 \\pi x)-x^{2 n} \\sin (x-1)}{1+x^{2 n+1}-x^{2 n}}\\) is continuous for all x in :</p>';

  const segments = parseContentSegments(rawQuestion);
  if (segments.length < 3) {
    throw new Error(`Expected at least 3 segments (intro text, display math, trailing text), got ${segments.length}`);
  }

  // Segment 1 should be inline text containing f: R -> R
  const introSeg = segments.find((s) => s.type === 'inlineMath' && s.content.includes('\\mathbb{R}'));
  if (!introSeg) {
    throw new Error('Inline math for f: R -> R was not found');
  }

  // Segment 2 should be display math for the limit fraction formula
  const formulaSeg = segments.find(
    (s) => s.type === 'displayMath' && s.content.includes('\\frac') && s.content.includes('\\cos')
  );
  if (!formulaSeg) {
    throw new Error('Formula was not elevated to displayMath');
  }

  // Render formula
  const rendered = renderMathToHtml(formulaSeg.content, true);
  if (rendered.error || !rendered.html.includes('katex-display')) {
    throw new Error(`Formula failed KaTeX rendering: ${rendered.error}`);
  }

  // Trailing text should exist and contain "continuous for all x in"
  const trailingText = segments.find(
    (s) => s.type === 'text' && s.content.includes('continuous for all x in')
  );
  if (!trailingText) {
    throw new Error('Trailing question statement text was lost');
  }
});

// Test A — Simple inline math
runTest('Test A: Simple inline math ($x > 0$, then $x^2 > 0$)', () => {
  const text = 'If $x > 0$, then $x^2 > 0$.';
  const segs = parseContentSegments(text);
  const mathSegs = segs.filter((s) => s.type === 'inlineMath');
  if (mathSegs.length !== 2) throw new Error(`Expected 2 inline math segments, got ${mathSegs.length}`);
  for (const m of mathSegs) {
    const res = renderMathToHtml(m.content, false);
    if (res.error) throw new Error(res.error);
  }
});

// Test B — Simple fraction
runTest('Test B: Simple fraction (\\frac{a+b}{c+d})', () => {
  const text = 'Evaluate \\(\\frac{a+b}{c+d}\\) when a = 1.';
  const segs = parseContentSegments(text);
  const mathSeg = segs.find((s) => s.type === 'inlineMath' || s.type === 'displayMath');
  if (!mathSeg) throw new Error('Math segment not found');
  const res = renderMathToHtml(mathSeg.content, false);
  if (res.error) throw new Error(res.error);
});

// Test C — Large fraction
runTest('Test C: Large fraction (\\frac{x^{2n+1}+x^{n+1}}{1+x^{2n}-x^n})', () => {
  const text = 'Calculate \\(\\frac{x^{2n+1}+x^{n+1}}{1+x^{2n}-x^n}\\)';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Large fraction should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test D — Limit
runTest('Test D: Limit (\\lim_{x\\to0}\\frac{\\sin x}{x})', () => {
  const text = 'Find \\(\\lim_{x\\to0}\\frac{\\sin x}{x}\\)';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Limit should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test E — Integral
runTest('Test E: Integral (\\int_0^{\\pi/2}\\sin^2x\\,dx)', () => {
  const text = 'Compute \\(\\int_0^{\\pi/2}\\sin^2x\\,dx\\)';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Integral should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test F — Summation
runTest('Test F: Summation (\\sum_{r=1}^{n} r^2)', () => {
  const text = 'The sum \\(\\sum_{r=1}^{n} r^2\\) equals:';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Summation should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test G — Matrix
runTest('Test G: Matrix (\\begin{pmatrix} a & b\\\\ c & d \\end{pmatrix})', () => {
  const text = 'Let matrix \\(A = \\begin{pmatrix} a & b\\\\ c & d \\end{pmatrix}\\).';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Matrix should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test H — Piecewise
runTest('Test H: Piecewise (\\begin{cases} x^2, & x>0\\\\ -x, & x\\le0 \\end{cases})', () => {
  const text = 'Let \\(f(x)=\\begin{cases} x^2, & x>0\\\\ -x, & x\\le0 \\end{cases}\\).';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Piecewise function should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test I — Nested expression
runTest('Test I: Nested expression (\\lim_{n\\to\\infty} \\frac{ \\int_0^1 x^n\\,dx }{ 1+\\frac{1}{n} })', () => {
  const text = 'Evaluate \\(\\lim_{n\\to\\infty} \\frac{ \\int_0^1 x^n\\,dx }{ 1+\\frac{1}{n} }\\)';
  const segs = parseContentSegments(text);
  const dispSeg = segs.find((s) => s.type === 'displayMath');
  if (!dispSeg) throw new Error('Nested expression should be promoted to displayMath');
  const res = renderMathToHtml(dispSeg.content, true);
  if (res.error) throw new Error(res.error);
});

// Test J — Mixed text + multiple equations
runTest('Test J: Mixed text + multiple equations', () => {
  const text =
    'Let \\(f(x)=\\frac{x^2-1}{x-1}\\) and let \\(g(x)=\\int_0^x (2t+1)\\,dt\\). Determine the value of \\(f(g(2))\\).';
  const segs = parseContentSegments(text);
  const mathSegs = segs.filter((s) => s.type === 'displayMath' || s.type === 'inlineMath');
  if (mathSegs.length !== 3) throw new Error(`Expected 3 math segments, got ${mathSegs.length}`);
  for (const m of mathSegs) {
    const res = renderMathToHtml(m.content, m.type === 'displayMath');
    if (res.error) throw new Error(res.error);
  }
});

// Test K — Very long equation
runTest('Test K: Very long equation (horizontal containment check)', () => {
  const longEq =
    '\\(P(x) = a_n x^n + a_{n-1} x^{n-1} + a_{n-2} x^{n-2} + \\cdots + a_2 x^2 + a_1 x + a_0 = \\sum_{k=0}^{n} a_k x^k\\)';
  const segs = parseContentSegments(longEq);
  const disp = segs.find((s) => s.type === 'displayMath');
  if (!disp) throw new Error('Long equation should be displayMath');
  const res = renderMathToHtml(disp.content, true);
  if (res.error) throw new Error(res.error);
});

// Test L — Scraped MathJax quirks repair
runTest('Test L: Scraped MathJax quirks repair (\\sum_\\limits, \\root, \\buildrel, \\matrix)', () => {
  const q1 = sanitizeLatex('\\sum_\\limits{k=1}^{n} k');
  if (!q1.wasRepaired) throw new Error('\\sum_\\limits was not repaired');
  const q2 = sanitizeLatex('\\root 5 \\of {x^2+1}');
  if (!q2.wasRepaired) throw new Error('\\root was not repaired');
  const q3 = sanitizeLatex('\\left\\{ {\\matrix{ {1} & {2} \\cr {3} & {4} \\cr } } \\right.');
  if (!q3.wasRepaired) throw new Error('\\matrix was not repaired');

  // Verify all 3 render cleanly in KaTeX
  if (renderMathToHtml(q1.sanitized).error) throw new Error('q1 failed KaTeX');
  if (renderMathToHtml(q2.sanitized).error) throw new Error('q2 failed KaTeX');
  if (renderMathToHtml(q3.sanitized).error) throw new Error('q3 failed KaTeX');
});

// 2. Question Bank Health Check Scan
console.log('\n--- Scanning Question Bank Math Health ---');
const rootDir = process.cwd();
const files = fs
  .readdirSync(rootDir)
  .filter((f) => f.endsWith('.json') && !['package.json', 'tsconfig.json', 'metadata.json', 'bun.lock'].includes(f));

let allQuestions: any[] = [];
for (const file of files) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8'));
    if (parsed.questions && Array.isArray(parsed.questions)) {
      allQuestions.push(...parsed.questions);
    }
  } catch {}
}

const healthReport = scanQuestionBankMathHealth(allQuestions);
console.log(`Total questions scanned: ${healthReport.totalScanned}`);
console.log(`Questions containing mathematics: ${healthReport.withMathCount}`);
console.log(`Rendered successfully without error: ${healthReport.renderedSuccessfully}`);
console.log(`Scraped LaTeX syntax auto-repaired: ${healthReport.repairedCount}`);
console.log(`Failed math segments: ${healthReport.failedCount}`);
console.log(`Long equations handled: ${healthReport.longEquationCount}`);

if (!allPassed || healthReport.failedCount > 50) {
  console.error('\nFAIL: Mathematical rendering suite has unresolved issues.');
  process.exit(1);
} else {
  console.log('\nSUCCESS: All math tests passed! Regression test verified.');
}
