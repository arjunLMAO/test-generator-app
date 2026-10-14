import {
  parseQuestionContentBlocks,
  parseHtmlMatchTable,
  parseTextMatching,
  parseGeneralTable,
  MatchTableData,
} from '../src/services/MathRendererService';
import { sanitizeStudentQuestionText } from '../src/services/StudentQuestionSerializer';
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Comprehensive Match Question & Table Renderer Regression Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    testsFailed++;
  }
}

// -------------------------------------------------------------
// Test Case 1: Four short items in each list (Basic Matching)
// -------------------------------------------------------------
console.log('🔹 Test 1: Standard Four Short Items in Each List');
const test1Text = `Match List I with List II
LIST I LIST II
A. Purely capacitive circuit I. Phase lead by 90
B. Purely inductive circuit II. Phase lag by 90
C. LCR series at resonance III. In same phase
D. LCR series circuit IV. Arbitrary phase difference
Choose the correct answer from the options given below:`;

const test1Blocks = parseQuestionContentBlocks(test1Text);
assert(test1Blocks.length === 1 && test1Blocks[0].type === 'matchingTable', 'Test 1 parsed into matchingTable block');
if (test1Blocks[0]?.type === 'matchingTable') {
  const data = test1Blocks[0].data;
  assert(data.rows.length === 4, 'Test 1 has exactly 4 rows');
  assert(data.rows[0].leftLabel === '(A)' && data.rows[0].rightLabel === '(I)', 'Test 1 has correct labels for row 1');
  assert(data.rows[3].leftLabel === '(D)' && data.rows[3].rightLabel === '(IV)', 'Test 1 has correct labels for row 4');
  assert(data.list1Title === 'List I' && data.list2Title === 'List II', 'Test 1 headers correct');
}

// -------------------------------------------------------------
// Test Case 2 & 3: Long text in List I and List II
// -------------------------------------------------------------
console.log('\n🔹 Test 2 & 3: Long Text Wrapping & Structural Balance');
const test2Text = `Match List - I with List - II
List I (Physical Phenomenon & Complex Setup) List II (Associated Law)
(A) When an oscillating mechanical wave travels across an inhomogeneous viscoelastic medium experiencing continuous damping and multiple boundary reflections (I) Generalized Helmholtz Equation with dissipative terms
(B) Two opposite equal point charges placed in a dielectric fluid subjected to a non-uniform external time-varying magnetic field (II) Maxwell-Ampere relation with non-linear displacement current
Choose the correct answer:`;

const test2Blocks = parseQuestionContentBlocks(test2Text);
assert(test2Blocks.length === 1 && test2Blocks[0].type === 'matchingTable', 'Test 2 parsed into matchingTable block');
if (test2Blocks[0]?.type === 'matchingTable') {
  const data = test2Blocks[0].data;
  assert(data.rows.length === 2, 'Test 2 has 2 rows');
  assert(data.rows[0].leftContent.includes('oscillating mechanical wave'), 'Test 2 preserves long text in List I');
  assert(data.rows[0].rightContent.includes('Helmholtz Equation'), 'Test 2 preserves long text in List II');
  assert(data.list1Title.includes('Physical Phenomenon'), 'Test 2 extracted subtitle for List I');
}

// -------------------------------------------------------------
// Test Case 4: Mathematical notation (fractions, integrals, dimensional formulas)
// -------------------------------------------------------------
console.log('\n🔹 Test 4: Mathematical Notation in Table Cells');
const test4Text = `<p>Match List I with List II</p>
<table class="tg" style="undefined;table-layout: fixed; width: 614px">
<thead>
<tr>
<th></th>
<th>List I (Physical Quantity)</th>
<th></th>
<th>List II (Dimensional Formula)</th>
</tr>
</thead>
<tbody>
<tr>
<td>A.</td>
<td>Pressure gradient</td>
<td>I.</td>
<td>\\(\\left[\\mathrm{M}^{\\circ} \\mathrm{L}^{2} \\mathrm{~T}^{-2}\\right]\\)</td>
</tr>
<tr>
<td>B.</td>
<td>Magnetic induction</td>
<td>II.</td>
<td>\\(\\int \\vec{B} \\cdot d\\vec{l} = \\mu_0 I\\)</td>
</tr>
</tbody>
</table>
<p>Choose the correct answer from the options given below:</p>`;

const test4Blocks = parseQuestionContentBlocks(test4Text);
assert(test4Blocks.length === 1 && test4Blocks[0].type === 'matchingTable', 'Test 4 parsed into matchingTable block');
if (test4Blocks[0]?.type === 'matchingTable') {
  const data = test4Blocks[0].data;
  assert(data.rows.length === 2, 'Test 4 has 2 rows');
  assert(data.rows[0].rightContent.includes('\\mathrm{M}^{\\circ}'), 'Test 4 LaTeX formula preserved intact');
  assert(data.rows[1].rightContent.includes('\\int \\vec{B}'), 'Test 4 integral formula preserved intact');
}

