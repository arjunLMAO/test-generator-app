import React from 'react';
import { MatchTableData, DataTableData } from '../services/MathRendererService';
import { MathText } from './MathText';

interface MatchTableRendererProps {
  data: MatchTableData;
  className?: string;
}

export const MatchTableRenderer: React.FC<MatchTableRendererProps> = ({ data, className = '' }) => {
  return (
    <div className={`my-4 w-full overflow-hidden border border-neutral-200 rounded-lg bg-white ${className}`}>
      {data.instructionPrefix && (
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-800">
          <MathText text={data.instructionPrefix} inline />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-neutral-700 text-xs font-medium border-b border-neutral-200">
              <th className="py-2.5 px-4 w-1/2">{data.list1Title || 'List I'}</th>
              <th className="py-2.5 px-4 w-1/2">{data.list2Title || 'List II'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {data.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-3 px-4 text-neutral-900 align-top">
                  <div className="flex items-start gap-2">
                    {row.leftLabel && (
                      <span className="font-mono font-bold text-xs text-neutral-700 shrink-0 mt-0.5">
                        {row.leftLabel}
                      </span>
                    )}
                    <div className="flex-1">
                      <MathText text={row.leftContent} inline />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-neutral-900 align-top">
                  <div className="flex items-start gap-2">
                    {row.rightLabel && (
                      <span className="font-mono font-bold text-xs text-neutral-700 shrink-0 mt-0.5">
                        {row.rightLabel}
                      </span>
                    )}
                    <div className="flex-1">
                      <MathText text={row.rightContent} inline />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.instructionSuffix && (
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-600">
          <MathText text={data.instructionSuffix} inline />
        </div>
      )}
    </div>
  );
};

interface DataTableRendererProps {
  data: DataTableData;
  className?: string;
}

export const DataTableRenderer: React.FC<DataTableRendererProps> = ({ data, className = '' }) => {
  return (
    <div className={`my-4 w-full overflow-hidden border border-neutral-200 rounded-lg bg-white ${className}`}>
      {data.caption && (
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-800">
          <MathText text={data.caption} inline />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {data.headers.length > 0 && (
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 text-xs font-medium border-b border-neutral-200">
                {data.headers.map((h: string, idx: number) => (
                  <th key={idx} className="py-2.5 px-4">
                    <MathText text={h} inline />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-neutral-200">
            {data.rows.map((row: string[], rIdx: number) => (
              <tr key={rIdx} className="hover:bg-neutral-50/80 transition-colors">
                {row.map((cell: string, cIdx: number) => (
                  <td key={cIdx} className="py-2.5 px-4 text-neutral-900 align-top">
                    <MathText text={cell} inline />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
