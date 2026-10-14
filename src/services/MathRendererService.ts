import katex from 'katex';

export type ContentSegmentType = 'text' | 'inlineMath' | 'displayMath';

export interface ContentSegment {
  type: ContentSegmentType;
  content: string; // plain text HTML or LaTeX source
  renderedHtml?: string;
  error?: string;
}

export type InlineItem =
  | { type: 'text'; text: string }
  | { type: 'inlineMath'; latex: string; renderedHtml: string };

export interface MatchTableRow {
  id: string;
  leftLabel: string;   // e.g. "(A)", "(P)"
  leftContent: string; // text, LaTeX formula, or HTML img
  rightLabel: string;  // e.g. "(I)", "(1)"
  rightContent: string;// text, LaTeX formula, or HTML img
}

export interface MatchTableData {
  instructionPrefix?: string;
  list1Title: string;
  list2Title: string;
  rows: MatchTableRow[];
  instructionSuffix?: string;
}

export interface DataTableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export type QuestionContentBlock =
  | { type: 'paragraph'; items: InlineItem[] }
  | { type: 'displayMath'; latex: string; renderedHtml: string }
  | { type: 'matchingTable'; data: MatchTableData }
  | { type: 'dataTable'; data: DataTableData };

export interface MathHealthReport {
  totalScanned: number;
  withMathCount: number;
  renderedSuccessfully: number;
  repairedCount: number;
  failedCount: number;
  suspiciousEscapingCount: number;
  unbalancedDelimitersCount: number;
  longEquationCount: number;
  failedQuestions: Array<{
    questionId: string;
    rawSnippet: string;
    error: string;
  }>;
}

/**
 * Decodes HTML entities commonly produced by web scrapers or CMS export tools.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Normalizes scraped HTML layout, removing style blocks and diagram markers.
 */
export function normalizeHtmlFormatting(input: string): string {
  if (!input) return '';
  return (
    input
      // Strip embedded <style>...</style> blocks
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Strip diagram/image metadata placeholders so they never leak into student text
      .replace(/\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):[\s\S]*?\]/gi, '')
      // Strip leftover scraper question header artifacts like "Question 113 English"
      .replace(/(?:\n|<br\s*\/?>|\s)*Question\s+\d+\s+English(?=[.,?;:\s]|$)/gi, '')
      .replace(/(?:\n|<br\s*\/?>|\s)*\[(?:image|diagram|figure|graph|reaction|structure)[\s\S]*?\]/gi, '')
      // Standardize paragraph tags into linebreaks
      .replace(/<\/p>\s*<p>/gi, '<br/><br/>')
      .replace(/<\/?p[^>]*>/gi, '')
      .replace(/<\/?blockquote[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '<br/>')
      // Collapse excessive linebreaks
      .replace(/(?:<br\/>\s*){3,}/gi, '<br/><br/>')
      .trim()
  );
}

/**
 * Sanitizes and repairs common LaTeX syntax quirks found in JEE examination databases.
 */
