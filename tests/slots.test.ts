import { describe, it, expect } from 'vitest';
import { fillSlots, listSlots } from '../src/compose/slots.js';

const fill = (content: string, additions: Record<string, string[]> = {}) =>
  fillSlots(content, new Map(Object.entries(additions)), 'file');

describe('fillSlots', () => {
  it('replaces slot lines in TypeScript, YAML and Markdown', () => {
    const content = [
      'a',
      '  // @slot code',
      '# @slot config',
      '<!-- @slot docs -->',
      'b',
      '',
    ].join('\n');

    const result = fill(content, {
      code: ['  code();\n'],
      config: ['key: value\n'],
      docs: ['## Docs\n'],
    });

    expect(result.content).toBe('a\n  code();\nkey: value\n## Docs\nb\n');
    expect([...result.filled]).toEqual(['code', 'config', 'docs']);
  });

  it('adds several features to one slot in order', () => {
    expect(fill('// @slot imports\n', { imports: ['one\n', 'two\n'] }).content).toBe(
      'one\ntwo\n',
    );
  });

  it('removes slot lines nothing was added to, leaving no blank line', () => {
    const result = fill('a\n  // @slot middleware\nb\n');

    expect(result.content).toBe('a\nb\n');
    expect(result.filled.size).toBe(0);
  });

  it('adds a missing final newline to added text', () => {
    expect(fill('// @slot x\nend\n', { x: ['text'] }).content).toBe('text\nend\n');
  });

  it('handles a slot on the last line without a newline', () => {
    expect(fill('a\n# @slot x', { x: ['b\n'] }).content).toBe('a\nb\n');
  });

  it('leaves lines that only mention @slot alone', () => {
    const content = "const note = '// @slot x';\n// see @slot x below\n";

    expect(fill(content, { x: ['added\n'] }).content).toBe(content);
  });

  it('refuses a file that names the same slot twice', () => {
    expect(() => fill('// @slot x\n// @slot x\n')).toThrow(
      'file has "@slot x" more than once.',
    );
  });
});

describe('listSlots', () => {
  it('lists slot names in order', () => {
    expect(listSlots('// @slot a\ncode\n  # @slot b\n<!-- @slot c -->\n')).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
