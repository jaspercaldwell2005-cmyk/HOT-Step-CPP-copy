// pagination.ts — Page size (persisted) and the slice of rows on screen.
//
// The page number needs no effect: it is clamped at read time, so a filter that
// removes pages can never leave the user staring at page 4 of 2, and the caller
// resets it explicitly when the filter itself changes.

import { useCallback, useMemo, useState } from 'react';

const PAGE_SIZE_KEY = 'hs-library-pageSize';

export const PAGE_SIZE_OPTIONS: (number | 'all')[] = [20, 40, 60, 80, 100, 'all'];

export function loadPageSize(): number | 'all' {
  try {
    const v = localStorage.getItem(PAGE_SIZE_KEY);
    if (v === 'all') return 'all';
    const n = v ? parseInt(v, 10) : NaN;
    if ((PAGE_SIZE_OPTIONS as (number | string)[]).includes(n)) return n;
  } catch { /* ignore */ }
  return 40;
}

export function savePageSize(v: number | 'all') {
  try { localStorage.setItem(PAGE_SIZE_KEY, String(v)); } catch { /* ignore */ }
}

/** Props for <PaginationControls>, rendered both above and below the list. */
export interface PaginationControlsProps {
  pageSize: number | 'all';
  page: number;
  totalPages: number;
  onChangePageSize: (v: number | 'all') => void;
  onPage: (updater: (p: number) => number) => void;
}

export function useSongPagination<T>(rows: T[]) {
  const [pageSize, setPageSizeState] = useState<number | 'all'>(() => loadPageSize());
  const [rawPage, setPage] = useState(1);

  const changePageSize = useCallback((v: number | 'all') => {
    setPageSizeState(v); savePageSize(v); setPage(1);
  }, []);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  // Clamped on read: the list shrinking under a later page lands on the last
  // page instead of an empty one, without a state write during render.
  const page = Math.min(rawPage, totalPages);

  /** Call when the filter changes: a new filter starts at its first page. */
  const reset = useCallback(() => setPage(1), []);

  /** A page change acts on the page the user can see, not on the raw stored
   *  number: after deletions (or any list that shrank) the raw value can still
   *  point past the end, and stepping from there clamps straight back to the
   *  same page — a Previous button that does nothing. The displayed page goes
   *  through the updater instead, and the result is bounded on both sides. */
  const goToPage = useCallback((updater: (p: number) => number) => {
    setPage(prev => {
      const next = updater(Math.min(prev, totalPages));
      return Math.min(Math.max(1, next), totalPages);
    });
  }, [totalPages]);

  const pageRows = useMemo(() => {
    if (pageSize === 'all') return rows;
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const controls: PaginationControlsProps = {
    pageSize, page, totalPages, onChangePageSize: changePageSize, onPage: goToPage,
  };

  return { pageSize, page, totalPages, pageRows, controls, reset };
}
