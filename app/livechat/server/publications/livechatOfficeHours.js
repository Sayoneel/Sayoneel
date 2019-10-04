import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatOfficeHour } from '../../../models';

Meteor.publish('livechat:officeHour', function() {
	console.warn('The publication "livechat:officeHour" is deprecated and will be removed after version v3.0.0');
	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:officeHour' }));
	}

	return LivechatOfficeHour.find();
});
