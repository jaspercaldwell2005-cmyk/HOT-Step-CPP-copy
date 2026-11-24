// tableColumns.ts — The table view's column definitions and its persisted
// state: widths and per-column visibility.

import { readJson, writeJson } from '@/utils/storage/storageJson';

export type ColAlign = 'left' | 'center' | 'right';
export interface ColDef { id: string; label: string; defaultW: number; minW: number; align: ColAlign; resizable: boolean; defaultHidden?: boolean }

export const SOURCE_BADGE_MAP: Record<string, { label: string; cls: string }> = {
  'insta-gen': { label: 'Auto-Gen', cls: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/25' },
  'lyric-studio': { label: 'Lyric', cls: 'text-pink-300 bg-pink-500/15 border-pink-500/25' },
  'cover-studio': { label: 'Cover', cls: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25' },
  'repaint': { label: 'Repaint', cls: 'text-amber-300 bg-amber-500/15 border-amber-500/25' },
  'stem-builder': { label: 'Stem', cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25' },
  'builder': { label: 'Builder', cls: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/25' },
};

// Column definitions — id, label, default width, min width, alignment.
// defaultHidden = not shown until the user enables it via the Columns menu.
export const BASE_COLS: ColDef[] = [
  { id: 'thumb',   label: '',        defaultW: 48,  minW: 48,  align: 'left', resizable: false },
  { id: 'title',   label: 'Title',   defaultW: 320, minW: 80,  align: 'left', resizable: true },
  { id: 'style',   label: 'Style',   defaultW: 320, minW: 80,  align: 'left', resizable: true },
  { id: 'bpm',     label: 'BPM',     defaultW: 60,  minW: 40,  align: 'left', resizable: true },
  { id: 'key',     label: 'Key',     defaultW: 60,  minW: 40,  align: 'left', resizable: true },
  { id: 'model',   label: 'Model',   defaultW: 110, minW: 60,  align: 'left', resizable: true },
  { id: 'quality', label: 'Quality', defaultW: 70,  minW: 50,  align: 'left', resizable: true },
  { id: 'time',    label: 'Time',    defaultW: 56,  minW: 44,  align: 'left', resizable: true },
  { id: 'date',    label: 'Date',    defaultW: 80,  minW: 50,  align: 'left', resizable: true },
  // ── Generation data (hidden by default; enable via Columns menu) ──
  { id: 'seed',      label: 'Seed',      defaultW: 96,  minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'lmSeed',    label: 'LM Seed',   defaultW: 96,  minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'steps',     label: 'Steps',     defaultW: 56,  minW: 44, align: 'left', resizable: true, defaultHidden: true },
  { id: 'cfg',       label: 'CFG',       defaultW: 56,  minW: 44, align: 'left', resizable: true, defaultHidden: true },
  { id: 'shift',     label: 'Shift',     defaultW: 56,  minW: 44, align: 'left', resizable: true, defaultHidden: true },
  { id: 'solver',    label: 'Solver',    defaultW: 110, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'scheduler', label: 'Scheduler', defaultW: 110, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'guidanceMode', label: 'Guidance', defaultW: 100, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'lora',      label: 'LoRA',      defaultW: 130, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'loraScale', label: 'LoRA Scale', defaultW: 80, minW: 50, align: 'left', resizable: true, defaultHidden: true },
  { id: 'lm',        label: 'LM Model',  defaultW: 120, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'vae',       label: 'VAE',       defaultW: 110, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'timesig',   label: 'Time Sig',  defaultW: 68,  minW: 48, align: 'left', resizable: true, defaultHidden: true },
  { id: 'lang',      label: 'Lang',      defaultW: 60,  minW: 44, align: 'left', resizable: true, defaultHidden: true },
  { id: 'task',      label: 'Task',      defaultW: 100, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  { id: 'instrumental', label: 'Instr.', defaultW: 60, minW: 48, align: 'center', resizable: true, defaultHidden: true },
  { id: 'mastered',  label: 'Mastered',  defaultW: 76,  minW: 56, align: 'center', resizable: true, defaultHidden: true },
  { id: 'seedType',  label: 'Seed Type', defaultW: 80,  minW: 56, align: 'left', resizable: true, defaultHidden: true },
  { id: 'lmSeedType', label: 'LM Seed Type', defaultW: 90, minW: 60, align: 'left', resizable: true, defaultHidden: true },
  // Holds up to 5 action buttons (edit/download/delete/A/B). Must be wide
  // enough that the fixed-layout <td overflow-hidden> never clips them — the
  // column is non-resizable so the user can't widen it manually (#58).
  { id: 'actions', label: 'Actions', defaultW: 158, minW: 158, align: 'right', resizable: false },
];

export const SOURCE_COL: ColDef = { id: 'source', label: 'Source', defaultW: 80, minW: 50, align: 'left', resizable: true };
export const SELECT_COL: ColDef = { id: 'select', label: '', defaultW: 32, minW: 32, align: 'left', resizable: false };
// Flexible spacer inserted before the actions column. It carries no width of
// its own and absorbs all leftover table width, which pins `actions` to the
// right edge while the resizable middle columns share the space between (#58).
export const SPACER_COL: ColDef = { id: 'spacer', label: '', defaultW: 0, minW: 0, align: 'left', resizable: false };

const STORAGE_KEY = 'hs-table-colWidths';

function loadColWidths(): Record<string, number> {
  return readJson<Record<string, number>>(STORAGE_KEY, {});
}

export function saveColWidths(w: Record<string, number>) {
  try { writeJson(STORAGE_KEY, w); } catch { /* ignore */ }
}

// ── Column visibility (user-customizable columns) ────────────────────────────
const COL_VIS_KEY = 'hs-table-colVisibility';
// Structural columns the user can't hide — the table needs them to function.
export const MANDATORY_COLS = new Set(['select', 'thumb', 'title', 'spacer', 'actions']);

export function loadColVisibility(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(COL_VIS_KEY, {});
}
export function saveColVisibility(v: Record<string, boolean>) {
  try { writeJson(COL_VIS_KEY, v); } catch { /* ignore */ }
}

/** Whether a column shows when the user hasn't explicitly toggled it. */
export function colDefaultVisible(id: string): boolean {
  if (MANDATORY_COLS.has(id)) return true;
  if (id === 'source') return true; // shown whenever the source column applies
  return !BASE_COLS.find(c => c.id === id)?.defaultHidden;
}

/** Initial column widths: saved values, filled in from the defaults. */
export function initialColWidths(): Record<string, number> {
  const saved = loadColWidths();
  const merged: Record<string, number> = {};
  for (const c of [...BASE_COLS, SOURCE_COL, SELECT_COL]) {
    merged[c.id] = saved[c.id] ?? c.defaultW;
  }
  return merged;
}