// -------------------------------------------------------------
// Test Case 5: Chemical Formulae with Subscripts & Superscripts
// -------------------------------------------------------------
console.log('\n🔹 Test 5: Chemical Formulae with Complex Notation');
const test5Text = `Match List I with List II
LIST I (Complex ion) LIST II (Hybridisation)
A. \\( \\left[\\mathrm{Cr}\\left(\\mathrm{NH}_3\\right)_6\\right]^{3+} \\) I. \\( \\mathrm{d}^2\\mathrm{sp}^3 \\)
B. \\( \\left[\\mathrm{Ni}(\\mathrm{CN})_4\\right]^{2-} \\) II. \\( \\mathrm{dsp}^2 \\)
C. \\( \\mathrm{SF}_6 \\) III. \\( \\mathrm{sp}^3\\mathrm{d}^2 \\)
D. \\( \\mathrm{PF}_5 \\) IV. \\( \\mathrm{sp}^3\\mathrm{d} \\)
Choose the correct answer from the options given below:`;

const test5Blocks = parseQuestionContentBlocks(test5Text);
assert(test5Blocks.length === 1 && test5Blocks[0].type === 'matchingTable', 'Test 5 parsed into matchingTable block');
if (test5Blocks[0]?.type === 'matchingTable') {
  const data = test5Blocks[0].data;
  assert(data.rows.length === 4, 'Test 5 has 4 chemical rows');
  assert(data.rows[0].leftContent.includes('\\mathrm{Cr}'), 'Test 5 Chromium complex preserved');
  assert(data.rows[1].rightContent.includes('\\mathrm{dsp}^2'), 'Test 5 hybridisation preserved');
}

// -------------------------------------------------------------
// Test Case 6: Matching Questions with Images (<img src="..."> and [image: ...])
// -------------------------------------------------------------
console.log('\n🔹 Test 6: Image-based Matching Questions');
const test6HtmlImg = `<p>Match List I with List II :</p>
<table>
<tr><td>A.</td><td><img src="https://example.com/diag1.png" alt="Circuit A" /></td><td>I.</td><td>Resonance</td></tr>
<tr><td>B.</td><td><img src="https://example.com/diag2.png" alt="Circuit B" /></td><td>II.</td><td>Antiresonance</td></tr>
</table>`;

const test6Blocks = parseQuestionContentBlocks(test6HtmlImg);
assert(test6Blocks.length === 1 && test6Blocks[0].type === 'matchingTable', 'Test 6 HTML img table parsed');
if (test6Blocks[0]?.type === 'matchingTable') {
  assert(test6Blocks[0].data.rows[0].leftContent.includes('img src='), 'Test 6 preserved img tag in cell');
}

const test6BracketImg = `Match List I with List II
LIST I LIST II
A. Purely capacitive circuit I. [image: JEE Main 2024 Question 19 Phasor 1]
B. Purely inductive circuit II. [image: JEE Main 2024 Question 19 Phasor 2]
Choose the correct answer:`;

const sanitized6 = sanitizeStudentQuestionText(test6BracketImg);
const test6BracketBlocks = parseQuestionContentBlocks(sanitized6);
assert(test6BracketBlocks.length === 1 && test6BracketBlocks[0].type === 'matchingTable', 'Test 6 bracket image preserved after sanitize');
if (test6BracketBlocks[0]?.type === 'matchingTable') {
  assert(test6BracketBlocks[0].data.rows[0].rightContent.includes('image:'), 'Test 6 bracket placeholder preserved inside cell');
}

// -------------------------------------------------------------
// Test Case 7: Questions with More or Fewer than 4 Matching Items (e.g. 3 or 5 items)
// -------------------------------------------------------------
console.log('\n🔹 Test 7: Non-Standard Item Counts (3 and 5 Items)');
const test7ThreeItems = `Match List I with List II
LIST I LIST II
(A) Item Alpha (I) Result 1
(B) Item Beta (II) Result 2
(C) Item Gamma (III) Result 3
Choose the correct answer:`;

const test7Blocks = parseQuestionContentBlocks(test7ThreeItems);
assert(test7Blocks.length === 1 && test7Blocks[0].type === 'matchingTable', 'Test 7 (3 items) parsed');
if (test7Blocks[0]?.type === 'matchingTable') {
  assert(test7Blocks[0].data.rows.length === 3, 'Test 7 accurately has 3 rows');
}

