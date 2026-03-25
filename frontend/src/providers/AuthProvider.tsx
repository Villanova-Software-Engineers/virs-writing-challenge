/**
 * src/providers/AuthProvider.tsx
 *
 * Handles Firebase authentication state and syncs user profile with backend.
 * Triggers backend sync after each successful Firebase login to ensure
 * user data (name, email, admin status) is stored in PostgreSQL.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth, authReady } from "../firebase/config";
import { api } from "../services/apiClient";
import { queryKeys } from "../hooks/useApi";
import type { UserProfile } from "../types/api.types";

// ── Auth Context Types ───────────────────────────────────────────────────────
interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Auth Provider Component ──────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  /**
   * Syncs the user profile with the backend.
   * This triggers the backend to create/update the user record
   * with data from the Firebase token (name, email, admin claim).
   */
  const syncProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      // Fetching profile triggers backend to sync Firebase data
      const fetchedProfile = await api.get<UserProfile>("/api/profile");
      setProfile(fetchedProfile);

      // Update the query cache so useProfile() has fresh data
      queryClient.setQueryData(queryKeys.profile, fetchedProfile);
    } catch (error) {
      console.error("[AuthProvider] Failed to sync profile:", error);
      setProfile(null);
    }
  }, [user, queryClient]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      // Wait for Firebase to initialize
      await authReady;

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        // Only set user if email is verified (or if user is null for logout)
        // This prevents unverified users from being treated as authenticated
        if (firebaseUser && !firebaseUser.emailVerified) {
          // User exists but email not verified - treat as logged out
          setUser(null);
          setProfile(null);
          queryClient.removeQueries({ queryKey: queryKeys.profile });
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        setUser(firebaseUser);

        if (firebaseUser) {
          // User logged in with verified email - sync profile with backend
          try {
            const fetchedProfile = await api.get<UserProfile>("/api/profile");
            if (isMounted) {
              setProfile(fetchedProfile);
              queryClient.setQueryData(queryKeys.profile, fetchedProfile);
            }
          } catch (error) {
            console.error("[AuthProvider] Failed to fetch profile:", error);
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          // User logged out - clear profile
          setProfile(null);
          queryClient.removeQueries({ queryKey: queryKeys.profile });
        }

        if (isMounted) {
          setIsLoading(false);
        }
      });
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [queryClient]);

  const isAdmin = profile?.is_admin ?? false;

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAdmin,
    syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook to use Auth Context ─────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
