import {ClientResultFactory} from '../../../lib/ClientResultProvider.js'

Template.redlinkQuery._hasResult = function (instance) {
	const results = instance.state.get('results') || [];
	if (results) {
		return results.length > 0;
	} else {
		return false;
	}
};

Template.redlinkQuery._fetched = function (instance) {
	return instance.state.get('status') === 'fetched';
};

Template.redlinkQuery.helpers({
	hasError(){
		const instance = Template.instance();
		return Template.redlinkQuery._fetched(instance) && instance.state.get('error');
	},

	errorText(){
		const instance = Template.instance();
		const error = instance.state.get('error');
		if (error) {
			const translatedText = TAPi18n.__(error);
			if (translatedText === error) {
				//translation was not succesful - provide a nicer but generic message
				return TAPi18n.__('oops_error');
			} else {
				return translatedText;
			}
		}
	},

	hasResult(){
		const instance = Template.instance();
		return Template.redlinkQuery._hasResult(instance);
	},

	isDirty(){
		return Template.instance().state.get('status') === 'dirty';
	},

	fetched(){
		const instance = Template.instance();
		Template.redlinkQuery._fetched(instance);
	},

	noResultFetched(){
		const instance = Template.instance();
		return Template.redlinkQuery._fetched(instance) && !Template.redlinkQuery._hasResult(instance)
	},

	classExpanded(){
		const instance = Template.instance();
		return instance.state.get('resultsExpanded') ? 'expanded' : 'collapsed';
	},

	queryPreviewHeadline(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if (results) {
			const creator = instance.state.get('creator'); //all results have got the same creator
			switch (creator) {
				case 'community.bahn.de':
					return t('results_community_bahn_de');
				case 'bahn.de':
					return t('results_bahn_de');
				case 'dbsearch':
					return t('dbsearch');
				default:
					return t(results);
			}
		}
	},

	navigationOptions(){
		const instance = Template.instance();
		const results = instance.state.get('results');
		if (results) {
			const creator = instance.state.get('creator'); //all results have got the same creator
			let options = {
				results: results,
				roomId: instance.data.roomId,
				creator: instance.state.get('creator')
			};

			switch (creator) {
				case 'bahn.de':
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 2;
					break;
				case 'VKL':
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 3;
					break;
				default:
					options.template = 'redlinkResultContainer_Slider';
					options.stepping = 5;
			}
			return options;
		}
	},
	getCreatorText(){
		const instance = Template.instance();
		if (instance.data.query.creator === 'Hasso-MLT' || instance.data.query.creator === 'Hasso-Search') {
			return "";
		} else {
			return TAPi18n.__(instance.data.query.replacedCreator);
		}
	},
	getQueryDisplayTitle(){
		const instance = Template.instance();
		if (instance.data.query.creator === 'Hasso-MLT') {
			return 'Ähnliche Fragen';
		}
		if (instance.data.query.creator === 'Hasso-Search') {
			return instance.data.query.displayTitle
				.replace("Conversationen zum", "Zum")
				.replace(/[|]/g, "");
		}

		// else
		return instance.data.query.displayTitle;
	}
});

Template.redlinkQuery.events({
	'click .js-toggle-results-expanded': function (event, instance) {
		const current = instance.state.get('resultsExpanded');
		instance.state.set('resultsExpanded', !current);
	}
});

Template.redlinkQuery.clientResult = function (creator) {
	switch (creator) {
		case 'dbsearch':
			return true;
		default:
			return false;
	}
};

Template.redlinkQuery.onCreated(function () {
	const instance = this;

	this.state = new ReactiveDict();
	this.state.setDefault({
		resultsExpanded: instance.data.query.inlineResultSupport && ( instance.data.maxConfidence === instance.data.query.confidence ),
		results: [],
		status: 'initial',
		error: ''
	});

	// Asynchronously load the results.
	instance.autorun(() => {
		if (instance.data && instance.data.query && instance.data.roomId) {
			//subscribe to the external messages for the room in order to re-fetch the results once the result
			// of the knowledge provider changes
			this.subscribe('livechat:externalMessages', Template.currentData().roomId);
			instance.state.set('creator', instance.data.query.creator);

			//issue a request to the redlink results-service and buffer the potential results in a reactive variable
			//which then can be forwarded to the results-template
			if (instance.data.query.inlineResultSupport) {
				instance.state.set('status', 'dirty');
				Meteor.call('redlink:retrieveResults', instance.data.roomId, instance.data.templateIndex, instance.data.query.creator, (err, results) => {
					instance.state.set('results', results);
					instance.state.set('status', 'fetched');
				});
			}
			if (Template.redlinkQuery.clientResult(instance.data.query.creator)) {
				instance.state.set('status', 'dirty');
				let crf = new ClientResultFactory().getInstance(instance.data.query.creator, instance.data.query.url);
				this.roomId = Template.currentData().roomId;
				this.instance = instance; //in order to pass the actual template instance to the callback in the next call

				crf.executeSearch([])
					.then(function (response) {
						Meteor.setTimeout(() => {
							instance.state.set('results', response.response.docs);
							instance.state.set('status', 'fetched');
							instance.state.set('error', null);
						}, 500);
					})
					.catch(function (err) {
						instance.state.set('error', "cannot-retrieve-" + instance.data.query.creator + "-results");
						instance.state.set('status', 'fetched');
					});
			}
		}
	})
});
