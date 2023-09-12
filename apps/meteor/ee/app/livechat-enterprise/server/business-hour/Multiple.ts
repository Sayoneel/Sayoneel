import { type ILivechatDepartment, type ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';
import moment from 'moment';

import { businessHourManager } from '../../../../../app/livechat/server/business-hour';
import type { IBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import {
	filterBusinessHoursThatMustBeOpened,
	filterBusinessHoursThatMustBeOpenedByDay,
} from '../../../../../app/livechat/server/business-hour/Helper';
import { settings } from '../../../../../app/settings/server';
import { isTruthy } from '../../../../../lib/isTruthy';
import { bhLogger } from '../lib/logger';
import { closeBusinessHour, openBusinessHour, removeBusinessHourByAgentIds } from './Helper';

interface IBusinessHoursExtraProperties extends ILivechatBusinessHour {
	timezoneName: string;
	departmentsToApplyBusinessHour: string;
}

export class MultipleBusinessHoursBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	constructor() {
		super();
		this.onAddAgentToDepartment = this.onAddAgentToDepartment.bind(this);
		this.onRemoveAgentFromDepartment = this.onRemoveAgentFromDepartment.bind(this);
		this.onRemoveDepartment = this.onRemoveDepartment.bind(this);
		this.onDepartmentArchived = this.onDepartmentArchived.bind(this);
		this.onDepartmentDisabled = this.onDepartmentDisabled.bind(this);
		this.onNewAgentCreated = this.onNewAgentCreated.bind(this);
	}

	async onStartBusinessHours(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromAllUsers();
		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');
		const day = currentTime.format('dddd');
		const activeBusinessHours = await this.BusinessHourRepository.findActiveAndOpenBusinessHoursByDay(day, {
			projection: {
				workHours: 1,
				timezone: 1,
				type: 1,
				active: 1,
			},
		});
		const businessHoursToOpen = await filterBusinessHoursThatMustBeOpened(activeBusinessHours);
		bhLogger.debug({
			msg: 'Starting Multiple Business Hours',
			totalBusinessHoursToOpen: businessHoursToOpen.length,
			top10BusinessHoursToOpen: businessHoursToOpen.slice(0, 10),
		});
		for (const businessHour of businessHoursToOpen) {
			void this.openBusinessHour(businessHour);
		}
	}

	async openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, undefined, {
			projection: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			void this.openBusinessHour(businessHour);
		}
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, undefined, {
			projection: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			void this.closeBusinessHour(businessHour);
		}
	}

	async afterSaveBusinessHours(businessHourData: IBusinessHoursExtraProperties): Promise<void> {
		const departments = businessHourData.departmentsToApplyBusinessHour?.split(',').filter(Boolean);
		const currentDepartments = businessHourData.departments?.map((dept: any) => dept._id);
		const toRemove = [...(currentDepartments || []).filter((dept: Record<string, any>) => !departments.includes(dept._id))];
		await this.removeBusinessHourFromRemovedDepartmentsUsersIfNeeded(businessHourData._id, toRemove);
		const businessHour = await this.BusinessHourRepository.findOneById(businessHourData._id);
		if (!businessHour) {
			return;
		}
		const businessHourIdToOpen = (await filterBusinessHoursThatMustBeOpened([businessHour])).map((businessHour) => businessHour._id);
		if (!businessHourIdToOpen.length) {
			return closeBusinessHour(businessHour);
		}
		return openBusinessHour(businessHour);
	}

	async onAddAgentToDepartment(options: { departmentId: string; agentsId: string[] }): Promise<any> {
		const { departmentId, agentsId } = options;
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'businessHourId'>>(departmentId, {
			projection: { businessHourId: 1 },
		});
		if (!department || !agentsId.length) {
			return options;
		}
		const defaultBusinessHour = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBusinessHour) {
			return options;
		}
		if (!department.businessHourId) {
			// If this department doesn't have a business hour, we need to apply default business hour to these agents
			// And then reset their status based on these BH
			const isDefaultBusinessHourActive = (await filterBusinessHoursThatMustBeOpened([defaultBusinessHour])).length > 0;
			if (!isDefaultBusinessHourActive) {
				bhLogger.debug('Default business hour is not active. No need to apply it to agents');
				return options;
			}

			await this.UsersRepository.addBusinessHourByAgentIds(agentsId, defaultBusinessHour._id);
			await this.UsersRepository.makeAgentsWithinBusinessHourAvailable(agentsId);

			return options;
		}

		// This department has a business hour, so we need to
		// 1. Remove default business hour from these agents if they have it
		// 2. Add this department's business hour to these agents
		// 3. Update their status based on these BH
		await removeBusinessHourByAgentIds(agentsId, defaultBusinessHour._id);

		const businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
		if (!businessHour) {
			return options;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([businessHour]);
		if (!businessHourToOpen.length) {
			return options;
		}
		await this.UsersRepository.addBusinessHourByAgentIds(agentsId, businessHour._id);
		await this.UsersRepository.makeAgentsWithinBusinessHourAvailable(agentsId);

		return options;
	}

	async onRemoveAgentFromDepartment(options: Record<string, any> = {}): Promise<any> {
		const { departmentId, agentsId } = options;
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'businessHourId'>>(departmentId, {
			projection: { businessHourId: 1 },
		});
		if (!department || !agentsId.length) {
			return options;
		}
		return this.handleRemoveAgentsFromDepartments(department, agentsId, options);
	}

	async onRemoveDepartment(options: { department: ILivechatDepartment; agentsIds: string[] }): Promise<any> {
		bhLogger.debug(`onRemoveDepartment: department ${options.department._id} removed`);
		const { department, agentsIds } = options;
		if (!department || !agentsIds?.length) {
			return options;
		}
		return this.onDepartmentDisabled(department);
	}

	async onDepartmentDisabled(department: ILivechatDepartment): Promise<void> {
		if (!department.businessHourId) {
			bhLogger.debug({
				msg: 'onDepartmentDisabled: department has no business hour',
				departmentId: department._id,
			});
			return;
		}

		// Get business hour
		let businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
		if (!businessHour) {
			bhLogger.error({
				msg: 'onDepartmentDisabled: business hour not found',
				businessHourId: department.businessHourId,
			});
			return;
		}

		// Unlink business hour from department
		await LivechatDepartment.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId([department._id], businessHour._id);

		// cleanup user's cache for default business hour and this business hour
		const defaultBH = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBH) {
			bhLogger.error('onDepartmentDisabled: default business hour not found');
			throw new Error('Default business hour not found');
		}
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds([businessHour._id, defaultBH._id]);

		// If i'm the only one, disable the business hour
		const imTheOnlyOne = !(await LivechatDepartment.countByBusinessHourIdExcludingDepartmentId(businessHour._id, department._id));
		if (imTheOnlyOne) {
			bhLogger.warn({
				msg: 'onDepartmentDisabled: department is the only one on business hour, disabling it',
				departmentId: department._id,
				businessHourId: businessHour._id,
			});
			await this.BusinessHourRepository.disableBusinessHour(businessHour._id);

			businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
			if (!businessHour) {
				bhLogger.error({
					msg: 'onDepartmentDisabled: business hour not found',
					businessHourId: department.businessHourId,
				});

				throw new Error(`Business hour ${department.businessHourId} not found`);
			}
		}

		// start default business hour and this BH if needed
		if (!settings.get('Livechat_enable_business_hours')) {
			bhLogger.debug(`onDepartmentDisabled: business hours are disabled. skipping`);
			return;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([businessHour, defaultBH]);
		for await (const bh of businessHourToOpen) {
			bhLogger.debug({
				msg: 'onDepartmentDisabled: opening business hour',
				businessHourId: bh._id,
			});
			await openBusinessHour(bh, false);
		}

		await Users.updateLivechatStatusBasedOnBusinessHours();

		await businessHourManager.restartCronJobsIfNecessary();

		bhLogger.debug({
			msg: 'onDepartmentDisabled: successfully processed department disabled event',
			departmentId: department._id,
		});
	}

	async onDepartmentArchived(department: Pick<ILivechatDepartment, '_id'>): Promise<void> {
		bhLogger.debug('Processing department archived event on multiple business hours', department);
		const dbDepartment = await LivechatDepartment.findOneById(department._id, { projection: { businessHourId: 1, _id: 1 } });

		if (!dbDepartment) {
			bhLogger.error(`No department found with id: ${department._id} when archiving it`);
			return;
		}

		return this.onDepartmentDisabled(dbDepartment);
	}

	allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}

	async onNewAgentCreated(agentId: string): Promise<void> {
		bhLogger.debug({
			msg: 'Executing onNewAgentCreated for agent',
			agentId,
		});

		await this.applyAnyOpenBusinessHourToAgent(agentId);

		await Users.updateLivechatStatusBasedOnBusinessHours([agentId]);
	}

	private async applyAnyOpenBusinessHourToAgent(agentId: string): Promise<void> {
		const currentTime = moment().utc();
		const day = currentTime.format('dddd');
		const allActiveBusinessHoursForEntireWeek = await this.BusinessHourRepository.findActiveBusinessHours({
			projection: {
				workHours: 1,
				timezone: 1,
				type: 1,
				active: 1,
			},
		});
		const openedBusinessHours = await filterBusinessHoursThatMustBeOpenedByDay(allActiveBusinessHoursForEntireWeek, day);
		if (!openedBusinessHours.length) {
			bhLogger.debug({
				msg: 'Business hour status check failed for agent. No opened business hour found for the current day',
				agentId,
			});
			return;
		}

		const agentDepartments = await LivechatDepartmentAgents.find(
			{ departmentEnabled: true, agentId },
			{ projection: { agentId: 1, departmentId: 1 } },
		).toArray();

		if (!agentDepartments.length) {
			// check if default businessHour is active
			const isDefaultBHActive = openedBusinessHours.find(({ type }) => type === LivechatBusinessHourTypes.DEFAULT);
			if (isDefaultBHActive?._id) {
				await Users.openAgentBusinessHoursByBusinessHourIdsAndAgentId([isDefaultBHActive._id], agentId);

				bhLogger.debug({
					msg: 'Business hour status check passed for agent. Found default business hour to be active',
					agentId,
				});
				return;
			}

			bhLogger.debug({
				msg: 'Business hour status check failed for agent. Found default business hour to be inactive',
				agentId,
			});
			return;
		}

		// check if any one these departments have a opened business hour linked to it
		const departments = (await LivechatDepartment.findInIds(
			agentDepartments.map(({ departmentId }) => departmentId),
			{ projection: { _id: 1, businessHourId: 1 } },
		).toArray()) as Pick<ILivechatDepartment, '_id' | 'businessHourId'>[];

		const departmentsWithActiveBH = departments.filter(
			({ businessHourId }) => businessHourId && openedBusinessHours.findIndex(({ _id }) => _id === businessHourId) !== -1,
		);

		if (!departmentsWithActiveBH.length) {
			// No opened business hour found for any of the departments connected to the agent
			// check if this agent has any departments that is connected to any non-default business hour
			// if no such departments found then check default BH and if it is active, then allow the agent to change service status
			const hasAtLeastOneDepartmentWithNonDefaultBH = departments.some(({ businessHourId }) => {
				// check if business hour is active
				return businessHourId && allActiveBusinessHoursForEntireWeek.findIndex(({ _id }) => _id === businessHourId) !== -1;
			});
			if (!hasAtLeastOneDepartmentWithNonDefaultBH) {
				const isDefaultBHActive = openedBusinessHours.find(({ type }) => type === LivechatBusinessHourTypes.DEFAULT);
				if (isDefaultBHActive?._id) {
					await Users.openAgentBusinessHoursByBusinessHourIdsAndAgentId([isDefaultBHActive._id], agentId);

					bhLogger.debug({
						msg: 'Business hour status check passed for agentId. Found default business hour to be active and agent has no departments with non-default business hours',
						agentId,
					});
					return;
				}
			}
			bhLogger.debug({
				msg: 'Business hour status check failed for agent. No opened business hour found for any of the departments connected to the agent',
				agentId,
			});
			return;
		}

		const activeBusinessHoursForAgent = departmentsWithActiveBH.map(({ businessHourId }) => businessHourId).filter(isTruthy);
		await Users.openAgentBusinessHoursByBusinessHourIdsAndAgentId(activeBusinessHoursForAgent, agentId);

		bhLogger.debug({
			msg: `Business hour status check passed for agent. Found opened business hour for departments connected to the agent`,
			activeBusinessHoursForAgent,
		});
	}

	private async handleRemoveAgentsFromDepartments(department: Record<string, any>, agentsIds: string[], options: any): Promise<any> {
		const agentIdsWithoutDepartment: string[] = [];
		const agentIdsToRemoveCurrentBusinessHour: string[] = [];
		for await (const agentId of agentsIds) {
			if ((await LivechatDepartmentAgents.findByAgentId(agentId).count()) === 0) {
				agentIdsWithoutDepartment.push(agentId);
			}
			// TODO: We're doing a full fledged aggregation with lookups and getting the whole array just for getting the length? :(
			if (!(await LivechatDepartmentAgents.findAgentsByAgentIdAndBusinessHourId(agentId, department.businessHourId)).length) {
				agentIdsToRemoveCurrentBusinessHour.push(agentId);
			}
		}
		if (department.businessHourId) {
			await removeBusinessHourByAgentIds(agentIdsToRemoveCurrentBusinessHour, department.businessHourId);
		}
		if (!agentIdsWithoutDepartment.length) {
			return options;
		}
		const defaultBusinessHour = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBusinessHour) {
			return options;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([defaultBusinessHour]);
		if (!businessHourToOpen.length) {
			return options;
		}
		await this.UsersRepository.addBusinessHourByAgentIds(agentIdsWithoutDepartment, defaultBusinessHour._id);
		return options;
	}

	private async openBusinessHour(businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<void> {
		return openBusinessHour(businessHour);
	}

	private async removeBusinessHourFromRemovedDepartmentsUsersIfNeeded(
		businessHourId: string,
		departmentsToRemove: string[],
	): Promise<void> {
		if (!departmentsToRemove.length) {
			return;
		}
		const agentIds = (await LivechatDepartmentAgents.findByDepartmentIds(departmentsToRemove).toArray()).map((dept: any) => dept.agentId);
		await removeBusinessHourByAgentIds(agentIds, businessHourId);
	}

	private async closeBusinessHour(businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<void> {
		await closeBusinessHour(businessHour);
	}
}
