/**
 * Polling modes for how users can choose options
 */
export enum VoteMode {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}

/**
 * Status states for a poll
 */
export enum PollStatus {
    ACTIVE = 'active',
    FINISHED = 'finished',
    EXPIRED = 'expired',
}

/**
 * Available poll templates
 */
export enum PollTemplate {
    CUSTOM = 'custom',
    YES_NO = 'yes_no',
    RATING_5 = 'rating_5',
    RATING_10 = 'rating_10',
    AGREEMENT = 'agreement',
}
