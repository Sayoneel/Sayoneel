RocketChat.Migrations.add({
	version: 109,
	up() {
		if (RocketChat && RocketChat.models) {
			if (RocketChat.models.Settings) {
				RocketChat.models.Settings.remove({_id: 'AutoLinker_UrlsRegExp' });
			}
		}
	}
});
