import type { App } from '@rocket.chat/core-typings';
import { Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AddonChip = ({ app }: { app: App }) => {
	const { t } = useTranslation();

	if (!app.addon) {
		return null;
	}

	return (
		<Tag variant='secondary' title={t('Requires_subscription_add-on')}>
			{t('Add-on')}
		</Tag>
	);
};

export default AddonChip;
