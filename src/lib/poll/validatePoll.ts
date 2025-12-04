import { IPoll, PollStatus } from '../../definition';
import { isExpired } from '../utils/time';

/**
 * Validation result for poll operations
 */
export interface IValidationResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Checks if a poll has expired based on its expiry time
 */
export function isPollExpired(poll: IPoll): boolean {
    return isExpired(poll.expiresAt);
}

/**
 * Checks if a poll is currently active and accepting votes
 */
export function isPollActive(poll: IPoll): boolean {
    return poll.status === PollStatus.ACTIVE && !poll.finished && !isPollExpired(poll);
}

/**
 * Validates if a user can vote on this poll
 */
export function canVote(poll: IPoll): IValidationResult {
    // Check if poll is finished
    if (poll.status === PollStatus.FINISHED || poll.finished) {
        return { allowed: false, reason: 'This poll has already ended' };
    }

    // Check if poll has expired
    if (isPollExpired(poll)) {
        return { allowed: false, reason: 'This poll has expired' };
    }

    return { allowed: true };
}

/**
 * Validates if a user can finish this poll
 */
export function canFinishPoll(poll: IPoll, userId: string): IValidationResult {
    // Check if user is the creator
    if (poll.uid !== userId) {
        return { allowed: false, reason: 'Only the poll creator can finish this poll' };
    }

    // Check if already finished
    if (poll.status === PollStatus.FINISHED || poll.finished) {
        return { allowed: false, reason: 'This poll is already finished' };
    }

    return { allowed: true };
}

/**
 * Validates if a user can start the next round
 */
export function canStartNextRound(poll: IPoll, userId: string): IValidationResult {
    // Check if user is the creator
    if (poll.uid !== userId) {
        return { allowed: false, reason: 'Only the poll creator can start the next round' };
    }

    // Check if there are more rounds
    if (poll.currentRound >= poll.totalRounds) {
        return { allowed: false, reason: 'All rounds have been completed' };
    }

    // Check if poll is active (current round should be active)
    if (poll.status !== PollStatus.ACTIVE) {
        return { allowed: false, reason: 'Cannot start next round when poll is not active' };
    }

    return { allowed: true };
}

/**
 * Validates if a user can export poll results
 */
export function canExportPoll(poll: IPoll): IValidationResult {
    // Anyone can export, but provide a warning if still active
    if (isPollActive(poll)) {
        return {
            allowed: true,
            reason: 'Note: Poll is still active, results may change'
        };
    }

    return { allowed: true };
}

/**
 * Checks if the poll should auto-close due to expiration
 * Returns true if the poll was expired and should be closed
 */
export function shouldAutoClose(poll: IPoll): boolean {
    return poll.status === PollStatus.ACTIVE && !poll.finished && isPollExpired(poll);
}

/**
 * Validates poll options before creation
 */
export function validatePollOptions(options: string[]): IValidationResult {
    const filteredOptions = options.filter(opt => opt && opt.trim() !== '');

    if (filteredOptions.length < 2) {
        return {
            allowed: false,
            reason: 'A poll must have at least 2 options'
        };
    }

    if (filteredOptions.length > 20) {
        return {
            allowed: false,
            reason: 'A poll cannot have more than 20 options'
        };
    }

    return { allowed: true };
}

/**
 * Validates poll duration
 */
export function validateDuration(minutes: number): IValidationResult {
    if (minutes < 0) {
        return { allowed: false, reason: 'Duration cannot be negative' };
    }

    if (minutes > 10080) { // 7 days
        return { allowed: false, reason: 'Duration cannot exceed 7 days' };
    }

    return { allowed: true };
}

/**
 * Validates total rounds
 */
export function validateRounds(rounds: number): IValidationResult {
    if (rounds < 1) {
        return { allowed: false, reason: 'Must have at least 1 round' };
    }

    if (rounds > 10) {
        return { allowed: false, reason: 'Cannot have more than 10 rounds' };
    }

    return { allowed: true };
}
