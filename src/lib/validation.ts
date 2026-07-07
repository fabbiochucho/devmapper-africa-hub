/**
 * Validation utilities for user input
 * Centralized validation functions for consistency
 */

/**
 * Email validation regex - RFC 5322 simplified
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; message: string } {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }

  if (email.length > 254) {
    return { valid: false, message: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate password strength
 * Requirements: 12+ chars, uppercase, lowercase, number
 */
export function validatePassword(password: string): {
  valid: boolean;
  message: string;
  requirements?: string[];
} {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  const requirements: string[] = [];

  if (password.length < 12) {
    requirements.push('At least 12 characters');
  }

  if (!/[A-Z]/.test(password)) {
    requirements.push('At least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    requirements.push('At least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    requirements.push('At least one number');
  }

  if (requirements.length > 0) {
    return {
      valid: false,
      message: 'Password does not meet requirements',
      requirements,
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate full name
 */
export function validateFullName(name: string): { valid: boolean; message: string; value?: string } {
  if (!name || !name.trim()) {
    return { valid: false, message: 'Full name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, message: 'Full name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'Full name must be less than 100 characters' };
  }

  return { valid: true, message: '', value: trimmed };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; message: string } {
  if (!url || !url.trim()) {
    return { valid: false, message: 'URL is required' };
  }

  try {
    new URL(url);
    return { valid: true, message: '' };
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }
}

/**
 * Validate phone number (basic - accepts most international formats)
 */
export function validatePhoneNumber(phone: string): { valid: boolean; message: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, message: 'Phone number is required' };
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().+]/g, '');

  if (!/^\d{7,15}$/.test(cleaned)) {
    return { valid: false, message: 'Invalid phone number format' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate number is within range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number
): { valid: boolean; message: string } {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Value must be between ${min} and ${max}`,
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate coordinate (latitude/longitude)
 */
export function validateCoordinate(lat: number, lng: number): {
  valid: boolean;
  message: string;
} {
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, message: 'Invalid coordinate format' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, message: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, message: 'Longitude must be between -180 and 180' };
  }

  return { valid: true, message: '' };
}

/**
 * Strips literal angle brackets and the javascript: scheme from a string.
 * NOT an XSS defense — does not protect against HTML-entity encoding, URL
 * encoding, data:/vbscript: schemes, or attribute-based injection. For HTML
 * contexts use DOMPurify; for URLs validate with `new URL()` and a scheme allowlist.
 */
export function stripAngleBracketsAndJsScheme(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}
