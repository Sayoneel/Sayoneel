import { useCallback } from 'react';

import { IMessage } from '../../../definition/IMessage';
import { MessageList } from '../../lib/lists/MessageList';
import { ObjectFromApi } from '../../../definition/ObjectFromApi';
import { useScrollableRecordList } from './useScrollableRecordList';

const convertMessageFromApi = (apiMessage: ObjectFromApi<IMessage>): IMessage => ({
	...apiMessage,
	_updatedAt: new Date(apiMessage._updatedAt),
	ts: new Date(apiMessage.ts),
	...apiMessage.tlm && { tlm: new Date(apiMessage.tlm) },
});

export const useScrollableMessageList = (
	messageList: MessageList,
	fetchMessages: (start: number, end: number) => Promise<ObjectFromApi<IMessage>[]>,
	initialItemCount?: number,
): ReturnType<typeof useScrollableRecordList> => {
	const fetchItems = useCallback(async (start: number, end: number): Promise<IMessage[]> =>
		fetchMessages(start, end).then((apiMessages) => apiMessages.map(convertMessageFromApi)), [fetchMessages]);

	return useScrollableRecordList(messageList, fetchItems, initialItemCount);
};
