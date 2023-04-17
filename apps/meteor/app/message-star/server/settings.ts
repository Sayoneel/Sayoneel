import { settingsRegistry } from '../../settings/server';

await settingsRegistry.add('Message_AllowStarring', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});
