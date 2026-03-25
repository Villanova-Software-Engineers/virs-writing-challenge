/**
 * src/hooks/useApi.ts
 *
 * React Query hooks for all API endpoints
 * Provides typed, cached, and optimistic data fetching
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "../services/apiClient";
import type {
  StreakResponse,
  Semester,
  Message,
  MessageCreate,
  MessageResponse,
  LeaderboardResponse,
  UserProfile,
  UserProfileUpdate,
  UserStats,
  UserStatsHistory,
  WritingSessionCreate,
  WritingSession,
} from "../types/api.types";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const queryKeys = {
  // Streaks
  streak: ["streak"] as const,
  streakCurrent: ["streak", "current"] as const,

  // Semesters
  semesters: ["semesters"] as const,
  semesterActive: ["semesters", "active"] as const,
  semester: (id: number) => ["semesters", id] as const,

  // Messages
  messages: ["messages"] as const,
  messagesList: (limit?: number) => ["messages", "list", limit] as const,

  // Leaderboard
  leaderboard: ["leaderboard"] as const,
  leaderboardBySemester: (semesterId?: number) => ["leaderboard", semesterId] as const,

  // Profile
  profile: ["profile"] as const,
  profileStats: ["profile", "stats"] as const,
  profileHistory: ["profile", "history"] as const,

  // Sessions
  sessions: ["sessions"] as const,
} as const;

// ── Streak Hooks ────────────────────────────────────────────────────────────
export function useCurrentStreak(
  options?: Omit<UseQueryOptions<StreakResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.streakCurrent,
    queryFn: () => api.get<StreakResponse>("/api/streaks/current"),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useUpdateStreak(
  options?: UseMutationOptions<StreakResponse, Error>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<StreakResponse>("/api/streaks/update"),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.streakCurrent, data);
      // Invalidate leaderboard since streak changed
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
    ...options,
  });
}

// ── Semester Hooks ──────────────────────────────────────────────────────────
export function useActiveSemester(
  options?: Omit<UseQueryOptions<Semester | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.semesterActive,
    queryFn: async () => {
      try {
        return await api.get<Semester>("/api/semesters/active");
      } catch (error) {
        // Return null if no active semester
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useSemesters(
  options?: Omit<UseQueryOptions<Semester[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.semesters,
    queryFn: () => api.get<Semester[]>("/api/semesters"),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useJoinSemester() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ semesterId, accessCode }: { semesterId: number; accessCode: string }) =>
      api.post<Semester>(`/api/semesters/${semesterId}/join`, { access_code: accessCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

// ── Message Hooks ───────────────────────────────────────────────────────────
export function useMessages(
  limit = 50,
  options?: Omit<UseQueryOptions<MessageResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.messagesList(limit),
    queryFn: () => api.get<MessageResponse[]>("/api/messages", { limit }),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useCreateMessage(
  options?: UseMutationOptions<MessageResponse, Error, MessageCreate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MessageCreate) =>
      api.post<MessageResponse, MessageCreate>("/api/messages", data),
    onSuccess: (newMessage) => {
      // Optimistically add to cache for limit=50
      queryClient.setQueryData<MessageResponse[]>(
        queryKeys.messagesList(50),
        (old) => (old ? [newMessage, ...old] : [newMessage])
      );
      // Also add to limit=5 cache (Dashboard)
      queryClient.setQueryData<MessageResponse[]>(
        queryKeys.messagesList(5),
        (old) => {
          if (!old) return [newMessage];
          return [newMessage, ...old].slice(0, 5);
        }
      );
      // Also invalidate to ensure data persists on refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    onError: (error) => {
      console.error("[useCreateMessage] Failed to create message:", error);
    },
    ...options,
  });
}

// Message reactions (likes/dislikes) - needs backend endpoints
export function useLikeMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<MessageResponse>(`/api/messages/${messageId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
  });
}

export function useDislikeMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      api.post<MessageResponse>(`/api/messages/${messageId}/dislike`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      api.post<MessageResponse>(`/api/messages/${messageId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      api.patch<MessageResponse>(`/api/messages/${messageId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
  });
}

// ── Leaderboard Hooks ───────────────────────────────────────────────────────
export function useLeaderboard(
  semesterId?: number,
  options?: Omit<UseQueryOptions<LeaderboardResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.leaderboardBySemester(semesterId),
    queryFn: () => api.get<LeaderboardResponse>("/api/leaderboard", { semester_id: semesterId }),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// ── Profile Hooks ───────────────────────────────────────────────────────────
export function useProfile(
  options?: Omit<UseQueryOptions<UserProfile>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<UserProfile>("/api/profile"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useUpdateProfile(
  options?: UseMutationOptions<UserProfile, Error, UserProfileUpdate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserProfileUpdate) =>
      api.patch<UserProfile, UserProfileUpdate>("/api/profile", data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.profile, updatedProfile);
    },
    ...options,
  });
}

export function useProfileStats(
  options?: Omit<UseQueryOptions<UserStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.profileStats,
    queryFn: () => api.get<UserStats>("/api/profile/stats"),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useProfileHistory(
  options?: Omit<UseQueryOptions<UserStatsHistory>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.profileHistory,
    queryFn: () => api.get<UserStatsHistory>("/api/profile/history"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ── Writing Session Hooks ───────────────────────────────────────────────────
export interface WritingSessionsListResponse {
  sessions: WritingSession[];
  total_time: number;
}

export function useSaveSession(
  options?: UseMutationOptions<WritingSession, Error, WritingSessionCreate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WritingSessionCreate) =>
      api.post<WritingSession, WritingSessionCreate>("/api/sessions", data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
    ...options,
  });
}

export function useSessions(
  limit = 20,
  semesterId?: number,
  options?: Omit<UseQueryOptions<WritingSessionsListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.sessions, limit, semesterId],
    queryFn: () =>
      api.get<WritingSessionsListResponse>("/api/sessions", {
        limit,
        semester_id: semesterId,
      }),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useTodaySessions(
  options?: Omit<UseQueryOptions<WritingSessionsListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.sessions, "today"],
    queryFn: () => api.get<WritingSessionsListResponse>("/api/sessions/today"),
    staleTime: 30 * 1000,
    ...options,
  });
}
