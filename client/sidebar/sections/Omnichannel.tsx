import { Box, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement, useState, useCallback } from 'react';

import { VoipEvents } from '../../components/voip/SimpleVoipUser';
import {
	useIsVoipLibReady,
	useVoipUser,
	useOmnichannelShowQueueLink,
	useOmnichannelQueueLink,
	useOmnichannelDirectoryLink,
	useOmnichannelAgentAvailable,
	useOmnichannelVoipCallAvailable,
} from '../../contexts/OmnichannelContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';

const OmnichannelSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const changeAgentStatus = useMethod('livechat:changeLivechatStatus');
	const voipCallAvailable = useState(useOmnichannelVoipCallAvailable());
	const [registered, setRegistered] = useState(false);
	const voipLibIsReady = useIsVoipLibReady();
	const voipLib = useVoipUser();
	const agentAvailable = useOmnichannelAgentAvailable();

	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();
	const queueLink = useOmnichannelQueueLink();
	const directoryLink = useOmnichannelDirectoryLink();

	const voipCallIcon = {
		title: !registered ? t('Enable') : t('Disable'),
		color: !registered ? 'success' : undefined,
		icon: !registered ? 'phone' : 'phone-disabled',
	};

	const availableIcon = {
		title: agentAvailable ? t('Available') : t('Not_Available'),
		color: agentAvailable ? 'success' : undefined,
		icon: agentAvailable ? 'message' : 'message-disabled',
	};

	const directoryIcon = {
		title: t('Contact_Center'),
		icon: 'contact',
	};

	const handleAvailableStatusChange = useMutableCallback(async () => {
		try {
			await changeAgentStatus();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
			console.log(error);
		}
	});

	const onUnregistrationError = useCallback((): void => {
		console.log('Unregistration error');
		voipLib?.removeListener(VoipEvents.unregistrationerror, onUnregistrationError);
	}, [voipLib]);

	const onUnregistered = useCallback((): void => {
		console.log('unRegistered');
		setRegistered(!registered);
		voipLib?.removeListener(VoipEvents.unregistered, onUnregistered);
		voipLib?.removeListener(VoipEvents.registrationerror, onUnregistrationError);
	}, [onUnregistrationError, registered, voipLib]);

	const onRegistrationError = useCallback((): void => {
		console.log('Registration Error');
		voipLib?.removeListener(VoipEvents.registrationerror, onRegistrationError);
	}, [voipLib]);

	const onRegistered = useCallback((): void => {
		console.log('Registered');
		setRegistered(!registered);
		voipLib?.removeListener(VoipEvents.registered, onRegistered);
		voipLib?.removeListener(VoipEvents.registrationerror, onRegistrationError);
	}, [onRegistrationError, registered, voipLib]);

	const handleVoipCallStatusChange = useCallback(() => {
		// TODO: backend set voip call status
		if (voipLibIsReady && voipCallAvailable) {
			if (!registered) {
				voipLib?.setListener(VoipEvents.registered, onRegistered);
				voipLib?.setListener(VoipEvents.registrationerror, onRegistrationError);
				voipLib?.registerEndpoint();
			} else {
				voipLib?.setListener(VoipEvents.unregistered, onUnregistered);
				voipLib?.setListener(VoipEvents.unregistrationerror, onUnregistrationError);
				voipLib?.unregisterEndpoint();
			}
		}
	}, [
		voipLibIsReady,
		voipCallAvailable,
		registered,
		voipLib,
		onRegistered,
		onRegistrationError,
		onUnregistered,
		onUnregistrationError,
	]);

	return (
		<Sidebar.TopBar.ToolBox {...props}>
			<Sidebar.TopBar.Title>{t('Omnichannel')}</Sidebar.TopBar.Title>
			<Sidebar.TopBar.Actions>
				{showOmnichannelQueueLink && (
					<Sidebar.TopBar.Action icon='queue' title={t('Queue')} is='a' href={queueLink} />
				)}
				<Sidebar.TopBar.Action {...voipCallIcon} onClick={handleVoipCallStatusChange} />
				<Sidebar.TopBar.Action {...availableIcon} onClick={handleAvailableStatusChange} />
				<Sidebar.TopBar.Action {...directoryIcon} href={directoryLink} is='a' />
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.ToolBox>
	);
};

export default Object.assign(memo(OmnichannelSection), {
	size: 56,
});
