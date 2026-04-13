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
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { api } from "../services/apiClient";
import type {
  StreakResponse,
  Semester,
  Message,
  MessageCreate,
  MessageResponse,
  MessageListResponse,
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

  // Admin
  admin: ["admin"] as const,
  adminUsers: ["admin", "users"] as const,
  adminArchivedMessages: (semesterId: number) => ["admin", "messages", "archived", semesterId] as const,
  adminArchivedLeaderboard: (semesterId: number) => ["admin", "leaderboard", "archived", semesterId] as const,
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
      // Invalidate all semester-dependent queries when joining a new semester
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
  });
}

// ── Message Hooks ───────────────────────────────────────────────────────────
export function useInfiniteMessages(
  limit = 20,
  options?: Omit<UseInfiniteQueryOptions<MessageListResponse>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam">
) {
  return useInfiniteQuery({
    queryKey: ["messages", "infinite", limit],
    queryFn: ({ pageParam }) =>
      api.get<MessageListResponse>("/api/messages", {
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    initialPageParam: undefined,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useCreateMessage(
  options?: UseMutationOptions<MessageResponse, Error, MessageCreate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MessageCreate) => {
      return api.post<MessageResponse, MessageCreate>("/api/messages", data);
    },
    onSuccess: (newMessage) => {

      // Update all infinite query caches - add to first page
      queryClient.setQueriesData<{ pages: MessageListResponse[]; pageParams: unknown[] }>(
        { queryKey: ["messages", "infinite"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0
                ? { ...page, messages: [newMessage, ...page.messages] }
                : page
            ),
          };
        }
      );

      // Invalidate to ensure fresh data on refresh
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => {
      console.error("[useCreateMessage] onError called with error:", error);
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

// Dislike functionality removed

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
    staleTime: 0, // Always refetch to ensure fresh data on page load
    ...options,
  });
}

// ── Session State Hooks ─────────────────────────────────────────────────────
export interface SessionState {
  id: number;
  user_id: number;
  accumulated_seconds: number;
  description: string | null;
  is_running: boolean;
  session_start_time: string | null;
  last_pause_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionStateUpdate {
  accumulated_seconds?: number;
  description?: string;
  is_running?: boolean;
  session_start_time?: string | null;
  last_pause_time?: string | null;
}

export function useSessionState(
  options?: Omit<UseQueryOptions<SessionState>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.sessions, "state"],
    queryFn: () => api.get<SessionState>("/api/sessions/state"),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useUpdateSessionState(
  options?: UseMutationOptions<SessionState, Error, SessionStateUpdate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SessionStateUpdate) =>
      api.patch<SessionState, SessionStateUpdate>("/api/sessions/state", data),
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.sessions, "state"], data);
    },
    ...options,
  });
}

export function useResetSessionState(
  options?: UseMutationOptions<SessionState, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<SessionState>("/api/sessions/state/reset"),
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.sessions, "state"], data);
    },
    ...options,
  });
}

// ── Admin Hooks (Admin only) ────────────────────────────────────────────────

// Admin - Create Semester
interface SemesterCreateData {
  name: string;
  start_date: string;
  end_date: string;
  auto_clear?: boolean;
}

export function useCreateSemester(
  options?: UseMutationOptions<Semester, Error, SemesterCreateData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SemesterCreateData) =>
      api.post<Semester, SemesterCreateData>("/api/semesters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
    },
    ...options,
  });
}

// Admin - Update Semester
export function useUpdateSemester(
  options?: UseMutationOptions<Semester, Error, { semesterId: number; name?: string; access_code?: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ semesterId, ...data }) =>
      api.patch<Semester>(`/api/semesters/${semesterId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
    },
    ...options,
  });
}

// Admin - End Semester
export function useEndSemester(
  options?: UseMutationOptions<Semester, Error, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (semesterId: number) =>
      api.patch<Semester>(`/api/semesters/${semesterId}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
    },
    ...options,
  });
}

