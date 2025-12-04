import { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll, VoteMode, IVoterPerson } from '../../definition';

export interface IVoteResult {
    success: boolean;
    action: 'added' | 'removed' | 'switched' | 'blocked';
    message?: string;
    previousOption?: number;
}

export function hasUserVoted(poll: IPoll, userId: string): boolean {
    return poll.votes.some(({ voters }) =>
        voters.some(voter => voter.id === userId)
    );
}

export function getUserVoteIndex(poll: IPoll, userId: string): number {
    return poll.votes.findIndex(({ voters }) =>
        voters.some(voter => voter.id === userId)
    );
}

export async function storeVote(
    poll: IPoll,
    voteIndex: number,
    user: IUser,
    { persis }: { persis: IPersistence }
): Promise<IVoteResult> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);

    const voter: IVoterPerson = {
        id: user.id,
        username: user.username,
        name: user.name
    };

    const findVoter = ({ id: voterId }: IVoterPerson) => voterId === user.id;
    const filterVoter = ({ id: voterId }: IVoterPerson) => voterId !== user.id;

    const hasVotedOnThisIndex = poll.votes[voteIndex].voters.findIndex(findVoter);
    const hasVotedOnThis = hasVotedOnThisIndex !== -1;
    const previousVoteIndex = getUserVoteIndex(poll, user.id);
    const hasVotedBefore = previousVoteIndex !== -1;

    const isSingleChoice = poll.voteMode === VoteMode.SINGLE || poll.singleChoice;
    const allowChange = poll.allowChangeVote !== false;

    let action: 'added' | 'removed' | 'switched' | 'blocked' = 'added';
    let previousOption: number | undefined;
    let message: string | undefined;

    if (isSingleChoice) {
        if (hasVotedOnThis) {
            poll.totalVotes--;
            poll.votes[voteIndex].quantity--;
            poll.votes[voteIndex].voters.splice(hasVotedOnThisIndex, 1);
            action = 'removed';
            message = 'Vote removed';
        } else if (hasVotedBefore) {
            if (!allowChange) {
                return {
                    success: false,
                    action: 'blocked',
                    message: 'You already voted. Changing vote is not allowed.'
                };
            }
            poll.votes[previousVoteIndex].quantity--;
            poll.votes[previousVoteIndex].voters = poll.votes[previousVoteIndex].voters.filter(filterVoter);
            poll.votes[voteIndex].quantity++;
            poll.votes[voteIndex].voters.push(voter);
            action = 'switched';
            previousOption = previousVoteIndex;
            message = 'Vote changed';
        } else {
            poll.totalVotes++;
            poll.votes[voteIndex].quantity++;
            poll.votes[voteIndex].voters.push(voter);
            action = 'added';
            message = 'Vote recorded';
        }
    } else {
        if (hasVotedOnThis) {
            if (!allowChange && hasVotedBefore) {
                return {
                    success: false,
                    action: 'blocked',
                    message: 'Changing vote is not allowed.'
                };
            }
            poll.totalVotes--;
            poll.votes[voteIndex].quantity--;
            poll.votes[voteIndex].voters.splice(hasVotedOnThisIndex, 1);
            action = 'removed';
            message = 'Vote removed';
        } else {
            poll.totalVotes++;
            poll.votes[voteIndex].quantity++;
            poll.votes[voteIndex].voters.push(voter);
            action = 'added';
            message = 'Vote added';
        }
    }

    await persis.updateByAssociation(association, poll);

    return {
        success: true,
        action,
        previousOption,
        message
    };
}
