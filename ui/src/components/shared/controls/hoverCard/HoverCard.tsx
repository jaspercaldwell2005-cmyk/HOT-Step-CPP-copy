// HoverCard.tsx — the surface a hover card is drawn on.
//
// Portalled and fixed-positioned for the same reason StyledSelect's panel is:
// explained labels live inside <details> drawers and scrolling panes, both of
// which clip an absolutely-positioned card.
//
// The z-index is the CSS maximum on purpose. The card is portalled to <body>, so
// it competes with every modal and popover rather than with the control's own
// stacking context: the Repair-timings panel sits at 16000 and full-screen
// dialogs at 10000, and a hint painted behind the panel that contains it is
// unreadable. Lowering this is what puts a toggle's explanation behind its
// panel.
//
// The heading, the optional mono meta line and the body are the house card
// layout, so a caller supplies words, not chrome. Placement comes from
// `useHoverCardPosition`; open/close timing from `useHoverCardTrigger`. Keeping
// those three apart is what lets a second surface (a truncated cell, a chart
// legend) reuse the behaviour without inheriting ParamLabel's label-and-icon
// trigger markup.

import React from 'react';
import ReactDOM from 'react-dom';
import { HOVER_CARD_W, type HoverCardPos } from './useHoverCardPosition';

export interface HoverCardProps {
  /** Where the position hook measured the card should sit. */
  pos: HoverCardPos;
  /** The card's heading — the field name, or the button's visible text. */
  heading: string;
  /** Optional one-liner under the heading: default value, accepted range. */
  meta?: string;
  /** The explanation. */
  children: React.ReactNode;
  cardRef?: React.Ref<HTMLDivElement>;
  /** Keeping the pointer on the card must cancel the trigger's pending close. */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  pos, heading, meta, children, cardRef, onMouseEnter, onMouseLeave,
}) => ReactDOM.createPortal(
  <div
    ref={cardRef}
    role="tooltip"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="fixed z-[2147483647] rounded-xl p-3
               bg-white dark:bg-zinc-900
               border border-zinc-200 dark:border-white/10
               shadow-xl shadow-black/25"
    style={{
      left: pos.left,
      width: HOVER_CARD_W,
      ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
      ...(pos.maxHeight !== undefined
        ? { maxHeight: pos.maxHeight, overflowY: 'auto' as const }
        : {}),
    }}
  >
    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{heading}</div>
    {meta && (
      <div className="mt-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-500/90">{meta}</div>
    )}
    <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
      {children}
    </p>
  </div>,
  document.body,
);

export default HoverCard;
