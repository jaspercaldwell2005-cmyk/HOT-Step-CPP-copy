// EmptyState.tsx — The house "there is nothing here yet" block.
//
// Three lyric-studio panels had grown the same block by copy: a circle holding
// an icon, a heading, an optional sentence, and sometimes an action row. The
// padding, ring and type must match across panels, or an empty album grid and
// an empty profile list look like different products.

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: React.ReactNode;
  /** One sentence on how to fill the panel; omitted when the title says it. */
  hint?: React.ReactNode;
  /** Buttons below the hint. */
  action?: React.ReactNode;
  /** `md` is the 56px circle used by panel lists; `lg` the 64px one used by
   *  grids; `xl` the 80px one used by page-level empty screens. */
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

/** Circle, icon, heading and vertical padding per size, kept together so a
 *  caller picks a whole look rather than matching four classes by hand. */
const SIZES = {
  md: { pad: 'py-16', box: 'w-14 h-14', icon: 'w-7 h-7', title: 'text-base' },
  lg: { pad: 'py-16', box: 'w-16 h-16', icon: 'w-8 h-8', title: 'text-base' },
  xl: { pad: 'py-24', box: 'w-20 h-20', icon: 'w-10 h-10', title: 'text-lg' },
} as const;

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon, title, hint, action, size = 'md', className = '',
}) => {
  const s = SIZES[size];
  return (
    <div className={`flex flex-col items-center justify-center ${s.pad} text-center ${className}`}>
      <div className={`${s.box} rounded-full bg-white/5 flex items-center justify-center mb-4`}>
        <Icon className={`${s.icon} text-zinc-600`} />
      </div>
      <h3 className={`${s.title} font-semibold text-zinc-600 dark:text-zinc-400 mb-2`}>{title}</h3>
      {hint && <p className={`text-sm text-zinc-500 max-w-xs${action ? ' mb-4' : ''}`}>{hint}</p>}
      {action}
    </div>
  );
};
