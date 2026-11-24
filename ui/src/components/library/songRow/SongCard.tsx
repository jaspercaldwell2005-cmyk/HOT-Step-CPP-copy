// SongCard.tsx — One song as a grid card.
//
// A streaming card is a real, playable track whose file does not exist yet, so
// it wears the orange treatment and hides every action that needs a file.

import React from 'react';
import { CheckSquare, Pause, Pencil, Play, Radio, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { CoverImage } from '@/components/shared/songs/CoverImage';
import { SongActionsMenu } from '@/components/shared/songs/SongActionsMenu';
import { useDisguiseMode } from '@/hooks/useDisguiseMode';
import { togglePlay } from '@/stores/playbackStore';
import { displaySubtext, displayTitle } from '@/utils/songDisplay';
import { formatPercent } from '@/utils/format/format';
import { formatTrackDuration } from '@/utils/format/trackDuration';
import { formatRelativeDay } from '@/utils/format/dateUtils';
import { DetailsButton } from './DetailsButton';
import { QualityBadge } from './QualityBadge';
import { SongParameterBadges } from './SongParameterBadges';
import { useStreamingSong } from './useStreamingSong';
import { useInlineRename } from './useInlineRename';

export interface SongCardProps {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (e?: React.MouseEvent) => void;
  onPlay: () => void;
  onSelect?: () => void;
  onShowDetails?: () => void;
  onDelete: () => void;
  onReuse?: () => void;
  onDownload?: () => void;
  onRename?: (newTitle: string) => void;
  onAddToPlaylist?: () => void;
  onSendToCover?: () => void;
  onEditMetadata?: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song, isActive, isPlaying, selectionMode, isSelected, onToggleSelect,
  onPlay, onSelect, onShowDetails, onDelete, onReuse, onDownload, onRename, onAddToPlaylist, onSendToCover, onEditMetadata,
}) => {
  const { t } = useTranslation();
  const { isDisguised, disguiseTitle } = useDisguiseMode();
  const rename = useInlineRename(song.title || '', onRename);

  const { isStreaming, frac: streamFrac, audible: streamAudible } = useStreamingSong(song);

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) onToggleSelect(e);
    else onSelect?.();
  };

  return (
    <div
      className={`
        group relative rounded-2xl border p-2 cursor-pointer flex flex-col
        transition-all duration-200 hover:shadow-lg hover:shadow-black/30
        ${isStreaming
          ? 'border-orange-500/60 mm3-stream-glow'
          : isSelected && selectionMode
          ? 'border-pink-500/40 bg-pink-500/5 ring-1 ring-pink-500/20'
          : isActive
            ? 'border-pink-500/30 bg-pink-500/[0.06]'
            : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-white/10 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
        }
      `}
      data-sel-id={song.id}
      // Named so the card-size slider's view transition can move and resize it.
      style={{ viewTransitionName: `song-card-${song.id.replace(/[^a-zA-Z0-9_-]/g, '_')}` }}
      onClick={handleClick}
    >
      {/* ── Artwork ── inset with its own radius, so the card reads as a card
          rather than as a photo with text printed over it. */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <CoverImage url={song.coverUrl || song.cover_url} seed={song.id} iconSize={32} />

        {/* Play button — always on show, per the card design. Hover only grows it. */}
        {!selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); if (isActive) togglePlay(); else onPlay(); }}
            className="absolute left-2.5 bottom-2.5 z-10 w-10 h-10 rounded-full
                       bg-black/45 backdrop-blur-sm border border-white/20
                       flex items-center justify-center text-white
                       transition-transform duration-200 hover:scale-110 hover:bg-black/60"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={17} />
              : <Play size={17} className="ml-0.5" />
            }
          </button>
        )}

        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-20">
            {isSelected
              ? <CheckSquare size={20} className="text-pink-400 drop-shadow" />
              : <Square size={20} className="text-white/60 drop-shadow" />
            }
          </div>
        )}

        {/* Quick delete, same action as the menu's Delete. Shown on hover (always
            on touch screens); hidden where the menu is, so it never sits under
            the streaming badge or deletes a file that does not exist yet. */}
        {!selectionMode && !isStreaming && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full
                       bg-black/45 backdrop-blur-sm border border-white/20
                       flex items-center justify-center text-white
                       opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100
                       transition-opacity hover:bg-red-500/80"
            title={t('library.delete', 'Delete')}
            aria-label={t('library.delete', 'Delete')}
          >
            <X size={13} />
          </button>
        )}

        {/* Duration badge */}
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-mono text-white/85"
          style={selectionMode ? { left: '2rem' } : undefined}
        >
          {formatTrackDuration(song.duration)}
        </div>

        {/* Live-render treatment: the orange ring above says "not finished", this
            says how far along and how much is listenable. Progress is measured in
            AUDIO RECEIVED, which is the part the play button can actually reach —
            the engine's stage percentage would run ahead of it and promise audio
            that is not there yet. */}
        {isStreaming && (
          <>
            {/* Several takes stream at once and only one is audible. The badge says
                which, because otherwise the audio that starts by itself belongs to
                a card you cannot pick out. */}
            <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md
                            text-[9px] font-bold uppercase tracking-wide text-white shadow
                            ${streamAudible ? 'bg-pink-500/90' : 'bg-orange-500/90'}`}>
              <Radio size={9} className="animate-pulse" />
              {streamAudible ? 'Listening' : 'Generating'}
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20">
              <div className="px-2 pb-1 text-[9px] font-medium text-orange-200 drop-shadow
                              flex items-center justify-between tabular-nums">
                <span>{streamAudible ? 'playing as it renders' : 'generation in progress'}</span>
                <span>{formatPercent(streamFrac)}</span>
              </div>
              <div className="h-1 bg-black/50">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-[width] duration-300"
                  style={{ width: `${streamFrac * 100}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Text ── */}
      <div className="px-1 pt-2.5 pb-0.5 flex flex-col gap-1">
        {/* Title — editable */}
        {rename.editing ? (
          <input
            {...rename.inputProps}
            className="w-full text-sm font-semibold bg-black/30 border border-pink-500/40 rounded-lg px-2 py-0.5 text-zinc-900 dark:text-white outline-none focus:border-pink-500"
          />
        ) : (
          <div className="flex items-center gap-1 group/title">
            <div className={`text-sm font-semibold truncate ${isActive ? 'text-pink-400' : 'text-zinc-900 dark:text-white'}`}>
              {disguiseTitle(displayTitle(song))}
            </div>
            {onRename && !selectionMode && (
              <button
                onClick={e => { e.stopPropagation(); rename.begin(); }}
                className="flex-shrink-0 p-0.5 rounded text-zinc-400 dark:text-white/40 hover:text-zinc-700 dark:hover:text-white opacity-0 group-hover/title:opacity-100 transition-opacity"
                title={t('library.rename')}
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
        )}

        <SongParameterBadges song={song} />
        {/* Subject, or the caption when there is no subject */}
        <div className="text-[11px] text-zinc-600 dark:text-white/55 leading-snug line-clamp-2 min-h-[2rem] [overflow-wrap:anywhere]">
          {isDisguised ? '' : (displaySubtext(song) || t('library.noDescription'))}
        </div>

        {/* Footer — age on the left, the song menu on the right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <QualityBadge song={song} />
            <span className="text-[10px] text-zinc-500 dark:text-white/40 truncate">
              {formatRelativeDay(song.created_at || song.createdAt)}
            </span>
          </div>

          {!selectionMode && !isStreaming && onShowDetails && (
            <DetailsButton onClick={onShowDetails} size={14}
              className="ml-auto w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                         text-zinc-400 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white
                         hover:bg-zinc-200/70 dark:hover:bg-white/10" />
          )}
          {/* Hidden on a live render: every item on it (download, delete,
              send-to-cover, export) needs a file that does not exist yet. */}
          {!selectionMode && !isStreaming && (
            <SongActionsMenu
              song={song}
              size={14}
              className="w-6 h-6 !p-0 rounded-full flex items-center justify-center flex-shrink-0
                         text-zinc-400 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white
                         hover:bg-zinc-200/70 dark:hover:bg-white/10"
              onReuse={onReuse}
              onAddToPlaylist={onAddToPlaylist}
              onDownload={onDownload}
              onSendToCover={onSendToCover}
              onEditMetadata={onEditMetadata}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};
