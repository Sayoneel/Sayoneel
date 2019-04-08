import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

Meteor.methods({
	saveSettings(params = []) {
		const settingsNotAllowed = [];
		if (Meteor.userId() === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		params.forEach(({ _id, value, editor }) => {
			// Verify the _id passed in is a string.
			check(_id, String);
			if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-privileged-setting')
				&& !(RocketChat.authz.hasAllPermission(Meteor.userId(), ['manage-selected-settings', `change-setting-${ _id }`]))) {
				settingsNotAllowed.push(_id);
				return;
			}
			const setting = RocketChat.models.Settings.db.findOneById(_id);

			// Verify the value is what it should be
			switch (setting.type) {
				case 'roomPick':
					check(value, Match.OneOf([Object], ''));
					break;
				case 'boolean':
					check(value, Boolean);
					break;
				case 'int':
					check(value, Number);
					break;
				default:
					check(value, String);
					break;
			}
			RocketChat.settings.updateById(_id, value, editor);
		});
		// Throw messages for settings that are not allowed to save!
		if (settingsNotAllowed.length) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSettings',
				settingIds: settingsNotAllowed,
			});
		}

		return true;
	},
});
