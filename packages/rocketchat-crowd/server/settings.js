Meteor.startup(function() {
	RocketChat.settings.addGroup('Atlassian Crowd', function() {
        const enableQuery = {_id: 'CROWD_Enable', value: true};

    	this.add('CROWD_Enable', false, { type: 'boolean', public: true });
        this.add('CROWD_URL', '', { type: "string" });
        this.add('CROWD_APP_USERNAME', '', { type: "string" });
        this.add('CROWD_APP_PASSWORD', '', { type: "string" });
        this.add('CROWD_Sync_User_Data', false, { type: 'boolean', enableQuery: enableQuery });
	});
});
