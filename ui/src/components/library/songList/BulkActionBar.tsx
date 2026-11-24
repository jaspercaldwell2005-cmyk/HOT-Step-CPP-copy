// BulkActionBar.tsx — The selection toolbar: select-all, then the actions that
// only make sense on a set of songs.

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare, Download, FileArchive, GitCompare, ListPlus, Loader2,
  MinusSquare, Square, Trash2,
} from 'lucide-react';

export interface BulkActionBarProps {
  allSelected: boolean;
  someSelected: boolean;
  /** How many songs are selected (may include rows filtered out since). */
  count: number;
  /** How many songs the current filter shows. */
  visibleCount: number;
  onToggleAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  /** Present only when a compare session can take this set (2+ songs). */
  onCompare?: () => void;
  onAddToPlaylist?: () => void;
  onZipExport?: () => void;
  onDownload: () => void;
  onDelete: () => void;
  downloading: boolean;
  exporting: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  allSelected, someSelected, count, visibleCount,
  onToggleAll, onSelectAll, onDeselectAll,
  onCompare, onAddToPlaylist, onZipExport, onDownload, onDelete,
  downloading, exporting,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/5">
      <button
        onClick={onToggleAll}
        className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-white transition-colors"
        title={allSelected ? t('library.deselectAll') : t('library.selectAll')}
      >
        {allSelected
          ? <CheckSquare size={18} className="text-pink-400" />
          : someSelected
            ? <MinusSquare size={18} className="text-pink-400" />
            : <Square size={18} />
        }
      </button>

      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium flex-1">
        {count === 0
          ? t('library.selectTracks')
          : t('library.selected', { count })
        }
      </span>

      {!allSelected && visibleCount > 0 && (
        <button
          onClick={onSelectAll}
          className="px-2 py-1 rounded-lg text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/10 transition-colors"
        >
          {t('library.selectAllVisible', 'Select all visible')}
        </button>
      )}
      {count > 0 && (
        <button
          onClick={onDeselectAll}
          className="px-2 py-1 rounded-lg text-xs text-zinc-600 dark:text-zinc-300 hover:bg-white/10 transition-colors"
        >
          {t('library.clearSelection', 'Clear')}
        </button>
      )}

      {count > 0 && (
        <>
          {onCompare && (
            <button
              onClick={onCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 text-xs font-semibold transition-all"
            >
              <GitCompare size={13} /> {t('library.compareCount', 'Compare {{count}}', { count })}
            </button>
          )}
          {onAddToPlaylist && (
            <button
              onClick={onAddToPlaylist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 text-xs font-semibold transition-all"
            >
              <ListPlus size={13} /> {t('library.addToPlaylistCount', 'Add {{count}} to playlist', { count })}
            </button>
          )}
          {onZipExport && (
            <button
              onClick={onZipExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 text-xs font-semibold transition-all disabled:opacity-40"
            >
              {exporting
                ? <><Loader2 size={13} className="animate-spin" /> {t('library.exportZipBusy', 'Zipping…')}</>
                : <><FileArchive size={13} /> {t('library.exportZipCount', 'Zip {{count}}', { count })}</>}
            </button>
          )}
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs font-semibold transition-all disabled:opacity-40"
          >
            {downloading
              ? <><Loader2 size={13} className="animate-spin" /> Downloading…</>
              : <><Download size={13} /> {t('library.downloadCount', { count })}</>}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs font-semibold transition-all"
          >
            <Trash2 size={13} />
            {t('library.deleteCount', { count })}
          </button>
        </>
      )}
    </div>
  );
};
