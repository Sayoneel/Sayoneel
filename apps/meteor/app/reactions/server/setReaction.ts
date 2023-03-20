import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import { EmojiCustom } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Messages, Rooms } from '../../models/server';
import { callbacks } from '../../../lib/callbacks';
import { emoji } from '../../emoji/server';
import { isTheLastMessage, msgStream } from '../../lib/server';
import { canAccessRoom, hasPermission } from '../../authorization/server';
import { AppEvents, Apps } from '../../../ee/server/apps/orchestrator';

const removeUserReaction = (message: IMessage, reaction: string, username: string) => {
	if (!message.reactions) {
		return message;
	}

	message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(username), 1);
	if (message.reactions[reaction].usernames.length === 0) {
		delete message.reactions[reaction];
	}
	return message;
};

async function setReaction(room: IRoom, user: IUser, message: IMessage, reaction: string, shouldReact?: boolean) {
	reaction = `:${reaction.replace(/:/g, '')}:`;

	if (!emoji.list[reaction] && (await EmojiCustom.findByNameOrAlias(reaction, {}).count()) === 0) {
		throw new Meteor.Error('error-not-allowed', 'Invalid emoji provided.', {
			method: 'setReaction',
		});
	}

	if (room.ro === true && !room.reactWhenReadOnly && !hasPermission(user._id, 'post-readonly', room._id)) {
		// Unless the user was manually unmuted
		if (!(room.unmuted || []).includes(user.username as string)) {
			throw new Error("You can't send messages because the room is readonly.");
		}
	}

	if (Array.isArray(room.muted) && room.muted.indexOf(user.username as string) !== -1) {
		throw new Meteor.Error('error-not-allowed', TAPi18n.__('You_have_been_muted', {}, user.language), {
			rid: room._id,
		});
	}

	const userAlreadyReacted =
		message.reactions &&
		Boolean(message.reactions[reaction]) &&
		message.reactions[reaction].usernames.indexOf(user.username as string) !== -1;
	// When shouldReact was not informed, toggle the reaction.
	if (shouldReact === undefined) {
		shouldReact = !userAlreadyReacted;
	}

	if (userAlreadyReacted === shouldReact) {
		return;
	}

	let isReacted;

	if (userAlreadyReacted) {
		const oldMessage = JSON.parse(JSON.stringify(message));
		removeUserReaction(message, reaction, user.username as string);
		if (_.isEmpty(message.reactions)) {
			delete message.reactions;
			if (isTheLastMessage(room, message)) {
				Rooms.unsetReactionsInLastMessage(room._id);
			}
			Messages.unsetReactions(message._id);
		} else {
			Messages.setReactions(message._id, message.reactions);
			if (isTheLastMessage(room, message)) {
				Rooms.setReactionsInLastMessage(room._id, message);
			}
		}
		callbacks.run('unsetReaction', message._id, reaction);
		callbacks.run('afterUnsetReaction', message, { user, reaction, shouldReact, oldMessage });

		isReacted = false;
	} else {
		if (!message.reactions) {
			message.reactions = {};
		}
		if (!message.reactions[reaction]) {
			message.reactions[reaction] = {
				usernames: [],
			};
		}
		message.reactions[reaction].usernames.push(user.username as string);
		Messages.setReactions(message._id, message.reactions);
		if (isTheLastMessage(room, message)) {
			Rooms.setReactionsInLastMessage(room._id, message);
		}
		callbacks.run('setReaction', message._id, reaction);
		callbacks.run('afterSetReaction', message, { user, reaction, shouldReact });

		isReacted = true;
	}

	Promise.await(Apps.triggerEvent(AppEvents.IPostMessageReacted, message, user, reaction, isReacted));

	msgStream.emit(message.rid, message);
}

export const executeSetReaction = async (reaction: string, messageId: IMessage['_id'], shouldReact?: boolean) => {
	const user = Meteor.user() as IUser | null;

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setReaction' });
	}

	const message = Messages.findOneById(messageId);
	if (!message) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
	}

	const room = Rooms.findOneById(message.rid);
	if (!room) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setReaction' });
	}

	if (!canAccessRoom(room, user)) {
		throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'setReaction' });
	}

	return setReaction(room, user, message, reaction, shouldReact);
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setReaction(reaction: string, messageId: IMessage['_id'], shouldReact?: boolean): Promise<void | boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async setReaction(reaction, messageId, shouldReact) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setReaction' });
		}

		try {
			return executeSetReaction(reaction, messageId, shouldReact);
		} catch (e: any) {
			if (e.error === 'error-not-allowed' && e.reason && e.details && e.details.rid) {
				void api.broadcast('notify.ephemeralMessage', uid, e.details.rid, {
					msg: e.reason,
				});

				return false;
			}

			throw e;
		}
	},
});
