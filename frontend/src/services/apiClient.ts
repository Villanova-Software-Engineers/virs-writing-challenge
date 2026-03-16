/**
 * src/services/apiClient.ts
 *
 * Waits for Firebase auth to fully restore before grabbing the ID token,
 * solving the race condition where auth.currentUser is null on first load.
 */

import { onAuthStateChanged } from "firebase/auth";
import { auth, authReady } from "../firebase/config";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * Waits for Firebase to restore auth state, then returns the ID token.
 * Resolves to null if no user is signed in.
 */
function waitForToken(): Promise<string | null> {
  return new Promise((resolve) => {
    // onAuthStateChanged fires immediately with the current user
    // (or null) once Firebase has restored the session.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // only need it once
      if (!user) {
        console.warn("[apiClient] No authenticated user — request will fail with 401");
        resolve(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        resolve(token);
      } catch (err) {
        console.error("[apiClient] getIdToken() failed:", err);
        resolve(null);
      }
    });
  });
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function apiClient<T = unknown>(
  path: string,
  options: {
    method?: Method;
    body?: unknown;
    params?: Record<string, string | number>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  // Ensure Firebase persistence is set before we try to read the user
  await authReady;

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }

  const token = await waitForToken();

  if (!token) {
    throw new Error("Not authenticated — please sign in again.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    console.error(`[apiClient] ${method} ${path} → ${res.status}:`, detail);
    throw new Error(`${res.status}: ${detail}`);
  }

  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}