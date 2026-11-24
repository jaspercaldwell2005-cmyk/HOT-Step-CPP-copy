// QualityBadge.tsx — Raw and post-processed quality scores, as a pair.
//
// Both numbers are shown together because they are judged against each other:
// a hovered badge that showed only its own numbers would lose the comparison
// that made the pair worth storing.

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { ParamLabel } from '@/components/shared/controls/ParamLabel';
import { formatPercent } from '@/utils/format/format';
import {
  qualityTextClass, qualityToneClass, parseQualityScores, type ParsedQuality,
} from '@/utils/format/quality';

export const QualityBadge: React.FC<{ song: Song }> = ({ song }) => {
  const { t } = useTranslation();
  const scores = parseQualityScores(song.quality_scores);
  // No hook may sit below this early return: a song that gains or loses
  // quality data would change the component's hook count.
  if (!scores) return null;

  const metric = (label: string, value: number) => (
    <span className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className={qualityTextClass(value)}>{formatPercent(value)}</span>
    </span>
  );

  const detail = (label: string, q: ParsedQuality) => (
    <span className="mt-2 block first:mt-0">
      <span className="mb-1 block text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="block space-y-0.5">
        {metric(t('library.quality.overall', 'Overall'), q.score)}
        {metric(t('library.quality.metallic', 'Metallic'), q.metallic)}
        {metric(t('library.quality.wordCuts', 'Word Cuts'), q.wordCuts)}
        {metric(t('library.quality.noise', 'Noise'), q.noise)}
      </span>
    </span>
  );

  // A span, not a button: the badge has no action of its own, and the old
  // badge let a click bubble to the song row to play/select it. A button here
  // would both look actionable and swallow that click.
  const badge = (q: ParsedQuality, label: string) => (
    <span
      tabIndex={0}
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-help outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${qualityToneClass(q.score)}`}
    >
      {label}
    </span>
  );

  const hasBoth = !!scores.unmastered && !!scores.mastered;
  // One card for both scores, as the old tooltip did.
  const info = (
    <>
      {scores.unmastered && detail(t('library.quality.unmastered', 'Unmastered'), scores.unmastered)}
      {scores.mastered && detail(t('library.quality.mastered', 'Mastered'), scores.mastered)}
    </>
  );

  return (
    <ParamLabel label={t('library.quality.title', 'Quality scores')} info={info} rootClassName="inline-flex">
      <span className="relative inline-flex items-center gap-1">
        {scores.unmastered && badge(
          scores.unmastered,
          `${hasBoth ? `${t('library.quality.raw', 'Raw')}: ` : ''}${formatPercent(scores.unmastered.score)}`,
        )}
        {scores.mastered && badge(
          scores.mastered,
          `${hasBoth ? `${t('library.quality.pp', 'PP')}: ` : ''}${formatPercent(scores.mastered.score)}`,
        )}
      </span>
    </ParamLabel>
  );
};
