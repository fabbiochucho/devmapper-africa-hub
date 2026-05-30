/**
 * Constants for application configuration
 * Centralizes magic numbers and configuration values
 */

// UI/UX Timing Constants
export const WALKTHROUGH_DELAY_MS = 1500; // Allow dashboard to render first
export const SESSION_CHECK_INTERVAL_MS = 5000; // Check session every 5 seconds
export const DEBOUNCE_DELAY_MS = 300; // Debounce search input
export const TOAST_DURATION_MS = 3000; // Toast notification duration

// Geolocation Constants
export const GEOCODING_DEFAULT_ZOOM = 3; // Zoom level for country-level detail
export const GEOCODING_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const GEOCODING_MIN_REQUEST_INTERVAL_MS = 100; // Minimum interval between geocoding requests

// Build Configuration
export const VITE_CHUNK_WARNING_LIMIT_KB = 600; // KB threshold for chunk size warnings
export const VITE_CHUNK_SIZE_LIMITS = {
  'vendor-react': 500,
  'vendor-recharts': 400,
  'vendor-maps': 450,
  'vendor-radix': 350,
  'vendor-supabase': 300,
  'vendor-query': 250,
  'vendor-forms': 280,
  'vendor-i18n': 150,
} as const;

// Pagination Configuration
export const POSTS_PER_PAGE = 20;
export const CONVERSATIONS_PER_PAGE = 25;
export const FORUM_POSTS_PER_PAGE = 20;
export const DEFAULT_PAGE_SIZE = 20;

// Validation Constants
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_FULL_NAME_LENGTH = 2;
export const MAX_FULL_NAME_LENGTH = 100;

// Password validation requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
} as const;

// Rate Limiting
export const API_RATE_LIMIT_REQUESTS = 100;
export const API_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Feature Flags
export const FEATURES = {
  EARTH_INTELLIGENCE: 'view_earth_intelligence',
  ADVANCED_EARTH_INTEL: 'advanced_earth_intel',
  ESG_MODULE: 'esg_module',
  SCENARIO_ANALYSIS: 'scenario_analysis',
  DATA_EXPORT: 'data_export',
} as const;

// Organization Plan Types
export const PLAN_TYPES = {
  LITE: 'lite',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Plan Limits
export const PLAN_LIMITS = {
  lite: {
    esg_suppliers: 50,
    esg_scenarios: 5,
    alphaearth_api_calls: 100,
    monthly_exports: 10,
  },
  pro: {
    esg_suppliers: 500,
    esg_scenarios: 50,
    alphaearth_api_calls: 1000,
    monthly_exports: 100,
  },
  enterprise: {
    esg_suppliers: null, // Unlimited
    esg_scenarios: null,
    alphaearth_api_calls: null,
    monthly_exports: null,
  },
} as const;

// SDG Goals
export const SDG_GOALS = Array.from({ length: 17 }, (_, i) => i + 1);

// Default Search Limit
export const DEFAULT_SEARCH_LIMIT = 50;
export const MAX_SEARCH_LIMIT = 500;