export function sanitizeLatex(input: string): { sanitized: string; wasRepaired: boolean } {
  let s = decodeHtmlEntities(input).trim();
  const original = s;

  // 1. Fix TeX subscripts before limits: \int_\limits -> \int\limits_
  s = s.replace(/\\(int|iint|iiint|oint|sum|prod|lim|coprod)\s*_\\limits\s*\{/g, '\\$1\\limits_{');
  s = s.replace(/\\(int|iint|iiint|oint|sum|prod|lim|coprod)\s*_\\limits\s*([0-9a-zA-Z\\])/g, '\\$1\\limits_{$2}');
  s = s.replace(/\\(int|iint|iiint|oint|sum|prod|lim|coprod)\s*_\\limits/g, '\\$1\\limits');

  // 2. Fix Plain TeX \root n \of {x} -> \sqrt[n]{x}
  s = s.replace(/\\root\s*\{?([^\\}]+)\}?\s*\\of\s*\{([^}]+)\}/g, '\\sqrt[$1]{$2}');

  // 3. Fix Plain TeX \buildrel {a} \over {b} -> \overset{a}{b}
  s = s.replace(/\\buildrel\s*([\s\S]+?)\s*\\over\s*(\\\w+|{[^}]+}|[^\s{}]+)/g, '\\overset{$1}{$2}');

  // 4. Fix Chemistry reaction arrows with limits:
  s = s.replace(/\\mathrel\{\\mathop\{\\kern0pt\\longrightarrow\}\s*\\limits_\{([^}]*)\}\^\{([^}]*)\}\}/g, '\\xrightarrow[$1]{$2}');
  s = s.replace(/\\mathrel\{\\mathop\{\\kern0pt\\longrightarrow\}\s*\\limits_\{([^}]*)\}\}/g, '\\xrightarrow[$1]{}');
  s = s.replace(/\\mathrel\{\\mathop\{\\kern0pt\\longrightarrow\}\s*\\limits\^\{([^}]*)\}\}/g, '\\xrightarrow{$1}');
  s = s.replace(/\\mathrel\{\\mathop\{\\kern0pt\\longrightarrow\}\}/g, '\\longrightarrow');

  // 5. Fix Plain TeX \matrix{ ... \cr ... } to LaTeX \begin{matrix} ... \end{matrix}
  let matrixIdx: number;
  while ((matrixIdx = s.indexOf('\\matrix')) !== -1) {
    const braceIdx = s.indexOf('{', matrixIdx);
    if (braceIdx === -1) break;
    let depth = 0;
    let endIdx = -1;
    for (let i = braceIdx; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx === -1) break;
    const body = s.slice(braceIdx + 1, endIdx).replace(/\\cr/g, '\\\\');
    s = s.slice(0, matrixIdx) + '\\begin{matrix}' + body + '\\end{matrix}' + s.slice(endIdx + 1);
  }

  // 6. Fix Plain TeX \cases{ ... \cr ... } to LaTeX \begin{cases} ... \end{cases}
  let casesIdx: number;
  while ((casesIdx = s.indexOf('\\cases')) !== -1) {
    const braceIdx = s.indexOf('{', casesIdx);
    if (braceIdx === -1) break;
    let depth = 0;
    let endIdx = -1;
    for (let i = braceIdx; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx === -1) break;
    const body = s.slice(braceIdx + 1, endIdx).replace(/\\cr/g, '\\\\');
    s = s.slice(0, casesIdx) + '\\begin{cases}' + body + '\\end{cases}' + s.slice(endIdx + 1);
  }

  // 7. Fix unescaped alignment tabs (&) and underscores inside \text{...}
  s = s.replace(/\\text\s*\{([^}]*)\}/g, (_m, txt) => {
    const cleanTxt = txt.replace(/&/g, '\\&').replace(/_/g, '\\_');
    return `\\text{${cleanTxt}}`;
  });

  // 8. Fix stray percent signs that comment out the end of LaTeX string
  s = s.replace(/%\s*$/g, '');

  // 9. Fix TeX align / equation environments to aligned for compatibility with inline/display KaTeX
  s = s.replace(/\\begin\{align\*?\}/gi, '\\begin{aligned}').replace(/\\end\{align\*?\}/gi, '\\end{aligned}');
  s = s.replace(/\\begin\{equation\*?\}/gi, '\\begin{aligned}').replace(/\\end\{equation\*?\}/gi, '\\end{aligned}');
  s = s.replace(/\\eqalign\b/gi, '\\aligned');

  // 10. Fix unsupported TeX spacing commands
  s = s.replace(/\\hfill/gi, '\\quad ');

  // 11. Normalize Unicode subscript characters into standard LaTeX subscripts
  s = s
    .replace(/₀/g, '_0')
    .replace(/₁/g, '_1')
    .replace(/₂/g, '_2')
    .replace(/₃/g, '_3')
    .replace(/₄/g, '_4')
    .replace(/₅/g, '_5')
    .replace(/₆/g, '_6')
    .replace(/₇/g, '_7')
    .replace(/₈/g, '_8')
    .replace(/₉/g, '_9');

  // 12. Strip stray trailing backslashes left before delimiters by scraper escaping
  s = s.replace(/\\+\s*$/g, '').trim();

  return {
    sanitized: s,
    wasRepaired: s !== original,
  };
}

