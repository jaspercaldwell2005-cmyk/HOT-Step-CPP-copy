// useInlineRename.ts — editing a track title in place.
//
// The grid card, the list row and the table cell each carried the same thirty
// lines: a draft, an `editing` flag, focus-and-select on open, commit on Enter
// or blur, revert on Escape. Three copies meant three chances to disagree about
// what an empty title does (it is not a rename) or to leave a stale draft
// behind when the row's title changes underneath it.
//
// The trigger markup stays with the caller — a card, a row and a table cell
// each own their own input styling — and this owns the state machine.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

export interface InlineRename {
  editing: boolean;
  /** Start editing, seeding the draft from the current title. */
  begin: () => void;
  /** Save, if the draft is non-empty and actually different. */
  commit: () => void;
  /** Abandon the draft and keep the old title. */
  cancel: () => void;
  /** Spread onto the `<input>`: focus ref, value, change, blur, Enter/Escape
   *  and the click guard that stops the row underneath from playing. */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    onClick: (e: MouseEvent<HTMLInputElement>) => void;
  };
}

export function useInlineRename(
  currentTitle: string,
  onRename?: (title: string) => void,
): InlineRename {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const begin = useCallback(() => {
    setDraft(currentTitle);
    setEditing(true);
  }, [currentTitle]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    // An empty title is not a name, and re-saving the same one is not an edit.
    if (trimmed && trimmed !== currentTitle) onRename?.(trimmed);
    setEditing(false);
  }, [draft, currentTitle, onRename]);

  const cancel = useCallback(() => {
    setDraft(currentTitle);
    setEditing(false);
  }, [currentTitle]);

  return {
    editing,
    begin,
    commit,
    cancel,
    inputProps: {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      },
      onClick: (e) => e.stopPropagation(),
    },
  };
}
