const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
required.forEach(key => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
};