/**
 * Determines whether a LaTeX snippet warrants display mode (Section 5 & 6).
 * Explicit display math ($$...$$ or \[...\]) is always rendered in display mode.
 * Inline formulas ($...$ or \(...\)) embedded within prose sentences are strictly preserved
 * as inline math to prevent sentence fragmentation, glyph distortion, and oversized block rendering.
 */
export function isComplexMathStructure(latex: string, isExplicitDisplay: boolean = false): boolean {
  if (isExplicitDisplay) return true;
  return false;
}

/**
 * Tokenizes raw question content into structured ContentSegments (Section 24).
 */
export function parseContentSegments(rawText: string, forceInline: boolean = false): ContentSegment[] {
  if (!rawText) return [];

  const normalized = normalizeHtmlFormatting(rawText);

  // Match:
  // 1. $$ ... $$ (display math)
  // 2. \[ ... \] (display math)
  // 3. \( ... \) (inline math)
  // 4. $ ... $ (inline math)
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = normalized.slice(lastIndex, match.index);
      if (textChunk) {
        segments.push({ type: 'text', content: textChunk });
      }
    }

    const token = match[0];
    let isExplicitDisplay = false;
    let mathSource = '';

    if (token.startsWith('$$') && token.endsWith('$$')) {
      isExplicitDisplay = true;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      isExplicitDisplay = true;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      isExplicitDisplay = false;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      isExplicitDisplay = false;
      mathSource = token.slice(1, -1);
    }

    const { sanitized } = sanitizeLatex(mathSource);
    const promoteToDisplay = !forceInline && isExplicitDisplay;

    segments.push({
      type: promoteToDisplay ? 'displayMath' : 'inlineMath',
      content: sanitized,
    });

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    const tail = normalized.slice(lastIndex);
    if (tail) {
      segments.push({ type: 'text', content: tail });
    }
  }

  return segments;
}

/**
 * Renders a mathematical segment to verified KaTeX HTML with safe error fallback.
 */
export function renderMathToHtml(
  latex: string,
  displayMode: boolean = false
): { html: string; error?: string } {
  try {
    const rendered = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'htmlAndMathml',
    });
    return { html: rendered };
  } catch (err: any) {
    // Graceful fallback: render escaped source inside styled code span without crashing UI
    const escaped = decodeHtmlEntities(latex)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return {
      html: `<span class="katex-error-fallback text-amber-300 font-mono text-sm px-1.5 py-0.5 rounded bg-slate-800/80">${escaped}</span>`,
      error: err?.message || 'KaTeX rendering failed',
    };
  }
}

function formatLabel(rawLabel: string, idx: number, side: 'left' | 'right'): string {
  const clean = rawLabel.replace(/[().]/g, '').trim();
  if (clean.length > 0) return `(${clean})`;
  if (side === 'left') return `(${String.fromCharCode(65 + idx)})`;
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  return `(${romans[idx] || idx + 1})`;
}

function splitLabelAndContent(
  cellStr: string,
  idx: number,
  side: 'left' | 'right'
): { label: string; content: string } {
  const plain = cellStr.trim();
  const labelMatch = plain.match(/^(?:<p[^>]*>)?(?:\(([A-Za-z0-9]+)\)|([A-Za-z0-9]+)[\.\)])\s*([\s\S]*)$/i);
  if (labelMatch) {
    const lbl = (labelMatch[1] || labelMatch[2]).toUpperCase();
    return {
      label: `(${lbl})`,
      content: labelMatch[3].trim(),
    };
  }
  return {
    label: formatLabel('', idx, side),
    content: plain,
  };
}

/**
 * Parses an HTML <table> snippet into a structured MatchTableData if it matches
 * the List I vs List II or Column I vs Column II format.
 */
