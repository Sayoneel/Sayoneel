import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { SidebarSection } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentType, memo, useMemo, ReactElement } from 'react';

import { useAcceptCall, useRejectIncomingCall, useIncomingCalls } from '../../contexts/VideoConfContext';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import OmnichannelSection from '../sections/OmnichannelSection';
import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';

const sections: {
	[key: string]: ComponentType<any>;
} = {
	Omnichannel: OmnichannelSection,
};

type RoomListRowProps = {
	extended: boolean;
	t: ReturnType<typeof useTranslation>;
	SideBarItemTemplate: ReturnType<typeof useTemplateByViewMode>;
	AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
	openedRoom: string;
	sidebarViewMode: 'extended' | 'condensed' | 'medium';
	isAnonymous: boolean;
};

const Row = ({ data, item }: { data: RoomListRowProps; item: ISubscription & IRoom }): ReactElement => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

	const acceptCall = useAcceptCall();
	const rejectCall = useRejectIncomingCall();
	const incomingCalls = useIncomingCalls();
	const currentCall = incomingCalls.find((call) => call.rid === item.rid);

	const videoConfActions = useMemo(
		() => ({
			acceptCall: (): void => acceptCall(currentCall?.callId as string),
			rejectCall: (): void => rejectCall(currentCall?.callId as string),
		}),
		[acceptCall, rejectCall, currentCall],
	);

	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? (
			<Section aria-level='1' />
		) : (
			<SidebarSection aria-level='1'>
				<SidebarSection.Title>{t(item)}</SidebarSection.Title>
			</SidebarSection>
		);
	}

	return (
		<SideBarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
			videoConfActions={currentCall && videoConfActions}
		/>
	);
};

export default memo(Row);
