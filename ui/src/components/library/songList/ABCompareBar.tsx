// ABCompareBar.tsx — Shows the two slots of the current A/B selection and the
// actions that only exist while one is loaded.

import React from 'react';
import { ArrowLeftRight, Play, X } from 'lucide-react';
import { clear as clearAB, openModal as openABModal, playAB } from '@/stores/abCompareStore';
import { IconButton } from '@/components/shared/controls/IconButton';

export const ABCompareBar: React.FC<{
  aId: string | null;
  aTitle: string;
  bId: string | null;
  bTitle: string;
}> = ({ aId, aTitle, bId, bTitle }) => {
  const hasBoth = !!aId && !!bId;
  return (
    <div className="mb-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/5 via-zinc-900/0 to-orange-500/5 border border-white/10 flex items-center gap-3">
      <ArrowLeftRight size={16} className="text-pink-400 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          aId ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
        }`}>
          A {aId && <span className="font-normal truncate max-w-[100px]">{aTitle}</span>}
        </span>
        <span className="text-[10px] text-zinc-600">vs</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          bId ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
        }`}>
          B {bId && <span className="font-normal truncate max-w-[100px]">{bTitle}</span>}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasBoth && (
          <>
            <button
              onClick={playAB}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
            >
              <Play size={10} /> Play A/B
            </button>
            <button
              onClick={openABModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
            >
              <ArrowLeftRight size={10} /> Compare
            </button>
          </>
        )}
        <IconButton
          label="Clear A/B"
          onClick={() => clearAB()}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X size={12} />
        </IconButton>
      </div>
    </div>
  );
};
