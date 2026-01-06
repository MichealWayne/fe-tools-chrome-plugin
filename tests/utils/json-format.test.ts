import { describe, expect, it } from 'vitest';
import { escapeHtml, formatJsonString } from '@/utils/json-format/format-utils';

describe('json-format utils', () => {
  it('formats json with default indentation', () => {
    const input = '{"name":"test","age":1}';
    const formatted = formatJsonString(input);

    expect(formatted).toBe('{' +
      '\n    "name": "test",' +
      '\n    "age": 1' +
      '\n}');
  });

  it('throws for invalid json', () => {
    expect(() => formatJsonString('invalid')).toThrow();
  });

  it('escapes html characters', () => {
    const input = '<div class="x">&</div>"\'';
    const output = escapeHtml(input);

    expect(output).toBe('&lt;div class=&quot;x&quot;&gt;&amp;&lt;/div&gt;&quot;&#039;');
  });
});
