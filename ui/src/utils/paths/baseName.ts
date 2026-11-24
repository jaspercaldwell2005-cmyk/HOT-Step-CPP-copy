// baseName.ts — A model or adapter path reduced to the name a column can show.
//
// Windows and POSIX separators both appear in stored params, and the extension
// is noise in a table cell, so both are answered here rather than in the cell.

const MODEL_EXT = /\.(safetensors|gguf|ckpt|pt|onnx|bin)$/i;

/** Last path segment, without a model extension. */
export function baseName(path?: string): string {
  if (!path) return '';
  const file = path.replace(/\\/g, '/').split('/').pop() || '';
  return file.replace(MODEL_EXT, '');
}
