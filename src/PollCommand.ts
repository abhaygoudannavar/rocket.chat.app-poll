import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { createPollModal } from './lib/ui/createPollModal';
import { exportPollHandler } from './handlers/exportHandler';

export class PollCommand implements ISlashCommand {
    public command = 'poll';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const triggerId = context.getTriggerId();
        const args = context.getArguments();
        const user = context.getSender();
        const room = context.getRoom();

        // Handle help subcommand: /poll help
        if (args[0] === 'help') {
            await this.sendHelpMessage(modify, room, user);
            return;
        }

        // Handle export subcommand: /poll export <poll-id>
        if (args[0] === 'export' && args[1]) {
            await exportPollHandler({
                pollId: args[1],
                user,
                room,
                read,
                modify,
            });
            return;
        }

        // Default: Open poll creation modal
        const data = {
            room: (room as any).value || room,
            threadId: context.getThreadId(),
        };

        const question = args.join(' ');

        if (triggerId) {
            const modal = await createPollModal({
                question,
                persistence: persis,
                modify,
                data
            });

            await modify.getUiController().openModalView(modal, { triggerId }, user);
        }
    }

    /**
     * Sends a help message explaining poll features
     */
    private async sendHelpMessage(modify: IModify, room: any, user: any): Promise<void> {
        const helpText = `**Poll App - Help**

**Commands:**
• \`/poll\` - Open the poll creation form
• \`/poll help\` - Show this help message
• \`/poll export <poll-id>\` - Export poll results to DM

**Creating a Poll:**
1. Type \`/poll\` to open the poll creation form
2. Enter your question and at least 2 options
3. Configure settings:
   - **Single/Multiple choice** - Allow one or many selections
   - **Anonymous** - Hide voter names
   - **Allow vote change** - Let users change their vote
   - **Show results** - Show results before poll ends
   - **Duration** - Auto-close after time (0 = no limit)

**Multi-Round Voting:**
Enable multi-round to run elimination-style polls:
- Set total rounds and options to keep per round
- Bottom options are eliminated each round
- Use "Next Round" button to advance

**Exporting Results:**
- Click "Export" button on any poll
- Or use \`/poll export <poll-id>\`
- Results are sent to your DM as CSV and JSON`;

        const msg = modify.getCreator().startMessage()
            .setRoom(room)
            .setText(helpText)
            .setUsernameAlias('Poll Help');

        await modify.getNotifier().notifyUser(user, msg.getMessage());
    }
}
