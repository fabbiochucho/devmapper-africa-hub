/**
 * Request cancellation utilities for aborted navigations
 * Uses AbortController to cancel in-flight requests when user navigates away
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that provides an AbortSignal that cancels when the component unmounts
 * Use with fetch() or Supabase queries that support abort signals
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  // Create a new controller, aborting any existing one
  const getSignal = useCallback(() => {
    // Abort previous request if still pending
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  // Abort on cleanup
  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Auto-abort on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return { getSignal, abort };
}

/**
 * Hook for cancellable async operations
 * Wraps an async function to automatically cancel on unmount or re-execution
 */
export function useCancellableOperation<T>() {
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    // Cancel previous operation
    controllerRef.current?.abort();
    
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const result = await operation(controller.signal);
      if (!mountedRef.current) return null;
      return result;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return null; // Silently handle aborted requests
      }
      throw error;
    }
  }, []);

  return { execute, isMounted: () => mountedRef.current };
}

/**
 * Cancellable fetch wrapper
 * Automatically cancels previous requests when called again
 */
export class CancellableFetch {
  private controller: AbortController | null = null;

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Cancel previous request
    this.cancel();
    
    this.controller = new AbortController();
    
    const response = await fetch(url, {
      ...options,
      signal: this.controller.signal,
    });
    
    return response;
  }

  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

/**
 * Create a cancellable version of a Supabase query builder
 * Note: Supabase JS v2 supports AbortSignal via .abortSignal()
 */
export function withCancellation<T>(
  queryBuilder: any,
  signal: AbortSignal
): any {
  if (typeof queryBuilder.abortSignal === 'function') {
    return queryBuilder.abortSignal(signal);
  }
  return queryBuilder;
}
