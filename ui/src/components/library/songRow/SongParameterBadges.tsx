// SongParameterBadges.tsx — The one-line "what made this" strip under a title:
// the cover artist name, then the selected backend's key parameters.

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Song } from '@/types';
import { useDisguiseMode } from '@/hooks/useDisguiseMode';
import { buildSongBadges, coverTag } from '../songBadges';

export const SongParameterBadges: React.FC<{ song: Song }> = ({ song }) => {
  const { t } = useTranslation();
  const { isDisguised } = useDisguiseMode();
  const tag = isDisguised ? '' : coverTag(song);
  const badges = buildSongBadges(song);
  if (!tag && !badges.length) return null;
  return (
    <div className="mt-1 min-w-0 space-y-1">
      {tag && <div className="text-[11px] text-cyan-700 dark:text-cyan-300 truncate"
        title={`${t('library.badge.tag')}: ${tag}`}>{t('library.badge.tag')}: {tag}</div>}
      {badges.length > 0 && <div className="flex flex-wrap gap-1">
        {badges.map(badge => (
          <span key={badge.label} title={`${t(`library.badge.${badge.label}`)}: ${badge.value}`}
            className="max-w-full truncate rounded border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] leading-tight text-zinc-600 dark:text-zinc-300">
            {t(`library.badge.${badge.label}`)}: {badge.value}
          </span>
        ))}
      </div>}
    </div>
  );
};
