// useSongSelection.ts — Everything about "which songs are selected".
//
// Four input paths feed one selection set: a plain click toggles, shift-click
// selects a range from the anchor, a long-press on touch enters selection mode
// (or extends the range), and the global hotkeys move a keyboard-focused row
// (see useSongRowFocus). They share one { selected, anchor } state here so the
// paths cannot disagree, and every update is a pure function of the previous
// state.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEventHandler, PointerEventHandler } from 'react';
import { applySelectClick, type SelectState } from '@/utils/rangeSelect';

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE_PX = 10;

const NO_SELECTION: SelectState = { selected: new Set(), anchor: null };

export interface SongSelectionOptions {
  /** Ids in the order the user sees them (sorted + filtered), for shift ranges. */
  visibleIds: string[];
  onBulkDelete?: (ids: string[]) => void;
}

export function useSongSelection({ visibleIds, onBulkDelete }: SongSelectionOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  // Anchor = last plainly clicked / long-pressed row. It lives with the set so
  // a range click is one atomic state transition, not a set plus a ref write.
  const [selection, setSelection] = useState<SelectState>(NO_SELECTION);
  const selectedIds = selection.selected;

  /** Click in selection mode: shift = range from anchor, ctrl/cmd or plain = toggle. */
  const selectClick = useCallback((id: string, range: boolean) => {
    setSelection(prev => applySelectClick(visibleIds, prev, id, range));
  }, [visibleIds]);
  const toggleSelection = useCallback((id: string, e?: { shiftKey?: boolean }) => {
    selectClick(id, !!e?.shiftKey);
  }, [selectClick]);

  // Mobile long-press: enter select mode (anchor), or select the range to the anchor.
  const pressRef = useRef<{ id: string; x: number; y: number; timer: number } | null>(null);
  const suppressClickRef = useRef(false);
  const cancelPress = useCallback(() => {
    if (pressRef.current) { window.clearTimeout(pressRef.current.timer); pressRef.current = null; }
  }, []);
  useEffect(() => cancelPress, [cancelPress]);

  const onPointerDown = useCallback<PointerEventHandler<HTMLDivElement>>((e) => {
    if (e.pointerType === 'mouse') return;
    const el = (e.target as HTMLElement).closest('[data-sel-id]') as HTMLElement | null;
    if (!el || (e.target as HTMLElement).closest('button, a, input')) return;
    const id = el.dataset.selId!;
    cancelPress();
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      suppressClickRef.current = true;
      if (!selectionMode) {
        setSelectionMode(true);
        setSelection({ selected: new Set([id]), anchor: id });
      } else {
        selectClick(id, true);
      }
      try { navigator.vibrate?.(15); } catch { /* not supported */ }
    }, LONG_PRESS_MS);
    pressRef.current = { id, x: e.clientX, y: e.clientY, timer };
  }, [selectionMode, selectClick, cancelPress]);

  const onPointerMove = useCallback<PointerEventHandler<HTMLDivElement>>((e) => {
    const p = pressRef.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_TOLERANCE_PX) cancelPress();
  }, [cancelPress]);

  const onClickCapture = useCallback<MouseEventHandler<HTMLDivElement>>((e) => {
    // Swallow the click that follows a long-press so it does not toggle or open the song.
    if (suppressClickRef.current) { suppressClickRef.current = false; e.stopPropagation(); e.preventDefault(); }
  }, []);

  const onMouseDown = useCallback<MouseEventHandler<HTMLDivElement>>((e) => {
    // Shift-click would otherwise select text across the rows.
    if (selectionMode && e.shiftKey) e.preventDefault();
  }, [selectionMode]);

  const onContextMenu = useCallback<MouseEventHandler<HTMLDivElement>>((e) => {
    if (suppressClickRef.current || pressRef.current) e.preventDefault();
  }, []);

  const selectAll = useCallback(() => {
    setSelection(prev => ({ selected: new Set(visibleIds), anchor: prev.anchor }));
  }, [visibleIds]);

  const deselectAll = useCallback(() => setSelection(NO_SELECTION), []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelection(NO_SELECTION);
  }, []);

  const enterSelectionMode = useCallback(() => setSelectionMode(true), []);

  const bulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    onBulkDelete?.(Array.from(selectedIds));
    exitSelectionMode();
  }, [selectedIds, onBulkDelete, exitSelectionMode]);

  const allSelected = selectedIds.size === visibleIds.length && visibleIds.length > 0;
  const someSelected = selectedIds.size > 0 && !allSelected;

  /** Spread onto the element that wraps every row: one place where touch,
   *  click, shift-click and context menus are wired for all three view modes. */
  const rowHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
    onClickCapture,
    onMouseDown,
    onContextMenu,
  };

  return {
    selectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedIds,
    count: selectedIds.size,
    allSelected,
    someSelected,
    selectAll,
    deselectAll,
    toggleSelection,
    bulkDelete,
    rowHandlers,
  };
}
