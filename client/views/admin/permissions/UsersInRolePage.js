import { Box, Field, Margins, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useRef } from 'react';

import Page from '../../../components/Page';
import RoomAutoComplete from '../../../components/RoomAutoComplete';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import UsersInRoleTableContainer from './UsersInRoleTableContainer';

const UsersInRolePage = ({ data }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const reload = useRef();

	const [rid, setRid] = useState();
	const [userError, setUserError] = useState();

	const { values, handlers } = useForm({ users: [] });
	const { users } = values;
	const { handleUsers } = handlers;

	const { _id, name, description } = data;

	const router = useRoute('admin-permissions');

	const addUser = useEndpoint('POST', 'roles.addUserToRole');

	const handleReturn = useMutableCallback(() => {
		router.push({
			context: 'edit',
			_id,
		});
	});

	const handleAdd = useMutableCallback(async () => {
		if (users.length === 0) {
			return setUserError(t('User_cant_be_empty'));
		}

		try {
			users.map(async (u) => {
				await addUser({ roleName: _id, username: u, roomId: rid });
				dispatchToastMessage({ type: 'success', message: t('User_added') });
				reload.current();
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleUserChange = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	return (
		<Page>
			<Page.Header title={`${t('Users_in_role')} "${description || name}"`}>
				<ButtonGroup>
					<Button onClick={handleReturn}>{t('Back')}</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Box display='flex' flexDirection='column' w='full' mi='neg-x4'>
					<Margins inline='x4'>
						{data.scope !== 'Users' && (
							<Field mbe='x4'>
								<Field.Label>{t('Choose_a_room')}</Field.Label>
								<Field.Row>
									<RoomAutoComplete value={rid} onChange={setRid} placeholder={t('User')} />
								</Field.Row>
							</Field>
						)}
						<Field>
							<Field.Label>{t('Add_user')}</Field.Label>
							<Field.Row>
								<UserAutoCompleteMultiple
									value={users}
									onChange={handleUserChange}
									placeholder={t('User')}
								/>

								<ButtonGroup mis='x8' align='end'>
									<Button primary onClick={handleAdd} disabled={!users.length}>
										{t('Add')}
									</Button>
								</ButtonGroup>
							</Field.Row>
							<Field.Error>{userError}</Field.Error>
						</Field>
					</Margins>
				</Box>
				<Margins blockStart='x8'>
					{(data.scope === 'Users' || rid) && (
						<UsersInRoleTableContainer
							reloadRef={reload}
							scope={data.scope}
							rid={rid}
							roleId={_id}
							roleName={name}
							description={description}
						/>
					)}
					{data.scope !== 'Users' && !rid && <Callout type='info'>{t('Select_a_room')}</Callout>}
				</Margins>
			</Page.Content>
		</Page>
	);
};

export default UsersInRolePage;
