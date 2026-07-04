/**
 * Environment variable validation.
 * Fails loudly in dev, logs an error in prod, so that missing
 * Supabase configuration surfaces immediately instead of causing
 * an opaque blank-page failure at runtime.
 */
const REQUIRED = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] as const;

const missing = REQUIRED.filter((key) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return !value || value.length === 0;
});

if (missing.length > 0) {
  const message = `Missing required environment variables: ${missing.join(", ")}`;
  if (import.meta.env.DEV) {
    throw new Error(message);
  } else {
    // eslint-disable-next-line no-console
    console.error(message);
  }
}

export {};
