// songActions/WordPlacementEditor.tsx — the lyric editor, mounted only while it
// is open.
//
// The editor's transport is the app's single audio element, so it has to be
// handed the engine's live playhead — a subscription that would otherwise sit
// on every row of the library. One row, while the modal is up, is the cost.
//
// Split from the menu because the menu opens it from three paths (existing word
// timings, line timings split into words, or a retranscription that lands later)
// and none of those paths should have to know how the playhead is read.

import React, { useSyncExternalStore } from 'react';
import type { Song } from '@/types';
import {
  getSnapshot as getEngineSnapshot, subscribe as subscribeEngine,
} from '@/audio/engine';
import { LyricEditorModal } from '@/components/player/LyricEditorModal';
import type { EditLine } from '@/components/player/lyric-editor/timingModel';

/** A song row's duration is seconds or a formatted "m:ss"; the editor works in seconds. */
export function durationSeconds(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const mmss = /^(\d+):(\d{1,2})$/.exec(value.trim());
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export interface WordPlacementEditorProps {
  song: Song;
  audioUrl: string;
  seed: EditLine[] | null;
  onClose: () => void;
}

export const WordPlacementEditor: React.FC<WordPlacementEditorProps> = ({
  song, audioUrl, seed, onClose,
}) => {
  const engine = useSyncExternalStore(subscribeEngine, getEngineSnapshot);
  // A song row's duration is seconds or a formatted "m:ss"; the editor works in
  // seconds. The engine's length is the fallback for a row that has none yet.
  const duration = durationSeconds(song.duration) || engine.duration;
  return (
    <LyricEditorModal
      audioUrl={audioUrl}
      title={song.title}
      duration={duration}
      currentTime={engine.currentTime}
      seed={seed}
      onClose={onClose}
    />
  );
};
