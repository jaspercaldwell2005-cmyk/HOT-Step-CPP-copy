// ParamLabel.tsx — a form field label that explains itself on hover.
//
// The Training Studio's Advanced drawers are ~30 numeric knobs each, most of
// them named after the thing they scale rather than the thing they do
// ("Timestep bias", "SNR gamma", "Unconditional dropout"). The inline help
// lines under a field are one clause long by necessity — there is no room for
// "what happens if you raise it" next to every box. This puts that sentence in a
// hover card instead: point at the label, get the paragraph.
//
// The behaviour lives in `hoverCard/`, one concern per module:
//   - `useHoverCardTrigger` — hover delay, one-card-at-a-time, focus and tap,
//     outside-press dismissal, and the grace period for crossing to the card
//   - `useHoverCardPosition` — where the card lands, and what it may cover
//   - `HoverCard` — the portalled surface and the heading/meta/body layout
//
// This file is only the trigger markup: the label plus `?`, or the caller's own
// control in `children` mode. Keeping it to that is what lets a second surface
// explain itself without copying the timing rules.
//
// Keyboard/touch: the icon is focusable and handles Enter/Space, so the card
// also opens on focus and on tap, not hover alone. It is a <span role="button">
// rather than a <button> on purpose — the global bar's accordion headers are
// themselves <button>s, and a nested <button> is invalid HTML that the parser
// reparents out of its ancestor, silently breaking the accordion's click
// target. A span nests anywhere and keeps the same semantics for a screen
// reader. Clicks stopPropagation for the same reason: pointing at "?" inside a
// header must not toggle the section.

import React, { useEffect, useRef } from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HoverCard } from '@/components/shared/controls/hoverCard/HoverCard';
import { useHoverCardPosition } from '@/components/shared/controls/hoverCard/useHoverCardPosition';
import { useHoverCardTrigger } from '@/components/shared/controls/hoverCard/useHoverCardTrigger';

interface Props {
  /** The field name, shown as the label and as the hover card's heading. */
  label: string;
  /** A control to explain, instead of the label-plus-icon trigger. The card
   *  opens from the control itself, so a row of icon buttons explains itself
   *  the same way a field does. `label` is still the card's heading. */
  children?: React.ReactNode;
  /** The explanation. Nothing renders the hover affordance without it. */
  info?: React.ReactNode;
  /** Optional one-liner under the heading — default value, accepted range. */
  meta?: string;
  /** Classes for the label text. Defaults to the studios' field-label style. */
  className?: string;
  /** Layout classes for the wrapper (margins, `block`, alignment). Keep these
   *  off `className`, which lands on the inner text span where a `block` or a
   *  margin has no effect inside the flex row. */
  rootClassName?: string;
  /** Dotted underline hinting the label is explainable. Off for section
   *  headings, where the whole row is already an affordance and the underline
   *  reads as noise under uppercase tracking. */
  underline?: boolean;
  /** Open the card when the control takes focus. Off for a box whose own edit
   *  state should not be covered while it is being typed in. */
  openOnFocus?: boolean;
  /** Keep the card shut while this is true: editing is not the moment to read
   *  the explanation. Reaching for the control again re-opens on hover. */
  suppress?: boolean;
  /** Shows a reset-to-default icon after the help icon. Pass this only while
   *  the value differs from its default — the caller decides visibility. */
  onReset?: () => void;
}

export const ParamLabel: React.FC<Props> = ({
  label,
  children,
  info,
  meta,
  className = 'text-xs font-semibold text-zinc-600 dark:text-zinc-400',
  rootClassName = '',
  underline = true,
  openOnFocus = true,
  suppress = false,
  onReset,
}) => {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // `measure` is known only after the trigger's `open` exists, and the trigger
  // wants it at the moment it opens. A ref bridges the two without merging the
  // hooks: the trigger still measures before it flips `open`, so the card paints
  // already placed instead of flashing at the top-left corner first.
  const measureRef = useRef<(() => void) | null>(null);
  const card = useHoverCardTrigger({
    anchorRef,
    cardRef,
    suppress,
    openOnFocus,
    beforeOpen: () => measureRef.current?.(),
  });
  const { pos, measure } = useHoverCardPosition(anchorRef, card.open);
  useEffect(() => { measureRef.current = measure; }, [measure]);

  const resetIcon = onReset && (
    <span
      role="button"
      tabIndex={0}
      aria-label={t('paramLabel.resetToDefault', 'Reset {{label}} to default', { label })}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReset(); }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        onReset();
      }}
      className="shrink-0 inline-flex text-zinc-400/70 hover:text-amber-500 focus:text-amber-500 outline-none transition-colors cursor-pointer"
    >
      <RotateCcw size={12} />
    </span>
  );

  if (!info) {
    if (!onReset) return <span className={`${className} ${rootClassName}`}>{label}</span>;
    return (
      <span className={`inline-flex items-center gap-1 w-fit ${rootClassName}`}>
        <span className={className}>{label}</span>
        {resetIcon}
      </span>
    );
  }

  const cardSurface = card.open && pos && (
    <HoverCard
      pos={pos}
      heading={label}
      meta={meta}
      cardRef={cardRef}
      onMouseEnter={card.cancelHide}
      onMouseLeave={card.handleMouseLeave}
    >
      {info}
    </HoverCard>
  );

  if (children) {
    return (
      <span
        ref={anchorRef}
        className={`inline-flex items-center ${rootClassName}`}
        onMouseEnter={card.handleMouseEnter}
        onMouseLeave={card.handleMouseLeave}
        onFocus={card.handleFocus}
        onBlur={card.handleBlur}
      >
        {children}
        {cardSurface}
      </span>
    );
  }

  return (
    <span
      ref={anchorRef}
      className={`inline-flex items-center gap-1 w-fit ${rootClassName}`}
      onMouseEnter={card.handleMouseEnter}
      onMouseLeave={card.handleMouseLeave}
    >
      <span className={`${className} cursor-help${underline ? ' decoration-dotted underline underline-offset-[3px] decoration-zinc-400/40' : ''}`}>
        {label}
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label={`About ${label}`}
        aria-expanded={card.open}
        onFocus={card.handleFocus}
        onBlur={card.handleBlur}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); card.toggle(); }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
          card.toggle();
        }}
        className="shrink-0 inline-flex text-zinc-400/70 hover:text-amber-500 focus:text-amber-500 outline-none transition-colors cursor-help"
      >
        <HelpCircle size={12} />
      </span>
      {resetIcon}

      {cardSurface}
    </span>
  );
};

export default ParamLabel;
