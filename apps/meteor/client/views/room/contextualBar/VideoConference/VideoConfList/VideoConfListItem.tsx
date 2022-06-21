import { IGroupVideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Button, Icon, Message, Box, Avatar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation, useSetting, useSetModal, useUserRoom } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { VIDEOCONF_STACK_MAX_USERS } from '..';
import RawText from '../../../../../components/RawText';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useVideoConfJoinCall } from '../../../../../contexts/VideoConfContext';
import { useTimeAgo } from '../../../../../hooks/useTimeAgo';
import JoinVideoConfModal from '../JoinVideoConfModal';

const VideoConfListItem = ({
	videoConfData,
	className = [],
	reload,
	...props
}: {
	videoConfData: IGroupVideoConference;
	className?: string[];
	reload: () => void;
}): ReactElement => {
	const t = useTranslation();
	const formatDate = useTimeAgo();
	const setModal = useSetModal();
	const joinCall = useVideoConfJoinCall();
	const showRealName = Boolean(useSetting('UI_Use_Real_Name'));

	const {
		_id: callId,
		createdBy: { name, username, _id },
		title,
		users,
		rid,
		createdAt,
		endedAt,
	} = videoConfData;

	const room = useUserRoom(rid);
	const joinedUsers = users.filter((user) => user._id !== _id);

	const hovered = css`
		&:hover,
		&:focus {
			background: ${colors.n100};
			.rcx-message {
				background: ${colors.n100};
			}
		}
		border-bottom: 2px solid ${colors.n300} !important;
	`;

	const disabled = css`
		opacity: 0.5;
	`;

	const handleJoin = (): void => {
		joinCall(callId);
		setModal(null);
		return reload();
	};

	const handleCloseModal = useMutableCallback(() => setModal(null));

	const handleJoinConference = useMutableCallback(() => {
		if (room) {
			return setModal(
				<JoinVideoConfModal confTitle={title} callId={callId} onClose={handleCloseModal} room={room} onConfirm={handleJoin} />,
			);
		}
	});

	return (
		<Box className={[...className, hovered, endedAt && disabled].filter(Boolean)} pb='x8'>
			<Message {...props}>
				<Message.LeftContainer>
					{username && <UserAvatar username={username} className='rcx-message__avatar' size='x36' />}
				</Message.LeftContainer>
				<Message.Container>
					<Message.Header>
						<Message.Name title={username}>{showRealName ? name : username}</Message.Name>
						<Message.Timestamp>{formatDate(createdAt)}</Message.Timestamp>
					</Message.Header>
					<Message.Body clamp={2}>
						<RawText>{title}</RawText>
					</Message.Body>
					<Box display='flex'></Box>
					<Message.Block flexDirection='row' alignItems='center'>
						{!endedAt && (
							<Button primary small alignItems='center' display='flex' onClick={handleJoinConference}>
								<Icon size='x20' name='video' mie='x4' />
								{t('Join')}
							</Button>
						)}
						{joinedUsers.length > 0 && (
							<Box mis='x8' fontScale='c1' display='flex' alignItems='center'>
								<Avatar.Stack>
									{joinedUsers.map(
										(user, index) =>
											user.username &&
											index + 1 <= VIDEOCONF_STACK_MAX_USERS && <UserAvatar username={user.username} etag={user.avatarETag} size='x28' />,
									)}
								</Avatar.Stack>
								<Box mis='x4'>
									{joinedUsers.length > VIDEOCONF_STACK_MAX_USERS
										? t('__usersCount__members_joined', { usersCount: joinedUsers.length - VIDEOCONF_STACK_MAX_USERS })
										: t('joined')}
								</Box>
							</Box>
						)}
						{joinedUsers.length === 0 && !endedAt && (
							<Box mis='x8' fontScale='c1'>
								{t('Be_first_to_join')}
							</Box>
						)}
					</Message.Block>
				</Message.Container>
			</Message>
		</Box>
	);
};

export default VideoConfListItem;
