/**
 * src/providers/QueryProvider.tsx
 *
 * React Query provider with optimized default configuration
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ApiClientError } from "../services/apiClient";

// ── Query Client Configuration ──────────────────────────────────────────────
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long data is considered fresh
        staleTime: 30 * 1000, // 30 seconds default

        // Cache time: How long inactive data stays in cache
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof ApiClientError) {
            if (error.status >= 400 && error.status < 500) {
              return false;
            }
          }
          // Retry up to 2 times on other errors
          return failureCount < 2;
        },

        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error) => {
          if (error instanceof ApiClientError && error.isServerError) {
            return failureCount < 1;
          }
          return false;
        },
      },
    },
  });
}

// ── Provider Component ──────────────────────────────────────────────────────
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient in state to ensure it's not recreated on re-renders
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
