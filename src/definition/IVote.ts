import { IUser } from '@rocket.chat/apps-engine/definition/users';

/**
 * Voter information stored with each vote
 */
export type IVoterPerson = Pick<IUser, 'id' | 'username' | 'name'>;

/**
 * Vote data for a single option
 */
export interface IVoter {
    quantity: number;
    voters: Array<IVoterPerson>;
}
