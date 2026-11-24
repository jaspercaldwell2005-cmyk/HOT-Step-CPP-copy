// SongList.tsx — The song library: what is on screen, and in what order.
//
// Three view modes, a source filter, pagination and selection. Each has one
// owner: songRow/* draws a song (card, list row, table row) and songList/* owns
// the chrome around it (filters, pagination, bulk actions, A/B bar). This file
// composes them and holds only the state that crosses those seams.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { LayoutGrid, List as ListIcon, Music, Table2, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { usePlaybackSelector } from '@/stores/playbackStore';
import { useABCompareSelector } from '@/stores/abCompareStore';
import { usePersistedState, writePersistedState } from '@/hooks/usePersistedState';
import { plural } from '@/utils/format/plural';
import { openImportTracks } from './ImportTracksModal';
import { SongCard } from './songRow/SongCard';
import { SongItem } from './songRow/SongItem';
import { SongTable } from './songRow/SongTable';
import { ABCompareBar } from './songList/ABCompareBar';
import { BulkActionBar } from './songList/BulkActionBar';
import { PaginationControls } from './songList/PaginationControls';
import { SourceFilterTabs } from './songList/SourceFilterTabs';
import { getSongSource } from '@/utils/songs/source';
import { SOURCE_FILTERS, countSongsBySource, type SourceFilter } from './songList/filters';
import { useSongPagination } from './songList/pagination';
import { useBulkActions } from './songList/useBulkActions';
import { useSongRowFocus } from './songList/useSongRowFocus';
import { useSongSelection } from './songList/useSongSelection';

/** Grid card size: the minimum card width in px, one saved setting for every song grid. */
const CARD_SIZE_KEY = 'hs-songGridCardSize';
const CARD_SIZE = { min: 120, max: 320, default: 150 };

interface SongListProps {
  songs: Song[];
  currentSongId?: string;
  onPlay: (song: Song) => void;
  onDelete: (song: Song) => void;
  onBulkDelete?: (ids: string[]) => void;
  /** Open the selected songs in a new Compare session (Library only). */
  onCompare?: (ids: string[]) => void;
  onSelect?: (song: Song) => void;
  /** The i button: open the Song Details panel for this track. */
  onShowDetails?: (song: Song) => void;
  onReuse?: (song: Song) => void;
  onDownload?: (song: Song) => void;
  onRename?: (song: Song, newTitle: string) => void;
  onAddToPlaylist?: (song: Song) => void;
  /** Download the selected songs' audio as one zip (Library only). */
  onExportZip?: (ids: string[]) => Promise<void>;
  /** Load this track's source audio + title/lyrics/style into Cover Studio. */
  onSendToCover?: (song: Song) => void;
  /** Open the metadata editor for this track. */
  onEditMetadata?: (song: Song) => void;
  /** Show source filter tabs — true for Library page, false for Create page */
  showFilters?: boolean;
  /** Offer "Upload into Library". Library only: importing is not tied to any
   *  generation surface, and a track that arrives from disk belongs to all of
   *  them or none of them. */
  showImport?: boolean;
  /** Layout mode — 'list' for compact rows, 'grid' for rich cards, 'table' for data-dense */
  viewMode?: 'list' | 'grid' | 'table';
  /** Override the header title */
  title?: string;
}

