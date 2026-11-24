// tailPath.ts — the last few segments of a stored path, for a badge or label.
//
// An adapter, run or dataset lives under a deep folder whose leaf alone is
// ambiguous ("step-800" exists in every run), so a label keeps two segments
// ("run-stamp/step-800") and a preview of a nested folder keeps three. The
// split is answered here, as in baseName, so both separators are handled and
// five surfaces do not each re-decide it.

/** The last `segments` non-empty segments of `path`, joined with `/`. */
export function tailPath(path: string, segments = 2): string {
  if (!path) return '';
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.slice(-segments).join('/');
}
