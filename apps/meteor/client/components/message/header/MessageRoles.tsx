import { MessageRole, MessageRoles as FuselageMessageRoles } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type MessageRolesProps = {
	roles: Array<string>;
	isBot?: boolean;
};

const MessageRoles = ({ roles, isBot }: MessageRolesProps): ReactElement | null => {
	const t = useTranslation();

	return (
		<FuselageMessageRoles>
			{roles.map((role, index) => (
				<MessageRole key={index}>{role}</MessageRole>
			))}
			{isBot && <MessageRole>{t('Bot')}</MessageRole>}
		</FuselageMessageRoles>
	);
};

export default MessageRoles;
