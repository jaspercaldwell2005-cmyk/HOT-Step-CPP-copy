// PaginationControls.tsx — Per-page choice and the page stepper.

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PaginationControlsProps } from './pagination';

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pageSize, page, totalPages, onChangePageSize, onPage,
}) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs min-w-0 max-w-full">
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      <span className="text-zinc-500">Per page</span>
      <div className="flex flex-wrap items-center rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden max-w-full">
        {PAGE_SIZE_OPTIONS.map(opt => (
          <button
            key={String(opt)}
            onClick={() => onChangePageSize(opt)}
            className={`px-2.5 py-1 transition-colors ${
              pageSize === opt
                ? 'bg-pink-500/20 text-pink-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            {opt === 'all' ? 'All' : opt}
          </button>
        ))}
      </div>
    </div>
    {pageSize !== 'all' && totalPages > 1 && (
      <div className="flex items-center gap-2 text-zinc-500">
        <button
          onClick={() => onPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="p-1 rounded hover:text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="tabular-nums whitespace-nowrap">Page {page} / {totalPages}</span>
        <button
          onClick={() => onPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="p-1 rounded hover:text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )}
  </div>
);