const test7FiveItems = `Match List I with List II
LIST I LIST II
A. Item 1 I. Result A
B. Item 2 II. Result B
C. Item 3 III. Result C
D. Item 4 IV. Result D
E. Item 5 V. Result E
Choose the correct answer:`;

const test7FiveBlocks = parseQuestionContentBlocks(test7FiveItems);
assert(test7FiveBlocks.length === 1 && test7FiveBlocks[0].type === 'matchingTable', 'Test 7 (5 items) parsed');
if (test7FiveBlocks[0]?.type === 'matchingTable') {
  assert(test7FiveBlocks[0].data.rows.length === 5, 'Test 7 accurately has 5 rows');
}

// -------------------------------------------------------------
// Test Case 8: Advanced Matching with (P), (Q), (R), (S) labels
// -------------------------------------------------------------
console.log('\n🔹 Test 8: JEE Advanced (P), (Q), (R), (S) Matching');
const test8PQRS = `Match Column I with Column II
Column I Column II
(P) Isothermal expansion (1) Internal energy constant
(Q) Adiabatic expansion (2) Heat exchanged is zero
(R) Isochoric process (3) Work done is zero
(S) Isobaric process (4) Pressure constant
Choose the correct matching:`;

const test8Blocks = parseQuestionContentBlocks(test8PQRS);
assert(test8Blocks.length === 1 && test8Blocks[0].type === 'matchingTable', 'Test 8 PQRS parsed');
if (test8Blocks[0]?.type === 'matchingTable') {
  const data = test8Blocks[0].data;
  assert(data.rows[0].leftLabel === '(P)' && data.rows[0].rightLabel === '(1)', 'Test 8 has (P) and (1) labels');
  assert(data.rows[3].leftLabel === '(S)' && data.rows[3].rightLabel === '(4)', 'Test 8 has (S) and (4) labels');
}

// -------------------------------------------------------------
// Test Case 9: General Data Table (Probability distribution / Statistics)
// -------------------------------------------------------------
console.log('\n🔹 Test 9: General Data Tables (Probability & Statistics)');
const test9Stats = `<p>A random variable X has the following probability distribution:</p>
<table border="1">
<thead>
<tr><th>X</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
</thead>
<tbody>
<tr><td>P(X)</td><td>0.1</td><td>k</td><td>2k</td><td>0.2</td></tr>
</tbody>
</table>
<p>Find the variance of X.</p>`;

const test9Blocks = parseQuestionContentBlocks(test9Stats);
assert(test9Blocks.some((b) => b.type === 'dataTable'), 'Test 9 parsed dataTable block');
const dataTableBlock = test9Blocks.find((b) => b.type === 'dataTable');
if (dataTableBlock && dataTableBlock.type === 'dataTable') {
  assert(dataTableBlock.data.headers.length === 5, 'Test 9 dataTable has 5 columns');
  assert(dataTableBlock.data.rows.length === 1, 'Test 9 dataTable has 1 data row');
}

// -------------------------------------------------------------
// Test Case 10: Full Question Bank Sweep across all 173 matching/table questions
// -------------------------------------------------------------
console.log('\n🔹 Test 10: Full Database Integrity Sweep (Physics, Chemistry, Math)');
const baseDir = path.join(process.cwd(), 'question-bank');
let qbTotalScanned = 0;
let qbMatchParsed = 0;

for (const sub of ['physics', 'chemistry', 'mathematics']) {
  const subDir = path.join(baseDir, sub);
  if (!fs.existsSync(subDir)) continue;
  for (const f of fs.readdirSync(subDir)) {
    if (!f.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8'));
    for (const q of data.questions || []) {
      const text = q.question || '';
      if (/<table|Match\s+(?:List|Column|the)|List\s*[-–—\s]*[I1]\b/i.test(text)) {
        qbTotalScanned++;
        const sanitized = sanitizeStudentQuestionText(text);
        const blocks = parseQuestionContentBlocks(sanitized);
        const hasTableBlock = blocks.some((b) => b.type === 'matchingTable' || b.type === 'dataTable');
        if (hasTableBlock) {
          qbMatchParsed++;
        }
      }
    }
  }
}

console.log(`  Scanned ${qbTotalScanned} table/match questions in question bank. Successfully parsed: ${qbMatchParsed}`);
assert(qbMatchParsed >= 165, `At least 95%+ of all matching/table questions (${qbMatchParsed}/${qbTotalScanned}) parsed into structured table blocks`);

console.log(`\n======================================================`);
console.log(`🏁 Regression Suite Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log(`======================================================\n`);

if (testsFailed > 0) {
  process.exit(1);
}
