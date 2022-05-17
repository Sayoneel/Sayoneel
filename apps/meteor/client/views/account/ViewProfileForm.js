import { Field, FieldGroup, Box, Button } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useMethod, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useEffect, useState } from 'react';

import { validateEmail } from '../../../lib/emailValidator';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../components/UserStatus';
import UserAvatarEditor from '../../components/avatar/UserAvatarEditor';
import { useEndpointData } from '../../hooks/useEndpointData';
import AccountInfo from './ViewAccountInfo';

function ViewProfileForm({ values, handlers, user, settings, ...props }) {
	const t = useTranslation();

	const checkUsernameAvailability = useMethod('checkUsernameAvailability');
	const getAvatarSuggestions = useMethod('getAvatarSuggestion');

	const [usernameError, setUsernameError] = useState();
	const [avatarSuggestions, setAvatarSuggestions] = useSafely(useState());

	const { allowUserAvatarChange, namesRegex, requireName } = settings;

	const { realname, email, username, password, confirmationPassword, statusText } = values;

	const { handleConfirmationPassword, handleAvatar } = handlers;

	const passwordError = useMemo(
		() => (!password || !confirmationPassword || password === confirmationPassword ? undefined : t('Passwords_do_not_match')),
		[t, password, confirmationPassword],
	);
	const emailError = useMemo(() => (validateEmail(email) ? undefined : 'error-invalid-email-address'), [email]);
	const checkUsername = useDebouncedCallback(
		async (username) => {
			if (user.username === username) {
				return setUsernameError(undefined);
			}
			if (!namesRegex.test(username)) {
				return setUsernameError(t('error-invalid-username'));
			}
			const isAvailable = await checkUsernameAvailability(username);
			if (!isAvailable) {
				return setUsernameError(t('Username_already_exist'));
			}
			setUsernameError(undefined);
		},
		400,
		[namesRegex, t, user.username, checkUsernameAvailability, setUsernameError],
	);

	useEffect(() => {
		const getSuggestions = async () => {
			const suggestions = await getAvatarSuggestions();
			setAvatarSuggestions(suggestions);
		};
		getSuggestions();
	}, [getAvatarSuggestions, setAvatarSuggestions]);

	useEffect(() => {
		checkUsername(username);
	}, [checkUsername, username]);

	useEffect(() => {
		if (!password) {
			handleConfirmationPassword('');
		}
	}, [password, handleConfirmationPassword]);

	const nameError = useMemo(() => {
		if (user.name === realname) {
			return undefined;
		}
		if (!realname && requireName) {
			return t('Field_required');
		}
	}, [realname, requireName, t, user.name]);

	const statusTextError = useMemo(() => {
		if (statusText && statusText.length > USER_STATUS_TEXT_MAX_LENGTH) {
			return t('Max_length_is', USER_STATUS_TEXT_MAX_LENGTH);
		}

		return undefined;
	}, [statusText, t]);
	const {
		emails: [],
	} = user;

	const handleSubmit = useCallback((e) => {
		e.preventDefault();
	}, []);

	// Refetch user data so that we can get createdAt field.
	const { value: data } = useEndpointData(
		'users.info',
		useMemo(() => ({ ...(username && { username }) }), [username]),
	);

	const userWithCredit = useMemo(() => {
		const { user } = data || { user: {} };
		return user || {};
	}, [data]);

	const dummyCredit = {
		gateway: 'bank-transfer',
		quantity: 7,
		amount: 500,
		currency: 'USD',
	};

	const buyCredit = useMemo(() => {
		if (!user.credit) {
			Meteor.call('buyCredit', dummyCredit, (error, result) => {
				if (result) {
					console.log('Bought credit');
				}
				if (error) {
					console.log(error);
				}
			});
		}
	}, [user.credit]);

	const setRandomTrustScore = useMemo(() => {
		if (!user.trustScore) {
			Meteor.call('setRandomTrustScore', (error, result) => {
				if (result) {
					console.log('Set a random trust score');
				}
				if (error) {
					console.log(error);
				}
			});
		}
	}, [user.trustScore]);

	const careerItems = [
		{ icon: 'user', content: 'Employee/er/broker', rc: true },
		{ icon: 'credit', content: `Credit point: ${userWithCredit.credit ? userWithCredit.credit : 0}`, rc: false },
		{ icon: 'trust-score', content: `Trust score: ${userWithCredit.trustScore ? userWithCredit.trustScore * 100 : 0}/100`, rc: false },
	];

	const privateInfo = [
		{ icon: 'mail', content: `${email}`, rc: true },
		{ icon: 'phone', content: '+254 730430234', rc: true },
		{ icon: 'gender', content: 'Male', rc: false },
	];

	const services = [
		{ icon: 'lock', content: 'Update profile/Chan', rc: true },
		{ icon: 'info', content: 'Customer support', rc: false },
		{ icon: 'credit-card', content: 'Verify identity', rc: false },
		{ icon: 'info', content: 'About us', rc: false },
	];

	return (
		<FieldGroup is='form' style={{ marginTop: '0px !important' }} autoComplete='off' onSubmit={handleSubmit} {...props}>
			{useMemo(
				() => (
					<Field>
						<UserAvatarEditor
							etag={user.avatarETag}
							currentUsername={user.username}
							username={username}
							setAvatarObj={handleAvatar}
							disabled={!allowUserAvatarChange}
							suggestions={avatarSuggestions}
							userId={user._id}
						/>
					</Field>
				),
				[username, user.username, handleAvatar, allowUserAvatarChange, avatarSuggestions, user.avatarETag],
			)}
			<Box style={{ margin: '0px auto', fontSize: '16px' }}>{user.bio ? user.bio : 'No user bio...'}</Box>
			<Box display='flex' flexDirection='column' style={{ marginTop: '30px' }}>
				<AccountInfo title={t('Career')} items={careerItems} />
				<AccountInfo title={t('Private Information')} items={privateInfo} />
				<AccountInfo title={t('Services')} items={services} />
			</Box>
		</FieldGroup>
	);
}

export default ViewProfileForm;
