import { Box, Margins, Table, Avatar, Tag, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useCallback } from 'react';

import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useFormatDate } from '../../hooks/useFormatDate';
import { roomTypes } from '../../../app/utils/client';
import { useQuery } from './hooks';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function RoomTags({ room }) {
	const t = useTranslation();
	return <Box mi='x4' alignItems='center' display='flex'>
		<Margins inline='x2'>
			{room.default && <Tag variant='primary'>{t('default')}</Tag>}
			{room.featured && <Tag variant='primary'>{t('featured')}</Tag>}
		</Margins>
	</Box>;
}

function TeamsTable() {
	const t = useTranslation();
	const refAutoFocus = useAutoFocus(true);
	const [sort, setSort] = useState(['name', 'asc']);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const query = useQuery(params, sort);

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'usersCount'} direction={sort[1]} active={sort[0] === 'usersCount'} onClick={onHeaderClick} sort='usersCount' style={{ width: '100px' }}>{t('Users')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'channelsCount'} direction={sort[1]} active={sort[0] === 'channelsCount'} onClick={onHeaderClick} sort='channelsCount' style={{ width: '100px' }}>{t('Channels')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</GenericTable.HeaderCell>,
		mediaQuery && <GenericTable.HeaderCell key={'lastMessage'} direction={sort[1]} active={sort[0] === 'lastMessage'} onClick={onHeaderClick} sort='lastMessage' style={{ width: '150px' }}>{t('Last_Message')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery]);

	const channelsRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	// teams.list does not support queries for now
	// const { value: data = { result: [] } } = useEndpointData('teams.list', query);

	const { value: data = { result: [] } } = useEndpointData('teams.list');

	const onClick = useMemo(() => (name, type) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			type === 0 ? channelsRoute.push({ name }) : groupsRoute.push({ name });
		}
	}, [channelsRoute, groupsRoute]);

	const formatDate = useFormatDate();
	const renderRow = useCallback((team) => {
		const { _id, createdAt, name, type, usersCount, channelsCount, lastMessage, roomId } = team;
		const t = type === 0 ? 'c' : 'p';
		const avatarUrl = roomTypes.getConfig(t).getAvatarPath({ _id: roomId });

		return <Table.Row key={_id} onKeyDown={onClick(name, type)} onClick={onClick(name, type)} tabIndex={0} role='link' action>
			<Table.Cell>
				<Box display='flex'>
					<Box flexGrow={0}>
						<Avatar size='x40' title={name} url={avatarUrl} />
					</Box>
					<Box grow={1} mi='x8' style={style}>
						<Box display='flex' alignItems='center'>
							<Box fontScale='p2' mi='x4'>{name}</Box><RoomTags room={team} style={style} />
						</Box>
					</Box>
				</Box>
			</Table.Cell>
			<Table.Cell fontScale='p1' color='hint' style={style}>
				{usersCount}
			</Table.Cell>
			<Table.Cell fontScale='p1' color='hint' style={style}>
				{channelsCount}
			</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
				{formatDate(createdAt)}
			</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
				{lastMessage && formatDate(lastMessage.ts)}
			</Table.Cell>}
		</Table.Row>;
	}
	, [formatDate, mediaQuery, onClick]);

	return <GenericTable
		header={header}
		renderFilter={({ onChange, ...props }) => <FilterByText placeholder={t('Search_Teams')} inputRef={refAutoFocus} onChange={onChange} {...props} />}
		renderRow={renderRow}
		results={data.teams}
		setParams={setParams}
		total={data.total}
	/>;
}

export default function TeamsTab(props) {
	const canViewPublicRooms = usePermission('view-c-room');

	if (canViewPublicRooms) {
		return <TeamsTable {...props} />;
	}

	return <NotAuthorizedPage />;
}
