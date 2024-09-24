import type { IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useJumpToMessage } from '../../../views/room/MessageList/hooks/useJumpToMessage';
import { useUserCard } from '../../../views/room/contexts/UserCardContext';
import Emoji from '../../Emoji';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import MessageToolbarHolder from '../MessageToolbarHolder';
import StatusIndicators from '../StatusIndicators';
import RoomMessageContent from './room/RoomMessageContent';

type RoomMessageProps = {
	message: IMessage & { ignored?: boolean };
	showUserAvatar: boolean;
	sequential: boolean;
	unread: boolean;
	mention: boolean;
	all: boolean;
	context?: MessageActionContext;
	ignoredUser?: boolean;
	searchText?: string;
} & ComponentProps<typeof Message>;

const RoomMessage = ({
	message,
	showUserAvatar,
	sequential,
	all,
	mention,
	unread,
	context,
	ignoredUser,
	searchText,
	...props
}: RoomMessageProps): ReactElement => {
	const t = useTranslation();
	const uid = useUserId();
	const editing = useIsMessageHighlight(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = (ignoredUser || message.ignored) && !displayIgnoredMessage;
	const { openUserCard, triggerProps } = useUserCard();

	const selecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const selected = useIsSelectedMessage(message._id);

	useCountSelected();

	const messageRef = useJumpToMessage(message._id);


	const handleRightClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

       // Check if the click target is an interactive element
       const target = e.target as HTMLElement;
       const isInteractiveElement = target.closest('a, button, [role="button"]');
       if (isInteractiveElement) {
        // Allow default right-click behavior for interactive elements
        return;
}
		
       const moreButton = (e.currentTarget as HTMLElement).querySelector('[aria-label^="More options"]') as HTMLElement;
       if (!moreButton) return;

          // Position and hide the button
          moreButton.style.position = 'fixed';
          moreButton.style.top = `${e.clientY}px`;
          moreButton.style.left = `${e.clientX}px`;
          moreButton.style.visibility = 'hidden';

         // Simulate click on the element
          moreButton.click();
};

	return (
		<Message
			ref={messageRef}
			id={message._id}
			role='listitem'
			aria-roledescription={sequential ? t('sequential_message') : t('message')}
			tabIndex={0}
			aria-labelledby={`${message._id}-displayName ${message._id}-time ${message._id}-content ${message._id}-read-status`}
			onClick={selecting ? toggleSelected : undefined}
			onContextMenu={handleRightClick}
			isSelected={selected}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-qa-editing={editing}
			data-qa-selected={selected}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
			data-qa-type='message'
			aria-busy={message.temp}
			{...props}
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && !selecting && showUserAvatar && (
					<MessageAvatar
						emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
						avatarUrl={message.avatar}
						username={message.u.username}
						size='x36'
						onClick={(e) => openUserCard(e, message.u.username)}
						style={{ cursor: 'pointer' }}
						role='button'
						{...triggerProps}
					/>
				)}
				{selecting && <CheckBox checked={selected} onChange={toggleSelected} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>
			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}
				{ignored ? (
					<IgnoredContent onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<RoomMessageContent message={message} unread={unread} mention={mention} all={all} searchText={searchText} />
				)}
			</MessageContainer>
			{!message.private && <MessageToolbarHolder message={message} context={context} />}
		</Message>
	);
};

export default memo(RoomMessage);
