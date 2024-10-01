import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import type { CardProps } from '../../FeatureUsageCard';
import FeatureUsageCard from '../../FeatureUsageCard';
import UpgradeButton from '../../UpgradeButton';
import AppsUsageCardSection from './AppsUsageCardSection';

// Magic numbers
const marketplaceAppsMaxCountFallback = 5;
const privateAppsMaxCountFallback = 0;
const defaultWarningThreshold = 80;

type AppsUsageCardProps = {
	privateAppsLimit?: { value?: number; max: number };
	marketplaceAppsLimit?: { value?: number; max: number };
};

const AppsUsageCard = ({ privateAppsLimit, marketplaceAppsLimit }: AppsUsageCardProps): ReactElement => {
	const { t } = useTranslation();

	if (!privateAppsLimit || !marketplaceAppsLimit) {
		// FIXME: not accessible enough
		return (
			<FeatureUsageCard card={{ title: t('Apps') }}>
				<Skeleton variant='rect' width='x112' height='x112' role='presentation' />
			</FeatureUsageCard>
		);
	}

	const marketplaceAppsCount = marketplaceAppsLimit?.value || 0;
	const marketplaceAppsMaxCount = marketplaceAppsLimit?.max || marketplaceAppsMaxCountFallback;
	const marketplaceAppsPercentage = Math.round((marketplaceAppsCount / marketplaceAppsMaxCount) * 100) || 0;
	const marketplaceAppsAboveWarning = marketplaceAppsPercentage >= defaultWarningThreshold;

	const privateAppsCount = privateAppsLimit?.value || 0;
	const privateAppsMaxCount = privateAppsLimit?.max || privateAppsMaxCountFallback;

	const card: CardProps = {
		title: t('Apps'),
		infoText:
			privateAppsCount > 0 ? (
				<Trans i18nKey='Apps_InfoText_limited' tOptions={{ marketplaceAppsMaxCount }}>
					Community workspaces can enable up to {{ marketplaceAppsMaxCount }} marketplace apps. Private apps can only be enabled in{' '}
					<Box is='a' href='https://www.rocket.chat/pricing' target='_blank' color='info'>
						premium plans
					</Box>
					.
				</Trans>
			) : (
				t('Apps_InfoText', { privateAppsMaxCount, marketplaceAppsMaxCount })
			),
		...(marketplaceAppsAboveWarning && {
			upgradeButton: (
				<UpgradeButton target='app-usage-card' action='upgrade' small>
					{t('Upgrade')}
				</UpgradeButton>
			),
		}),
	};

	return (
		<FeatureUsageCard card={card}>
			<AppsUsageCardSection
				title={t('Marketplace_apps')}
				appsCount={marketplaceAppsCount}
				appsMaxCount={marketplaceAppsMaxCount}
				warningThreshold={defaultWarningThreshold}
			/>

			<AppsUsageCardSection
				title={t('Private_apps')}
				tip={privateAppsMaxCount === 0 ? t('Private_apps_premium_message') : undefined}
				appsCount={privateAppsCount}
				appsMaxCount={privateAppsMaxCount}
				warningThreshold={defaultWarningThreshold}
			/>
		</FeatureUsageCard>
	);
};

export default AppsUsageCard;