export function parseHtmlMatchTable(
  tableHtml: string,
  surroundingPre: string = '',
  surroundingPost: string = ''
): MatchTableData | null {
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rawRows: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = m[1];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cm[1].trim());
    }
    if (cells.length > 0) rawRows.push(cells);
  }

  if (rawRows.length === 0) return null;

  let list1Title = 'List I';
  let list2Title = 'List II';
  let dataRows = rawRows;

  // Check if first row contains headers
  const firstRow = rawRows[0];
  const isHeaderRow = firstRow.some((c) => /List|Column/i.test(c));
  if (isHeaderRow) {
    if (firstRow.length === 4) {
      list1Title = firstRow[1] || firstRow[0] || 'List I';
      list2Title = firstRow[3] || firstRow[2] || 'List II';
    } else if (firstRow.length === 2) {
      list1Title = firstRow[0] || 'List I';
      list2Title = firstRow[1] || 'List II';
    }
    dataRows = rawRows.slice(1);
  }

  list1Title = list1Title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'List I';
  list2Title = list2Title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'List II';

  const rows: MatchTableRow[] = [];
  for (let idx = 0; idx < dataRows.length; idx++) {
    const r = dataRows[idx];
    if (r.length === 4) {
      const leftLabel = r[0].replace(/<[^>]+>/g, '').trim();
      const leftContent = r[1].trim();
      const rightLabel = r[2].replace(/<[^>]+>/g, '').trim();
      const rightContent = r[3].trim();
      rows.push({
        id: `row-${idx}`,
        leftLabel: formatLabel(leftLabel, idx, 'left'),
        leftContent,
        rightLabel: formatLabel(rightLabel, idx, 'right'),
        rightContent,
      });
    } else if (r.length === 2) {
      const leftParsed = splitLabelAndContent(r[0], idx, 'left');
      const rightParsed = splitLabelAndContent(r[1], idx, 'right');
      rows.push({
        id: `row-${idx}`,
        leftLabel: leftParsed.label,
        leftContent: leftParsed.content,
        rightLabel: rightParsed.label,
        rightContent: rightParsed.content,
      });
    }
  }

  if (rows.length < 2) return null;

  const instructionPrefix = surroundingPre
    ? surroundingPre.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : 'Match List I with List II';
  const instructionSuffix = surroundingPost
    ? surroundingPost.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  return {
    instructionPrefix,
    list1Title,
    list2Title,
    rows,
    instructionSuffix,
  };
}

/**
 * Parses general data tables (e.g. probability distributions, truth tables).
 */
export function parseGeneralTable(tableHtml: string, caption?: string): DataTableData | null {
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = m[1];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cm[1].trim());
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length < 2) return null;

  return {
    headers: rows[0],
    rows: rows.slice(1),
    caption: caption ? caption.replace(/<[^>]+>/g, ' ').trim() : undefined,
  };
}

/**
 * Parses plain text / markdown / unformatted Match the Following questions.
 */
