import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FileUploadModal from './FileUploadModal';

const defaultProps = {
	onClose: () => undefined,
	file: new File([], 'testing.png'),
	fileName: 'Testing',
	fileDescription: '',
	onSubmit: () => undefined,
	invalidContentType: false,
	showDescription: true,
};

it('should show Undo request button when roomOpen is true and transcriptRequest exist', async () => {
	render(<FileUploadModal {...defaultProps} />, {
		legacyRoot: true,
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Cannot_upload_file_character_limit: 'Cannot upload file, description is over the {{count}} character limit',
				Send: 'Send',
				Upload_file_description: 'File description',
			})
			.withSetting('Message_MaxAllowedSize', 10)
			.build(),
	});

	const input = await screen.findByRole('textbox', { name: 'File description' });
	expect(input).toBeInTheDocument();
	await userEvent.type(input, '12345678910');

	expect(screen.getByText('Cannot upload file, description is over the 10 character limit')).toBeInTheDocument();
});
