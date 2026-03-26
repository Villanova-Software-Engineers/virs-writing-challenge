/**
 * src/services/apiClient.ts
 *
 * Industry-standard API client with:
 * - Firebase auth token management
 * - Typed request/response handling
 * - Comprehensive error handling
 * - Request/response interceptors pattern
 */

import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase/config";
import type { ApiError } from "../types/api.types";

// ── Custom API Error Class ──────────────────────────────────────────────────
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, detail: string) {
    super(`${status}: ${detail}`);
    this.name = "ApiClientError";
    this.status = status;
    this.detail = detail;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// ── Token Management ────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Gets a valid Firebase ID token, using cache when possible.
 * Forces refresh if token is about to expire (within 5 minutes).
 */
async function getToken(forceRefresh = false): Promise<string | null> {
  const now = Date.now();
  const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

  // Return cached token if valid and not expiring soon
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + REFRESH_BUFFER) {
    return cachedToken;
  }

  // If we have a current user, get the token directly
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken(forceRefresh);
      cachedToken = token;
      tokenExpiresAt = now + 55 * 60 * 1000;
      return token;
    } catch (err) {
      console.error("[apiClient] getIdToken() failed:", err);
      cachedToken = null;
      tokenExpiresAt = 0;
      return null;
    }
  }

  // If no current user, wait for auth state to resolve
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        cachedToken = null;
        tokenExpiresAt = 0;
        resolve(null);
        return;
      }
      try {
        const token = await user.getIdToken(forceRefresh);
        cachedToken = token;
        tokenExpiresAt = now + 55 * 60 * 1000;
        resolve(token);
      } catch (err) {
        console.error("[apiClient] getIdToken() failed:", err);
        cachedToken = null;
        tokenExpiresAt = 0;
        resolve(null);
      }
    });
  });
}

/**
 * Clears the cached token (call on logout)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

// ── Request Types ───────────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

// ── Main API Client Function ────────────────────────────────────────────────
export async function apiClient<TResponse = unknown, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, params, headers: customHeaders, skipAuth = false } = options;

  // Wait for Firebase auth to initialize
  await authReady;

  // Build URL with query parameters
  const url = new URL(`${import.meta.env.VITE_BACKEND_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Get auth token
  let token: string | null = null;
  if (!skipAuth) {
    token = await getToken();
    if (!token) {
      throw new ApiClientError(401, "Not authenticated — please sign in again.");
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make request
  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Handle errors
  if (!res.ok) {
    let detail: string;
    try {
      const errorBody = await res.json() as ApiError;
      detail = errorBody.detail || res.statusText;
    } catch {
      detail = await res.text().catch(() => res.statusText);
    }

    // If unauthorized, try refreshing the token once
    if (res.status === 401 && !skipAuth) {
      const newToken = await getToken(true);
      if (newToken) {
        // Retry the request with fresh token
        headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await fetch(url.toString(), {
          method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        if (retryRes.ok) {
          if (retryRes.status === 204) return {} as TResponse;
          return retryRes.json() as Promise<TResponse>;
        }
      }
    }

    throw new ApiClientError(res.status, detail);
  }

  // Handle successful responses
  if (res.status === 204) return {} as TResponse;

  return res.json() as Promise<TResponse>;
}

// ── Convenience Methods ─────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<T>(path, { method: "GET", params }),

  post: <T, B = unknown>(path: string, body?: B, params?: Record<string, string | number | boolean | undefined>) =>
    apiClient<T, B>(path, { method: "POST", body, params }),

  patch: <T, B = unknown>(path: string, body?: B) =>
    apiClient<T, B>(path, { method: "PATCH", body }),

  put: <T, B = unknown>(path: string, body?: B) =>
    apiClient<T, B>(path, { method: "PUT", body }),

  delete: <T>(path: string) =>
    apiClient<T>(path, { method: "DELETE" }),
};

export default apiClient;