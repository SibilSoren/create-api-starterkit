/**
 * Validate a project name.
 * Must be a valid npm package name (kebab-case, no special chars).
 */
export function validateProjectName(name: string): {
  valid: boolean;
  message?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Project name cannot be empty.' };
  }

  // npm package name rules (simplified)
  const validPattern = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

  if (!validPattern.test(name)) {
    return {
      valid: false,
      message: `"${name}" is not a valid project name. Use lowercase letters, numbers, and hyphens (e.g., my-api).`,
    };
  }

  if (name.length > 214) {
    return {
      valid: false,
      message: 'Project name must be less than 214 characters.',
    };
  }

  return { valid: true };
}
