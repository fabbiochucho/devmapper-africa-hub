/**
 * Privacy guard: detects email addresses and phone numbers in user-generated
 * content (forum posts, replies, direct messages) so they can be blocked
 * before persistence. Catches common obfuscations (e.g. "name (at) domain dot com").
 */

// Emails — standard form and "(at)" / "[at]" / " at " obfuscations
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const OBFUSCATED_EMAIL_REGEX =
  /[A-Z0-9._%+-]+\s*[\(\[\{]?\s*(?:at|@)\s*[\)\]\}]?\s*[A-Z0-9.-]+\s*[\(\[\{]?\s*(?:dot|\.)\s*[\)\]\}]?\s*[A-Z]{2,}/i;

// Phone numbers — 7+ digits, optionally separated by spaces, dashes, dots,
// parentheses, or "+". Catches international and local formats.
const PHONE_REGEX = /(?:\+?\d[\s().-]*){7,}\d/;

export type PrivacyViolation = "email" | "phone";

export function detectPrivacyViolations(text: string): PrivacyViolation[] {
  const violations: PrivacyViolation[] = [];
  if (!text) return violations;

  const normalized = text.replace(/\s+/g, " ");

  if (EMAIL_REGEX.test(normalized) || OBFUSCATED_EMAIL_REGEX.test(normalized)) {
    violations.push("email");
  }

  // Strip emails first so the domain TLD digits don't trigger phone matcher
  const withoutEmails = normalized
    .replace(new RegExp(EMAIL_REGEX, "gi"), " ")
    .replace(new RegExp(OBFUSCATED_EMAIL_REGEX, "gi"), " ");

  if (PHONE_REGEX.test(withoutEmails)) {
    violations.push("phone");
  }

  return violations;
}

export function formatPrivacyError(violations: PrivacyViolation[]): string {
  if (violations.length === 0) return "";
  const labels = violations.map((v) =>
    v === "email" ? "email addresses" : "phone numbers"
  );
  const joined =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `For your safety, ${joined} can't be shared in public posts or messages.`;
}

/**
 * Throws a user-friendly error if the text contains contact info.
 * Returns the text unchanged otherwise.
 */
export function assertNoContactInfo(text: string): string {
  const violations = detectPrivacyViolations(text);
  if (violations.length > 0) {
    throw new Error(formatPrivacyError(violations));
  }
  return text;
}
