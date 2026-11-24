// useHoverCardPosition.ts — where a hover card lands, and when to re-measure.
//
// This was the bottom half of ParamLabel. It is separate for two reasons: the
// arithmetic is the part that needs reading twice and testing once, and every
// other explained surface (a truncated cell, a chart legend, a toolbar group)
// wants the same answer without copying it.
//
// Placement has two modes. Without a `data-hovercard-boundary` ancestor the card
// sits under the trigger and flips above it near the bottom of the window. With
// one, it flanks that element instead — pinned just outside its left or right
// edge, vertically level with the label — because the global bar's panels close
// when the pointer leaves them, and a card anchored *under* a label there covers
// the knobs the panel was opened to reach.
//
// Flanking picks the side with room for a full-width card, preferring the wider
// side when neither fits outright. If the boundary is centred in a narrow window
// with no room either side, it gives up and falls back to the under-the-trigger
// placement rather than hanging the card off-screen.
//
// The position is measured *before* the card opens (the caller calls `measure()`
// in its show handler), so the card appears already placed in the frame the
// pointer enters, with no second pass and no flash at the top-left corner.

import { useCallback, useLayoutEffect, useState } from 'react';
import { useGlobalEvent } from '@/hooks/useGlobalEvent';

/** The card's fixed width. Also the width the flanking test needs room for. */
export const HOVER_CARD_W = 340;
/** Breathing room between the card and whatever it flanks. */
const GAP = 10;
/** Below this, the card has no useful height left to open into. */
const MIN_CARD_H = 120;
/** A comfortable card height; a shorter gap below the trigger flips it above. */
const COMFORTABLE_H = 220;

export interface HoverCardPos {
  left: number;
  /** Set for the under/flank placements. */
  top?: number;
  /** Set only when flipped above the trigger. */
  bottom?: number;
  /** Set when the placement is top-anchored: the card scrolls internally
   *  rather than growing past the bottom of the window. */
  maxHeight?: number;
}

/** The nearest ancestor the card should sit beside instead of on top of. */
export function findHoverCardBoundary(el: HTMLElement | null): HTMLElement | null {
  return el?.closest<HTMLElement>('[data-hovercard-boundary]') ?? null;
}

export interface UseHoverCardPositionResult {
  /** Null until the first measurement; the caller must not render the card before then. */
  pos: HoverCardPos | null;
  /** Measure now — call from the open handler so the first paint is already placed. */
  measure: () => void;
}

/**
 * Track where a card anchored to `anchorRef` should be drawn.
 *
 * `open` only controls the scroll/resize subscriptions: while the card is shut
 * there is nothing to keep in place, and a page of explained fields must not
 * hold a capture-phase scroll listener each.
 */
export function useHoverCardPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
): UseHoverCardPositionResult {
  const [pos, setPos] = useState<HoverCardPos | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    const boundary = findHoverCardBoundary(el);
    if (boundary) {
      const b = boundary.getBoundingClientRect();
      const roomRight = window.innerWidth - b.right - GAP * 2;
      const roomLeft = b.left - GAP * 2;
      const side = roomRight >= HOVER_CARD_W ? 'right'
        : roomLeft >= HOVER_CARD_W ? 'left'
        : roomRight >= roomLeft ? 'right' : 'left';
      const room = side === 'right' ? roomRight : roomLeft;

      if (room >= HOVER_CARD_W) {
        const left = side === 'right' ? b.right + GAP : b.left - GAP - HOVER_CARD_W;
        // Level with the label, but never so low that the card has no height
        // left to open into.
        const top = Math.max(GAP, Math.min(r.top - 4, window.innerHeight - MIN_CARD_H - GAP));
        setPos({ left, top, maxHeight: window.innerHeight - top - GAP });
        return;
      }
      // No room either side — fall through to the under-the-trigger placement
      // rather than parking the card half off-screen.
    }

    const below = window.innerHeight - r.bottom;
    const flip = below < COMFORTABLE_H && r.top > below;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - HOVER_CARD_W - 8));
    setPos(flip
      ? { left, bottom: window.innerHeight - r.top + 6, maxHeight: r.top - 6 - GAP }
      : { left, top: r.bottom + 6, maxHeight: below - 6 - GAP });
  }, [anchorRef]);

  useLayoutEffect(() => { if (open) measure(); }, [open, measure]);
  useGlobalEvent('scroll', measure, { enabled: open, capture: true });
  useGlobalEvent('resize', measure, { enabled: open });

  return { pos, measure };
}
