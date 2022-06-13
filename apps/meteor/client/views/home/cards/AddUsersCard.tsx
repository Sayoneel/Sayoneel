import { Button } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import CardBody from '../../../components/Card/Body';
import Card from '../../../components/Card/Card';
import CardFooterWrapper from '../../../components/Card/CardFooterWrapper';
import CardIcon from '../../../components/Card/CardIcon';
import CardTitle from '../../../components/Card/Title';

// Add users card for homepage
// Should only be visible for admins
const AddUsersCard = (): ReactElement => {
	const t = useTranslation();

	const adminUsersRoute = useRoute('admin-users');
	const handleOpenUsersRoute = (): void => {
		adminUsersRoute.push({});
	};

	return (
		<Card variant='light'>
			<CardTitle>
				{t('Add_users')}
				<CardIcon name='info' mis='x4' />
			</CardTitle>

			<CardBody>{t('Homepage_card_add_users_description')}</CardBody>

			<CardFooterWrapper>
				<Button primary onClick={handleOpenUsersRoute}>
					{t('Add_users')}
				</Button>
			</CardFooterWrapper>
		</Card>
	);
};

export default AddUsersCard;
