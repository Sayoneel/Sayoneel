import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import type { ILivechatDepartment, IUser, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import { api, credentials, methodCall, request } from '../api-data';
import { IUserCredentialsHeader, password } from '../user';
import { login } from '../users.helper';
import { createAgent, makeAgentAvailable } from './rooms';

export const NewDepartmentData = ((): Partial<ILivechatDepartment> => ({
    enabled: true,
    name: `new department ${Date.now()}`,
    description: 'created from api',
    showOnRegistration: true,
    email: faker.internet.email(),
    showOnOfflineForm: true,
}))();

export const createDepartment = async (departmentData: Partial<ILivechatDepartment> = NewDepartmentData): Promise<ILivechatDepartment> => {
    const response = await request.post(api('livechat/department')).set(credentials).send({
        department: departmentData,
    }).expect(200);
    return response.body.department;
};

export const updateDepartment = async (departmentId: string, departmentData: Partial<LivechatDepartmentDTO>): Promise<ILivechatDepartment> => {
    const response = await request.put(api(`livechat/department/${ departmentId }`)).set(credentials).send({
        department: departmentData,
    }).expect(200);
    return response.body.department;
};

export const createDepartmentWithMethod = (initialAgents: { agentId: string, username: string }[] = []) =>
new Promise((resolve, reject) => {
	request
		.post(methodCall('livechat:saveDepartment'))
		.set(credentials)
		.send({
			message: JSON.stringify({
				method: 'livechat:saveDepartment',
				params: ['', {
					enabled: true,
					email: faker.internet.email(),
					showOnRegistration: true,
					showOnOfflineForm: true,
					name: `new department ${Date.now()}`,
					description: 'created from api',
				}, initialAgents],
				id: 'id',
				msg: 'method',
			}),
		})
		.end((err: any, res: any) => {
			if (err) {
				return reject(err);
			}
			resolve(JSON.parse(res.body.message).result);
		});
});

export const createDepartmentWithAnOnlineAgent = async (): Promise<{department: ILivechatDepartment, agent: {
	credentials: IUserCredentialsHeader;
	user: IUser;
}}> => {
	// TODO moving here for tests
	const username = `user.test.${Date.now()}`;
	const email = `${username}@rocket.chat`;
	const { body } = await request
			.post(api('users.create'))
			.set(credentials)
			.send({ email, name: username, username, password });
	console.log('-----------------------------------------------');
	const agent = body.user;
	console.log(body);
	console.log(agent);
	const createdUserCredentials = await login(agent.username, password);
	await createAgent(agent.username);
	await makeAgentAvailable(createdUserCredentials);

	const department = await createDepartmentWithMethod() as ILivechatDepartment;

	await addOrRemoveAgentFromDepartment(department._id, {agentId: agent._id, username: (agent.username as string)}, true);

	return {
		department,
		agent: {
			credentials: createdUserCredentials,
			user: agent,
		}
	};
};

export const addOrRemoveAgentFromDepartment = async (departmentId: string, agent: { agentId: string; username: string; count?: number; order?: number }, add: boolean) => {
	const response = await request.post(api('livechat/department/' + departmentId + '/agents')).set(credentials).send({
		...add ? { upsert: [agent], remove: [] } : { remove: [agent], upsert: [] },
	});

	if (response.status !== 200) {
		throw new Error('Failed to add or remove agent from department. Status code: ' + response.status + '\n' + response.body);
	}
}

export const archiveDepartment = async (departmentId: string): Promise<void> => {
    await request.post(api(`livechat/department/${ departmentId }/archive`)).set(credentials).expect(200);
}

export const disableDepartment = async (department: ILivechatDepartment): Promise<void> => {
    department.enabled = false;
    delete department._updatedAt;
    const updatedDepartment = await updateDepartment(department._id, department);
    expect(updatedDepartment.enabled).to.be.false;
}

export const deleteDepartment = async (departmentId: string): Promise<void> => {
    await request.delete(api(`livechat/department/${ departmentId }`)).set(credentials).expect(200);
}

export const getDepartmentById = async (departmentId: string): Promise<ILivechatDepartment> => {
    const response = await request.get(api(`livechat/department/${ departmentId }`)).set(credentials).expect(200);
    return response.body.department;
};
