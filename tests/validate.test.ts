import { describe, it, expect } from 'vitest';
import { validateProjectName } from '../src/utils/validate.js';

describe('validateProjectName', () => {
  it('should allow valid npm package names', () => {
    expect(validateProjectName('my-api').valid).toBe(true);
    expect(validateProjectName('my_api').valid).toBe(true);
    expect(validateProjectName('@scope/my-api').valid).toBe(true);
  });

  it('should reject empty names', () => {
    const result = validateProjectName('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Project name cannot be empty.');
  });

  it('should reject invalid characters', () => {
    const result = validateProjectName('My API!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('is not a valid project name');
  });
});
