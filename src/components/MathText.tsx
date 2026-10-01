import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function normalizeHtmlFormatting(input: string): string {
  return input
    // Strip embedded <style>...</style> blocks from scraped HTML tables so dark theme styles apply
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Cleanly format [image: ...] scraper notes
    .replace(/\[image:\s*([^\]]+)\]/gi, '<span class="text-xs font-mono text-slate-400">[Diagram: $1]</span>')
    // Replace paragraph boundaries with clean line breaks
    .replace(/<\/p>\s*<p>/gi, '<br/><br/>')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<\/?blockquote[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '<br/>')
    // Collapse 3+ consecutive <br/> into 2
    .replace(/(?:<br\/>\s*){3,}/gi, '<br/><br/>')
    .trim();
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', block = false }) => {
  const renderedHtml = useMemo(() => {
    if (!text) return '';

    const raw = normalizeHtmlFormatting(String(text));

    // Tokenize display math ($$...$$ and \[...\]) and inline math ($...$ and \(...\))
    const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g;
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const formatPlainSegment = (seg: string): string => {
      // Allow safe inline formatting tags (strong, b, i, em, sub, sup, br, span)
      return decodeHtmlEntities(seg).replace(/\n/g, '<br/>');
    };

    while ((match = tokenRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatPlainSegment(raw.slice(lastIndex, match.index)));
      }

      const token = match[0];
      let isDisplay = false;
      let mathSource = '';

      if (token.startsWith('$$') && token.endsWith('$$')) {
        isDisplay = true;
        mathSource = token.slice(2, -2);
      } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
        isDisplay = true;
        mathSource = token.slice(2, -2);
      } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
        isDisplay = false;
        mathSource = token.slice(2, -2);
      } else if (token.startsWith('$') && token.endsWith('$')) {
        isDisplay = false;
        mathSource = token.slice(1, -1);
      }

      // Decode HTML entities inside LaTeX blocks (e.g., &amp; in \begin{aligned}, &lt; for <)
      const cleanedMath = decodeHtmlEntities(mathSource)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+>/g, '')
        .trim();

      if (
        cleanedMath.includes('\\begin{aligned}') ||
        cleanedMath.includes('\\begin{array}') ||
        cleanedMath.includes('\\begin{cases}')
      ) {
        // Keep inline or display based on context, KaTeX supports aligned/cases in both
      }

      try {
        parts.push(
          katex.renderToString(cleanedMath, {
            displayMode: isDisplay || block,
            throwOnError: false,
            strict: false,
          })
        );
      } catch {
        parts.push(formatPlainSegment(token));
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < raw.length) {
      const tail = raw.slice(lastIndex);
      if (
        !raw.includes('$') &&
        !raw.includes('\\(') &&
        !raw.includes('\\[') &&
        /\\(frac|sqrt|int|sum|alpha|beta|theta|Delta|rightarrow|mathrm)/.test(tail)
      ) {
        try {
          parts.push(
            katex.renderToString(decodeHtmlEntities(tail), {
              displayMode: block,
              throwOnError: false,
              strict: false,
            })
          );
        } catch {
          parts.push(formatPlainSegment(tail));
        }
      } else {
        parts.push(formatPlainSegment(tail));
      }
    }

    return parts.join('');
  }, [text, block]);

  return (
    <span
      className={`math-rich-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
