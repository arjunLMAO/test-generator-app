import React, { useMemo } from 'react';
import {
  parseQuestionContentBlocks,
  QuestionContentBlock,
} from '../services/MathRendererService';

export interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
  inline?: boolean;
}

/**
 * Standardized JEE Mathematical Typesetting Component (Sections 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16).
 * Automatically separates inline prose from prominent display equations,
 * groups prose and inline math (e.g. `C`, `AB`) into unified flowing sentences,
 * guarantees zero glyph overlap, and provides full responsive equation scrolling.
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  block = false,
  inline = false,
}) => {
  const blocks = useMemo<QuestionContentBlock[]>(() => {
    if (!text) return [];
    return parseQuestionContentBlocks(String(text), inline);
  }, [text, inline]);

  if (!text) {
    return null;
  }

  // Purely inline mode (for MCQ options, small labels, table cells, or single-line prose)
  if (inline || (blocks.length === 1 && blocks[0].type === 'paragraph' && !block)) {
    const inlineHtml = blocks
      .flatMap((b) =>
        b.type === 'paragraph'
          ? b.items
          : [{ type: 'inlineMath' as const, latex: b.latex, renderedHtml: b.renderedHtml }]
      )
      .map((item) => {
        if (item.type === 'text') {
          return item.text;
        }
        return `<span class="inline-math-item inline align-baseline px-0.5">${item.renderedHtml}</span>`;
      })
      .join('');

    return (
      <span
        className={`math-rich-content leading-relaxed select-text ${className}`}
        dangerouslySetInnerHTML={{ __html: inlineHtml }}
      />
    );
  }

  // Structured Content-Aware Layout Mode (for Question Statements, Solutions, Explanations)
  return (
    <div className={`math-rich-content w-full leading-relaxed select-text space-y-3 ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'paragraph') {
          return (
            <p
              key={`p-${idx}`}
              className="text-slate-100 text-base sm:text-lg leading-relaxed select-text my-2"
            >
              {b.items.map((item, itemIdx) =>
                item.type === 'text' ? (
                  <span key={itemIdx} dangerouslySetInnerHTML={{ __html: item.text }} />
                ) : (
                  <span
                    key={itemIdx}
                    className="inline-math-item inline align-baseline px-0.5"
                    dangerouslySetInnerHTML={{ __html: item.renderedHtml }}
                  />
                )
              )}
            </p>
          );
        }

        if (b.type === 'displayMath') {
          return (
            <div
              key={`disp-${idx}`}
              className="math-display-container w-full my-4 py-3 sm:py-3.5 px-4 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto overflow-y-visible text-center sm:text-left transition-colors hover:border-slate-700/80 select-text shadow-xs"
            >
              <div
                className="w-full inline-block min-w-0"
                dangerouslySetInnerHTML={{ __html: b.renderedHtml }}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