export function parseTextMatching(rawText: string): MatchTableData | null {
  let text = String(rawText || '').trim();
  text = text.replace(/\\?\(\s*\\text\s*\{([^}]*)\}\s*\\?\)/gi, '$1');

  // 1. Separate trailing instruction (e.g. Choose the correct answer...)
  let instructionSuffix = '';
  const suffixMatch = text.match(/(Choose the correct answer (?:from the options given below|from the following)[\s\S]*)$/i);
  if (suffixMatch && suffixMatch.index !== undefined) {
    instructionSuffix = suffixMatch[1].trim();
    text = text.slice(0, suffixMatch.index).trim();
  }

  // 2. Find where items start: A. or (A) or P. or (P)
  const firstItemMatch = text.search(/(?:^|\s)(?:\([APap]\)|[APap][\.\)]|\b[APap]\b(?=\s+\\?\())(?=\s)/);
  if (firstItemMatch === -1) return null;

  const headerPart = text.slice(0, firstItemMatch).trim();
  const itemsPart = text.slice(firstItemMatch).trim();

  let instructionPrefix = 'Match List I with List II';
  let list1Title = 'List I';
  let list2Title = 'List II';

  const promptMatch = headerPart.match(/^(Match\s+(?:the\s+)?(?:List|Column)[^\n:.]*(?:with|and)[^\n:.]*[:.]?)/i);
  let columnsPart = headerPart;
  if (promptMatch) {
    instructionPrefix = promptMatch[1].trim();
    columnsPart = headerPart.slice(promptMatch[0].length).trim();
  } else {
    const genericPrompt = headerPart.match(/^(Match\s+(?:the\s+)?(?:List|Column)[^\n:.]+[:.]?)/i);
    if (genericPrompt) {
      instructionPrefix = genericPrompt[1].trim();
      columnsPart = headerPart.slice(genericPrompt[0].length).trim();
    }
  }

  const list2Idx = columnsPart.search(/(?:LIST|List|Column)\s*[-–—]?\s*(?:II|2)\b/i);
  if (list2Idx !== -1) {
    const list1Segment = columnsPart.slice(0, list2Idx).trim();
    const list2Segment = columnsPart.slice(list2Idx).trim();

    const l1Match = list1Segment.match(/(?:LIST|List|Column)\s*[-–—]?\s*(?:I|1)\s*(?:\(([^)]+)\)|([A-Za-z\s,/+-]{2,}))?$/i);
    if (l1Match && (l1Match[1] || l1Match[2])) {
      const sub1 = (l1Match[1] || l1Match[2]).trim();
      if (sub1 && sub1.length > 1 && !/^(?:with|and)$/i.test(sub1)) list1Title = `List I (${sub1})`;
    }

    const l2Match = list2Segment.match(/(?:LIST|List|Column)\s*[-–—]?\s*(?:II|2)\s*(?:\(([^)]+)\)|([A-Za-z\s,/+-]{2,}))?$/i);
    if (l2Match && (l2Match[1] || l2Match[2])) {
      const sub2 = (l2Match[1] || l2Match[2]).trim();
      if (sub2 && sub2.length > 1) list2Title = `List II (${sub2})`;
    }
  }

  const isPQRS = /(?:^|\s)(?:\(P\)|P[\.\)])/i.test(itemsPart);
  const leftLabels = isPQRS ? ['P', 'Q', 'R', 'S', 'T'] : ['A', 'B', 'C', 'D', 'E'];

  const foundLeft: Array<{ label: string; index: number; matchLen: number }> = [];
  let searchPos = 0;
  for (let i = 0; i < leftLabels.length; i++) {
    const label = leftLabels[i];
    const reg = new RegExp(`(?:^|\\s)(?:\\(${label}\\)|${label}[\\.\\)]|\\b${label}\\b(?=\\s+\\\\?\\())(?=\\s)`, 'i');
    const sub = itemsPart.slice(searchPos);
    const m = sub.match(reg);
    if (m && m.index !== undefined) {
      const absIdx = searchPos + m.index + (m[0].startsWith(' ') ? 1 : 0);
      foundLeft.push({
        label,
        index: absIdx,
        matchLen: m[0].trim().length,
      });
      searchPos = absIdx + m[0].trim().length;
    } else {
      break;
    }
  }

  if (foundLeft.length < 2) return null;

  const rows: MatchTableRow[] = [];
  for (let i = 0; i < foundLeft.length; i++) {
    const cur = foundLeft[i];
    const nextIdx = i + 1 < foundLeft.length ? foundLeft[i + 1].index : itemsPart.length;
    const chunk = itemsPart.slice(cur.index + cur.matchLen, nextIdx).trim();

    const rightRegex = /(?:^|\s)(?:\(([IVXivx]+|[1-9])\)|([IVXivx]+|[1-9])[\.\)]|\b([IVXivx]+)\b(?=\s*\\?\()|\b([IVXivx]+)\b(?=\s+[A-Za-z0-9\\]))/;
    const rm = chunk.match(rightRegex);
    if (rm && rm.index !== undefined) {
      const leftContent = chunk.slice(0, rm.index).trim();
      const rightLabel = (rm[1] || rm[2] || rm[3] || rm[4]).toUpperCase();
      const rightContent = chunk.slice(rm.index + rm[0].length).trim();
      rows.push({
        id: `row-${i}`,
        leftLabel: `(${cur.label})`,
        leftContent,
        rightLabel: `(${rightLabel})`,
        rightContent,
      });
    } else {
      rows.push({
        id: `row-${i}`,
        leftLabel: `(${cur.label})`,
        leftContent: chunk,
        rightLabel: '',
        rightContent: '',
      });
    }
  }

  return {
    instructionPrefix,
    list1Title,
    list2Title,
    rows,
    instructionSuffix,
  };
}

