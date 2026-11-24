// useBulkActions.ts — What the bulk bar DOES, separated from how it looks.
//
// Each action works on the filtered set rather than the page, so "select all"
// means all matching songs, not the twenty on screen.

import { useCallback, useState } from 'react';
import type { Song } from '@/types';
import { downloadAll } from '@/utils/audio/downloadTrack';
import { errorMessage } from '@/utils/format/errorMessage';
import { useAuth } from '@/context/AuthContext';

export interface BulkActionsOptions {
  /** Every row the current filter allows, not just the visible page. */
  rows: Song[];
  selectedIds: Set<string>;
  exitSelectionMode: () => void;
  onAddToPlaylist?: (song: Song) => void;
  onExportZip?: (ids: string[]) => Promise<void>;
}

export function useBulkActions({
  rows, selectedIds, exitSelectionMode, onAddToPlaylist, onExportZip,
}: BulkActionsOptions) {
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { token } = useAuth();

  const download = useCallback(async () => {
    if (selectedIds.size === 0 || downloading || !token) return;
    const selected = rows.filter(s => selectedIds.has(s.id));
    if (selected.length === 0) return;
    setDownloading(true);
    try {
      const failures = await downloadAll(selected);
      if (failures.length) window.alert(`Some downloads failed:\n${failures.join('\n')}`);
    } catch (err) {
      window.alert(`Download failed: ${errorMessage(err)}`);
    } finally {
      setDownloading(false);
    }
  }, [selectedIds, rows, downloading, token]);

  const exportZip = useCallback(async () => {
    if (!onExportZip || selectedIds.size === 0 || exporting) return;
    setExporting(true);
    try {
      await onExportZip(Array.from(selectedIds));
    } finally {
      setExporting(false);
    }
  }, [onExportZip, selectedIds, exporting]);

  const addSelectedToPlaylist = useCallback(() => {
    if (!onAddToPlaylist || selectedIds.size === 0) return;
    for (const s of rows) if (selectedIds.has(s.id)) onAddToPlaylist(s);
    exitSelectionMode();
  }, [onAddToPlaylist, selectedIds, rows, exitSelectionMode]);

  return { downloading, exporting, download, exportZip, addSelectedToPlaylist };
}
