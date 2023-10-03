import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Subscriptions, Users } from '@rocket.chat/models';

import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { getAppCount } from './lib/getAppCount';

settings.watch<string>('Site_Url', (value) => {
	if (value) {
		void License.setWorkspaceUrl(value);
	}
});

callbacks.add('workspaceLicenseChanged', async (updatedLicense) => {
	try {
		await License.setLicense(updatedLicense);
	} catch (_error) {
		// Ignore
	}
});

License.setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
License.setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
License.setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));
License.setLicenseLimitCounter('privateApps', () => getAppCount('private'));
License.setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
// #TODO: Get real value
License.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);

const updateCronJob = async () => {
	if (License.hasValidLicense() === (await cronJobs.has('licenseLimitChecker'))) {
		return;
	}

	if (License.hasValidLicense()) {
		await cronJobs.add('licenseLimitChecker', '*/30 * * * *', () => License.revalidateLimits());
	} else {
		await cronJobs.remove('licenseLimitChecker');
	}
};

License.onValidateLicense(async () => updateCronJob());
License.onInvalidateLicense(async () => updateCronJob());
void updateCronJob();
