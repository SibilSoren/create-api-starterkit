/**
 * Slots are marker lines in template files where features add code:
 *
 *   // @slot middleware        (TypeScript, JavaScript)
 *   # @slot services           (YAML, Dockerfile, .env)
 *   <!-- @slot deploy -->      (Markdown)
 *
 * A slot line is replaced by what the chosen features add there, in feature
 * order, or removed when nothing is added. Generated projects never contain
 * slot lines.
 */
const SLOT_LINE =
  /^[ \t]*(?:\/\/|#|<!--)[ \t]*@slot[ \t]+([\w.-]+)[ \t]*(?:-->)?[ \t]*(?:\r?\n|$)/gm;

/**
 * Replace every slot line in `content` with the text added for that slot.
 * Returns the new content and the names of the slots that received text.
 * Throws if a file names the same slot twice, so it's always clear where
 * an addition goes.
 */
export function fillSlots(
  content: string,
  additions: ReadonlyMap<string, readonly string[]>,
  file: string,
): { content: string; filled: Set<string> } {
  const seen = new Set<string>();
  const filled = new Set<string>();

  const result = content.replace(SLOT_LINE, (_line, name: string) => {
    if (seen.has(name)) {
      throw new Error(`${file} has "@slot ${name}" more than once.`);
    }
    seen.add(name);

    const texts = additions.get(name);
    if (!texts || texts.length === 0) return '';
    filled.add(name);
    return texts.map((text) => (text.endsWith('\n') ? text : `${text}\n`)).join('');
  });

  return { content: result, filled };
}

/**
 * The names of the slots in `content`, in order.
 */
export function listSlots(content: string): string[] {
  return [...content.matchAll(SLOT_LINE)].map((match) => match[1]);
}
