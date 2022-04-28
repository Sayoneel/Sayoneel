/* eslint-disable @typescript-eslint/no-use-before-define */
import { Box, Callout, Chip, Divider, Margins } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import ExternalLink from '../../../components/ExternalLink';
import AppAvatar from '../../../components/avatar/AppAvatar';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';
import ScreenshotCarouselAnchor from './components/ScreenshotCarouselAnchor';
import { App } from './types';

type AppDetailsPageContentProps = {
	app: App;
};

const AppDetailsPageContent: FC<AppDetailsPageContentProps> = ({ app }) => {
	const t = useTranslation();

	const {
		author: { homepage, support },
		description,
		categories = [],
		bundledIn,
	} = app;

	return (
		<Box maxWidth='x640' w='full' marginInline='auto'>
			{app.licenseValidation && (
				<>
					{Object.entries(app.licenseValidation.warnings).map(([key]) => (
						<Callout key={key} type='warning'>
							{t(`Apps_License_Message_${key}` as TranslationKey)}
						</Callout>
					))}

					{Object.entries(app.licenseValidation.errors).map(([key]) => (
						<Callout key={key} type='danger'>
							{t(`Apps_License_Message_${key}` as TranslationKey)}
						</Callout>
					))}
				</>
			)}

			<Box display='flex' flexDirection='column'>
				<Margins block='x12'>
					<ScreenshotCarouselAnchor />

					<Box fontScale='h4'>{t('Categories')}</Box>
					<Box display='flex' flexDirection='row'>
						{categories?.map((current) => (
							<Chip key={current} textTransform='uppercase' mie='x8'>
								<Box color='hint'>{current}</Box>
							</Chip>
						))}
					</Box>

					<Box fontScale='h4'>{t('Contact')}</Box>
					<Box display='flex' flexDirection='row' flexGrow={1} justifyContent='space-around' flexWrap='wrap'>
						<Box display='flex' flexDirection='column' mie='x12' flexGrow={1}>
							<Box fontScale='h4' color='hint'>
								{t('Author_Site')}
							</Box>
							<ExternalLink to={homepage} />
						</Box>
						<Box display='flex' flexDirection='column' flexGrow={1}>
							<Box fontScale='h4' color='hint'>
								{t('Support')}
							</Box>
							<ExternalLink to={support} />
						</Box>
					</Box>

					<Box fontScale='h4'>{t('Details')}</Box>
					<Box display='flex' flexDirection='row'>
						{description}
					</Box>
				</Margins>
			</Box>
			{bundledIn && (
				<>
					<Divider />
					<Box display='flex' flexDirection='column'>
						<Margins block='x12'>
							<Box fontScale='h4'>{t('Bundles')}</Box>
							{bundledIn.map((bundle) => (
								<Box key={bundle.bundleId} display='flex' flexDirection='row' alignItems='center'>
									<Box
										width='x80'
										height='x80'
										display='flex'
										flexDirection='row'
										justifyContent='space-around'
										flexWrap='wrap'
										flexShrink={0}
									>
										{bundle.apps.map((app) => (
											<AppAvatar
												size='x36'
												key={app.latest.name}
												iconFileContent={app.latest.iconFileContent}
												iconFileData={app.latest.iconFileData}
											/>
										))}
									</Box>
									<Box display='flex' flexDirection='column' mis='x12'>
										<Box fontScale='p2m'>{bundle.bundleName}</Box>
										{bundle.apps.map((app) => (
											<Box key={app.latest.name}>{app.latest.name},</Box>
										))}
									</Box>
								</Box>
							))}
						</Margins>
					</Box>
				</>
			)}
		</Box>
	);
};

export default AppDetailsPageContent;
