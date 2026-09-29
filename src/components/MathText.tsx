import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', block = false }) => {
  const renderedHtml = useMemo(() => {
    if (!text) return '';

    const raw = String(text);

    // Replace $$...$$ display math first, then $...$ inline math
    const segments: string[] = [];
    const displayRegex = /\$\$([\s\S]+?)\$\$/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    const processInline = (segment: string): string => {
      const inlineRegex = /\$([^\n$]+?)\$/g;
      let iLast = 0;
      let iMatch: RegExpExecArray | null;
      const out: string[] = [];

      const escapeHtml = (str: string) =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');

      while ((iMatch = inlineRegex.exec(segment)) !== null) {
        if (iMatch.index > iLast) {
          out.push(escapeHtml(segment.slice(iLast, iMatch.index)));
        }
        try {
          out.push(
            katex.renderToString(iMatch[1], {
              displayMode: false,
              throwOnError: false,
              strict: false,
            })
          );
        } catch {
          out.push(escapeHtml(iMatch[0]));
        }
        iLast = inlineRegex.lastIndex;
      }

      if (iLast < segment.length) {
        const tail = segment.slice(iLast);
        // Check if raw contains un-delimited LaTeX commands like \frac{...}
        if (!segment.includes('$') && /\\(frac|sqrt|int|sum|alpha|beta|theta|Delta|rightarrow)/.test(tail)) {
          try {
            out.push(
              katex.renderToString(tail, {
                displayMode: block,
                throwOnError: false,
                strict: false,
              })
            );
          } catch {
            out.push(escapeHtml(tail));
          }
        } else {
          out.push(escapeHtml(tail));
        }
      }

      return out.join('');
    };

    while ((match = displayRegex.exec(raw)) !== null) {
      if (match.index > lastIdx) {
        segments.push(processInline(raw.slice(lastIdx, match.index)));
      }
      try {
        segments.push(
          katex.renderToString(match[1], {
            displayMode: true,
            throwOnError: false,
            strict: false,
          })
        );
      } catch {
        segments.push(processInline(match[1]));
      }
      lastIdx = displayRegex.lastIndex;
    }

    if (lastIdx < raw.length) {
      segments.push(processInline(raw.slice(lastIdx)));
    }

    return segments.join('');
  }, [text, block]);

  return (
    <span
      className={`leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
