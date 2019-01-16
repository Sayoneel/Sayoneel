const fs = require('fs');
import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	async getPDFFile(pdfId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getPDFFile' });
		}

		try {
			const pathToFilePdf = `${ RocketChat.settings.get('FileUpload_FileSystemPath') }/${ pdfId }`;
			return fs.readFileSync(pathToFilePdf);
		} catch (error) {
			return error;
		}
	},
});
