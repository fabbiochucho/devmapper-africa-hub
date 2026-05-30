/**
 * Error handling utilities
 * Standardized error handling patterns and helpers
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred';
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[${context}]`, message, error);
}

/**
 * Create standardized app error
 */
export function createAppError(
  message: string,
  code?: string,
  status?: number,
  details?: unknown
): AppError {
  return { message, code, status, details };
}

/**
 * Handle async operations with error boundary
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const appError = createAppError(errorMessage, 'ASYNC_ERROR', 500, error);
    logError('safeAsync', error);
    return { data: null, error: appError };
  }
}

/**
 * Type guard for network errors
 */
export function isNetworkError(error: unknown): error is Error & { status?: number } {
  return error instanceof Error && ('status' in error || error.message.includes('network'));
}

/**
 * Type guard for validation errors
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('validation');
}

/**
 * Retry logic for async operations
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number; backoff?: boolean } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
