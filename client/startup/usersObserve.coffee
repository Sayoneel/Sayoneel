Meteor.startup ->
	Meteor.users.find({}, { fields: { name: 1, username: 1, pictures: 1, status: 1, emails: 1, phone: 1, services: 1 } }).observe
		added: (user) ->
			Session.set('user_' + user.username + '_status', user.status)
			Session.set('user_' + user.username + '_status_message', user.statusMessage)
		changed: (user) ->
			Session.set('user_' + user.username + '_status', user.status)
			Session.set('user_' + user.username + '_status_message', user.statusMessage)
		removed: (user) ->
			Session.set('user_' + user.username + '_status', null)
			Session.set('user_' + user.username + '_status_message', user.statusMessage)