// Admin - Delete Semester
export function useDeleteSemester(
  options?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (semesterId: number) =>
      api.delete<void>(`/api/semesters/${semesterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters });
      queryClient.invalidateQueries({ queryKey: queryKeys.semesterActive });
    },
    ...options,
  });
}

// Admin - Archived Messages by Semester
export function useArchivedMessages(
  semesterId: number | null,
  options?: Omit<UseQueryOptions<MessageListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.adminArchivedMessages(semesterId ?? 0),
    queryFn: () =>
      api.get<MessageListResponse>("/api/admin/messages/archived", {
        semester_id: semesterId!,
        limit: 100,
      }),
    enabled: !!semesterId,
    staleTime: 60 * 1000,
    ...options,
  });
}

// Admin - Archived Leaderboard by Semester
export function useArchivedLeaderboard(
  semesterId: number | null,
  options?: Omit<UseQueryOptions<LeaderboardResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.adminArchivedLeaderboard(semesterId ?? 0),
    queryFn: () =>
      api.get<LeaderboardResponse>("/api/admin/leaderboard/archived", {
        semester_id: semesterId!,
        limit: 100,
      }),
    enabled: !!semesterId,
    staleTime: 60 * 1000,
    ...options,
  });
}

// Admin - User Management
interface AdminUserListResponse {
  users: Array<{
    id: number;
    uid: string;
    email: string;
    first_name: string;
    last_name: string;
    department: string;
    is_admin: boolean;
    created_at: string | null;
  }>;
  total: number;
}

export function useAdminUsers(
  limit = 50,
  offset = 0,
  options?: Omit<UseQueryOptions<AdminUserListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...queryKeys.adminUsers, limit, offset],
    queryFn: () => api.get<AdminUserListResponse>("/api/admin/users", { limit, offset }),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useSetUserAdmin(
  options?: UseMutationOptions<any, Error, { userId: number; isAdmin: boolean }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isAdmin }) =>
      api.patch(`/api/admin/users/${userId}/admin`, { is_admin: isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    ...options,
  });
}

export function useUpdateUser(
  options?: UseMutationOptions<any, Error, { userId: number; firstName: string; lastName: string; department: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, firstName, lastName, department }) =>
      api.patch(`/api/admin/users/${userId}`, { first_name: firstName, last_name: lastName, department }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    ...options,
  });
}

export function useDeleteUser(
  options?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      api.delete<void>(`/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
    ...options,
  });
}

// Admin - Sessions
interface AdminSessionsListResponse {
  sessions: Array<{
    id: number;
    user_uid: string;
    user_name: string;
    duration: number;
    description?: string;
    started_at: string;
    ended_at: string;
    semester_id?: number;
    created_at: string;
  }>;
  total_time: number;
}

export function useAdminSessions(
  limit = 100,
  semesterId?: number,
  userId?: number,
  options?: Omit<UseQueryOptions<AdminSessionsListResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["admin", "sessions", limit, semesterId, userId],
    queryFn: () => api.get<AdminSessionsListResponse>("/api/admin/sessions", {
      limit,
      semester_id: semesterId,
      user_id: userId
    }),
    staleTime: 30 * 1000,
    ...options,
  });
}

// Admin - Message Management
export function useAdminUpdateMessage(
  options?: UseMutationOptions<any, Error, { messageId: string; content: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }) =>
      api.patch(`/api/admin/messages/${messageId}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    ...options,
  });
}

export function useAdminDeleteMessage(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete<void>(`/api/admin/messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    ...options,
  });
}

export function usePinMessage(
  options?: UseMutationOptions<any, Error, { messageId: string; isPinned: boolean }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, isPinned }) =>
      api.patch(`/api/admin/messages/${messageId}/pin`, { is_pinned: isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    ...options,
  });
}

export function useAdminDeleteComment(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete<void>(`/api/admin/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    ...options,
  });
}

// Admin - Session Management
export interface AdminSessionCreate {
  user_id: number;
  duration: number;
  started_at: string;
  ended_at: string;
  description?: string;
}

export interface AdminSessionUpdate {
  duration?: number;
  description?: string;
  started_at?: string;
  ended_at?: string;
}

export function useAdminCreateSession(
  options?: UseMutationOptions<WritingSession, Error, AdminSessionCreate>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminSessionCreate) =>
      api.post<WritingSession, AdminSessionCreate>("/api/admin/sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
    ...options,
  });
}

export function useAdminUpdateSession(
  options?: UseMutationOptions<WritingSession, Error, { sessionId: number; data: AdminSessionUpdate }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }) =>
      api.patch<WritingSession, AdminSessionUpdate>(`/api/admin/sessions/${sessionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
    ...options,
  });
}

export function useAdminDeleteSession(
  options?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) =>
      api.delete<void>(`/api/admin/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
    },
    ...options,
  });
}
