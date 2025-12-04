import { IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import { IPoll, PollStatus, migratePoll } from '../../definition';

/**
 * Retrieves a poll by message ID
 */
export async function getPoll(msgId: string, read: IRead): Promise<IPoll> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, msgId);
    const polls = await read.getPersistenceReader().readByAssociation(association);

    if (!polls || polls.length < 1) {
        throw new Error('No poll found');
    }

    // Migrate to new format to ensure backward compatibility
    return migratePoll(polls[0]);
}

/**
 * Updates the poll status and persists it
 */
export async function updatePollStatus(
    poll: IPoll,
    status: PollStatus,
    persistence: IPersistence
): Promise<IPoll> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);

    poll.status = status;

    // Also set legacy field for backward compatibility
    if (status === PollStatus.FINISHED || status === PollStatus.EXPIRED) {
        poll.finished = true;
    }

    await persistence.updateByAssociation(association, poll);
    return poll;
}

/**
 * Updates the poll data and persists it
 */
export async function updatePoll(
    poll: IPoll,
    persistence: IPersistence
): Promise<IPoll> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);
    await persistence.updateByAssociation(association, poll);
    return poll;
}

/**
 * Saves a round to the poll's round history
 */
export async function saveRoundToHistory(
    poll: IPoll,
    persistence: IPersistence
): Promise<IPoll> {
    const currentRound = {
        roundNumber: poll.currentRound,
        question: poll.question,
        options: [...poll.options],
        votes: JSON.parse(JSON.stringify(poll.votes)), // Deep copy
        totalVotes: poll.totalVotes,
        startedAt: poll.createdAt,
        finishedAt: Date.now(),
    };

    poll.rounds.push(currentRound);

    return updatePoll(poll, persistence);
}

/**
 * Starts a new round, resetting votes
 */
export async function startNewRound(
    poll: IPoll,
    persistence: IPersistence
): Promise<IPoll> {
    // Save current round to history
    await saveRoundToHistory(poll, persistence);

    // Reset for new round
    poll.currentRound++;
    poll.totalVotes = 0;
    poll.votes = poll.options.map(() => ({ quantity: 0, voters: [] }));
    poll.createdAt = Date.now();

    // Recalculate expiry if duration was set
    if (poll.durationMinutes && poll.durationMinutes > 0) {
        poll.expiresAt = poll.createdAt + (poll.durationMinutes * 60 * 1000);
    }

    return updatePoll(poll, persistence);
}
