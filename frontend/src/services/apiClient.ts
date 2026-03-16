/**
 * src/services/apiClient.ts
 *
 * Central fetch wrapper for all FastAPI calls.
 * - Automatically attaches the Firebase ID token as a Bearer header.
 * - Reads the backend URL from VITE_API_URL in your .env
 *   e.g.  VITE_API_URL=http://localhost:8000
 */

import { auth } from "../firebase/config"; // ← points to your existing firebase/config.ts

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
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

  // Build query string if params provided
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${detail}`);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}