import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll, PollStatus, migratePoll } from '../../definition';
import { canVote, shouldAutoClose } from '../poll/validatePoll';
import { getPoll, updatePollStatus } from '../poll/getPoll';
import { sendEphemeralError } from '../utils/ephemeral';
import { createPollBlocks } from '../ui/createPollBlocks';
import { storeVote } from './storeVote';

/**
 * Handles a vote action on a poll
 */
export async function votePoll({
    data,
    read,
    persistence,
    modify
}: {
    data: IUIKitBlockIncomingInteraction;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
}): Promise<{ success: boolean; message?: string }> {
    if (!data.message) {
        return { success: false, message: 'No message found' };
    }

    const messageId = String(data.message.id);
    const user = data.user;
    const room = data.room;

    // Get and migrate poll to new format
    let poll: IPoll;
    try {
        const rawPoll = await getPoll(messageId, read);
        poll = migratePoll(rawPoll);
    } catch (e) {
        if (room) {
            await sendEphemeralError(modify, room as IRoom, user, 'Poll not found');
        }
        return { success: false, message: 'Poll not found' };
    }

    // Check for auto-close (expired)
    if (shouldAutoClose(poll)) {
        poll = await updatePollStatus(poll, PollStatus.EXPIRED, persistence);
        await updatePollMessage(poll, data, read, modify);

        if (room) {
            await sendEphemeralError(modify, room as IRoom, user, 'This poll has expired');
        }
        return { success: false, message: 'Poll expired' };
    }

    // Validate vote
    const validation = canVote(poll);
    if (!validation.allowed) {
        if (room) {
            await sendEphemeralError(modify, room as IRoom, user, validation.reason || 'Cannot vote on this poll');
        }
        return { success: false, message: validation.reason };
    }

    // Store the vote
    const voteIndex = parseInt(String(data.value), 10);
    await storeVote(poll, voteIndex, user, { persis: persistence });

    // Update the poll message
    await updatePollMessage(poll, data, read, modify);

    return { success: true };
}

/**
 * Updates the poll message with current state
 */
async function updatePollMessage(
    poll: IPoll,
    data: IUIKitBlockIncomingInteraction,
    read: IRead,
    modify: IModify
): Promise<void> {
    const message = await modify.getUpdater().message(data.message!.id as string, data.user);
    message.setEditor(message.getSender());

    const block = modify.getCreator().getBlockBuilder();
    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    createPollBlocks(block, poll.question, poll.options, poll, showNames.value);
    message.setBlocks(block);

    await modify.getUpdater().finish(message);
}
