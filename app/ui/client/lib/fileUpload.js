import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import s from 'underscore.string';
import { Handlebars } from 'meteor/ui';

import { fileUploadHandler } from '../../../file-upload';
import { ChatMessage } from '../../../models/client';
import { t, fileUploadIsValidContentType, SWCache } from '../../../utils';
import { settings } from '../../../settings/client';
import { modal, prependReplies } from '../../../ui-utils';
import { sendOfflineFileMessage } from './sendOfflineFileMessage';

const setMsgId = (msgData = {}) => {
	let id;
	if (msgData.id) {
		id = msgData.id;
	} else {
		id = Random.id();
	}
	return Object.assign({
		id,
		msg: '',
		groupable: false,
	}, msgData);
};

const readAsDataURL = (file, callback) => {
	const reader = new FileReader();
	reader.onload = (e) => callback(e.target.result, file);

	return reader.readAsDataURL(file);
};

const showUploadPreview = (file, callback) => {
	// If greater then 10MB don't try and show a preview
	if (file.file.size > (10 * 1000000)) {
		return callback(file, null);
	}

	if (file.file.type == null) {
		return callback(file, null);
	}

	if ((file.file.type.indexOf('audio') > -1) || (file.file.type.indexOf('video') > -1) || (file.file.type.indexOf('image') > -1)) {
		file.type = file.file.type.split('/')[0];

		return readAsDataURL(file.file, (content) => callback(file, content));
	}

	return callback(file, null);
};

const getAudioUploadPreview = (file, preview) => `\
<div class='upload-preview'>
	<audio style="width: 100%;" controls="controls">
		<source src="${ preview }" type="${ file.file.type }">
		Your browser does not support the audio element.
	</audio>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;

const getVideoUploadPreview = (file, preview) => `\
<div class='upload-preview'>
	<video style="width: 100%;" controls="controls">
		<source src="${ preview }" type="video/webm">
		Your browser does not support the video element.
	</video>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;

const getImageUploadPreview = (file, preview) => `\
<div class='upload-preview'>
	<div class='upload-preview-file' style='background-image: url(${ preview })'></div>
</div>
<div class='upload-preview-title'>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
	</div>
	<div class="rc-input__wrapper">
		<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
	</div>
</div>`;

const formatBytes = (bytes, decimals) => {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1000;
	const dm = (decimals + 1) || 3;

	const sizes = [
		'Bytes',
		'KB',
		'MB',
		'GB',
		'TB',
		'PB',
	];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) } ${ sizes[i] }`;
};

const getGenericUploadPreview = (file) => `\
<div class='upload-preview'>
<div>${ Handlebars._escape(file.name) } - ${ formatBytes(file.file.size) }</div>
</div>
<div class='upload-preview-title'>
<div class="rc-input__wrapper">
<input class="rc-input__element" id='file-name' style='display: inherit;' value='${ Handlebars._escape(file.name) }' placeholder='${ t('Upload_file_name') }'>
</div>
<div class="rc-input__wrapper">
<input class="rc-input__element" id='file-description' style='display: inherit;' value='' placeholder='${ t('Upload_file_description') }'>
</div>
</div>`;

const getUploadPreview = async (file, preview) => {
	if (file.type === 'audio') {
		return getAudioUploadPreview(file, preview);
	}

	if (file.type === 'video') {
		return getVideoUploadPreview(file, preview);
	}

	const isImageFormatSupported = () => new Promise((resolve) => {
		const element = document.createElement('img');
		element.onload = () => resolve(true);
		element.onerror = () => resolve(false);
		element.src = preview;
	});

	if (file.type === 'image' && await isImageFormatSupported()) {
		return getImageUploadPreview(file, preview);
	}

	return getGenericUploadPreview(file, preview);
};

export const fileUpload = async (files, input, { rid, tmid }) => {
	const threadsEnabled = settings.get('Threads_enabled');

	files = [].concat(files);

	const replies = $(input).data('reply') || [];
	const mention = $(input).data('mention-user') || false;

	let msg = '';

	if (!mention || !threadsEnabled) {
		msg = await prependReplies('', replies, mention);
	}

	if (mention && threadsEnabled && replies.length) {
		tmid = replies[0]._id;
	}

	let offlineFile = null;

	const uploadNextFile = () => {
		const file = files.pop();
		if (!file) {
			modal.close();
			return;
		}

		if (!fileUploadIsValidContentType(file.file.type)) {
			modal.open({
				title: t('FileUpload_MediaType_NotAccepted'),
				text: file.file.type || `*.${ s.strRightBack(file.file.name, '.') }`,
				type: 'error',
				timer: 3000,
			});
			return;
		}

		if (file.file.size === 0) {
			modal.open({
				title: t('FileUpload_File_Empty'),
				type: 'error',
				timer: 1000,
			});
			return;
		}

		showUploadPreview(file, async (file, preview) => modal.open({
			title: t('Upload_file_question'),
			text: await getUploadPreview(file, preview),
			showCancelButton: true,
			closeOnConfirm: false,
			closeOnCancel: false,
			confirmButtonText: t('Send'),
			cancelButtonText: t('Cancel'),
			html: true,
			onRendered: () => $('#file-name').focus(),
		}, (isConfirm) => {
			if (!isConfirm) {
				return;
			}

			const record = {
				name: document.getElementById('file-name').value || file.name || file.file.name,
				size: file.file.size,
				type: file.file.type,
				rid,
				description: document.getElementById('file-description').value,
			};

			const upload = fileUploadHandler('Uploads', record, file.file);
			const uploading = {
				id: upload.id,
				name: upload.getFileName(),
				percentage: 0,
			};
			file.file._id = upload.id;
			uploadNextFile();

			// Session.set(`uploading-${ upload.id }`, uploading);

			upload.onProgress = (progress) => {
				const uploads = uploading;
				uploads.percentage = Math.round(progress * 100) || 0;
				ChatMessage.setProgress(msgData.id, uploads);
			};

			const offlineUpload = (file, meta) => sendOfflineFileMessage(rid, msgData, file, meta, (file) => {
				offlineFile = file;
			});

			upload.start((error, file, storage) => {
				if (error) {
					ChatMessage.setProgress(msgData.id, uploading);
					return;
				}

				if (!file) {
					return;
				}

				Meteor.call('sendFileMessage', rid, storage, file, msgData, () => {
					$(input)
						.removeData('reply')
						.trigger('dataChange');

					if (offlineFile) {
						SWCache.removeFromCache(offlineFile);
					}
				});
			}, offlineUpload);

			Tracker.autorun((computation) => {
				const isCanceling = Session.get(`uploading-cancel-${ upload.id }`);

				if (!isCanceling) {
					return;
				}

				computation.stop();
				upload.stop();

				ChatMessage.setProgress(msgData.id, uploading);
			});
		}));
	};

	uploadNextFile();
};
