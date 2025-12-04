import { IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { IPoll, PollStatus, VoteMode } from '../../definition';

export async function buildReadableSummary(
    poll: IPoll,
    read: IRead
): Promise<string> {
    const lines: string[] = [];
    const isAnonymous = poll.isAnonymous || poll.confidential;
    const isSingleChoice = poll.voteMode === VoteMode.SINGLE || poll.singleChoice;

    let creatorUsername = 'Unknown';
    try {
        const creator = await read.getUserReader().getById(poll.uid);
        creatorUsername = creator?.username || 'Unknown';
    } catch {
    }

    lines.push('═'.repeat(50));
    lines.push('POLL RESULTS');
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push(`Question: ${poll.question}`);
    if (poll.description) {
        lines.push(`Description: ${poll.description}`);
    }
    lines.push('');
    lines.push(`Created by: @${creatorUsername}`);
    lines.push(`Created at: ${formatDate(poll.createdAt)}`);
    lines.push(`Status: ${poll.status === PollStatus.ACTIVE ? 'Active' : 'Closed'}`);
    lines.push(`Total Votes: ${poll.totalVotes}`);
    lines.push(`Vote Mode: ${isSingleChoice ? 'Single choice' : 'Multiple choice'}`);
    lines.push(`Visibility: ${isAnonymous ? 'Confidential' : 'Open'}`);

    if (poll.totalRounds > 1) {
        lines.push(`Rounds: ${poll.currentRound} of ${poll.totalRounds}`);
    }

    lines.push('');
    lines.push('─'.repeat(50));
    lines.push('OPTIONS & RESULTS');
    lines.push('─'.repeat(50));
    lines.push('');

    poll.options.forEach((option, index) => {
        const vote = poll.votes[index];
        const voteCount = vote?.quantity || 0;
        const percentage = poll.totalVotes > 0
            ? ((voteCount / poll.totalVotes) * 100).toFixed(2)
            : '0.00';

        lines.push(`• ${option}`);
        lines.push(`  Votes: ${voteCount} (${percentage}%)`);

        if (!isAnonymous && vote?.voters && vote.voters.length > 0) {
            const voterNames = vote.voters.map(v => `@${v.username}`).join(', ');
            lines.push(`  Voters: ${voterNames}`);
        } else if (isAnonymous) {
            lines.push(`  Voters: hidden (anonymous poll)`);
        }

        lines.push('');
    });

    if (poll.rounds && poll.rounds.length > 0) {
        lines.push('─'.repeat(50));
        lines.push('ROUND HISTORY');
        lines.push('─'.repeat(50));
        lines.push('');

        poll.rounds.forEach((round) => {
            lines.push(`Round ${round.roundNumber}:`);
            lines.push(`  Total votes: ${round.totalVotes}`);
            if (round.finishedAt) {
                lines.push(`  Completed at: ${formatDate(round.finishedAt)}`);
            }
            lines.push('');
        });
    }

    lines.push('═'.repeat(50));
    lines.push(`Exported on: ${formatDate(Date.now())}`);
    lines.push('═'.repeat(50));

    return lines.join('\n');
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getExportFilename(pollId: string): string {
    return `poll-results-${pollId}.txt`;
}
