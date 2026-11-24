// trackDuration.ts — A track's length, as a row should show it.
//
// The library's three view modes each carried a byte-identical copy of this
// rule (card, list row, table cell). It is deliberately laxer than
// songFacts.formatDuration: a value already shaped like a clock passes through
// untouched, and a missing one becomes the row's placeholder.

import { formatClock } from './format';

/** Preformatted strings pass through; numbers become `m:ss`. Anything falsy —
 *  including 0 and NaN — shows `placeholder`. */
export function formatTrackDuration(
  value: string | number | null | undefined,
  placeholder = '--:--',
): string {
  if (!value) return placeholder;
  return typeof value === 'string' ? value : formatClock(value);
}
