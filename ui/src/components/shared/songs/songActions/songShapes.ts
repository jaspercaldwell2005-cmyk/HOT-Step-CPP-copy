// songActions/songShapes.ts — widen the several row shapes the app lists into
// the one `Song` shape the menu's actions expect.
//
// These live apart from the menu because they are not menu behaviour: a
// download handler, the cover-art modal and the post-processing gate all need
// the same widening, and shapes are the part of the menu that a regression
// surfaces as "the wrong track got mastered" rather than as a visual glitch.
// Plain functions, no React, so they can be exercised directly.

import type { Song, UnifiedRecentSong } from '@/types';

/** Words in a `.lyrics.json`, for deciding whether there is anything to place. */
export function countSidecarWords(data: { lines?: Array<{ words?: unknown[] }> } | null): number {
  return data?.lines?.reduce((n, line) => n + (line.words?.length ?? 0), 0) ?? 0;
}

/**
 * Widen a /songs/recent row into the Song shape this menu (and downloadTrack,
 * and the cover-art modal) expects.
 *
 * mastered_audio_url is the field that matters most here: it is what decides
 * whether the post-processing item is offered, so dropping it would offer a
 * second pass on an already-mastered track.
 */
export function songFromRecent(rs: UnifiedRecentSong): Song {
  return {
    id: rs.id,
    title: rs.title || 'Untitled',
    style: rs.style || rs.caption || '',
    caption: rs.caption || '',
    lyrics: rs.lyrics || '',
    audioUrl: rs.audio_url || '',
    audio_url: rs.audio_url || '',
    coverUrl: rs.cover_url || rs.artist_image || '',
    cover_url: rs.cover_url || '',
    duration: rs.duration || 0,
    bpm: rs.bpm,
    key_scale: rs.key_scale,
    tags: [],
    masteredAudioUrl: rs.mastered_audio_url || '',
    mastered_audio_url: rs.mastered_audio_url || '',
    noAdapterAudioUrl: rs.noadapter_audio_url || '',
    latentUrl: rs.latent_url || '',
    latent_url: rs.latent_url || '',
  };
}

/**
 * Widen a playlist entry into the Song shape.
 *
 * A playlist item is a thin projection stored in localStorage, so it carries no
 * lyrics and its `style` doubles as the caption. That is enough for every menu
 * action: the post-processing gate reads masteredAudioUrl and audioUrl, and the
 * server re-reads the real row before it runs anything.
 */
export function songFromPlaylistItem(item: {
  id: string;
  title: string;
  audioUrl: string;
  masteredAudioUrl?: string;
  noAdapterAudioUrl?: string;
  coverUrl?: string;
  duration?: number;
  style?: string;
  generationParams?: Song['generationParams'];
}): Song {
  return {
    id: item.id,
    title: item.title || 'Untitled',
    style: item.style || '',
    caption: item.style || '',
    lyrics: '',
    audioUrl: item.audioUrl || '',
    audio_url: item.audioUrl || '',
    coverUrl: item.coverUrl || '',
    duration: item.duration || 0,
    tags: [],
    masteredAudioUrl: item.masteredAudioUrl || '',
    mastered_audio_url: item.masteredAudioUrl || '',
    noAdapterAudioUrl: item.noAdapterAudioUrl || '',
    generationParams: item.generationParams,
  };
}

/**
 * Widen a finished audio-queue item into the Song shape.
 *
 * Returns null without `songId`: that field is the DB row id, and every action
 * here that reaches the server needs one. A queue item can be playable before
 * its row exists, and offering post-processing on it would 404.
 */
export function songFromQueueItem(item: {
  id: string;
  songId?: string;
  audioUrl?: string;
  masteredAudioUrl?: string;
  noAdapterAudioUrl?: string;
  coverUrl?: string;
  artistImageUrl?: string;
  audioDuration?: number;
  artistName?: string;
  generation?: { title?: string; caption?: string; lyrics?: string };
}): Song | null {
  if (!item.songId) return null;
  return {
    id: item.songId,
    title: item.generation?.title || 'Untitled',
    lyrics: item.generation?.lyrics || '',
    style: item.generation?.caption || '',
    caption: item.generation?.caption || '',
    audioUrl: item.audioUrl || '',
    audio_url: item.audioUrl || '',
    masteredAudioUrl: item.masteredAudioUrl || '',
    mastered_audio_url: item.masteredAudioUrl || '',
    noAdapterAudioUrl: item.noAdapterAudioUrl || '',
    coverUrl: item.coverUrl || item.artistImageUrl || '',
    duration: item.audioDuration || 0,
    artistName: item.artistName || '',
    tags: [],
  };
}
