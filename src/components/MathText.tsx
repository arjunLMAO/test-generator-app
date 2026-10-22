import React, { useMemo } from 'react';
import {
  parseQuestionContentBlocks,
  QuestionContentBlock,
} from '../services/MathRendererService';
import { MatchTableRenderer, DataTableRenderer } from './MatchTableRenderer';

export interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
  inline?: boolean;
}

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
      .flatMap((b) => {
        if (b.type === 'paragraph') {
          return b.items;
        }
        if (b.type === 'displayMath') {
          return [{ type: 'inlineMath' as const, latex: b.latex, renderedHtml: b.renderedHtml }];
        }
        return [];
      })
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
    <div className={`math-rich-content w-full leading-relaxed select-text space-y-2.5 ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'paragraph') {
          return (
            <p
              key={`p-${idx}`}
              className="text-neutral-900 text-base leading-relaxed select-text my-1.5"
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
              className="math-display-container my-2.5 py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-md overflow-x-auto overflow-y-visible text-center select-text"
            >
              <div
                className="w-full inline-block min-w-0"
                dangerouslySetInnerHTML={{ __html: b.renderedHtml }}
              />
            </div>
          );
        }

        if (b.type === 'matchingTable') {
          return <MatchTableRenderer key={`match-${idx}`} data={b.data} />;
        }

        if (b.type === 'dataTable') {
          return <DataTableRenderer key={`data-table-${idx}`} data={b.data} />;
        }

        return null;
      })}
    </div>
  );
};
