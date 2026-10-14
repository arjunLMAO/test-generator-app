import React from 'react';
import { MathText } from './MathText';
import { ImageIcon } from 'lucide-react';

export interface MatchTableRow {
  id: string;
  leftLabel: string;   // e.g. "(A)", "(P)", "A."
  leftContent: string; // text, LaTeX formula, or HTML img
  rightLabel: string;  // e.g. "(I)", "(1)", "I."
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

/**
 * Helper to render cell content that may contain [image: ...] bracket placeholders
 * or HTML <img> tags or LaTeX formulas.
 */
const RenderCellContent: React.FC<{ content: string }> = ({ content }) => {
  const trimmed = String(content || '').trim();
  if (!trimmed) {
    return <span className="text-slate-500 italic text-xs">—</span>;
  }

  // If content is purely a bracket placeholder like [image: ...]
  const bracketImgMatch = trimmed.match(/^\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*([^\]]+)\]$/i);
  if (bracketImgMatch) {
    const descriptor = bracketImgMatch[2].trim();
    // Generate a clean student-facing label without scraper metadata
    let cleanLabel = 'Structure Diagram';
    if (/reaction|mechanism/i.test(descriptor)) cleanLabel = 'Reaction Scheme';
    else if (/phasor|circuit|ac/i.test(descriptor)) cleanLabel = 'Circuit Diagram';
    else if (/graph|curve/i.test(descriptor)) cleanLabel = 'Graph Reference';
    else if (/optics|ray/i.test(descriptor)) cleanLabel = 'Optical Setup';

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/70 border border-blue-800/70 text-xs text-blue-300 font-medium my-1 select-none">
        <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>[{cleanLabel}]</span>
      </span>
    );
  }

  return <MathText text={trimmed} inline />;
};

/**
 * Standardized JEE Two-Column Match the Following Renderer.
 * Provides pixel-aligned columns, anchored labels, consistent row heights,
 * natural LaTeX typography, responsive table boundary containment, and zero layout shift.
 */
export const MatchTableRenderer: React.FC<{ data: MatchTableData }> = ({ data }) => {
  const { instructionPrefix, list1Title, list2Title, rows, instructionSuffix } = data;

  return (
    <div className="match-table-root w-full my-3 space-y-2.5 select-text">
      {/* 1. Optional Leading Instruction */}
      {instructionPrefix && (
        <p className="text-slate-200 text-sm sm:text-base font-medium leading-relaxed my-1">
          <MathText text={instructionPrefix} inline />
        </p>
      )}

      {/* 2. Structured Two-Column Table */}
      <div className="match-table-container w-full max-w-3xl overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/70 shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse table-fixed min-w-[480px] sm:min-w-full">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700/80 text-xs sm:text-sm font-semibold tracking-wide text-slate-300">
                <th className="py-2.5 px-3 sm:px-4 border-r border-slate-800/80 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{list1Title}</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 sm:px-4 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{list2Title}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm sm:text-base text-slate-200">
              {rows.map((row, idx) => (
                <tr
                  key={row.id || `match-row-${idx}`}
                  className="hover:bg-slate-900/40 transition-colors"
                >
                  {/* Left Column (List I) */}
                  <td className="py-2.5 px-3 sm:px-4 align-top border-r border-slate-800/80">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-xs sm:text-sm text-blue-400 select-none shrink-0 pt-0.5 w-7 sm:w-8 text-left">
                        {row.leftLabel}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed text-slate-200 match-cell-content break-words">
                        <RenderCellContent content={row.leftContent} />
                      </div>
                    </div>
                  </td>

                  {/* Right Column (List II) */}
                  <td className="py-2.5 px-3 sm:px-4 align-top">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400 select-none shrink-0 pt-0.5 w-7 sm:w-8 text-left">
                        {row.rightLabel}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed text-slate-200 match-cell-content break-words">
                        <RenderCellContent content={row.rightContent} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Optional Trailing Instruction (e.g. Choose the correct answer...) */}
      {instructionSuffix && (
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-2.5 pt-0.5">
          <MathText text={instructionSuffix} inline />
        </p>
      )}
    </div>
  );
};

/**
 * Standardized JEE General Data Table Renderer (e.g. Probability distributions,
 * statistical frequency matrices, truth tables).
 */
export const DataTableRenderer: React.FC<{ data: DataTableData }> = ({ data }) => {
  const { headers, rows, caption } = data;

  return (
    <div className="data-table-root w-full my-3 select-text">
      {caption && (
        <p className="text-slate-200 text-sm font-medium mb-2">
          <MathText text={caption} inline />
        </p>
      )}

      <div className="data-table-container w-full max-w-3xl overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/70 shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-center border-collapse">
            {headers && headers.length > 0 && (
              <thead className="bg-slate-900/90 border-b border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-300">
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="py-2 px-3 border-r border-slate-800/80 last:border-r-0 whitespace-nowrap"
                    >
                      <MathText text={h} inline />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/70 text-sm text-slate-200">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2 px-3 border-r border-slate-800/80 last:border-r-0 leading-relaxed align-middle"
                    >
                      <MathText text={cell} inline />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
