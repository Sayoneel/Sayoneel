import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:forwardstatus'(roomId, status) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:forwardstatus' });
		}

		return Livechat.forwardChat(roomId, status);
	},
});
