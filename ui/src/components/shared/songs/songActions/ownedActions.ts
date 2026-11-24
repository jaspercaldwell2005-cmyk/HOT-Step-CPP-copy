// songActions/ownedActions.ts — the actions the menu implements itself.
//
// Everything here works from the `song` it is handed plus app-wide services; no
// host wiring is needed, which is why the menu can offer these on every surface
// that lists a track. Each one announces its effect on the shared event bus
// instead of reaching into the list that rendered it, so a rename in the Lyric
// Studio queue updates the library too.
//
// Kept out of the component so the menu file reads as "what is offered" and the
// mechanics stay out of JSX. `saveJson`/`saveText` own the download path; this
// module only decides what the file contains and what it is called.

import { toast } from 'react-toastify';
import type { Song } from '@/types';
import { songApi } from '@/services/api';
import { saveJson, saveText } from '@/utils/storage/saveFile';
import { errorMessage } from '@/utils/format/errorMessage';
import { emit } from '@/utils/appEvents';

/** A filesystem-safe stem from a title. */
function fileStem(song: Song, suffix: string): string {
  return `${(song.title || 'song').slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${suffix}`;
}

/** A param value that is meant to be text, or the empty string. The row's
 *  params are a bag of unknown JSON; only the two string fields are read. */
function paramText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Download this song's params as a hot-step preset JSON. */
export function exportParams(song: Song): void {
  // Both spellings can be present: `normalizeSong` keeps the DB's snake_case
  // alongside the component's camelCase. The camelCase wins when both exist.
  const fromRow = (song as Song & { generation_params?: Record<string, unknown> }).generation_params;
  const params: Record<string, unknown> = { ...fromRow, ...song.generationParams };
  const exportData = {
    _format: 'hot-step-preset',
    _version: 1,
    ...params,
    title: song.title || '',
    caption: paramText(params.caption) || song.style || '',
    lyrics: paramText(params.lyrics) || song.lyrics || '',
  };
  saveJson(exportData, fileStem(song, 'params.json'));
}

/** Download YuE2's ABC lead sheet for this song. */
export function downloadScoreAbc(song: Song, abc: string): void {
  saveText(abc, fileStem(song, 'lead_sheet.abc'), 'text/vnd.abc');
}

/**
 * Save a new title, then announce it. Every list that caches the title (the
 * library and recent-songs queries, the playlist, the audio queue, the open
 * Song Details) listens for `song-renamed`, so the menu needs no host wiring.
 */
export async function renameSong(song: Song, title: string): Promise<void> {
  try {
    await songApi.update(song.id, { title });
    emit('song-renamed', { songId: song.id, title });
  } catch (err) {
    toast.error(`Rename failed: ${errorMessage(err)}`);
  }
}
