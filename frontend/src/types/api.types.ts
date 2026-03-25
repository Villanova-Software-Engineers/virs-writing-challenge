/**
 * API Types - Shared TypeScript interfaces for frontend-backend communication
 */

// ── Streak Types ────────────────────────────────────────────────────────────
export interface StreakResponse {
  count: number;
  last_date: string | null; // ISO date string YYYY-MM-DD
}

// ── Semester Types ──────────────────────────────────────────────────────────
export interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  access_code: string;
  is_active: boolean;
  created_at: string;
}

export interface SemesterCreate {
  name: string;
  start_date: string;
  end_date?: string;
  access_code: string;
}

export interface SemesterUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  access_code?: string;
  is_active?: boolean;
}

// ── Message Types ───────────────────────────────────────────────────────────
export type MessageCategory = 'win' | 'gain';

export interface Message {
  id: string;
  content: string;
  category: MessageCategory;
  author_name: string;
  author_department: string;
  author_is_admin: boolean;
  author_uid: string;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  likes: string[];
  comments: Comment[];
}

export interface MessageCreate {
  content: string;
  category: MessageCategory;
}

export interface MessageResponse {
  id: string;
  content: string;
  category: MessageCategory;
  author_name: string;
  author_department: string;
  author_is_admin: boolean;
  author_uid: string;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  author_uid: string;
  author_name: string;
  author_department: string;
  author_is_admin: boolean;
  content: string;
  created_at: string;
}

export interface CommentCreate {
  content: string;
}

// ── Leaderboard Types ───────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  user_uid: string;
  user_name: string;
  total_time: number; // in seconds
  streak: number;
  active_days: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  semester_id: number;
  semester_name: string;
}

// ── Profile Types ───────────────────────────────────────────────────────────
export interface SemesterInfo {
  id: number;
  name: string;
  access_code: string;
  is_active: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  is_admin: boolean;
  current_semester: SemesterInfo | null;
  created_at: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  department?: string;
}

export interface UserStats {
  total_time: number; // in seconds
  current_streak: number;
  longest_streak: number;
  active_days: number;
  semester_id: number;
  semester_name: string;
}

export interface UserStatsHistory {
  semesters: SemesterStats[];
}

export interface SemesterStats {
  semester_id: number;
  semester_name: string;
  total_time: number;
  longest_streak: number;
  active_days: number;
}

// ── Writing Session Types ───────────────────────────────────────────────────
export interface WritingSession {
  id: string;
  user_uid: string;
  duration: number; // in seconds
  description?: string;
  started_at: string;
  ended_at: string;
  semester_id: number;
}

export interface WritingSessionCreate {
  duration: number;
  started_at: string;
  ended_at: string;
  description?: string;
}

// ── Health Check ────────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  timestamp: string;
}

// ── API Error Response ──────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
  status_code?: number;
}
