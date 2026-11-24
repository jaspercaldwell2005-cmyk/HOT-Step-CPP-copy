// useHoverCardTrigger.ts — when a hover card is open, and who may close it.
//
// This was the top half of ParamLabel. The timing rules are the whole point of
// the primitive, so they live in one place rather than being re-derived by every
// surface that wants an explained control:
//
//   - hover waits SHOW_DELAY before opening, so sweeping the pointer along a
//     toolbar on the way to a button does not throw a card up per icon
//   - while a card is already open the next hover opens at once, so reading
//     along a row of buttons does not pay the delay at every stop
//   - only one card is open at a time: opening claims the shared slot and closes
//     whatever held it, in the same frame
//   - leaving schedules a grace period long enough to cross the gap to the card
//     (a flanking card is a whole panel away from its label)
//   - keyboard focus (`:focus-visible` only) and a tap open immediately
//   - a press anywhere outside the trigger and the card shuts it: otherwise the
//     card is a lid over the control underneath it
//
// The shared slot lives in `status/hoverCardState` because panels consult it to
// defer their own close while a card is up, and because a module that exports a
// component must not also export mutable state if Fast Refresh is to keep it.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  claimOpenCard, hoverCardIsOpen, noteCardOpenState, releaseOpenCard,
} from '@/components/shared/status/hoverCardState';

/** Hover delay before a card opens. Keyboard focus and taps ignore it. */
export const HOVER_CARD_SHOW_DELAY = 500;
/** Grace period so the pointer can travel from the trigger to the card. */
const HIDE_GRACE = 320;

export interface UseHoverCardTriggerOptions {
  /** The trigger element. Outside presses are tested against it. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** The card surface, once mounted. Outside presses are tested against it too. */
  cardRef?: React.RefObject<HTMLElement | null>;
  /** Keep the card shut while true: editing is not the moment to read the
   *  explanation. Reaching for the control again re-opens on hover. */
  suppress?: boolean;
  /** Open the card when the trigger takes keyboard focus. Off for a box whose
   *  own edit state should not be covered while it is being typed in. */
  openOnFocus?: boolean;
  /** Called immediately before the card opens — the position hook's `measure`,
   *  so the card paints already placed. */
  beforeOpen?: () => void;
  /** Open on hover at all. Off for a card driven only by click (a menu). */
  hover?: boolean;
}

export interface UseHoverCardTriggerResult {
  open: boolean;
  /** Open now, ignoring the delay and the one-card check. */
  show: () => void;
  /** Close now. */
  close: () => void;
  /** Flip the card from a click on the "?" affordance. */
  toggle: () => void;
  cancelHide: () => void;
  cancelShow: () => void;
  /** Trigger handlers. `handleFocus` is undefined when `openOnFocus` is off. */
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleFocus: ((e: React.FocusEvent) => void) | undefined;
  handleBlur: () => void;
}

export function useHoverCardTrigger({
  anchorRef,
  cardRef,
  suppress = false,
  openOnFocus = true,
  beforeOpen,
  hover = true,
}: UseHoverCardTriggerOptions): UseHoverCardTriggerResult {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Stable, so the global "who is open" pointer can compare identity. */
  const closeSelf = useCallback(() => setOpen(false), []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const cancelShow = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    // A flanking card is a long way from its label — the pointer has the whole
    // panel to cross before it lands. 140ms was enough when the card sat 6px
    // below the label and is not enough now.
    hideTimer.current = setTimeout(() => {
      setOpen(false);
      releaseOpenCard(closeSelf);
    }, HIDE_GRACE);
  }, [cancelHide, closeSelf]);

  useEffect(() => () => {
    cancelHide();
    cancelShow();
    releaseOpenCard(closeSelf);
  }, [cancelHide, cancelShow, closeSelf]);

  const show = useCallback(() => {
    if (suppress) return;
    cancelHide();
    cancelShow();
    // Only one card is up at a time: take whichever one held the slot down in
    // this same frame, so neighbouring buttons never show two.
    claimOpenCard(closeSelf);
    beforeOpen?.();
    setOpen(true);
  }, [suppress, cancelHide, cancelShow, closeSelf, beforeOpen]);

  // Publish this card's open state for hover-close containers to consult, and
  // make sure a card that unmounts while open (its panel closed underneath it)
  // still gives its count back.
  useEffect(() => {
    if (!open) return;
    noteCardOpenState(true);
    return () => { noteCardOpenState(false); };
  }, [open]);

  // A card still up when the pointer presses somewhere else is a lid: the press
  // lands on the card instead of the control underneath it (the waveform, say),
  // and dragging from there selects the card's paragraph. Any press outside the
  // trigger and the card closes it, so the surface under it is reachable on the
  // press after this one rather than never.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (anchorRef.current?.contains(target) || cardRef?.current?.contains(target)) return;
      setOpen(false);
      releaseOpenCard(closeSelf);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open, anchorRef, cardRef, closeSelf]);

  // A field that suppresses the card while it is being edited must also close
  // one that was already up: focusing the box is the signal to get out of the
  // way, not an instruction to wait for the pointer to leave. Adjusted during
  // render — the pattern React documents for state that follows a prop — so an
  // effect cannot paint the card once more before taking it down.
  if (suppress && open) setOpen(false);

  const hoverShow = () => {
    if (!hover) return;
    cancelHide();
    if (open || showTimer.current) return;
    // While a card is up the next hover opens at once.
    if (hoverCardIsOpen()) { show(); return; }
    showTimer.current = setTimeout(show, HOVER_CARD_SHOW_DELAY);
  };

  const hoverHide = () => { cancelShow(); scheduleHide(); };

  // A mouse click focuses the button too; only keyboard focus opens at once.
  const handleFocus = openOnFocus
    ? (e: React.FocusEvent) => {
      if ((e.target as HTMLElement).matches?.(':focus-visible')) show();
    }
    : undefined;

  const toggle = () => { cancelShow(); setOpen(o => !o); };

  return {
    open,
    show,
    close: closeSelf,
    toggle,
    cancelHide,
    cancelShow,
    handleMouseEnter: hoverShow,
    handleMouseLeave: hoverHide,
    handleFocus,
    handleBlur: hoverHide,
  };
}