/**
 * Parses raw question text into structured content blocks (Sections 2, 3, 4, 5, 6, 7).
 * Paragraphs keep prose and inline mathematical expressions flowing naturally together
 * without breaking sentences into isolated boxes. Display math expressions form
 * standalone responsive blocks. Matching tables and data tables form dedicated structural blocks.
 */
export function parseQuestionContentBlocks(
  rawText: string,
  forceInline: boolean = false
): QuestionContentBlock[] {
  if (!rawText) return [];

  // 1. High-level check for Match the Following tables and general data tables when not forceInline
  if (!forceInline) {
    const rawStr = String(rawText);

    // Case A: Contains HTML <table>
    const tableMatch = rawStr.match(/<table[^>]*>[\s\S]*?<\/table>/i);
    if (tableMatch && tableMatch.index !== undefined) {
      const pre = rawStr.slice(0, tableMatch.index).trim();
      const post = rawStr.slice(tableMatch.index + tableMatch[0].length).trim();
      const tableHtml = tableMatch[0];

      // Check if it is a Match List table
      if (
        /List\s*[-–—\s]*[I1]|Column/i.test(tableHtml) ||
        /Match\s+(?:the\s+)?(?:List|Column)/i.test(pre)
      ) {
        const matchData = parseHtmlMatchTable(tableHtml, pre, post);
        if (matchData && matchData.rows.length >= 2) {
          return [{ type: 'matchingTable', data: matchData }];
        }
      } else {
        // General Data Table (e.g. probability, frequency distribution)
        const genData = parseGeneralTable(tableHtml, pre);
        if (genData) {
          const blocks: QuestionContentBlock[] = [];
          if (pre && !genData.caption) {
            blocks.push(...parseQuestionContentBlocks(pre, true));
          }
          blocks.push({ type: 'dataTable', data: genData });
          if (post) {
            blocks.push(...parseQuestionContentBlocks(post, true));
          }
          return blocks;
        }
      }
    }

    // Case B: Plain text / unformatted Match List question (no <table> tag)
    if (
      /Match\s+(?:the\s+)?(?:List|Column)|(?:List|Column)\s*[-–—]?\s*[I1]\b/i.test(rawStr)
    ) {
      const matchData = parseTextMatching(rawStr);
      if (
        matchData &&
        matchData.rows.length >= 2 &&
        matchData.rows.every((r) => r.leftContent && r.rightContent)
      ) {
        return [{ type: 'matchingTable', data: matchData }];
      }
    }
  }

  // 2. Standard Prose + Math Token Parsing
  const normalized = normalizeHtmlFormatting(rawText);
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g;
  const blocks: QuestionContentBlock[] = [];
  let currentItems: InlineItem[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const flushParagraph = () => {
    if (currentItems.length > 0) {
      // Clean leading and trailing <br/> tags from paragraph
      const cleanedItems: InlineItem[] = [];
      for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i];
        if (item.type === 'text') {
          let t = item.text;
          if (i === 0) {
            t = t.replace(/^(?:\s*<br\s*\/?>)+/gi, '').trimStart();
          }
          if (i === currentItems.length - 1) {
            t = t.replace(/(?:<br\s*\/?>\s*)+$/gi, '').trimEnd();
          }
          if (t.length > 0) {
            cleanedItems.push({ type: 'text', text: t });
          }
        } else {
          cleanedItems.push(item);
        }
      }

      if (cleanedItems.length > 0) {
        blocks.push({ type: 'paragraph', items: cleanedItems });
      }
      currentItems = [];
    }
  };

  const pushText = (rawStr: string) => {
    if (!rawStr) return;
    const formatted = decodeHtmlEntities(rawStr).replace(/\n/g, '<br/>');
    currentItems.push({ type: 'text', text: formatted });
  };

  while ((match = tokenRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      pushText(normalized.slice(lastIndex, match.index));
    }

    const token = match[0];
    let isExplicitDisplay = false;
    let mathSource = '';

    if (token.startsWith('$$') && token.endsWith('$$')) {
      isExplicitDisplay = true;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      isExplicitDisplay = true;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      isExplicitDisplay = false;
      mathSource = token.slice(2, -2);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      isExplicitDisplay = false;
      mathSource = token.slice(1, -1);
    }

    const { sanitized } = sanitizeLatex(mathSource);

    // Only promote to display mode if explicitly authored as display math ($$...$$ or \[...\]),
    // OR if it is an isolated multiline system (\begin{aligned|cases|matrix}) with zero surrounding prose.
    // Inline math ($...$ or \(...\)) embedded in prose must NEVER split paragraphs or render as giant blocks.
    let promoteToDisplay = false;
    if (!forceInline) {
      if (isExplicitDisplay) {
        promoteToDisplay = true;
      } else if (
        currentItems.length === 0 &&
        /\\begin\{(aligned|cases|matrix|pmatrix|bmatrix|vmatrix|array)\}/i.test(sanitized)
      ) {
        const remaining = normalized.slice(tokenRegex.lastIndex);
        const nextBreak = remaining.search(/\n\n|<br\s*\/?>\s*<br\s*\/?>/i);
        const restOfParagraph = nextBreak !== -1 ? remaining.slice(0, nextBreak) : remaining;
        if (!restOfParagraph.replace(/<[^>]+>/g, '').trim()) {
          promoteToDisplay = true;
        }
      }
    }

    if (promoteToDisplay) {
      flushParagraph();
      const { html } = renderMathToHtml(sanitized, true);
      blocks.push({
        type: 'displayMath',
        latex: sanitized,
        renderedHtml: html,
      });
    } else {
      const { html } = renderMathToHtml(sanitized, false);
      currentItems.push({
        type: 'inlineMath',
        latex: sanitized,
        renderedHtml: html,
      });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    pushText(normalized.slice(lastIndex));
  }
  flushParagraph();

  return blocks;
}

