import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../app/callbacks/lib/callbacks';
import { addLicense, setURL } from './license';

settings.watch('Site_Url', (value) => {
	if (value) {
		setURL(value);
	}
});

callbacks.add('workspaceLicenseChanged', (updatedLicense) => {
	addLicense(updatedLicense);
});
