// source.ts — Which surface produced a song.
//
// The library filters by it and App.tsx tags rows with it, and those were two
// copies of the same expression. One reader, so a song cannot be "cover-studio"
// in one place and "create" in the other.

import type { Song } from '@/types';

/** The source tag from a song's generation params; untagged rows are Custom-Gen. */
export function getSongSource(song: Song): string {
  return song.generationParams?.source || song.generation_params?.source || 'create';
}
