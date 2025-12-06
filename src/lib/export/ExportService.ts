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

    const sortedOptions = poll.options
        .map((option, index) => ({
            option,
            index,
            votes: poll.votes[index]?.quantity || 0,
        }))
        .sort((a, b) => b.votes - a.votes);

    const winner = sortedOptions[0];
    const hasWinner = poll.status !== PollStatus.ACTIVE && poll.totalVotes > 0;

    lines.push('╔' + '═'.repeat(48) + '╗');
    lines.push('║' + '          📊 POLL RESULTS EXPORT          '.padEnd(48) + '║');
    lines.push('╚' + '═'.repeat(48) + '╝');
    lines.push('');

    if (hasWinner) {
        lines.push('🏆 WINNER: ' + winner.option);
        lines.push('   ' + winner.votes + ' votes (' + ((winner.votes / poll.totalVotes) * 100).toFixed(1) + '%)');
        lines.push('');
        lines.push('─'.repeat(50));
        lines.push('');
    }

    lines.push('📋 POLL INFORMATION');
    lines.push('─'.repeat(50));
    lines.push('');
    lines.push('  Question:    ' + poll.question);
    if (poll.description) {
        lines.push('  Description: ' + poll.description);
    }
    lines.push('');
    lines.push('  Created by:  @' + creatorUsername);
    lines.push('  Created at:  ' + formatDate(poll.createdAt));
    lines.push('  Status:      ' + (poll.status === PollStatus.ACTIVE ? '🟢 Active' : '🔴 Closed'));
    lines.push('  Total Votes: ' + poll.totalVotes);
    lines.push('  Vote Mode:   ' + (isSingleChoice ? 'Single choice' : 'Multiple choice'));
    lines.push('  Visibility:  ' + (isAnonymous ? '🔒 Confidential' : '👁️ Open'));

    if (poll.totalRounds > 1) {
        lines.push('  Rounds:      ' + poll.currentRound + ' of ' + poll.totalRounds);
    }

    lines.push('');
    lines.push('📈 OPTIONS & RESULTS (Ranked)');
    lines.push('─'.repeat(50));
    lines.push('');

    sortedOptions.forEach((item, rank) => {
        const vote = poll.votes[item.index];
        const percentage = poll.totalVotes > 0
            ? ((item.votes / poll.totalVotes) * 100).toFixed(1)
            : '0.0';

        const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '  ';
        const bar = buildTextBar(parseFloat(percentage));

        lines.push(medal + ' #' + (rank + 1) + ' ' + item.option);
        lines.push('     ' + bar + ' ' + percentage + '%');
        lines.push('     ' + item.votes + ' vote' + (item.votes !== 1 ? 's' : ''));

        if (!isAnonymous && vote?.voters && vote.voters.length > 0) {
            const voterNames = vote.voters.slice(0, 5).map(v => '@' + v.username).join(', ');
            const more = vote.voters.length > 5 ? ' +' + (vote.voters.length - 5) + ' more' : '';
            lines.push('     Voters: ' + voterNames + more);
        } else if (isAnonymous) {
            lines.push('     Voters: (hidden - anonymous poll)');
        }

        lines.push('');
    });

    if (poll.rounds && poll.rounds.length > 0) {
        lines.push('🔄 ROUND HISTORY');
        lines.push('─'.repeat(50));
        lines.push('');

        poll.rounds.forEach((round) => {
            lines.push('  Round ' + round.roundNumber + ':');
            lines.push('    • Total votes: ' + round.totalVotes);
            if (round.eliminatedOptions && round.eliminatedOptions.length > 0) {
                lines.push('    • Eliminated: ' + round.eliminatedOptions.join(', '));
            }
            if (round.finishedAt) {
                lines.push('    • Completed: ' + formatDate(round.finishedAt));
            }
            lines.push('');
        });
    }

    lines.push('─'.repeat(50));
    lines.push('📅 Exported on: ' + formatDate(Date.now()));
    lines.push('─'.repeat(50));

    return lines.join('\n');
}

function buildTextBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getExportFilename(pollId: string): string {
    return `poll-results-${pollId}.txt`;
}
