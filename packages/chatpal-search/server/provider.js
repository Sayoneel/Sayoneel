import {searchProviderService} from 'meteor/rocketchat:search';
import {SearchProvider} from 'meteor/rocketchat:search';
import Index from './index';
import ChatpalLogger from './logger';

class ChatpalProvider extends SearchProvider {

	constructor() {
		super('chatpalProvider');

		this.chatpalBaseUrl = 'https://beta.chatpal.io/v1';

		this._settings.add('Backend', 'select', 'cloud', {
			values:[
				{key: 'cloud', i18nLabel: 'Cloud Service'},
				{key: 'onsite', i18nLabel: 'On-Site'}
			]
		});
		this._settings.add('API_Key', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'cloud'
			}],
			i18nLabel: 'Chatpal_API_Key',
			i18nDescription: 'Chatpal_API_Key_Description'
		});
		this._settings.add('Base_URL', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}]
		});
		this._settings.add('HTTP_Headers', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}],
			multiline: true,
			i18nLabel: 'Chatpal_HTTP_Headers',
			i18nDescription: 'Chatpal_HTTP_Headers_Description'
		});
		this._settings.add('Main_Language', 'select', 'en', {
			values: [
				{key: 'none', i18nLabel: 'Not_set'},
				{key: 'de', i18nLabel: 'German'},
				{key: 'en', i18nLabel: 'English'}
			]
		});
		this._settings.add('PageSize', 'int', 15);
	}

	get i18nLabel() {
		return 'Chatpal Provider';
	}

	get resultTemplate() {
		return 'ChatpalSearchResultTemplate';
	}

	on(name, value, payload) {

		if (!this.index) {
			this.indexFail = true;
			return false;
		}

		switch (name) {
			case 'message.save': return this.index.indexDoc('message', payload);
			case 'user.save': return this.index.indexDoc('user', payload);
			case 'room.save': return this.index.indexDoc('room', payload);
			case 'message.delete': return this.index.removeDoc('message', value);
			case 'user.delete': return this.index.removeDoc('user', value);
			case 'room.delete': return this.index.removeDoc('room', value);
		}

		return true;
	}

	_checkForClear(reason) {

		if (reason === 'startup') { return false; }

		if (reason === 'switch') { return true; }

		return this._indexConfig.backendtype !== this._settings.get('Backend') ||
			(this._indexConfig.backendtype === 'onsite' && this._indexConfig.baseurl !== this._settings.get('Base_URL')) ||
			(this._indexConfig.backendtype === 'cloud' && this._indexConfig.httpOptions.headers['X-Api-Key'] !== this._settings.get('API_Key')) ||
			this._indexConfig.language !== this._settings.get('Main_Language');
	}

	_parseHeaders() {
		const headers = {};
		const sh = this._settings.get('HTTP_Headers').split('\n');
		sh.forEach(function(d) {
			const ds = d.split(':');
			if (ds.length === 2 && ds[0].trim() !== '') {
				headers[ds[0]] = ds[1];
			}
		});
		return headers;
	}

	_ping(config, callback, timeout = 5000) {

		const maxTimeout = 200000;

		if (Index.ping(config)) {
			ChatpalLogger.debug('ping was successfull');
			callback(config);
		} else {

			ChatpalLogger.warn(`ping failed, retry in ${ timeout } ms`);

			this._pingTimeout = Meteor.setTimeout(() => {
				this._ping(config, callback, Math.min(maxTimeout, 2*timeout));
			}, timeout);
		}

	}

	_getIndexConfig(callback) {

		const config = {
			backendtype: this._settings.get('Backend')
		};

		if (this._settings.get('Backend') === 'cloud') {
			config.baseurl = this.chatpalBaseUrl;
			config.language = this._settings.get('Main_Language');
			config.searchpath = '/search/search';
			config.updatepath = '/search/update';
			config.pingpath = '/search/ping';
			config.clearpath = '/search/clear';
			config.httpOptions = {
				headers: {
					'X-Api-Key': this._settings.get('API_Key')
				}
			};
		} else {
			config.baseurl = this._settings.get('Backend').endsWith('/') ? this._settings.get('Backend').slice(0, -1) : this._settings.get('Backend');
			config.language = this._settings.get('Main_Language');
			config.searchpath = '/chatpal/search';
			config.updatepath = '/chatpal/update';
			config.pingpath = '/chatpal/ping';
			config.clearpath = '/chatpal/clear';
			config.httpOptions = {
				headers: this._parseHeaders()
			};
		}

		this._ping(config, callback);

	}

	stop(callback) {
		ChatpalLogger.info('Provider stopped');
		Meteor.clearTimeout(this._pingTimeout);
		this.indexFail = false;
		this.index = undefined;
		callback();
	}

	start(reason, callback) {

		const clear = this._checkForClear(reason);

		ChatpalLogger.debug(`clear = ${ clear } with reason '${ reason }'`);

		this._getIndexConfig((config) => {
			this._indexConfig = config;

			ChatpalLogger.debug('config:', JSON.stringify(this._indexConfig, null, 2));

			this.index = new Index(this._indexConfig, this.indexFail || clear);

			callback();
		});
	}

	_getAcl(context) {
		return RocketChat.models.Subscriptions.find({'u._id': context.uid}).fetch().map(room => room.rid);
	}

	search(text, context, payload, callback) {

		if (!this.index) { return callback({msg:'Chatpal_currently_not_active'}); }

		this.index.query(
			text,
			this._settings.get('Main_Language'),
			this._getAcl(context),
			payload.type || ['message', 'user', 'room'],
			payload.start || 0,
			payload.rows || this._settings.get('PageSize'),
			callback
		);

	}
}

searchProviderService.register(new ChatpalProvider());
