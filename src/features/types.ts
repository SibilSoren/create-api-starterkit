/**
 * Text a feature adds at a slot in one of the template's files.
 */
export interface SlotAddition {
  /** File in the generated project, e.g. "src/app.ts". */
  file: string;
  /** Slot name in that file, e.g. "middleware" for `// @slot middleware`. */
  slot: string;
  /** Text that takes the slot line's place. A missing final newline is added. */
  text: string;
}

/**
 * An optional part of the generated project, such as rate limiting.
 *
 * A feature changes template files only through slots, and package.json
 * through the fields below. New files go in features/<id>/ at the root of
 * this package; they're copied into the project and may not replace a
 * template file or another feature's file.
 */
export interface Feature {
  /** Short name, used for the features/<id>/ folder and in error messages. */
  id: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  slots?: SlotAddition[];
}
