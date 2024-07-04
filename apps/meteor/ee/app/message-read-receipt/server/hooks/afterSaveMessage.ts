import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../../../app/lib/server/lib/notifyListener';
import { callbacks } from '../../../../../lib/callbacks';
import { ReadReceipt } from '../../../../server/lib/message-read-receipt/ReadReceipt';

callbacks.add(
	'afterSaveMessage',
	async (message: IMessage, room: IRoom) => {
		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		if (!isOmnichannelRoom(room) || !room.closedAt) {
			// set subscription as read right after message was sent
			const setAsReadResponse = await Subscriptions.setAsReadByRoomIdAndUserId(room._id, message.u._id);
			if (setAsReadResponse.modifiedCount) {
				void notifyOnSubscriptionChangedByRoomIdAndUserId(room._id, message.u._id);
			}
		}

		// mark message as read as well
		await ReadReceipt.markMessageAsReadBySender(message, room, message.u._id);

		return message;
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterSaveMessage',
);