/**
 * Health check scanner for mathematical equations across questions (Section 40).
 */
export function scanQuestionBankMathHealth(
  questions: Array<{ id: string; question?: string; options?: string[]; explanation?: string; solution?: string }>
): MathHealthReport {
  let withMathCount = 0;
  let renderedSuccessfully = 0;
  let repairedCount = 0;
  let failedCount = 0;
  let suspiciousEscapingCount = 0;
  let unbalancedDelimitersCount = 0;
  let longEquationCount = 0;
  const failedQuestions: MathHealthReport['failedQuestions'] = [];

  for (const q of questions) {
    const combined = [
      q.question || '',
      ...(q.options || []),
      q.explanation || '',
      q.solution || '',
    ].join(' ');

    const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g;
    let match: RegExpExecArray | null;
    let hasMath = false;

    while ((match = tokenRegex.exec(combined)) !== null) {
      hasMath = true;
      const token = match[0];
      const rawMath = token.replace(/^(\$\$|\\\[|\\\(|\$)|\s*$/g, '').replace(/(\$\$|\\\]|\\\)|\$)$/, '');

      if (rawMath.length > 150) {
        longEquationCount++;
      }
      if (/\\\\[a-zA-Z]/.test(rawMath)) {
        suspiciousEscapingCount++;
      }

      const { sanitized, wasRepaired } = sanitizeLatex(rawMath);
      if (wasRepaired) {
        repairedCount++;
      }

      try {
        katex.renderToString(sanitized, { displayMode: false, throwOnError: true, strict: false });
        renderedSuccessfully++;
      } catch (err: any) {
        failedCount++;
        failedQuestions.push({
          questionId: q.id,
          rawSnippet: token.slice(0, 100),
          error: err?.message || 'Parse error',
        });
      }
    }

    if (hasMath) {
      withMathCount++;
    }
  }

  return {
    totalScanned: questions.length,
    withMathCount,
    renderedSuccessfully,
    repairedCount,
    failedCount,
    suspiciousEscapingCount,
    unbalancedDelimitersCount,
    longEquationCount,
    failedQuestions: failedQuestions.slice(0, 20),
  };
}
