import { IVoter } from './IVote';

/**
 * Represents a single round in a multi-round poll
 */
export interface IRound {
    /** Round number (1-indexed) */
    roundNumber: number;

    /** Question for this round (can differ per round) */
    question: string;

    /** Options available in this round */
    options: string[];

    /** Votes per option */
    votes: IVoter[];

    /** Total votes in this round */
    totalVotes: number;

    /** Unix timestamp when round started */
    startedAt: number;

    /** Unix timestamp when round finished (undefined if active) */
    finishedAt?: number;

    /** Options eliminated in this round */
    eliminatedOptions?: string[];
}
