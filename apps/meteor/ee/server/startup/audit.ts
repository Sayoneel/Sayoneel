import { License } from '@rocket.chat/license';

import { createPermissions } from '../lib/audit/startup';

await License.onLicense('auditing', async () => {
	await import('../lib/audit/methods');
	await import('../lib/audit/endpoints');

	await createPermissions();
});
