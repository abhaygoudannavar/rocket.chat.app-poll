import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitBlockIncomingInteraction, IUIKitViewSubmitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { IPoll, migratePoll } from '../definition';
import { getPoll } from '../lib/poll/getPoll';
import { buildReadableSummary } from '../lib/export';
import { createExportModal } from '../lib/ui/createExportModal';

export async function openExportModal({
    data,
    read,
    modify,
    persistence
}: {
    data: IUIKitBlockIncomingInteraction;
    read: IRead;
    modify: IModify;
    persistence: IPersistence;
}): Promise<{ success: boolean; message?: string }> {
    if (!data.message?.id || !data.triggerId) {
        return { success: false, message: 'Missing data' };
    }

    const pollId = data.message.id;
    const roomId = data.room?.id || '';

    const modal = await createExportModal(pollId, roomId, modify, persistence);
    await modify.getUiController().openModalView(modal, { triggerId: data.triggerId }, data.user);

    return { success: true };
}

export async function handleExportSubmit({
    data,
    read,
    modify,
    persistence
}: {
    data: IUIKitViewSubmitIncomingInteraction;
    read: IRead;
    modify: IModify;
    persistence: IPersistence;
}): Promise<{ success: boolean; message?: string }> {
    const { view: { id }, user } = data;
    const { state }: { state?: any } = data.view;

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, id);
    const records = await read.getPersistenceReader().readByAssociation(association);

    if (!records || records.length === 0) {
        throw new Error('Export context not found');
    }

    const context = records[0] as { pollId: string; roomId: string };

    if (!context?.pollId) {
        throw new Error('Poll ID not found in context');
    }

    const exportConfig = state?.export || {};
    const destination = exportConfig.destination || 'dm';

    let poll: IPoll;
    try {
        const rawPoll = await getPoll(context.pollId, read);
        poll = migratePoll(rawPoll);
    } catch (e) {
        throw new Error('Poll not found');
    }

    const summary = await buildReadableSummary(poll, read);
    const messageText = `**📊 Poll Results Export**\n\n**Poll:** ${poll.question}\n\n\`\`\`\n${summary}\n\`\`\`\n\n_You can copy this text and save it as a .txt file_`;

    if (destination === 'dm') {
        const room = await read.getRoomReader().getById(context.roomId);
        if (room) {
            const msg = modify.getCreator().startMessage()
                .setRoom(room)
                .setText(messageText)
                .setSender(user);

            await modify.getNotifier().notifyUser(user, msg.getMessage());
        }
    } else {
        const room = await read.getRoomReader().getById(context.roomId);
        if (room) {
            const msg = modify.getCreator().startMessage()
                .setRoom(room)
                .setText(messageText);

            await modify.getCreator().finish(msg);
        }
    }

    return { success: true };
}

export async function exportPollHandler({
    pollId,
    user,
    room,
    read,
    modify
}: {
    pollId: string;
    user: IUser;
    room?: IRoom;
    read: IRead;
    modify: IModify;
}): Promise<{ success: boolean; message?: string }> {
    let poll: IPoll;
    try {
        const rawPoll = await getPoll(pollId, read);
        poll = migratePoll(rawPoll);
    } catch (e) {
        return { success: false, message: 'Poll not found' };
    }

    const summary = await buildReadableSummary(poll, read);
    const messageText = `**📊 Poll Results Export**\n\n**Poll:** ${poll.question}\n\n\`\`\`\n${summary}\n\`\`\`\n\n_Copy this text and save as poll-results.txt_`;

    if (room) {
        const msg = modify.getCreator().startMessage()
            .setRoom(room)
            .setText(messageText)
            .setSender(user);

        await modify.getNotifier().notifyUser(user, msg.getMessage());
    }

    return { success: true };
}

export async function exportButtonHandler({
    data,
    read,
    modify,
    persistence
}: {
    data: IUIKitBlockIncomingInteraction;
    read: IRead;
    modify: IModify;
    persistence: IPersistence;
}): Promise<{ success: boolean; message?: string }> {
    return openExportModal({ data, read, modify, persistence });
}
