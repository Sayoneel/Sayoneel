import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../../../client/views/room/contexts/RoomToolboxContext';
import { useExternalComponentsQuery } from '../../apps/gameCenter/hooks/useExternalComponentsQuery';

const GameCenter = lazy(() => import('../../apps/gameCenter/GameCenter'));

export const useGameCenterRoomAction = (): RoomToolboxActionConfig | undefined => {
	const result = useExternalComponentsQuery();
	const enabled = result.isSuccess && result.data.length > 0;

	return useMemo(() => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'game-center',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Apps_Game_Center',
			icon: 'game',
			template: GameCenter,
			order: -1,
		};
	}, [enabled]);
};
