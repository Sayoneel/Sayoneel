import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../lib/queryClient';
import { dispatchToastMessage } from '../../lib/toast';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action(_, { message }) {
			try {
				await sdk.call('starMessage', { ...message, starred: false });
				queryClient.invalidateQueries({ queryKey: ['rooms', message.rid, 'starred-messages'] });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		condition({ message, subscription, user }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(message.starred?.find((star: any) => star._id === user?._id));
		},
		order: 3,
		group: 'menu',
	});
});
