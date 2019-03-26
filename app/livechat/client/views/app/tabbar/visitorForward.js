import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/tap:i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { ChatRoom } from '../../../../../models';
import { Notifications } from '../../../../../notifications';
import { t } from '../../../../../utils';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';
import { AgentUsers } from '../../../collections/AgentUsers';
import './visitorForward.html';

Template.visitorForward.helpers({
	visitor() {
		return Template.instance().visitor.get();
	},
	hasDepartments() {
		return LivechatDepartment.find({ enabled: true }).count() > 0;
	},
	departments() {
		return LivechatDepartment.find({ enabled: true });
	},
	agents() {
		const query = {
			_id: { $ne: Meteor.userId() },
			status: { $ne: 'offline' },
			statusLivechat: 'available',
		};

		return AgentUsers.find(query, { sort: { name: 1, username: 1 } });
	},
	agentName() {
		return this.name || this.username;
	},
	forwarded() {
		return Template.instance().forwarded.get();
	},
});

Template.visitorForward.onCreated(function() {
	this.visitor = new ReactiveVar();
	this.room = new ReactiveVar();
	this.forwarded = new ReactiveVar();
	this.autorun(() => {
		this.visitor.set(Meteor.users.findOne({ _id: Template.currentData().visitorId }));
	});

	this.autorun(() => {
		this.room.set(ChatRoom.findOne({ _id: Template.currentData().roomId }));
	});

	this.autorun(() => {
		this.forwarded.set(ChatRoom.findOne({ _id: Template.currentData().roomId }).forwarded);
	});

	this.subscribe('livechat:departments');
	this.subscribe('livechat:agents');
});


Template.visitorForward.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const transferData = {
			roomId: instance.room.get()._id,
		};

		if (instance.find('#forwardUser').value) {
			transferData.userId = instance.find('#forwardUser').value;
		} else if (instance.find('#forwardDepartment').value) {
			transferData.departmentId = instance.find('#forwardDepartment').value;
		}

		// Check for settings whether forward is enabled or not.

		if (!settings.get('Livechat_ask_for_forward')) {
			// If asking for forward permission disabled forward normally
			Meteor.call('livechat:transfer', transferData, (error, result) => {
				if (error) {
					toastr.error(t(error.error));
				} else if (result) {
					this.save();
					toastr.success(t('Transferred'));
					FlowRouter.go('/');
				} else {
					toastr.warning(t('No_available_agents_to_transfer'));
				}
			});
			return;
		}

		const timeoutAgent = Math.abs(settings.get('Livechat_forward_timeout_second') * 1000);
		const userDeny = Meteor.users.findOne(transferData.userId);
		instance.timeout = Meteor.setTimeout(() => {
			Meteor.call('livechat:updateForwardStatus', transferData.roomId, false);
			modal.open({
				title: t('Timeout'),
				type: 'error',
				timer: 2000,
				text: TAPi18n.__('Username_did_not_accept_your_livechat_request', { username: userDeny.username }),
				html: true,
				confirmButtonText: TAPi18n.__('OK'),
			});
		}, timeoutAgent);
		transferData.timeout = instance.timeout;
		transferData.timeoutAgent = timeoutAgent;
		transferData.originalAgentId = Meteor.userId();
		Notifications.notifyUser(transferData.userId, 'forward-livechat', 'handshake', { roomId: transferData.roomId, userId: transferData.userId, transferData });
	},

	'change #forwardDepartment, blur #forwardDepartment'(event, instance) {
		if (event.currentTarget.value) {
			instance.find('#forwardUser').value = '';
		}
	},

	'change #forwardUser, blur #forwardUser'(event, instance) {
		if (event.currentTarget.value && instance.find('#forwardDepartment')) {
			instance.find('#forwardDepartment').value = '';
		}
	},

	'click .cancel'(event) {
		event.preventDefault();

		this.cancel();
	},
});

Tracker.autorun(function() {
	if (Meteor.userId()) {
		Notifications.onUser('forward-livechat', (type, data) => {
			const user = Meteor.users.findOne(data.transferData.originalAgentId);
			switch (type) {

				case 'handshake':
					Meteor.call('livechat:updateForwardStatus', data.transferData.roomId, true);
					modal.open({
						title: TAPi18n.__('LiveChat'),
						text: TAPi18n.__('Username_wants_to_forward_livechat_Do_you_want_to_accept', { username: user.username }),
						html: true,
						showCancelButton: true,
						allowOutsideClick: false,
						confirmButtonText: TAPi18n.__('Yes'),
						cancelButtonText: TAPi18n.__('No'),
					}, (isConfirm) => {
						if (isConfirm) {
							Meteor.call('livechat:checkLiveAgent', data.transferData.originalAgentId, (error, result) => {
								if (result && result.userStatus === 'offline') {
									Meteor.call('livechat:updateForwardStatus', data.transferData.roomId, false);
									toastr.error(t(`Cannot transfer, ${ user.username } is offline`));
								} else {
									Notifications.notifyUser(data.transferData.originalAgentId, 'forward-livechat', 'accepted', { transferData: data.transferData });
								}
							});
						}
					}, () => {
						Meteor.call('livechat:updateForwardStatus', data.transferData.roomId, false);
						Notifications.notifyUser(data.transferData.originalAgentId, 'forward-livechat', 'deny', { transferData: data.transferData });
					});

					Meteor.setTimeout(() => {
						modal.close();
					}, data.transferData.timeoutAgent);
					// Set forward back to false if agent closes the window.
					Meteor.call('livechat:updateForwardStatusOfflineAgent', data.transferData, false);
					break;

				case 'accepted':
					Meteor.call('livechat:updateForwardStatus', data.transferData.roomId, false);
					Meteor.call('livechat:transfer', data.transferData, (error, result) => {
						if (error) {
							toastr.error(t(error.error));
						} else if (result) {
							Meteor.clearTimeout(data.transferData.timeout);
							Notifications.notifyUser(data.transferData.userId, 'forward-livechat', 'transferred', { transferData: data.transferData });
							FlowRouter.go('/');
							toastr.success(t('Transferred'));
						} else {
							toastr.warning(t('No_available_agents_to_transfer'));
						}
					});
					break;

				case 'deny':
					const userDeny = Meteor.users.findOne(data.transferData.userId);
					Meteor.clearTimeout(data.transferData.timeout);
					modal.open({
						title: TAPi18n.__('LiveChat'),
						text: TAPi18n.__('Username_did_not_accept_your_livechat_request', { username: userDeny.username }),
						html: true,
						confirmButtonText: TAPi18n.__('OK'),
					});
					break;

				case 'transferred':
					FlowRouter.go(`/live/${ data.transferData.roomId }`);
					toastr.success(t('Transferred'));
					break;
			}
		});
	}
});

