import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Audit Panel', () => {
	let testChannel: IRoom;
	let dummyUser: IUser;
	let auditor: IUser;
	let auditorCredentials: Credentials;
	before((done) => getCredentials(done));
	before(async () => {
		testChannel = (await createRoom({ type: 'c', name: `chat.api-test-${Date.now()}` })).body.channel;
		dummyUser = await createUser();
		auditor = await createUser({ roles: ['user', 'auditor'] });

		auditorCredentials = await login(auditor.username, password);
	});
	after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));
	after(() => deleteUser({ _id: dummyUser._id }));
	after(() => deleteUser({ _id: auditor._id }));

	describe('audit/rooms.members', () => {
		it('should fail if user is not logged in', async () => {
			await request
				.get(api('audit/rooms.members'))
				.query({
					roomId: 'GENERAL',
				})
				.expect(401);
		});
		it('should fail if user does not have view-members-list-all-rooms permission', async () => {
			await updatePermission('view-members-list-all-rooms', []);
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
				})
				.expect(403);
			await request
				.get(api('audit/rooms.members'))
				.set(auditorCredentials)
				.query({
					roomId: 'GENERAL',
				})
				.expect(403);

			await updatePermission('view-members-list-all-rooms', ['admin', 'auditor']);
		});
		it('should fail if roomId is invalid', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: Random.id(),
				})
				.expect(404);
		});
		it('should fetch the members of a room', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
				});
		});
		it('should fetch the members of a room with offset and count', async () => {
			await request
				.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: testChannel._id, users: [dummyUser.username] }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					offset: 1,
					count: 1,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].username).to.be.equal(dummyUser.username);
					expect(res.body.total).to.be.equal(2);
					expect(res.body.offset).to.be.equal(1);
					expect(res.body.count).to.be.equal(1);
				});
		});

		it('should filter by username', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: dummyUser.username,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].username).to.be.equal(dummyUser.username);
				});
		});

		it('should filter by user name', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: dummyUser.name,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].name).to.be.equal(dummyUser.name);
				});
		});

		it('should sort by username', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					sort: '{ "username": -1 }',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(2);
					expect(res.body.members[0].username).to.be.equal('rocketchat.internal.admin.test');
					expect(res.body.members[1].username).to.be.equal(dummyUser.username);
				});
		});

		it('should not allow nosqlinjection on filter param', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: '{ "$ne": "rocketchat.internal.admin.test" }',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(0);
				});

			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: { username: 'rocketchat.internal.admin.test' },
				})
				.expect(400);
		});

		it('should allow to fetch info even if user is not in the room', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(auditorCredentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members[0].username).to.be.equal('rocketchat.internal.admin.test');
					expect(res.body.members[1].username).to.be.equal(dummyUser.username);
					expect(res.body.total).to.be.equal(2);
				});
		});
	});
});
