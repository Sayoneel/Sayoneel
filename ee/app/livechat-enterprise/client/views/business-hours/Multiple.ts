import { IBusinessHourBehavior } from '../../../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../../definition/ILivechatBusinessHour';

export class MultipleBusinessHoursBehavior implements IBusinessHourBehavior {
	getView(): string {
		return 'livechatBusinessHours';
	}

	showCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return !businessHourData._id || businessHourData.type !== LivechatBussinessHourTypes.DEFAULT;
	}

	showTimezoneTemplate(): boolean {
		return true;
	}

	showBackButton(): boolean {
		return true;
	}
}
