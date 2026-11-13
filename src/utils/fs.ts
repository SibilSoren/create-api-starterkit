import fs from 'node:fs';
import path from 'node:path';

/**
 * Changes a text file's content while it's copied. `file` is the file's path
 * in the generated project, with "/" separators, e.g. "src/app.ts".
 */
export type TextTransform = (file: string, content: string) => string;

/**
 * Recursively copy a directory. Text files go through `transform`; other
 * files are copied as they are. With `overwrite: false`, finding a file
 * already in place is an error.
 */
export function copyTemplateDir(
  src: string,
  dest: string,
  transform: TextTransform,
  options: { overwrite?: boolean } = {},
): void {
  copyDir(src, dest, '', transform, options.overwrite ?? true);
}

function copyDir(
  src: string,
  dest: string,
  relative: string,
  transform: TextTransform,
  overwrite: boolean,
): void {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    // Rename _gitignore to .gitignore (npm strips .gitignore from published packages)
    const destName = entry.name === '_gitignore' ? '.gitignore' : entry.name;
    const destPath = path.join(dest, destName);
    const file = relative ? `${relative}/${destName}` : destName;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, file, transform, overwrite);
      continue;
    }
    if (!overwrite && fs.existsSync(destPath)) {
      throw new Error(`${file} already exists; a feature can't replace it.`);
    }
    copyTemplateFile(srcPath, destPath, file, transform);
  }
}

/**
 * Copy a single file, sending text files through `transform`.
 */
function copyTemplateFile(
  src: string,
  dest: string,
  file: string,
  transform: TextTransform,
): void {
  const ext = path.extname(src).toLowerCase();
  const textExtensions = [
    '.ts',
    '.js',
    '.json',
    '.md',
    '.yml',
    '.yaml',
    '.env',
    '.txt',
    '.example',
    '.prettierrc',
    '',
  ];

  if (textExtensions.includes(ext) || path.basename(src).startsWith('.')) {
    fs.writeFileSync(dest, transform(file, fs.readFileSync(src, 'utf-8')), 'utf-8');
  } else {
    // Binary files — copy as-is
    fs.copyFileSync(src, dest);
  }
}

/**
 * Check if a directory is empty or doesn't exist.
 */
export function isDirEmpty(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) return true;
  const entries = fs.readdirSync(dirPath);
  return entries.length === 0;
}
