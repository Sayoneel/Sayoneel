import { Meteor } from 'meteor/meteor';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { i18n } from '../../../server/lib/i18n';

/*
 * Leave is a named function that will replace /leave commands
 * @param {Object} message - The message object
 */
const Leave = async function Leave({ message, userId }: SlashCommandCallbackParams<'leave'>): Promise<void> {
	try {
		await Meteor.callAsync('leaveRoom', message.rid);
	} catch ({ error }: any) {
		if (typeof error !== 'string') {
			return;
		}
		const user = await Users.findOneById(userId);
		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: i18n.t(error, { lng: user?.language || settings.get('Language') || 'en' }),
		});
	}
};

slashCommands.add({
	command: 'leave',
	callback: Leave,
	options: {
		description: 'Leave_the_current_channel',
		permission: ['leave-c', 'leave-p'],
	},
});
slashCommands.add({
	command: 'part',
	callback: Leave,
	options: {
		description: 'Leave_the_current_channel',
		permission: ['leave-c', 'leave-p'],
	},
});
