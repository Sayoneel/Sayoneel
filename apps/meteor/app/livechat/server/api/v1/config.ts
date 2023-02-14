import mem from 'mem';
import { isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';

const cachedSettings = mem(settings, { maxAge: 1000, cacheKey: JSON.stringify });

API.v1.addRoute(
	'livechat/config',
	{ validateParams: isGETLivechatConfigParams },
	{
		async get() {
			const enabled = Livechat.enabled();

			if (!enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department, businessUnit } = this.queryParams;

			const config = await cachedSettings({ businessUnit });

			const status = Livechat.online(department);
			const guest: ILivechatVisitor | null = token ? await Livechat.findGuest(token) : null;

			const room: IOmnichannelRoom | undefined = guest && token ? findOpenRoom(token) : undefined;
			const agent = guest && room && room.servedBy && findAgent(room.servedBy._id);

			const extra = await getExtraConfigInfo(room);
			return API.v1.success({
				config: { ...config, online: status, ...extra, ...(guest && { guest }), ...(room && { room }), ...(agent && { agent }) },
			});
		},
	},
);
