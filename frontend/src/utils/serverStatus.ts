/**
 * Server Status Detection Utility
 *
 * Detects when the backend server is starting up (common with Render's free tier)
 * and manages retry logic with exponential backoff.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const HEALTH_CHECK_ENDPOINT = '/api/health';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 15000; // 15 seconds

export interface ServerStatusResult {
  isAvailable: boolean;
  isStarting: boolean;
  error?: string;
}

/**
 * Checks if the server is available and responsive
 */
export async function checkServerStatus(): Promise<ServerStatusResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${BACKEND_URL}${HEALTH_CHECK_ENDPOINT}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { isAvailable: true, isStarting: false };
    }

    // Server responded but not healthy
    return { isAvailable: false, isStarting: true };
  } catch (error: any) {
    // Network errors typically indicate server is starting/unavailable
    if (error.name === 'AbortError') {
      return { isAvailable: false, isStarting: true, error: 'Request timeout' };
    }

    // Check if it's a network error (server not reachable)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { isAvailable: false, isStarting: true, error: 'Server unreachable' };
    }

    return { isAvailable: false, isStarting: true, error: error.message };
  }
}

/**
 * Polls the server until it becomes available or max retries reached
 * Uses exponential backoff for retry delays
 */
export async function waitForServer(
  onProgress?: (attempt: number, maxRetries: number) => void
): Promise<boolean> {
  let attempt = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (attempt < MAX_RETRIES) {
    attempt++;

    if (onProgress) {
      onProgress(attempt, MAX_RETRIES);
    }

    const status = await checkServerStatus();

    if (status.isAvailable) {
      return true;
    }

    // Don't wait after the last attempt
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff with max cap
      delay = Math.min(delay * 1.5, MAX_RETRY_DELAY);
    }
  }

  return false;
}

/**
 * Detects if an error is likely due to server startup
 */
export function isServerStartupError(error: any): boolean {
  if (!error) return false;

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }

  // Common error messages indicating server issues
  const errorMessage = error.message?.toLowerCase() || '';
  const errorDetail = error.detail?.toLowerCase() || '';

  const startupIndicators = [
    'network request failed',
    'failed to fetch',
    'connection refused',
    'econnrefused',
    'timeout',
    'unreachable',
    'not available',
    'service unavailable',
    '503',
  ];

  return startupIndicators.some(indicator =>
    errorMessage.includes(indicator) || errorDetail.includes(indicator)
  );
}
