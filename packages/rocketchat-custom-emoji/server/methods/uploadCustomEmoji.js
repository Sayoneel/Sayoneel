/* globals RocketChatFileCustomEmojiInstance */
Meteor.methods({
	uploadCustomEmoji(binaryContent, contentType, emojiData) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		//delete aliases for notification purposes. here, it is a string rather than an array
		delete emojiData.aliases;
		let file = new Buffer(binaryContent, 'binary');

		let rs = RocketChatFile.bufferToStream(file);
		RocketChatFileCustomEmojiInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
		let ws = RocketChatFileCustomEmojiInstance.createWriteStream(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`), contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => RocketChat.Notifications.notifyAll('updateCustomEmoji', {emojiData})
			, 500)
		));

		rs.pipe(ws);
	}
});
