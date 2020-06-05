import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models';

Meteor.methods({
	async 'livechat:requestScreenshare'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:requestScreenshare' });
		}

		const guest = Meteor.user();

		Messages.createWithTypeRoomIdMessageAndUser('request_screenshare_access', roomId, '', guest, {
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' },
			],
		});
	},
});
