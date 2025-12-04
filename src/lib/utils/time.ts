/**
 * Time utility functions for poll duration
 */

/**
 * Calculates expiry timestamp from creation time and duration
 */
export function calculateExpiryTime(createdAt: number, durationMinutes: number): number {
    return createdAt + (durationMinutes * 60 * 1000);
}

/**
 * Checks if a timestamp has passed
 */
export function isExpired(expiresAt: number | undefined): boolean {
    if (!expiresAt) return false;
    return Date.now() > expiresAt;
}

/**
 * Gets remaining time in milliseconds
 */
export function getTimeRemaining(expiresAt: number | undefined): number {
    if (!expiresAt) return Infinity;
    return Math.max(0, expiresAt - Date.now());
}

/**
 * Formats remaining time into a human-readable string
 */
export function formatTimeRemaining(expiresAt: number | undefined): string {
    if (!expiresAt) return 'No time limit';

    const diff = expiresAt - Date.now();
    if (diff <= 0) return '⏱️ Expired';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `⏱️ ${days}d ${hours % 24}h remaining`;
    }
    if (hours > 0) {
        return `⏱️ ${hours}h ${minutes % 60}m remaining`;
    }
    if (minutes > 0) {
        return `⏱️ ${minutes}m ${seconds % 60}s remaining`;
    }
    return `⏱️ ${seconds}s remaining`;
}

/**
 * Formats a Unix timestamp to a human-readable date string
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toUTCString();
}

/**
 * Formats a duration in minutes to a readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes === 0) return 'No limit';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
}
