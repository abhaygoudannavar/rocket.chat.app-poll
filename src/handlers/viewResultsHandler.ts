import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { IPoll, migratePoll } from '../definition';
import { getPoll } from '../lib/poll/getPoll';
import { createResultsModal } from '../lib/ui/createResultsModal';

export async function viewResultsHandler({
    data,
    read,
    modify
}: {
    data: IUIKitBlockIncomingInteraction;
    read: IRead;
    modify: IModify;
}): Promise<{ success: boolean; message?: string }> {
    if (!data.message || !data.triggerId) {
        return { success: false, message: 'Missing data' };
    }

    const messageId = String(data.message.id);
    const user = data.user;

    let poll: IPoll;
    try {
        const rawPoll = await getPoll(messageId, read);
        poll = migratePoll(rawPoll);
    } catch (e) {
        return { success: false, message: 'Poll not found' };
    }

    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    const modal = createResultsModal(poll, modify, showNames.value);
    await modify.getUiController().openModalView(modal, { triggerId: data.triggerId }, user);

    return { success: true };
}
