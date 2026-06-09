import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively copy a directory, replacing template placeholders.
 */
export function copyTemplateDir(
  src: string,
  dest: string,
  replacements: Record<string, string>,
): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    // Rename _gitignore to .gitignore (npm strips .gitignore from published packages)
    const destName = entry.name === '_gitignore' ? '.gitignore' : entry.name;
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyTemplateDir(srcPath, destPath, replacements);
    } else {
      copyTemplateFile(srcPath, destPath, replacements);
    }
  }
}

/**
 * Copy a single file, replacing template placeholders in text files.
 */
function copyTemplateFile(
  src: string,
  dest: string,
  replacements: Record<string, string>,
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
    let content = fs.readFileSync(src, 'utf-8');

    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replaceAll(placeholder, value);
    }

    fs.writeFileSync(dest, content, 'utf-8');
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
