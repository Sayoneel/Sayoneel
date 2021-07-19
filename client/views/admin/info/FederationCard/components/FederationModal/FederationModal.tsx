import {
	Banner,
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	Modal,
	Select,
	SelectOptions,
	Tabs,
	TextInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { parse as parseDomain, ParsedDomain } from 'psl';
import React, { FC, ReactElement, useCallback, useState } from 'react';

import { useSetting, useSettingSetValue } from '../../../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../../../contexts/TranslationContext';
import { useForm } from '../../../../../../hooks/useForm';
import { DNSRecords } from './DNSRecords';
import { DNSRecordName, ResolvedDNS, TXTRecordValue } from './Types';

export const FederationModal: FC<{ onClose: () => void }> = ({
	onClose,
	...props
}): ReactElement => {
	const t = useTranslation();

	// State
	const [currentStep, setCurrentStep] = useState(1);
	const [currentTab, setCurrentTab] = useState(1);

	// Settings
	const siteUrl = useSetting('Site_Url') as string;
	const { protocol, hostname: rocketChatDomain, port: rocketChatPort } = new URL(siteUrl);
	const rocketChatProtocol = protocol.slice(0, -1);

	const federationDomain = useSetting('FEDERATION_Domain') as string;
	const setFederationDomain = useSettingSetValue('FEDERATION_Domain');

	let federationSubdomain = '';
	const parsedDomain = parseDomain(federationDomain);
	if ((parsedDomain as ParsedDomain)?.subdomain) {
		federationSubdomain = (parsedDomain as ParsedDomain).subdomain || '';
	}

	const federationDiscoveryMethod = useSetting('FEDERATION_Discovery_Method') as string;
	const setFederationDiscoveryMethod = useSettingSetValue('FEDERATION_Discovery_Method');

	const federationPublicKey = useSetting('FEDERATION_Public_Key') as string;

	// Form
	const discoveryOptions: SelectOptions = [
		['dns', 'DNS (recommended)'],
		['hub', 'HUB'],
	];

	const initialValues = {
		domain: federationDomain,
		discoveryMethod: federationDiscoveryMethod,
	};
	const { values, handlers, hasUnsavedChanges, commit } = useForm(initialValues);

	const { domain, discoveryMethod } = values as { domain: string; discoveryMethod: string };
	const { handleDomain, handleDiscoveryMethod } = handlers;

	const onChangeDomain = useMutableCallback((value) => {
		handleDomain(value);
	});

	const onChangeDiscoveryMethod = useMutableCallback((value) => {
		handleDiscoveryMethod(value);
	});

	// Wizard
	const nextStep = useCallback(() => {
		if (currentStep === 1 && hasUnsavedChanges) {
			setFederationDomain(domain);
			setFederationDiscoveryMethod(discoveryMethod);
			commit();
		}

		if (currentStep === 3) {
			onClose();
		} else {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, hasUnsavedChanges, domain, discoveryMethod]);

	const previousStep = useCallback(() => {
		if (currentStep === 1) {
			onClose();
		} else {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	// Resolve DNS
	const resolvedSRVString = useSetting('FEDERATION_ResolvedSRV') as string;
	const resolvedSRV: Record<DNSRecordName, string | number> = JSON.parse(resolvedSRVString || '{}');

	const resolvedPublicKeyTXT = useSetting('FEDERATION_ResolvedPublicKeyTXT') as string;
	const resolvedProtocolTXT = useSetting('FEDERATION_ResolvedProtocolTXT') as string;

	const resolvedDNS: ResolvedDNS = {
		srv: resolvedSRV,
		txt: {
			[TXTRecordValue.PUBLIC_KEY]: resolvedPublicKeyTXT,
			[TXTRecordValue.PROTOCOL]: resolvedProtocolTXT,
		},
	};

	return (
		<Modal {...props}>
			{currentStep === 1 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<FieldGroup>
							<Field>
								<Field.Label>{t('Federation_Domain')}</Field.Label>
								<Field.Description>{t('Federation_Domain_details')}</Field.Description>
								<Field.Row>
									<TextInput placeholder='rocket.chat' value={domain} onChange={onChangeDomain} />
								</Field.Row>
							</Field>
							<Field>
								<Field.Label>{t('Federation_Discovery_method')}</Field.Label>
								<Field.Description>{t('Federation_Discovery_method_details')}</Field.Description>
								<Field.Row>
									<Select
										width='250px'
										value={discoveryMethod || 'dns'}
										options={discoveryOptions}
										onChange={onChangeDiscoveryMethod}
									/>
								</Field.Row>
							</Field>
						</FieldGroup>
					</Modal.Content>
				</>
			)}
			{currentStep === 2 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation_Adding_to_your_server')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Tabs>
							<Tabs.Item selected={currentTab === 1} onClick={() => setCurrentTab(1)}>
								Configure DNS
							</Tabs.Item>
							<Tabs.Item selected={currentTab === 2} onClick={() => setCurrentTab(2)}>
								Legacy Support
							</Tabs.Item>
						</Tabs>
						<Box style={{ marginTop: 30 }}>
							{currentTab === 1 && (
								<DNSRecords
									federationSubdomain={federationSubdomain}
									federationPublicKey={federationPublicKey}
									rocketChatProtocol={rocketChatProtocol}
									rocketChatDomain={rocketChatDomain}
									rocketChatPort={rocketChatPort}
									resolvedEntries={resolvedDNS}
								/>
							)}
							{currentTab === 2 && (
								<>
									<Box style={{ marginBottom: 15 }}>
										<b>If your DNS provider does not support SRV records with _http or _https</b>
										<p style={{ marginTop: 8 }}>
											Some DNS providers will not allow setting _https or _http on SRV records, so
											we have support for those cases, using our old DNS record resolution method.
										</p>
									</Box>
									<DNSRecords
										federationSubdomain={federationSubdomain}
										federationPublicKey={federationPublicKey}
										rocketChatProtocol={rocketChatProtocol}
										rocketChatDomain={rocketChatDomain}
										rocketChatPort={rocketChatPort}
										resolvedEntries={resolvedDNS}
										legacy={true}
									/>
								</>
							)}
						</Box>
					</Modal.Content>
				</>
			)}
			{currentStep === 3 && (
				<>
					<Modal.Header>
						<Modal.Title>{t('Federation_Adding_users_from_another_server')}</Modal.Title>
						<Modal.Close onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
							<Box display='flex' flexDirection='column' alignItems='stretch' flexGrow={1}>
								<Box style={{ fontWeight: 600 }}>
									{t('Federation_Inviting_users_from_another_server')}
								</Box>
								<Box style={{ marginTop: 20 }}>
									{t('Federation_Search_users_you_want_to_connect')}
								</Box>
								<Box style={{ marginTop: 20, paddingLeft: '1em' }}>
									<ul style={{ listStyle: 'disc', listStylePosition: 'inside' }}>
										<li>{t('Federation_Username')}</li>
										<li>{t('Federation_Email')}</li>
									</ul>
								</Box>
								<Box style={{ marginTop: 20 }}>
									{t('Federation_You_will_invite_users_without_login_access')}
								</Box>
								<ButtonGroup align='start' style={{ marginTop: 20 }}>
									<Button primary small>
										{t('Federation_Invite_User')}
									</Button>
								</ButtonGroup>
								<Banner style={{ marginTop: 20 }}>
									<h2 style={{ fontWeight: 600 }}>
										{t('Federation_Invite_Users_To_Private_Rooms')}
									</h2>
									<p>{t('Federation_Channels_Will_Be_Replicated')}</p>
								</Banner>
							</Box>
						</Box>
					</Modal.Content>
				</>
			)}
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={previousStep}>{currentStep === 1 ? t('Cancel') : t('Back')}</Button>
					<Button primary onClick={nextStep}>
						{currentStep === 3 ? t('Finish') : t('Next')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};
