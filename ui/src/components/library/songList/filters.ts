// filters.ts — Where a song came from: the tab strip's data and the reader
// that every view uses. Non-React on purpose: the table, the list row and the
// card all answer "which surface made this?" and must answer it the same way.

import type { Song } from '@/types';
import { getSongSource } from '@/utils/songs/source';

export type SourceFilter =
  | 'all'
  | 'create'
  | 'insta-gen'
  | 'lyric-studio'
  | 'cover-studio'
  | 'repaint'
  | 'stem-builder'
  | 'builder'
  | 'import';

export const SOURCE_FILTERS: { id: SourceFilter; label: string; color: string }[] = [
  { id: 'all',           label: 'All',           color: 'text-zinc-700 dark:text-zinc-300 bg-white/10 border-zinc-300 dark:border-white/10' },
  { id: 'create',        label: 'Custom-Gen',   color: 'text-violet-300 bg-violet-500/15 border-violet-500/25' },
  { id: 'insta-gen',     label: 'Auto-Gen',      color: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/25' },
  { id: 'lyric-studio',  label: 'Lyric Studio',  color: 'text-pink-300 bg-pink-500/15 border-pink-500/25' },
  { id: 'cover-studio',  label: 'Cover Studio',  color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25' },
  { id: 'repaint',       label: 'Repaint',       color: 'text-amber-300 bg-amber-500/15 border-amber-500/25' },
  { id: 'stem-builder',  label: 'Stem Build',    color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25' },
  { id: 'builder',       label: 'Song Builder',  color: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/25' },
  { id: 'import',        label: 'Imported',      color: 'text-sky-300 bg-sky-500/15 border-sky-500/25' },
];

/** Counts per tab. Keys are derived from SOURCE_FILTERS so adding a new source
 *  can't drift out of sync, and anything unrecognised lands in Custom-Gen. */
export function countSongsBySource(songs: Song[]): Record<string, number> {
  const counts: Record<string, number> = { all: songs.length };
  for (const f of SOURCE_FILTERS) if (f.id !== 'all') counts[f.id] = 0;
  for (const s of songs) {
    const src = getSongSource(s);
    if (src in counts && src !== 'all') counts[src]++;
    else counts.create++; // default to create for untagged / unknown
  }
  return counts;
}
