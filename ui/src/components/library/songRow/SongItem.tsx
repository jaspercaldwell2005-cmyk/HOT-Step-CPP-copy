// SongItem.tsx — One song as a compact list row.

import React from 'react';
import { CheckSquare, ListPlus, Pause, Pencil, Play, Radio, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { CoverImage } from '@/components/shared/songs/CoverImage';
import { SongActionsMenu } from '@/components/shared/songs/SongActionsMenu';
import { IconButton } from '@/components/shared/controls/IconButton';
import { useDisguiseMode } from '@/hooks/useDisguiseMode';
import { togglePlay } from '@/stores/playbackStore';
import { trackMetadata } from '@/components/details/songFacts';
import { displaySubtext, displayTitle } from '@/utils/songDisplay';
import { formatPercent } from '@/utils/format/format';
import { formatTrackDuration } from '@/utils/format/trackDuration';
import { getSongSource } from '@/utils/songs/source';
import { SOURCE_FILTERS } from '../songList/filters';
import { DetailsButton } from './DetailsButton';
import { QualityBadge } from './QualityBadge';
import { SongParameterBadges } from './SongParameterBadges';
import { useStreamingSong } from './useStreamingSong';
import { useInlineRename } from './useInlineRename';

export interface SongItemProps {
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
  showSourceBadge?: boolean;
  abTrackAId?: string | null;
  abTrackBId?: string | null;
}

export const SongItem: React.FC<SongItemProps> = ({
  song, isActive, isPlaying, selectionMode, isSelected, onToggleSelect,
  onPlay, onSelect, onShowDetails, onDelete, onReuse, onDownload, onRename, onAddToPlaylist, onSendToCover, onEditMetadata, showSourceBadge,
  abTrackAId, abTrackBId,
}) => {
  const { isStreaming, frac: streamFrac, audible: streamAudible } = useStreamingSong(song);
  const { t } = useTranslation();
  const { isDisguised, disguiseTitle } = useDisguiseMode();
  const rename = useInlineRename(song.title || '', onRename);

  const { bpm, keyScale } = trackMetadata(song);

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      onToggleSelect(e);
    } else {
      onSelect?.();
    }
  };

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
        ${isStreaming
          ? 'bg-orange-500/10 border border-orange-500/50 mm3-stream-glow'
          : isSelected && selectionMode
          ? 'bg-pink-500/10 border border-pink-500/20'
          : isActive
            ? 'bg-pink-500/10 border border-pink-500/20'
            : 'hover:bg-white/5 border border-transparent'
        }
        ${song.id === abTrackAId ? 'border-l-2 !border-l-blue-500' : song.id === abTrackBId ? 'border-l-2 !border-l-orange-500' : ''}
      `}
      data-sel-id={song.id}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0">
          {isSelected
            ? <CheckSquare size={18} className="text-pink-400" />
            : <Square size={18} className="text-zinc-600" />
          }
        </div>
      )}

      {/* Cover Art Thumbnail */}
      <div className="relative w-11 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
        <CoverImage url={song.coverUrl} seed={song.id} iconSize={18} />
        {/* Play overlay on hover (not in selection mode) */}
        {!selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isActive) {
                // Toggle play/pause via playback store — don't reload the track
                togglePlay();
              } else {
                onPlay();
              }
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
          </button>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        {rename.editing ? (
          <input
            {...rename.inputProps}
            className="w-full text-sm font-medium bg-zinc-100 dark:bg-zinc-800 border border-pink-500/40 rounded-lg px-2 py-0.5 text-zinc-800 dark:text-zinc-200 outline-none focus:border-pink-500"
          />
        ) : (
          <div className="flex items-center gap-1 group/title">
            <div className={`text-sm font-medium truncate ${
              isStreaming ? 'text-orange-400' : isActive ? 'text-pink-400' : 'text-zinc-800 dark:text-zinc-200'
            }`}>
              {disguiseTitle(displayTitle(song))}
            </div>
            {/* The row equivalent of the grid card's badge + bar: the track is
                playable, and this is how much of it exists so far. */}
            {isStreaming && (
              <span className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded
                               text-[9px] font-bold uppercase tracking-wide text-white
                               ${streamAudible ? 'bg-pink-500/90' : 'bg-orange-500/90'}`}
                    title={streamAudible ? 'This is the take you are hearing' : 'Rendering — click to listen to this one'}>
                <Radio size={8} className="animate-pulse" />
                {formatPercent(streamFrac)}
              </span>
            )}
            {onRename && !selectionMode && (
              <button
                onClick={e => { e.stopPropagation(); rename.begin(); }}
                className="flex-shrink-0 p-0.5 rounded text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-0 group-hover/title:opacity-100 transition-opacity"
                title={t('library.rename')}
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
        )}
        {isStreaming && (
          <div className="mt-1 mb-0.5 h-0.5 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-[width] duration-300"
              style={{ width: `${streamFrac * 100}%` }}
            />
          </div>
        )}
        <div className="text-xs text-zinc-500 truncate mt-0.5">
          {isDisguised ? '' : (displaySubtext(song) || t('library.noDescription'))}
        </div>
        <SongParameterBadges song={song} />
      </div>

      {/* Metadata Badges */}
      <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
        {showSourceBadge && (() => {
          const src = getSongSource(song);
          const cfg = SOURCE_FILTERS.find(f => f.id === src);
          if (!cfg || src === 'create') return null;
          return (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.label}
            </span>
          );
        })()}
        {bpm > 0 && (
          <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5 rounded bg-zinc-100/50 dark:bg-zinc-800/50">
            {bpm} BPM
          </span>
        )}
        {keyScale && (
          <span className="text-[10px] text-zinc-500 font-medium px-1.5 py-0.5 rounded bg-zinc-100/50 dark:bg-zinc-800/50">
            {keyScale}
          </span>
        )}
        <QualityBadge song={song} />
      </div>

      {/* Duration */}
      <span className="text-xs text-zinc-500 font-mono flex-shrink-0 w-12 text-right">
        {formatTrackDuration(song.duration)}
      </span>

      {/* Actions (hidden in selection mode) */}
      {!selectionMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative">
          {onShowDetails && (
            <DetailsButton onClick={onShowDetails} size={15}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-pink-400 hover:bg-white/10 transition-colors" />
          )}
          {onAddToPlaylist && (
            <IconButton
              label={t('library.addToPlaylist')}
              hint={t('library.addToPlaylist')}
              onClick={() => onAddToPlaylist()}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-pink-400 hover:bg-white/10 transition-colors"
            >
              <ListPlus size={15} />
            </IconButton>
          )}
          <SongActionsMenu
            song={song}
            onReuse={onReuse}
            onDownload={onDownload}
            onSendToCover={onSendToCover}
            onEditMetadata={onEditMetadata}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
};
