import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitViewSubmitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import {
    IModalContext,
    IPoll,
    PollStatus,
    VoteMode,
    createDefaultPoll
} from '../../definition';
import { createPollBlocks } from '../ui/createPollBlocks';

/**
 * Creates a new poll message from the modal submission
 */
export async function createPollMessage(
    data: IUIKitViewSubmitIncomingInteraction,
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    uid: string
): Promise<void> {
    const { view: { id } } = data;
    const { state }: { state?: any } = data.view;

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, id);
    const [record] = await read.getPersistenceReader().readByAssociation(association) as Array<IModalContext>;

    // Validate question
    if (!state?.poll?.question || state.poll.question.trim() === '') {
        throw { question: 'Please type your question here' };
    }

    if (!record.room) {
        throw new Error('Invalid room');
    }

    // Extract options
    const options = Object.entries<any>(state.poll || {})
        .filter(([key]) => key !== 'question' && key !== 'description')
        .map(([, option]) => option)
        .filter((option) => option && option.trim() !== '');

    // Validate options
    if (options.length < 2) {
        throw {
            'option-0': 'Please provide at least 2 options',
            'option-1': 'Please provide at least 2 options',
        };
    }

    // Extract configuration
    const config = state.config || {};
    const visibility = config.visibility || 'open';
    const mode = config.mode || 'single';
    const allowChange = config.allowChange || 'yes';

    // Extract multi-round settings
    const multiRound = state.multiRound || {};
    const totalRounds = parseInt(multiRound.totalRounds || '1', 10) || 1;

    // Get settings
    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    // Build the poll object
    const poll: IPoll = createDefaultPoll({
        question: state.poll.question,
        uid,
        options,
        totalVotes: 0,
        votes: options.map(() => ({ quantity: 0, voters: [] })),
        status: PollStatus.ACTIVE,
        voteMode: mode === 'multiple' ? VoteMode.MULTIPLE : VoteMode.SINGLE,
        isAnonymous: visibility === 'confidential',
        allowChangeVote: allowChange === 'yes',
        showResultsBeforeFinish: true,
        createdAt: Date.now(),
        currentRound: 1,
        totalRounds,
        rounds: [],
        roomId: typeof record.room === 'string' ? record.room : record.room.id,
        threadId: record.threadId,
        // Legacy fields
        singleChoice: mode === 'single',
        confidential: visibility === 'confidential',
        showResults: true,
    });

    // Get the room object
    const room = typeof record.room === 'string'
        ? await read.getRoomReader().getById(record.room)
        : record.room;

    if (!room) {
        throw new Error('Room not found');
    }

    // Build the message
    const builder = modify.getCreator().startMessage()
        .setUsernameAlias((showNames.value && data.user.name) || data.user.username)
        .setRoom(room)
        .setText(state.poll.question);

    if (record.threadId) {
        builder.setThreadId(record.threadId);
    }

    // Build poll blocks
    const block = modify.getCreator().getBlockBuilder();
    createPollBlocks(block, poll.question, options, poll, showNames.value);
    builder.setBlocks(block);

    // Create the message
    const messageId = await modify.getCreator().finish(builder);
    poll.msgId = messageId;

    // Persist the poll
    const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);
    await persistence.createWithAssociation(poll, pollAssociation);
}
