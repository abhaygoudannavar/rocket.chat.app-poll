import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

import { PollStatus, VoteMode } from './enums';
import { IRound } from './IRound';
import { IVoter } from './IVote';

export interface IPollSettings {
    anonymous: boolean;
    multipleChoice: boolean;
    allowChangeVote: boolean;
    showResultsBeforeClose: boolean;
    durationMinutes: number;
    multiRound: boolean;
    optionsToKeepPerRound: number;
}

export interface IPollOption {
    id: string;
    text: string;
    eliminated: boolean;
}

export interface IPoll {
    msgId: string;
    uid: string;
    question: string;
    description?: string;
    options: string[];
    pollOptions?: IPollOption[];
    totalVotes: number;
    votes: IVoter[];
    status: PollStatus;
    finished?: boolean;
    voteMode: VoteMode;
    singleChoice?: boolean;
    isAnonymous: boolean;
    confidential?: boolean;
    showResultsBeforeFinish: boolean;
    showResults?: boolean;
    allowChangeVote: boolean;
    createdAt: number;
    durationMinutes?: number;
    expiresAt?: number;
    currentRound: number;
    totalRounds: number;
    optionsToKeepPerRound?: number;
    rounds: IRound[];
    roomId: string;
    threadId?: string;
}

export interface IModalContext {
    threadId?: string;
    room?: IRoom | string;
}

export function createDefaultPoll(partial: Partial<IPoll>): IPoll {
    const now = Date.now();
    return {
        msgId: '',
        uid: '',
        question: '',
        options: [],
        totalVotes: 0,
        votes: [],
        status: PollStatus.ACTIVE,
        voteMode: VoteMode.MULTIPLE,
        isAnonymous: false,
        showResultsBeforeFinish: true,
        allowChangeVote: true,
        createdAt: now,
        currentRound: 1,
        totalRounds: 1,
        rounds: [],
        roomId: '',
        ...partial,
    };
}

export function migratePoll(poll: any): IPoll {
    return {
        ...poll,
        status: poll.status || (poll.finished ? PollStatus.FINISHED : PollStatus.ACTIVE),
        voteMode: poll.voteMode || (poll.singleChoice ? VoteMode.SINGLE : VoteMode.MULTIPLE),
        isAnonymous: poll.isAnonymous ?? poll.confidential ?? false,
        showResultsBeforeFinish: poll.showResultsBeforeFinish ?? poll.showResults ?? true,
        allowChangeVote: poll.allowChangeVote ?? true,
        createdAt: poll.createdAt || Date.now(),
        currentRound: poll.currentRound || 1,
        totalRounds: poll.totalRounds || 1,
        rounds: poll.rounds || [],
        roomId: poll.roomId || '',
    };
}
