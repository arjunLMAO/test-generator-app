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

export type QuestionContentBlock =
  | { type: 'paragraph'; items: InlineItem[] }
  | { type: 'displayMath'; latex: string; renderedHtml: string };

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
 * Large fractions, limits, integrals, summations, matrices, cases, or complex operators
 * are automatically elevated to display equations for optimal legibility,
 * while compact scalars and simple ratios stay inline with prose.
 */
export function isComplexMathStructure(latex: string, isExplicitDisplay: boolean = false): boolean {
  if (isExplicitDisplay) return true;

  const trimmed = latex.trim();

  // If contains matrices, systems of equations, or piecewise definitions
  if (/\\begin\{(matrix|pmatrix|bmatrix|vmatrix|cases|aligned|array)\}/i.test(trimmed)) {
    return true;
  }

  // If contains limits, summations, integrals, or products
  if (/\\(lim|sum|int|iint|iiint|oint|prod|coprod)(?=[^a-zA-Z]|$)/i.test(trimmed)) {
    return true;
  }

  // If contains multi-line breaks
  if (/\\\\/.test(trimmed)) {
    return true;
  }

  // If contains nested fractions (\frac inside another \frac)
  const fracMatches = trimmed.match(/\\(frac|dfrac|cfrac)(?=[^a-zA-Z]|$)/gi) || [];
  if (fracMatches.length > 1) {
    return true;
  }

  // Complex fraction with polynomials, exponents, trig functions, or long expressions
  if (
    /\\(frac|dfrac|cfrac)\s*\{[^{}]*(\^|_|\\sin|\\cos|\\tan|\\log|\\ln|\\int|\+|\-|\()[^{}]*\}\s*\{/i.test(trimmed) ||
    (trimmed.length > 30 && fracMatches.length > 0)
  ) {
    return true;
  }

  // If contains substantial equations with multiple relations
  if (trimmed.length > 45 && /(=|<|>|\\le|\\ge|\\in|\\to|\\rightarrow)/.test(trimmed)) {
    return true;
  }

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
    const promoteToDisplay = !forceInline && isComplexMathStructure(sanitized, isExplicitDisplay);

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

/**
 * Parses raw question text into structured content blocks (Sections 2, 3, 4, 5, 6, 7).
 * Paragraphs keep prose and inline mathematical expressions flowing naturally together
 * without breaking sentences into isolated boxes. Display math expressions form
 * standalone responsive blocks.
 */
export function parseQuestionContentBlocks(
  rawText: string,
  forceInline: boolean = false
): QuestionContentBlock[] {
  if (!rawText) return [];

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
    const promoteToDisplay = !forceInline && isComplexMathStructure(sanitized, isExplicitDisplay);

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
