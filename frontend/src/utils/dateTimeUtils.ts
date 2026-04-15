/**
 * Date and Time Utility Functions
 * Centralized formatting utilities to avoid duplication across components
 */

/**
 * Format seconds into a short duration string (e.g., "2h 15m")
 * @param seconds - Total seconds
 * @returns Formatted string like "2h 15m" or "15m"
 */
export function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

/**
 * Format seconds into a full duration string (e.g., "2h 15m 30s")
 * @param seconds - Total seconds
 * @returns Formatted string like "2h 15m 30s" or "15m 30s"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Format seconds into detailed duration object
 * @param seconds - Total seconds
 * @returns Object with hours, minutes, seconds
 */
export function formatDurationDetailed(seconds: number): { hours: number; minutes: number; seconds: number } {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { hours, minutes, seconds: secs };
}

/**
 * Format seconds into HH:MM:SS format (e.g., "02:15:30")
 * @param seconds - Total seconds
 * @returns Formatted string like "02:15:30"
 */
export function formatTimeDigital(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format ISO date string to readable time (e.g., "2:30 PM")
 * @param isoString - ISO date string
 * @returns Formatted time string
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format ISO date string to readable date (e.g., "Jan 15, 2024")
 * @param isoString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format ISO date string to full date and time (e.g., "Jan 15, 2024 at 2:30 PM")
 * @param isoString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate relative time ago (e.g., "5m ago", "2h ago", "3d ago")
 * @param isoString - ISO date string
 * @returns Relative time string
 */
export function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Calculate relative time without "ago" suffix (e.g., "5m", "2h", "3d")
 * Used for compact displays
 * @param isoString - ISO date string
 * @returns Relative time string without "ago"
 */
export function timeAgoShort(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/**
 * Calculate duration between two dates in seconds
 * @param start - Start date
 * @param end - End date
 * @returns Duration in seconds, or 0 if inputs are invalid
 */
export function calculateDuration(start: Date | string | null | undefined, end: Date | string | null | undefined): number {
  if (!start || !end) return 0;

  const startTime = typeof start === 'string' ? new Date(start) : start;
  const endTime = typeof end === 'string' ? new Date(end) : end;

  // Check for invalid dates
  if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
}
