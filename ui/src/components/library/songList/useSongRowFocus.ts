// useSongRowFocus.ts — The keyboard layer over the row list.
//
// Up/Down move a focused row, Enter plays it, Delete removes the selection (or
// the focused row) and Esc backs out. The focus outline is drawn imperatively
// on the row DOM node, which is why this hook owns the container ref and is
// kept separate from selection state: a ref in a hook result makes every plain
// read of that result look like a render-time ref access.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Song } from '@/types';
import { moveFocus } from '@/utils/hotkeys';
import { HOTKEY_EVENT } from '@/hooks/useGlobalHotkeys';

export interface SongRowFocusOptions {
  /** Rows on the current page, for keyboard play and focus order. */
  pageSongs: Song[];
  /** Changes when the view mode does, so the focus outline is re-applied. */
  viewKey: string;
  selectedIds: Set<string>;
  selectionMode: boolean;
  exitSelectionMode: () => void;
  onPlay: (song: Song) => void;
  onBulkDelete?: (ids: string[]) => void;
}

/** Returns the ref for the element that wraps every row. */
export function useSongRowFocus({
  pageSongs, viewKey, selectedIds, selectionMode, exitSelectionMode, onPlay, onBulkDelete,
}: SongRowFocusOptions) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const pagedOrder = useMemo(() => pageSongs.map(s => s.id), [pageSongs]);

  useEffect(() => {
    const root = rowsRef.current;
    if (!root || !focusedId) return;
    const el = Array.from(root.querySelectorAll<HTMLElement>('[data-sel-id]')).find(n => n.dataset.selId === focusedId);
    if (!el) return;
    el.style.outline = '2px solid #ec4899';
    el.style.outlineOffset = '-2px';
    el.scrollIntoView({ block: 'nearest' });
    return () => { el.style.outline = ''; el.style.outlineOffset = ''; };
  }, [focusedId, pagedOrder, viewKey]);

  useEffect(() => {
    const onHotkey = (ev: Event) => {
      const root = rowsRef.current;
      // Only the visible list handles keys (several SongLists can be mounted).
      if (!root || root.offsetParent === null) return;
      const action = (ev as CustomEvent<{ action: string }>).detail?.action;
      if (action === 'focusPrev' || action === 'focusNext') {
        const next = moveFocus(pagedOrder, focusedId, action === 'focusNext' ? 1 : -1);
        if (!next) return;
        setFocusedId(next);
      } else if (action === 'playFocused') {
        const song = pageSongs.find(s => s.id === focusedId);
        if (!song) return;
        onPlay(song);
      } else if (action === 'deleteSelection') {
        const ids = selectedIds.size > 0 ? Array.from(selectedIds) : (focusedId ? [focusedId] : []);
        if (ids.length === 0 || !onBulkDelete) return;
        onBulkDelete(ids);
        exitSelectionMode();
        if (focusedId && ids.includes(focusedId)) setFocusedId(null);
      } else if (action === 'clearSelection') {
        if (selectionMode || selectedIds.size > 0) exitSelectionMode();
        else if (focusedId) setFocusedId(null);
        else return;
      } else {
        return;
      }
      ev.preventDefault();
    };
    window.addEventListener(HOTKEY_EVENT, onHotkey);
    return () => window.removeEventListener(HOTKEY_EVENT, onHotkey);
  }, [pagedOrder, pageSongs, focusedId, selectedIds, selectionMode, onPlay, onBulkDelete, exitSelectionMode]);

  return rowsRef;
}
