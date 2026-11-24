// SourceFilterTabs.tsx — The filter pills across the top of the library.

import React from 'react';
import { SOURCE_FILTERS, type SourceFilter } from './filters';

export const SourceFilterTabs: React.FC<{
  active: SourceFilter;
  counts: Record<string, number>;
  onPick: (id: SourceFilter) => void;
}> = ({ active, counts, onPick }) => (
  <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
    {SOURCE_FILTERS.map(f => {
      const isActive = active === f.id;
      const count = counts[f.id] || 0;
      return (
        <button
          key={f.id}
          onClick={() => onPick(f.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            border transition-all duration-200 whitespace-nowrap
            ${isActive
              ? f.color
              : 'text-zinc-500 bg-transparent border-transparent hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/5'
            }
          `}
        >
          {f.label}
          {count > 0 && (
            <span className={`
              min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold
              flex items-center justify-center
              ${isActive ? 'bg-white/15' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}
            `}>
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
