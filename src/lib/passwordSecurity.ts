/**
 * Client-side leaked password protection using the Have I Been Pwned API.
 * Uses k-anonymity: only the first 5 chars of the SHA-1 hash are sent,
 * so the full password is never transmitted.
 */

export async function checkPasswordBreached(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!response.ok) {
      // If API is unavailable, don't block the user — fail open
      console.warn('HIBP API unavailable, skipping breach check');
      return false;
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix && parseInt(count.trim(), 10) > 0) {
        return true; // Password has been found in breaches
      }
    }

    return false;
  } catch {
    // Network error — fail open so users aren't blocked
    console.warn('Password breach check failed, skipping');
    return false;
  }
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Common patterns reduce score
  if (/^(123|abc|password|qwerty)/i.test(password)) score = Math.max(score - 2, 0);

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Very weak', color: 'bg-destructive' },
    1: { label: 'Weak', color: 'bg-destructive' },
    2: { label: 'Fair', color: 'bg-yellow-500' },
    3: { label: 'Strong', color: 'bg-green-500' },
    4: { label: 'Very strong', color: 'bg-green-600' },
  };

  return { score: capped, ...map[capped] };
}
