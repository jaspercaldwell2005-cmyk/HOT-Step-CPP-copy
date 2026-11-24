// quality.ts — Reading the quality-scores blob a post-processing run stores.
//
// The badge is the only consumer today, but the parse is pure and has one real
// failure mode (an older or truncated JSON string), so it lives beside the
// other formatters instead of inside the component that draws it.

export interface ParsedQuality {
  score: number;
  metallic: number;
  wordCuts: number;
  noise: number;
}

export interface QualityScores {
  unmastered?: ParsedQuality;
  mastered?: ParsedQuality;
}

/** Parse `song.quality_scores`: null when absent or unreadable, which is the
 *  signal for "draw no badge" — not an error. */
export function parseQualityScores(raw?: string): QualityScores | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QualityScores;
  } catch {
    return null;
  }
}

/** Border/background tint for a score: good, middling, poor. */
export function qualityToneClass(score: number): string {
  if (score >= 0.8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (score >= 0.5) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

/** Just the text colour from the same scale, for a number in a metric row. */
export function qualityTextClass(score: number): string {
  return qualityToneClass(score).split(' ')[0];
}
