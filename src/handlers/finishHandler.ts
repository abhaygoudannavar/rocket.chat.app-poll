import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { IPoll, PollStatus, migratePoll } from '../definition';
import { getPoll, updatePollStatus } from '../lib/poll/getPoll';
import { canFinishPoll } from '../lib/poll/validatePoll';
import { sendEphemeralError, sendEphemeralSuccess } from '../lib/utils/ephemeral';
import { createPollBlocks } from '../lib/ui/createPollBlocks';

/**
 * Handles finishing a poll
 */
export async function finishPollHandler({
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

    // Get poll
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

    // Validate permission
    const validation = canFinishPoll(poll, user.id);
    if (!validation.allowed) {
        if (room) {
            await sendEphemeralError(modify, room as IRoom, user, validation.reason || 'Cannot finish this poll');
        }
        return { success: false, message: validation.reason };
    }

    // Finish the poll
    poll = await updatePollStatus(poll, PollStatus.FINISHED, persistence);

    // Update the message
    const message = await modify.getUpdater().message(messageId, user);
    message.setEditor(message.getSender());

    const block = modify.getCreator().getBlockBuilder();
    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');
    createPollBlocks(block, poll.question, poll.options, poll, showNames.value);
    message.setBlocks(block);

    await modify.getUpdater().finish(message);

    if (room) {
        await sendEphemeralSuccess(modify, room as IRoom, user, 'Poll finished successfully!');
    }

    return { success: true };
}
