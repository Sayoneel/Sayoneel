import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Webdav]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('/webdav.getMyAccounts', () => {
		it('should return my webdav accounts', (done) => {
			request
				.get(api('webdav.getMyAccounts'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('accounts').and.to.be.a('array');
				})
				.end(done);
		});
	});

	describe('/webdav.removeWebdavAccount', () => {
		// it('should return my webdav accounts', (done) => {
		// 	request
		// 		.post(api('webdav.removeWebdavAccount'))
		// 		.set(credentials)
		// 		.send({
		// 			accountId: credentials['X-User-Id'],
		// 		})
		// 		.expect(200)
		// 		.expect((res) => {
		// 			expect(res.body).to.have.property('success', true);
		// 			expect(res.body).to.have.property('accounts').and.to.be.a('array');
		// 		})
		// 		.end(done);
		// });
		it('should return an error when send an invalid request', (done) => {
			request
				.post(api('webdav.removeWebdavAccount'))
				.set(credentials)
				.send({
					accountId: '',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});
});
