// IconButton.tsx — An icon-only button with one behaviour contract.
//
// The app has ~50 icon buttons and each re-decides three things: whether the
// click should bubble to the row underneath, what an icon-only control is
// called for screen readers, and whether its explanation is a native `title`
// (which rule 3 of docs/dev/ui-design.md forbids). This settles all three:
// the click is swallowed unless `bubble` says otherwise, `label` is always the
// accessible name, and `hint` draws the house hover card instead of a tooltip.
//
// Styling stays with the caller — icon buttons sit in wildly different
// contexts (toolbars, card corners, absolute overlays), and a tone system
// could not express them without the caller fighting it.

import React from 'react';
import { HintButton } from './HintButton';

export interface IconButtonProps {
  /** Accessible name. Also the hover card's heading when `hint` is set. */
  label: string;
  /** Explanation for the hover card. Without it the button has no tooltip, by design. */
  hint?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Let the click reach the card/row the button sits on. Default: swallowed. */
  bubble?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label, hint, onClick, children, className = '', disabled, bubble = false,
}) => {
  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!bubble) e.stopPropagation();
    onClick(e);
  };

  if (hint) {
    return (
      <HintButton
        label={label}
        info={hint}
        ariaLabel={label}
        className={className}
        onClick={handle}
        disabled={disabled}
        rootClassName="inline-flex"
      >
        {children}
      </HintButton>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handle}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );
};
