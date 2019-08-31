import { Meteor } from 'meteor/meteor';

import { roomFiles } from '../lib/roomFiles';

Meteor.publish('roomFilesWithSearchText', function(rid, searchText, fileType, limit = 50) {
	return roomFiles(this, { rid, searchText, fileType, limit });
});
