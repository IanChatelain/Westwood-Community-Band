/**
 * Shared validation & sanitization helpers.
 * Safe to import from both client components and server actions.
 */

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip control characters and collapse repeated whitespace. */
export function sanitizeString(value: string, maxLength = 1000): string {
  return value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Normalise an email: trim, lowercase, strip control chars, enforce max length. */
export function sanitizeEmail(value: string): string {
  return value.replace(CONTROL_CHARS, '').trim().toLowerCase().slice(0, 254);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required.';
  if (email.length > 254) return 'Email is too long.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be 128 characters or fewer.';
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

export function validateMaxLength(value: string, max: number, label: string): string | null {
  if (value.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

export function validateMinLength(value: string, min: number, label: string): string | null {
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`;
  return null;
}

/** Sanitise a single-line string field (strips newlines in addition to control chars). */
export function sanitizeSingleLine(value: string, maxLength = 500): string {
  return value.replace(CONTROL_CHARS, '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

const SLUG_RE = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function validateSlug(slug: string): string | null {
  if (slug === '/') return null;
  if (!SLUG_RE.test(slug)) return 'Slug must start with / and contain only lowercase letters, numbers, and hyphens.';
  if (slug.length > 200) return 'Slug is too long.';
  return null;
}

const URL_RE = /^https?:\/\/.+/i;

export function validateUrl(url: string, label = 'URL'): string | null {
  if (!url) return null;
  if (!URL_RE.test(url)) return `${label} must start with http:// or https://.`;
  if (url.length > 2000) return `${label} is too long.`;
  return null;
}
