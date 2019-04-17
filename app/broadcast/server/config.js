import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Broadcast', function() {
		this.add('Broadcast_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});
});

