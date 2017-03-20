const _createExpertsChannel = function(){
	let expertsRoomName = RocketChat.settings.get('Assistify_Expert_Channel');

		if(expertsRoomName) {
			expertsRoomName.toLowerCase();
		}

	if (!RocketChat.models.Rooms.findByTypeAndName('c', expertsRoomName).fetch()) {
		RocketChat.models.Rooms.createWithIdTypeAndName(Random.id(), 'c', expertsRoomName);
	}
};

Meteor.startup(() => {



	RocketChat.settings.add('Assistify_Room_Count', 1, {
		group: 'Assistify',
		i18nLabel: 'Assistify_room_count',
		type: 'int',
		public: true,
		section: 'General'
	});

	RocketChat.settings.add('Assistify_Expert_Channel', TAPi18n.__('Experts'), {
		group: 'Assistify',
		i18nLabel: 'Experts_channel',
		type: 'string',
		public: true,
		section: 'General'
	});

	_createExpertsChannel();

	RocketChat.theme.addPackageAsset(() => {
		return Assets.getText('assets/stylesheets/helpRequestContext.less');
	});
});
