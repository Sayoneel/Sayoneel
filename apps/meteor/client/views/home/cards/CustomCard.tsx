import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import { useSettingSetValue, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import CustomHomepageContent from '../CustomHomePageContent';

const CustomCard = ({ isAdmin }: { isAdmin: boolean }): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { data } = useIsEnterprise();
	const isCustomContentBodyEmpty = useSetting('Layout_Home_Body') === '';
	const isCustomContentVisible = Boolean(useSetting('Layout_Home_Custom_Block_Visible'));
	const isCustomContentOnly = Boolean(useSetting('Layout_Custom_Body_Only'));

	const setCustomContentVisible = useSettingSetValue('Layout_Home_Custom_Block_Visible');
	const setCustomContentOnly = useSettingSetValue('Layout_Custom_Body_Only');

	const handleChangeCustomContentVisibility = async () => {
		try {
			await setCustomContentVisible(!isCustomContentVisible);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleOnlyShowCustomContent = async () => {
		try {
			await setCustomContentOnly(!isCustomContentOnly);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const isEnterprise = data?.isEnterprise;

	if (isAdmin) {
		return (
			<Card variant='light' data-qa-id='homepage-custom-card'>
				<Card.Title>
					<Tag data-qa-id='homepage-custom-content-visibility-tag'>
						<Icon mie='x4' name={isCustomContentBodyEmpty || !isCustomContentVisible ? 'eye-off' : 'eye'} size='x16' />
						{isCustomContentBodyEmpty || !isCustomContentVisible ? t('Not_Visible_To_Workspace') : t('Visible_To_Workspace')}
					</Tag>
				</Card.Title>
				<Box mb='x8' color='info'>
					{isCustomContentBodyEmpty ? t('Homepage_Custom_Content_Default_Message') : <CustomHomepageContent />}
				</Box>
				<Card.FooterWrapper>
					<Card.Footer>
						<Button is='a' href='/admin/settings/Layout' title={t('Layout_Home_Page_Content')}>
							{t('Customize_Content')}
						</Button>
						<Button
							disabled={isCustomContentBodyEmpty}
							title={!isCustomContentVisible ? t('Now_Its_Available_Only_For_Admins') : t('Now_Its_Available_For_Everyone')}
							onClick={handleChangeCustomContentVisibility}
							data-qa-id='homepage-custom-content-visibility-button'
						>
							<Icon mie='x4' name='eye-off' size='x16' />
							{t('Show_To_Workspace')}
						</Button>
						<Button
							disabled={isCustomContentBodyEmpty || !isEnterprise}
							title={t('It_Will_Hide_All_Other_White_Blocks_In_The_Homepage')}
							onClick={handleOnlyShowCustomContent}
							data-qa-id='homepage-custom-content-only-button'
						>
							<Icon name='lightning' size='x16' /> {!isCustomContentOnly ? t('Show_Only_This_Content') : t('Show_default_content')}
						</Button>
					</Card.Footer>
				</Card.FooterWrapper>
			</Card>
		);
	}

	if (isCustomContentVisible) {
		return <CustomHomepageContent />;
	}

	return <></>;
};

export default CustomCard;
