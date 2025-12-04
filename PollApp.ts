import {
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import {
    IUIKitInteractionHandler,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';

import { createPollMessage } from './src/lib/poll/createPollMessage';
import { createPollModal } from './src/lib/ui/createPollModal';
import { votePoll } from './src/lib/voting/votePoll';
import { finishPollHandler } from './src/handlers/finishHandler';
import { nextRoundHandler } from './src/handlers/nextRoundHandler';
import { exportButtonHandler } from './src/handlers/exportHandler';
import { PollCommand } from './src/PollCommand';

export class PollApp extends App implements IUIKitInteractionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    /**
     * Handles modal form submissions (poll creation)
     */
    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();

        const { state }: {
            state?: {
                poll?: {
                    question?: string;
                    description?: string;
                    [option: string]: string | undefined;
                };
                config?: {
                    mode?: string;
                    visibility?: string;
                    showResults?: string;
                };
                advanced?: {
                    duration?: string;
                    totalRounds?: string;
                };
            };
        } = data.view as any;

        if (!state) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: {
                    question: 'Error creating poll',
                },
            });
        }

        // Check if this is an export modal submission
        if (data.view.id.startsWith('export-')) {
            try {
                const { handleExportSubmit } = await import('./src/handlers/exportHandler');
                await handleExportSubmit({ data, read, modify, persistence });
                return { success: true };
            } catch (err) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId: data.view.id,
                    errors: { destination: 'Export failed' },
                });
            }
        }

        try {
            await createPollMessage(data, read, modify, persistence, data.user.id);
        } catch (err) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: err,
            });
        }

        return {
            success: true,
        };
    }

    /**
     * Handles block interactions (votes, buttons, menu actions)
     */
    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();
        const { actionId, value } = data;

        switch (actionId) {
            // Vote on a poll option
            case 'vote': {
                await votePoll({ data, read, persistence, modify });
                return { success: true };
            }

            // Open the poll creation modal
            case 'create': {
                const modal = await createPollModal({ data, persistence, modify });
                return context.getInteractionResponder().openModalViewResponse(modal);
            }

            // Add a new choice in the modal
            case 'addChoice': {
                const modal = await createPollModal({
                    id: data.container.id,
                    data,
                    persistence,
                    modify,
                    options: parseInt(String(value), 10)
                });
                return context.getInteractionResponder().updateModalViewResponse(modal);
            }

            // Finish the poll
            case 'finish': {
                await finishPollHandler({ data, read, persistence, modify });
                return { success: true };
            }

            // Start next round
            case 'nextRound': {
                await nextRoundHandler({ data, read, persistence, modify });
                return { success: true };
            }

            // Export poll results
            case 'export': {
                await exportButtonHandler({ data, read, modify, persistence });
                return { success: true };
            }

            // Poll overflow menu actions
            case 'pollMenu': {
                if (value === 'finish') {
                    await finishPollHandler({ data, read, persistence, modify });
                } else if (value === 'export') {
                    await exportButtonHandler({ data, read, modify, persistence });
                }
                return { success: true };
            }
        }

        return {
            success: true,
            triggerId: data.triggerId,
        };
    }

    /**
     * Initialize app settings and slash commands
     */
    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        // Register slash command
        await configuration.slashCommands.provideSlashCommand(new PollCommand());

        // App settings
        await configuration.settings.provideSetting({
            id: 'use-user-name',
            i18nLabel: 'Use name attribute to display voters, instead of username',
            i18nDescription: 'When checked, display voters as full user names instead of username',
            required: false,
            type: SettingType.BOOLEAN,
            public: true,
            packageValue: false,
        });

        await configuration.settings.provideSetting({
            id: 'default-duration',
            i18nLabel: 'Default poll duration (minutes)',
            i18nDescription: 'Default duration for new polls in minutes. 0 means no limit.',
            required: false,
            type: SettingType.NUMBER,
            public: true,
            packageValue: 0,
        });

        await configuration.settings.provideSetting({
            id: 'max-options',
            i18nLabel: 'Maximum poll options',
            i18nDescription: 'Maximum number of options allowed per poll',
            required: false,
            type: SettingType.NUMBER,
            public: true,
            packageValue: 20,
        });
    }
}
