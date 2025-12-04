import { IVoterPerson } from './IVote';

/**
 * Export data structure for CSV/text export
 */
export interface IExportOption {
    option: string;
    votes: number;
    percentage: string;
    voters: IVoterPerson[];
}

/**
 * Complete export data for a poll
 */
export interface IExportData {
    pollId: string;
    question: string;
    description?: string;
    createdBy: string;
    createdAt: string;
    status: string;
    totalVotes: number;
    voteMode: string;
    isAnonymous: boolean;
    currentRound: number;
    totalRounds: number;
    options: IExportOption[];
}

/**
 * Generates CSV-like formatted text from export data
 */
export function formatExportAsCSV(data: IExportData): string {
    const lines: string[] = [];

    lines.push(`Poll Results: ${data.question}`);
    if (data.description) {
        lines.push(`Description: ${data.description}`);
    }
    lines.push(`Created by: @${data.createdBy}`);
    lines.push(`Created at: ${data.createdAt}`);
    lines.push(`Status: ${data.status}`);
    lines.push(`Total Votes: ${data.totalVotes}`);
    lines.push(`Vote Mode: ${data.voteMode}`);
    if (data.totalRounds > 1) {
        lines.push(`Round: ${data.currentRound} of ${data.totalRounds}`);
    }
    lines.push('');
    lines.push('Option,Votes,Percentage,Voters');

    for (const opt of data.options) {
        const voterNames = data.isAnonymous ? '' : opt.voters.map(v => `@${v.username}`).join(';');
        lines.push(`"${opt.option}",${opt.votes},${opt.percentage},"${voterNames}"`);
    }

    return lines.join('\n');
}

/**
 * Generates JSON formatted export
 */
export function formatExportAsJSON(data: IExportData): string {
    const exportObj = {
        poll: {
            id: data.pollId,
            question: data.question,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            status: data.status,
            settings: {
                voteMode: data.voteMode,
                anonymous: data.isAnonymous,
            },
            rounds: {
                current: data.currentRound,
                total: data.totalRounds,
            },
        },
        results: {
            totalVotes: data.totalVotes,
            options: data.options.map(opt => ({
                text: opt.option,
                votes: opt.votes,
                percentage: opt.percentage,
                voters: data.isAnonymous ? [] : opt.voters.map(v => ({
                    username: v.username,
                    name: v.name,
                })),
            })),
        },
    };

    return JSON.stringify(exportObj, null, 2);
}

