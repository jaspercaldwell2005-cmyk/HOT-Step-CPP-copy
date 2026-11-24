// SongTable.tsx — The data-dense third view: sortable-looking columns the user
// can resize, reorder by hiding, and freeze actions to the right edge.

import React, { useCallback, useMemo, useState } from 'react';
import { Check, CheckSquare, Columns3, Pause, Pencil, Play, Radio, RotateCcw, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { CoverImage } from '@/components/shared/songs/CoverImage';
import { SongActionsMenu } from '@/components/shared/songs/SongActionsMenu';
import { HoverFullText } from '@/components/shared/controls/HoverFullText';
import { useDisguiseMode } from '@/hooks/useDisguiseMode';
import { togglePlay } from '@/stores/playbackStore';
import { trackMetadata } from '@/components/details/songFacts';
import { displaySubtext, displayTitle } from '@/utils/songDisplay';
import { formatPercent } from '@/utils/format/format';
import { formatRelativeDay } from '@/utils/format/dateUtils';
import { formatTrackDuration } from '@/utils/format/trackDuration';
import { baseName } from '@/utils/paths/baseName';
import { IconButton } from '@/components/shared/controls/IconButton';
import { getSongSource } from '@/utils/songs/source';
import { DetailsButton } from './DetailsButton';
import { QualityBadge } from './QualityBadge';
import { SongParameterBadges } from './SongParameterBadges';
import { useStreamingSong } from './useStreamingSong';
import { useInlineRename } from './useInlineRename';
import {
  BASE_COLS, MANDATORY_COLS, SELECT_COL, SOURCE_BADGE_MAP, SOURCE_COL, SPACER_COL,
  colDefaultVisible, initialColWidths, loadColVisibility, saveColVisibility, saveColWidths,
  type ColDef,
} from './tableColumns';

export interface SongTableProps {
  songs: Song[];
  currentSongId?: string;
  isPlaying: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onPlay: (song: Song) => void;
  onSelect?: (song: Song) => void;
  /** The i button: open the Song Details panel for this track. */
  onShowDetails?: (song: Song) => void;
  onDelete: (song: Song) => void;
  onReuse?: (song: Song) => void;
  onDownload?: (song: Song) => void;
  onRename?: (song: Song, newTitle: string) => void;
  onSendToCover?: (song: Song) => void;
  showSourceBadge?: boolean;
  /** Rendered on the right of the Columns toolbar row (e.g. pagination). */
  topRight?: React.ReactNode;
}

// ── TableTitleCell — Inline-editable title for table rows ─────────────────────

const TableTitleCell: React.FC<{
  song: Song;
  isActive: boolean;
  onRename?: (newTitle: string) => void;
  disguiseTitle: (t: string) => string;
}> = ({ song, isActive, onRename, disguiseTitle }) => {
  const { t } = useTranslation();
  const { isStreaming, frac } = useStreamingSong(song);
  const rename = useInlineRename(song.title || '', onRename);

  if (rename.editing) {
    return (
      <input
        {...rename.inputProps}
        className="w-full text-xs font-medium bg-zinc-800 border border-pink-500/40 rounded px-1.5 py-0.5 text-zinc-200 outline-none focus:border-pink-500"
      />
    );
  }

  return (
    <span className="flex items-center gap-1 group/title min-w-0">
      <span className={`font-medium truncate ${
        isStreaming ? 'text-orange-400' : isActive ? 'text-pink-400' : 'text-zinc-200'
      }`}>
        {disguiseTitle(displayTitle(song))}
      </span>
      {/* Third view mode, same treatment. A row that reads as an ordinary track
          while its audio is still being written is the bug this exists to stop. */}
      {isStreaming && (
        <span className="flex-shrink-0 flex items-center gap-1 px-1 rounded bg-orange-500/90
                         text-[9px] font-bold uppercase tracking-wide text-white">
          <Radio size={8} className="animate-pulse" />
          {formatPercent(frac)}
        </span>
      )}
      {onRename && (
        <button
          onClick={e => { e.stopPropagation(); rename.begin(); }}
          className="flex-shrink-0 p-0.5 rounded text-zinc-600 hover:text-zinc-300 opacity-0 group-hover/title:opacity-100 transition-opacity"
          title={t('library.rename')}
        >
          <Pencil size={10} />
        </button>
      )}
    </span>
  );
};

// ── Style cell — truncated, with a hover tooltip showing the full text + copy ──
const TableStyleCell: React.FC<{ text: string }> = ({ text }) => (
  <HoverFullText text={text} className="text-zinc-500 truncate block" />
);

export const SongTable: React.FC<SongTableProps> = ({
  songs, currentSongId, isPlaying, selectionMode, selectedIds, onToggleSelect,
  onPlay, onSelect, onShowDetails, onDelete, onReuse, onDownload, onRename, onSendToCover, showSourceBadge, topRight,
}) => {
  const { t } = useTranslation();
  const { isDisguised, disguiseTitle } = useDisguiseMode();

  // Persisted per-column visibility (default visible). Mandatory cols ignore it.
  const [colVisible, setColVisible] = useState<Record<string, boolean>>(() => loadColVisibility());
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const isColVisible = (id: string) => MANDATORY_COLS.has(id) || (colVisible[id] ?? colDefaultVisible(id));
  const toggleCol = (id: string) => setColVisible(prev => {
    const cur = prev[id] ?? colDefaultVisible(id);
    const next = { ...prev, [id]: !cur };
    saveColVisibility(next);
    return next;
  });

  // Columns the user can show/hide (Source only exists in the unfiltered view).
  const toggleableCols = useMemo(() => {
    const ids = BASE_COLS.filter(c => !MANDATORY_COLS.has(c.id)).map(c => ({ id: c.id, label: c.label }));
    if (showSourceBadge) ids.splice(1, 0, { id: 'source', label: 'Source' }); // after Style
    return ids;
  }, [showSourceBadge]);

  // Build column list based on current flags + visibility
  const columns = useMemo(() => {
    const cols: ColDef[] = [];
    if (selectionMode) cols.push(SELECT_COL);
    // Insert base cols, injecting source col after style if needed, and a
    // flexible spacer just before actions so actions hugs the right edge.
    for (const c of BASE_COLS) {
      if (c.id === 'actions') cols.push(SPACER_COL);
      if (!isColVisible(c.id)) continue;
      cols.push(c);
      if (c.id === 'style' && showSourceBadge && isColVisible('source')) cols.push(SOURCE_COL);
    }
    return cols;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode, showSourceBadge, colVisible]);

  // Persisted column widths
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => initialColWidths());

  const getW = (id: string) => colWidths[id] ?? BASE_COLS.find(c => c.id === id)?.defaultW ?? 80;

  // Drag-resize handler
  const handleResizeStart = useCallback((colId: string, minW: number, startX: number) => {
    const startW = colWidths[colId] ?? BASE_COLS.find(c => c.id === colId)?.defaultW ?? 80;
    const onMove = (e: MouseEvent) => {
      const newW = Math.max(minW, startW + (e.clientX - startX));
      setColWidths(prev => {
        const next = { ...prev, [colId]: newW };
        saveColWidths(next);
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  // Sum of fixed column widths (spacer is flexible, contributes nothing).
  // Used as the table's min width so it scrolls once the fixed columns no
  // longer fit; otherwise the table fills 100% and the spacer takes the slack.
  const totalW = columns.reduce((s, c) => s + (c.id === 'spacer' ? 0 : getW(c.id)), 0);

  return (
    <div>
      {/* Toolbar: Columns menu (left) + pagination / extras (right) */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="relative">
          <button
            onClick={() => setColMenuOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/5 transition-colors"
            title="Choose columns"
          >
            <Columns3 size={13} /> Columns
          </button>
          {colMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] max-h-80 overflow-y-auto py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-xl">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Show columns</div>
                {toggleableCols.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleCol(c.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    {isColVisible(c.id)
                      ? <CheckSquare size={14} className="text-pink-400 flex-shrink-0" />
                      : <Square size={14} className="text-zinc-500 flex-shrink-0" />}
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {topRight && <div className="flex-shrink-0">{topRight}</div>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/5">
      <table className="text-xs" style={{ tableLayout: 'fixed', width: '100%', minWidth: totalW }}>
        <colgroup>
          {columns.map(c => (
            <col key={c.id} style={{ width: c.id === 'spacer' ? 'auto' : getW(c.id) }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 text-left">
            {columns.map(c => (
              <th
                key={c.id}
                className={`relative px-2 py-2.5 font-semibold select-none ${
                  c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : ''
                } ${
                  // Actions is a frozen column — pinned to the right edge, always
                  // visible regardless of how the other columns are sized/scrolled (#58).
                  c.id === 'actions'
                    ? 'sticky right-0 z-20 bg-zinc-100 dark:bg-zinc-800 border-l border-zinc-200 dark:border-white/10'
                    : ''
                }`}
              >
                {c.label}
                {c.resizable && (
                  <div
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-10 group/resize hover:bg-pink-500/30"
                    onMouseDown={(e) => { e.preventDefault(); handleResizeStart(c.id, c.minW, e.clientX); }}
                  >
                    <div className="w-px h-full mx-auto bg-zinc-300 dark:bg-zinc-600 group-hover/resize:bg-pink-400 transition-colors" />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {songs.map(song => {
            const isActive = currentSongId === song.id;
            const gp: NonNullable<Song['generationParams']> = song.generationParams
              || (song.generation_params as NonNullable<Song['generationParams']>)
              || {};
            const { bpm, keyScale } = trackMetadata(song);
            const model = song.dit_model || gp.ditModel || '';
            const modelShort = model ? baseName(model).slice(0, 16) : '';
            const src = getSongSource(song);
            const badge = SOURCE_BADGE_MAP[src];
            const loraName = baseName(gp.loraPath);
            const lmName = baseName(gp.lmModel);
            const vaeName = baseName(gp.vaeModel);
            const isMastered = !!(song.masteredAudioUrl || song.mastered_audio_url);

            // Build cell map
            const cells: Record<string, React.ReactNode> = {
              select: selectionMode ? (
                selectedIds.has(song.id)
                  ? <CheckSquare size={15} className="text-pink-400" />
                  : <Square size={15} className="text-zinc-600" />
              ) : null,

              thumb: (
                <div className="relative w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                  <CoverImage url={song.coverUrl || song.cover_url} seed={song.id} iconSize={12} />
                  {!selectionMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isActive) togglePlay(); else onPlay(song); }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isActive && isPlaying
                        ? <Pause size={10} className="text-white" />
                        : <Play size={10} className="text-white ml-0.5" />
                      }
                    </button>
                  )}
                </div>
              ),

              title: <div className="min-w-0">
                <TableTitleCell song={song} isActive={isActive} onRename={onRename ? (newTitle) => onRename(song, newTitle) : undefined} disguiseTitle={disguiseTitle} />
                <SongParameterBadges song={song} />
              </div>,
              style: <TableStyleCell text={isDisguised ? '—' : (displaySubtext(song) || '—')} />,
              source: badge ? <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span> : null,
              bpm: <span className="text-zinc-500 font-mono">{bpm || '—'}</span>,
              key: <span className="text-zinc-500">{keyScale || '—'}</span>,
              model: <span className="text-violet-400/60 truncate block" title={model}>{modelShort || '—'}</span>,
              quality: <QualityBadge song={song} />,
              time: <span className="text-zinc-500 font-mono">{formatTrackDuration(song.duration)}</span>,
              date: <span className="text-zinc-600">{formatRelativeDay(song.created_at || song.createdAt)}</span>,
              // ── Generation data (hidden by default) ──
              seed: <span className="text-zinc-500 font-mono truncate block">{gp.seed ?? '—'}</span>,
              lmSeed: <span className="text-zinc-500 font-mono truncate block">{gp.lmSeed ?? '—'}</span>,
              steps: <span className="text-zinc-500 font-mono">{gp.inferenceSteps ?? '—'}</span>,
              cfg: <span className="text-zinc-500 font-mono">{gp.guidanceScale ?? '—'}</span>,
              shift: <span className="text-zinc-500 font-mono">{gp.shift ?? '—'}</span>,
              solver: <span className="text-zinc-500 truncate block" title={gp.inferMethod || ''}>{gp.inferMethod || '—'}</span>,
              scheduler: <span className="text-zinc-500 truncate block" title={gp.scheduler || ''}>{gp.scheduler || '—'}</span>,
              guidanceMode: <span className="text-zinc-500 truncate block" title={gp.guidanceMode || ''}>{gp.guidanceMode || '—'}</span>,
              lora: <span className="text-zinc-500 truncate block" title={gp.loraPath || ''}>{loraName || '—'}</span>,
              loraScale: <span className="text-zinc-500 font-mono">{loraName && gp.loraScale != null ? gp.loraScale : '—'}</span>,
              lm: <span className="text-zinc-500 truncate block" title={gp.lmModel || ''}>{lmName || '—'}</span>,
              vae: <span className="text-zinc-500 truncate block" title={gp.vaeModel || ''}>{vaeName || '—'}</span>,
              timesig: <span className="text-zinc-500 font-mono">{gp.timeSignature || song.time_signature || '—'}</span>,
              lang: <span className="text-zinc-500">{gp.vocalLanguage || '—'}</span>,
              task: <span className="text-zinc-500 truncate block" title={gp.taskType || ''}>{gp.taskType || '—'}</span>,
              instrumental: <span className="text-zinc-500">{gp.instrumental ? 'Yes' : (gp.instrumental === false ? 'No' : '—')}</span>,
              mastered: isMastered ? <Check size={13} className="text-emerald-400 inline" /> : <span className="text-zinc-600">—</span>,
              seedType: <span className="text-zinc-500">{gp.randomSeed === true ? 'Random' : (gp.randomSeed === false ? 'Fixed' : '—')}</span>,
              lmSeedType: <span className="text-zinc-500">{gp.lmSeedFollowsDit === true ? 'Tied to DiT' : (gp.lmSeedFollowsDit === false ? 'Fixed' : '—')}</span>,
              actions: (
                <div className="flex items-center justify-end gap-0.5 flex-nowrap flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onShowDetails && (
                    <DetailsButton onClick={() => onShowDetails(song)} size={12}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors" />
                  )}
                  {/* Edit stays out here as the one-click action; everything
                      else (download, send-to-cover, delete, A/B, and now
                      post-processing) is on the shared menu. */}
                  {onReuse && (
                    <IconButton label={t('library.edit')} hint={t('library.edit')}
                      onClick={() => onReuse(song)}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                      <RotateCcw size={12} />
                    </IconButton>
                  )}
                  <SongActionsMenu
                    song={song}
                    size={13}
                    className="!p-1"
                    onDownload={onDownload ? () => onDownload(song) : undefined}
                    onSendToCover={onSendToCover ? () => onSendToCover(song) : undefined}
                    onDelete={() => onDelete(song)}
                  />
                </div>
              ),
            };

            return (
              <tr
                key={song.id}
                className={`group border-t border-zinc-100 dark:border-white/5 cursor-pointer transition-colors ${
                  selectedIds.has(song.id) && selectionMode
                    ? 'bg-pink-500/10'
                    : isActive
                      ? 'bg-pink-500/5'
                      : 'hover:bg-white/5'
                }`}
                data-sel-id={song.id}
                onClick={(e) => selectionMode ? onToggleSelect(song.id, e) : onSelect?.(song)}
              >
                {columns.map(c => (
                  <td
                    key={c.id}
                    className={`px-2 py-2 overflow-hidden ${
                      c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : ''
                    } ${
                      // Frozen actions column — opaque bg (matches the transparent
                      // default row) so scrolled cells slide cleanly underneath (#58).
                      c.id === 'actions'
                        ? 'sticky right-0 z-10 bg-white dark:bg-zinc-950 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900 border-l border-zinc-200 dark:border-white/10'
                        : ''
                    }`}
                  >
                    {cells[c.id]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};
