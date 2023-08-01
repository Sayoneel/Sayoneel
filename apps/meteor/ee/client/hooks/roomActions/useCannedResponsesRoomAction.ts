import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../../../client/views/room/contexts/RoomToolboxContext';
import { useHasLicenseModule } from '../useHasLicenseModule';

const CannedResponse = lazy(() => import('../../omnichannel/components/contextualBar/CannedResponse'));

export const useCannedResponsesRoomAction = (): RoomToolboxActionConfig | undefined => {
	const licensed = useHasLicenseModule('canned-responses') === true;
	const enabled = useSetting('Canned_Responses_Enable', false);

	return useMemo(() => {
		if (!licensed || !enabled) {
			return undefined;
		}

		return {
			id: 'canned-responses',
			groups: ['live'],
			title: 'Canned_Responses',
			icon: 'canned-response',
			template: CannedResponse,
			order: 0,
		};
	}, [enabled, licensed]);
};
