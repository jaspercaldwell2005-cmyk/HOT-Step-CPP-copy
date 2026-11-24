// useStreamingSong.ts — The live-render treatment, for whichever view mode is on.
//
// All THREE modes need it, and that is the whole reason this is a hook: the
// grid card got it first, the Generations list remembers its view mode in
// localStorage, and a user in list mode saw a plain row with no hint that the
// track was still being written. `frac` is AUDIO RECEIVED over the resolved
// duration — what the play button can actually reach — not the engine's stage
// percentage, which runs ahead of it.

import type { Song } from '@/types';
import { mm3StreamTakeState, useMm3StreamAudio } from '@/stores/mm3StreamStore';
import { clamp01 } from '@/utils/format/clamp';

export function useStreamingSong(song: Song): { isStreaming: boolean; frac: number; audible: boolean } {
  // Subscribed for the re-render; the numbers come from THIS take.
  const stream = useMm3StreamAudio();
  const take = song.streamTake ?? 0;
  const isStreaming = !!song.streamJobId && stream.jobId === song.streamJobId;
  // PER TAKE, because every card of an ensemble shares one jobId — reading the
  // store's top-level state would paint all of them with the progress of
  // whichever take happens to be audible.
  const st = isStreaming && song.streamJobId
    ? mm3StreamTakeState(song.streamJobId, take)
    : null;
  const received = st ? st.received : stream.received;
  const expected = st ? st.expected : stream.expected;
  const frac = isStreaming && expected > 0
    ? clamp01(received / expected)
    : 0;
  // Is this the take coming out of the speakers? Several are growing at once
  // and only one is audible, so a card has to say which — otherwise the first
  // thing you hear belongs to a track you cannot identify.
  const audible = isStreaming && stream.take === take;
  return { isStreaming, frac, audible };
}
