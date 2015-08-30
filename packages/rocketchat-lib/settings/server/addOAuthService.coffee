Meteor.methods
	addOAuthService: (name) ->
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}"       , false, { type: 'boolean', group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Enable'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_url"   , ''   , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_URL'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_id"    , ''   , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_ID'}
		RocketChat.settings.add "Accounts_OAuth_Custom_#{name}_secret", ''   , { type: 'string' , group: 'Accounts', section: name, i18nLabel: 'Accounts_OAuth_Custom_Secret'}
