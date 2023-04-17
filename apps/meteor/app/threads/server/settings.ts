import { settingsRegistry } from '../../settings/server';

await settingsRegistry.addGroup('Threads', async function () {
	await this.add('Threads_enabled', true, {
		group: 'Threads',
		i18nLabel: 'Enable',
		type: 'boolean',
		public: true,
	});
});
