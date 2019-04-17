import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { getUserPreference, t } from '../../../utils';
import { settings } from '../../../settings';
import moment from 'moment';

let clockMode;

Tracker.autorun(() => {
	clockMode = getUserPreference(Meteor.userId(), 'clockMode', false);
});

export const formatTime = (time) => {
	switch (clockMode) {
		case 1:
			return moment(time).format('h:mm A');
		case 2:
			return moment(time).format('H:mm');
		default:
			return moment(time).format(settings.get('Message_TimeFormat'));
	}
};

export const formatDateAndTime = (time) => {
	switch (clockMode) {
		case 1:
			return moment(time).format('MMMM D, Y h:mm A');
		case 2:
			return moment(time).format('MMMM D, Y H:mm');
		default:
			return moment(time).format(settings.get('Message_TimeAndDateFormat'));
	}
};

export const timeAgo = (time) => {
	const now = new Date();
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

	return (
		(now.getDate() === time.getDate() && moment(time).format('LT')) ||
		(yesterday.getDate() === time.getDate() && t('yesterday')) ||
		moment(time).format('L')
	);
};

export const formatDate = (time) => moment(time).format(settings.get('Message_DateFormat'));