export const SongList: React.FC<SongListProps> = ({
  songs, currentSongId, onPlay, onDelete, onBulkDelete, onCompare, onSelect, onShowDetails, onReuse, onDownload, onRename, onAddToPlaylist, onExportZip,
  onSendToCover, onEditMetadata, showFilters = true, showImport = false,
  viewMode = 'list', title = 'Library',
}) => {
  const { t } = useTranslation();
  const isPlaying = usePlaybackSelector(s => s.isPlaying);
  const abTrackAId = useABCompareSelector(s => s.trackA?.id ?? null);
  const abTrackBId = useABCompareSelector(s => s.trackB?.id ?? null);
  const abTrackATitle = useABCompareSelector(s => s.trackA?.title ?? '');
  const abTrackBTitle = useABCompareSelector(s => s.trackB?.title ?? '');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // Internal view mode — persisted per context (title), initialized from prop
  const storageKey = `hs-songlist-viewMode-${title}`;
  const [cardSize] = usePersistedState<number>(CARD_SIZE_KEY, CARD_SIZE.default);
  const gridRef = useRef<HTMLDivElement>(null);
  // Cards only change size when the column count does (they stretch to fill
  // the row), and then every card moves at once. A view transition animates
  // that reflow; it starts only when the count actually changes, so slider
  // steps that change nothing cannot cut a running animation short.
  const setCardSize = useCallback((size: number) => {
    const apply = () => flushSync(() => writePersistedState(CARD_SIZE_KEY, size));
    const grid = gridRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!grid || reduce || !document.startViewTransition) { apply(); return; }
    const GAP = 12; // gap-3
    const cols = (min: number) => Math.max(1, Math.floor((grid.clientWidth + GAP) / (min + GAP)));
    if (cols(size) === cols(cardSize)) { apply(); return; }
    document.startViewTransition(apply);
  }, [cardSize]);
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'grid' | 'table'>(() => {
    try { const v = localStorage.getItem(storageKey); if (v === 'list' || v === 'grid' || v === 'table') return v; } catch { /* ignore */ }
    return viewMode ?? 'list';
  });
  const changeViewMode = useCallback((m: 'list' | 'grid' | 'table') => {
    setActiveViewMode(m);
    try { localStorage.setItem(storageKey, m); } catch { /* ignore */ }
  }, [storageKey]);

  // Client-side source filtering
  const filteredSongs = useMemo(() => {
    if (sourceFilter === 'all') return songs;
    return songs.filter(s => getSongSource(s) === sourceFilter);
  }, [songs, sourceFilter]);

  // Counts per tab, derived from the same table the tabs render.
  const sourceCounts = useMemo(() => countSongsBySource(songs), [songs]);

  const { pageRows: pagedSongs, controls: paginationProps, reset: resetPage } = useSongPagination(filteredSongs);
  const visibleIds = useMemo(() => filteredSongs.map(s => s.id), [filteredSongs]);

  const selection = useSongSelection({ visibleIds, onBulkDelete });
  const rowsRef = useSongRowFocus({
    pageSongs: pagedSongs,
    viewKey: activeViewMode,
    selectedIds: selection.selectedIds,
    selectionMode: selection.selectionMode,
    exitSelectionMode: selection.exitSelectionMode,
    onPlay,
    onBulkDelete,
  });
  const bulk = useBulkActions({
    rows: filteredSongs,
    selectedIds: selection.selectedIds,
    exitSelectionMode: selection.exitSelectionMode,
    onAddToPlaylist,
    onExportZip,
  });

  const compareSelected = useCallback(() => {
    if (!onCompare || selection.selectedIds.size < 2) return;
    onCompare(Array.from(selection.selectedIds));
    selection.exitSelectionMode();
  }, [onCompare, selection]);

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <Music size={48} className="mb-4 opacity-30" />
        <div className="text-lg font-medium text-zinc-600 dark:text-zinc-400">{t('library.noSongsYet')}</div>
        <div className="text-sm text-zinc-600 mt-1">{t('library.createFirstTrack')}</div>
        {showImport && (
          <button
            onClick={openImportTracks}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-colors"
          >
            <Upload size={13} />
            {t('library.import', 'Upload into Library')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
        <h3 className="text-lg font-bold text-white truncate min-w-0">{title}</h3>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs text-zinc-500 font-medium">
            {filteredSongs.length}{showFilters && sourceFilter !== 'all' ? ` / ${songs.length}` : ''} {plural(filteredSongs.length, 'song')}
          </span>

          {showImport && (
            <button
              onClick={openImportTracks}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 transition-colors"
              title={t('library.importTooltip', 'Add audio files you already have — they can be post-processed like any render')}
            >
              <Upload size={13} />
              {t('library.import', 'Upload into Library')}
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden">
            {([['grid', LayoutGrid], ['list', ListIcon], ['table', Table2]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => changeViewMode(mode as 'list' | 'grid' | 'table')}
                className={`p-1.5 transition-colors ${
                  activeViewMode === mode
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1) + ' view'}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          {!selection.selectionMode ? (
            <button
              onClick={selection.enterSelectionMode}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              title={t('library.selectTracks')}
            >
              {t('library.select')}
            </button>
          ) : (
            <button
              onClick={selection.exitSelectionMode}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Source Filter Tabs — only on Library page */}
      {showFilters && (
        <SourceFilterTabs
          active={sourceFilter}
          counts={sourceCounts}
          onPick={(id) => {
            if (id !== sourceFilter) resetPage();
            setSourceFilter(id);
            selection.exitSelectionMode();
          }}
        />
      )}

      {/* Bulk Action Bar */}
      {selection.selectionMode && (
        <BulkActionBar
          allSelected={selection.allSelected}
          someSelected={selection.someSelected}
          count={selection.count}
          visibleCount={filteredSongs.length}
          onToggleAll={selection.allSelected ? selection.deselectAll : selection.selectAll}
          onSelectAll={selection.selectAll}
          onDeselectAll={selection.deselectAll}
          onCompare={onCompare && selection.count >= 2 ? compareSelected : undefined}
          onAddToPlaylist={onAddToPlaylist ? bulk.addSelectedToPlaylist : undefined}
          onZipExport={onExportZip ? bulk.exportZip : undefined}
          onDownload={bulk.download}
          onDelete={selection.bulkDelete}
          downloading={bulk.downloading}
          exporting={bulk.exporting}
        />
      )}

      {/* A/B Comparison Bar */}
      {(abTrackAId || abTrackBId) && (
        <ABCompareBar aId={abTrackAId} aTitle={abTrackATitle} bId={abTrackBId} bTitle={abTrackBTitle} />
      )}

      {selection.selectionMode && (
        <div className="-mt-2 mb-3 px-3 text-[11px] text-zinc-500">
          {t('library.rangeHint', 'Long-press another song to select the range (Shift+click on desktop)')}
        </div>
      )}

      {/* Empty state */}
      {filteredSongs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Music size={32} className="mb-3 opacity-20" />
          <div className="text-sm text-zinc-500">
            {showFilters ? t('library.noFilterSongs', { filter: SOURCE_FILTERS.find(f => f.id === sourceFilter)?.label }) : t('library.noSongsYet')}
          </div>
        </div>
      )}

      {/* Top pagination — grid/list (table view renders it inline beside Columns) */}
      {activeViewMode !== 'table' && filteredSongs.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 mb-3">
          {/* Card size, grid view only. One saved setting for every song grid. */}
          {activeViewMode === 'grid' && (
            <input
              type="range"
              min={CARD_SIZE.min}
              max={CARD_SIZE.max}
              step={10}
              value={cardSize}
              onChange={e => setCardSize(Number(e.target.value))}
              onDoubleClick={() => setCardSize(CARD_SIZE.default)}
              // Inline width: the global input[type=range] rule (width 100%) outranks a class.
              style={{ width: 72 }}
              className="max-[640px]:hidden"
              title={t('library.cardSize', 'Card size (double-click to reset)')}
              aria-label={t('library.cardSize', 'Card size (double-click to reset)')}
            />
          )}
          <PaginationControls {...paginationProps} />
        </div>
      )}

      <div ref={rowsRef} {...selection.rowHandlers}>
      {/* Grid View */}
      {activeViewMode === 'grid' && filteredSongs.length > 0 && (
        <div ref={gridRef} className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${cardSize}px, 100%), 1fr))` }}>
          {pagedSongs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              isActive={currentSongId === song.id}
              isPlaying={currentSongId === song.id && isPlaying}
              selectionMode={selection.selectionMode}
              isSelected={selection.selectedIds.has(song.id)}
              onToggleSelect={(e) => selection.toggleSelection(song.id, e)}
              onPlay={() => onPlay(song)}
              onSelect={() => onSelect?.(song)}
              onShowDetails={onShowDetails ? () => onShowDetails(song) : undefined}
              onDelete={() => onDelete(song)}
              onReuse={() => onReuse?.(song)}
              onDownload={() => onDownload?.(song)}
              onRename={onRename ? (newTitle) => onRename(song, newTitle) : undefined}
              onAddToPlaylist={onAddToPlaylist ? () => onAddToPlaylist(song) : undefined}
              onSendToCover={onSendToCover ? () => onSendToCover(song) : undefined}
              onEditMetadata={onEditMetadata ? () => onEditMetadata(song) : undefined}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {activeViewMode === 'list' && filteredSongs.length > 0 && (
        <div className="space-y-1">
          {pagedSongs.map(song => (
            <SongItem
              key={song.id}
              song={song}
              isActive={currentSongId === song.id}
              isPlaying={currentSongId === song.id && isPlaying}
              selectionMode={selection.selectionMode}
              isSelected={selection.selectedIds.has(song.id)}
              onToggleSelect={(e) => selection.toggleSelection(song.id, e)}
              onPlay={() => onPlay(song)}
              onSelect={() => onSelect?.(song)}
              onShowDetails={onShowDetails ? () => onShowDetails(song) : undefined}
              onDelete={() => onDelete(song)}
              onReuse={() => onReuse?.(song)}
              onDownload={() => onDownload?.(song)}
              onRename={onRename ? (newTitle) => onRename(song, newTitle) : undefined}
              onAddToPlaylist={onAddToPlaylist ? () => onAddToPlaylist(song) : undefined}
              onSendToCover={onSendToCover ? () => onSendToCover(song) : undefined}
              onEditMetadata={onEditMetadata ? () => onEditMetadata(song) : undefined}
              showSourceBadge={showFilters && sourceFilter === 'all'}
              abTrackAId={abTrackAId}
              abTrackBId={abTrackBId}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {activeViewMode === 'table' && filteredSongs.length > 0 && (
        <SongTable
          songs={pagedSongs}
          currentSongId={currentSongId}
          isPlaying={isPlaying}
          selectionMode={selection.selectionMode}
          selectedIds={selection.selectedIds}
          onToggleSelect={selection.toggleSelection}
          onPlay={onPlay}
          onSelect={onSelect}
          onShowDetails={onShowDetails}
          onDelete={onDelete}
          onReuse={onReuse}
          onDownload={onDownload}
          onRename={onRename}
          onSendToCover={onSendToCover}
          showSourceBadge={showFilters && sourceFilter === 'all'}
          topRight={<PaginationControls {...paginationProps} />}
        />
      )}
      </div>

      {/* Bottom pagination bar */}
      {filteredSongs.length > 0 && (
        <div className="flex justify-end mt-4 pt-3 border-t border-zinc-200 dark:border-white/5">
          <PaginationControls {...paginationProps} />
        </div>
      )}
    </div>
  );
};
