import { api } from '@rocket.chat/core-services';

import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { LDAPEEService } from '../local-services/ldap/service';
import { MessageReadsService } from '../local-services/message-reads/service';
import { InstanceService } from '../local-services/instance/service';
import { LicenseService } from '../../app/license/server/license.internalService';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { OmnichannelEE } from '../../app/livechat-enterprise/server/services/omnichannel.internalService';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
api.registerService(new MessageReadsService());
api.registerService(new OmnichannelEE());

// when not running micro services we want to start up the instance intercom
if (!isRunningMs()) {
	void (async (): Promise<void> => {
		const { FederationService } = await import('@rocket.chat/federation');

		api.registerService(await FederationService.createFederationService());
		api.registerService(new InstanceService());
	})();
}
