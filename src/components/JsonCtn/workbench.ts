export type JsonSelection = { target: 'input' | 'output'; start: number; end: number };

/** Measures the selected caret with the editor's actual wrapping so distant matches become visible. */
export const revealTextSelection = (editor: HTMLTextAreaElement, start: number, end: number) => {
  editor.focus();
  editor.setSelectionRange(start, end);
  const style = getComputedStyle(editor);
  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  Object.assign(mirror.style, {
    position: 'fixed',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    width: `${editor.clientWidth}px`,
    boxSizing: 'border-box',
    font: style.font,
    lineHeight: style.lineHeight,
    padding: style.padding,
    tabSize: style.tabSize,
  });
  mirror.textContent = editor.value.slice(0, start);
  const marker = document.createElement('span');
  marker.textContent = editor.value.slice(start, end) || ' ';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const top = marker.getBoundingClientRect().top - mirror.getBoundingClientRect().top;
  editor.scrollTop = Math.max(0, top - editor.clientHeight / 2);
  mirror.remove();
};

/** Returns a real native-parser location; unsupported engine messages have no guessed offset. */
export const jsonErrorOffset = (text: string, error: unknown): number | undefined => {
  const message = error instanceof Error ? error.message : '';
  const position = message.match(/(?:at position|position)\s+(\d+)/i);
  if (position) return Math.min(text.length, Number(position[1]));
  const line = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (line) {
    const lines = text.split('\n');
    const row = Number(line[1]) - 1;
    if (row < lines.length)
      return Math.min(
        text.length,
        lines.slice(0, row).reduce((n, value) => n + value.length + 1, 0) + Number(line[2]) - 1
      );
  }
  if (/unexpected end of json/i.test(message)) return text.length;
  return undefined;
};

export const findLiteralMatches = (text: string, query: string): number[] => {
  if (!query) return [];
  const matches: number[] = [];
  let offset = text.indexOf(query);
  while (offset >= 0 && matches.length < 10000) {
    matches.push(offset);
    offset = text.indexOf(query, offset + query.length);
  }
  return matches;
};
