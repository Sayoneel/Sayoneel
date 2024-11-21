import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';

export const useJumpToSearchMessageAction = () => {
	useEffect(() => {
		MessageAction.addButton({
			id: 'jump-to-search-message',
			icon: 'jump',
			label: 'Jump_to_message',
			context: ['search'],
			async action(_, { message }) {
				setMessageJumpQueryStringParameter(message._id);
			},
			order: 100,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('jump-to-search-message');
		};
	}, []);
};
