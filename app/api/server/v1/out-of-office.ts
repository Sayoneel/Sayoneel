import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { updateOutOfOffice } from '../../../out-of-office/server';
import { OutOfOffice } from '../../../models/server';

API.v1.addRoute(
	'outOfOffice.toggle',
	{ authRequired: true },
	{
		post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					isEnabled: Boolean,
					roomIds: Array,
					customMessage: String,
					startDate: String,
					endDate: String,
				}),
			);

			if (isNaN(Date.parse(this.bodyParams.startDate)) || isNaN(Date.parse(this.bodyParams.endDate))) {
				throw new Meteor.Error('error-invalid-date', 'The "startDate" and "endDate" must be  valid dates.');
			}

			const { startDate, endDate } = this.bodyParams;

			if (startDate && endDate && startDate > endDate) {
				throw new Meteor.Error('error-invalid-date', 'Your Start data has to be before the End Date');
			}

			const { message } = updateOutOfOffice({
				userId: this.userId,
				...this.bodyParams,
			});

			return API.v1.success({ message });
		},
	},
);

API.v1.addRoute(
	'outOfOffice.status',
	{ authRequired: true },
	{
		get() {
			const foundDocument = OutOfOffice.findOneByUserId(this.userId, {
				isEnabled: 1,
				roomIds: 1,
				customMessage: 1,
			});

			// need to subtract the offset here
			if (!foundDocument) {
				return API.v1.success({
					error: 'error-not-found',
					details:
            'Out of Office document associated with this user-id could not be found',
				});
			}

			return API.v1.success(foundDocument);
		},
	},
);

// temporary - only for debugging purposes

API.v1.addRoute('outOfOffice.getAll', {
	get() {
		const allDocuments = OutOfOffice.find({}).fetch();

		return API.v1.success({
			'all-docs': allDocuments,
		});
	},
});

API.v1.addRoute('outOfOffice.getById', {
	get() {
		const { docId } = this.bodyParams;
		if (!docId) {
			return API.v1.failure('doc id not provided');
		}
		const doc = OutOfOffice.findOneById(docId);

		return API.v1.success({ 'the-found': doc });
	},
});

API.v1.addRoute('outOfOffice.removeAll', {
	get() {
		OutOfOffice.remove({});
		return API.v1.success({ result: 'deleted all documents' });
	},
});
