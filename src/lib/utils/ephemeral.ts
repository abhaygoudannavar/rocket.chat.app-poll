import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

/**
 * Sends an ephemeral error message to a user
 * This message is only visible to the specified user
 */
export async function sendEphemeralError(
    modify: IModify,
    room: IRoom,
    user: IUser,
    message: string,
): Promise<void> {
    const msg = modify.getCreator()
        .startMessage()
        .setRoom(room)
        .setText(`⚠️ ${message}`)
        .setUsernameAlias('Poll');

    await modify.getNotifier().notifyUser(user, msg.getMessage());
}

/**
 * Sends an ephemeral success message to a user
 */
export async function sendEphemeralSuccess(
    modify: IModify,
    room: IRoom,
    user: IUser,
    message: string,
): Promise<void> {
    const msg = modify.getCreator()
        .startMessage()
        .setRoom(room)
        .setText(`✅ ${message}`)
        .setUsernameAlias('Poll');

    await modify.getNotifier().notifyUser(user, msg.getMessage());
}

/**
 * Sends an ephemeral info message to a user
 */
export async function sendEphemeralInfo(
    modify: IModify,
    room: IRoom,
    user: IUser,
    message: string,
): Promise<void> {
    const msg = modify.getCreator()
        .startMessage()
        .setRoom(room)
        .setText(`ℹ️ ${message}`)
        .setUsernameAlias('Poll');

    await modify.getNotifier().notifyUser(user, msg.getMessage());
}
