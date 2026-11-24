// songActions/menuChrome.tsx — the shell a song menu is drawn in.
//
// Split out of SongActionsMenu when that file grew to own action logic, shape
// adapters, the lyric-editor handoff and the menu markup at once. Nothing here
// knows what a song is: it draws a portalled panel, rows with an icon and a
// label, and dividers. That is what makes it reusable by any other "3-dot" menu
// in the app, and it is the only place the portal/z-index/dismiss contract is
// written down.
//
// The dropdown portals to document.body to escape overflow clipping, and tags
// itself data-portal-layer so a click inside it does not read as a click
// outside to BarSection's dismiss handler (#129/#126).
//
// On phones the same rows render into a BottomSheet instead: a 420px dropdown
// pinned to a thumb is not a menu, and the sheet already handles focus return
// and backdrop dismissal.

import React, { useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BottomSheet } from '@/components/shared/overlays/BottomSheet';

const MENU_WIDTH = 220;
const MENU_MAX_HEIGHT = 420;

export interface PortalMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

export const PortalMenu: React.FC<PortalMenuProps & { sheet?: boolean; title?: React.ReactNode }> = ({
  anchorRef, onClose, children, sheet, title,
}) => {
  if (sheet) {
    return <BottomSheet open onClose={onClose} title={title} ariaLabel="Song actions">{children}</BottomSheet>;
  }
  return <DropdownMenu anchorRef={anchorRef} onClose={onClose}>{children}</DropdownMenu>;
};

const DropdownMenu: React.FC<PortalMenuProps> = ({ anchorRef, onClose, children }) => {
  const [pos, setPos] = useState({ top: 0, left: 0, flipped: false });

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipped = spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow;
    setPos({
      top: flipped ? rect.top : rect.bottom + 4,
      // Right-align to the button, then keep the whole menu on screen.
      left: Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        Math.max(8, window.innerWidth - MENU_WIDTH - 8),
      ),
      flipped,
    });
  }, [anchorRef]);

  return ReactDOM.createPortal(
    <>
      <div data-portal-layer className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        data-portal-layer
        className="fixed z-[9999] bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl shadow-xl py-1 overflow-y-auto"
        style={{
          top: pos.flipped ? undefined : pos.top,
          bottom: pos.flipped ? (window.innerHeight - pos.top + 4) : undefined,
          left: pos.left,
          width: MENU_WIDTH,
          maxHeight: MENU_MAX_HEIGHT,
        }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};

const ITEM_BASE = 'w-full flex items-center gap-2 px-3 py-2 max-[1023px]:py-3 text-sm text-left transition-colors';

export interface ItemProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  /** Tailwind colour classes for the enabled state. */
  tone?: string;
  disabled?: boolean;
  /** Shown on hover — the place to explain a disabled item. */
  title?: string;
}

export const Item: React.FC<ItemProps> = ({ icon, label, onClick, tone, disabled, title }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
    className={`${ITEM_BASE} ${
      disabled
        ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
        : (tone || 'text-zinc-700 dark:text-zinc-300 hover:bg-white/5 hover:text-white')
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

/** A row laid out like an `Item` for content that is not a button — the inline
 *  rename box, a note, a two-line entry. */
export const MenuRow: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '', children,
}) => <div className={`${ITEM_BASE} ${className}`}>{children}</div>;

export const Divider: React.FC = () => (
  <div className="border-t border-zinc-200 dark:border-white/5 my-1" />
);
