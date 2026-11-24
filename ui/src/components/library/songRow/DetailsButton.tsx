// DetailsButton.tsx — The i button on a track: opens the Song Details panel.
// Playing or clicking a track no longer does.

import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DetailsButton: React.FC<{ onClick: () => void; size: number; className: string }> = ({ onClick, size, className }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={className}
      title={t('library.songDetails', 'Song details')}
      aria-label={t('library.songDetails', 'Song details')}
    >
      <Info size={size} />
    </button>
  );
};
