import React, { FC, memo } from 'react';

import { FieldsAttachment, FieldsAttachmentProps } from './FieldsAttachment';
import { QuoteAttachment, QuoteAttachmentProps } from './QuoteAttachment';
import { Attachment } from './Attachment';
import { FileAttachmentProps, isFileAttachment, FileAttachment } from './Files';
import MarkdownText from '../../MarkdownText';

type PossibleMarkdownFields = 'text' | 'pretext' | 'fields';

type AttachmentProps = {
	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields: FieldsAttachmentProps;

	// footer
	// footer_icon

	image_url?: string;

	mrkdwn_in?: Array<PossibleMarkdownFields>;
	pretext?: string;
	text? : string;

	thumb_url?: string;

	title?: string;
	title_link?: string;

	ts?: Date;

	color?: string;
}

export type AttachmentPropsGeneric = AttachmentProps | FileAttachmentProps | QuoteAttachmentProps;

const isQuoteAttachment = (attachment: AttachmentPropsGeneric): attachment is QuoteAttachmentProps => 'message_link' in attachment;

const applyMarkdownIfRequires = (list: AttachmentProps['mrkdwn_in']) => (key: PossibleMarkdownFields, text: string): JSX.Element | string => (list?.includes(key) ? <MarkdownText withRichContent={null} content={text}/> : text);

const Item: FC<{attachment: AttachmentPropsGeneric }> = memo(({ attachment }) => {
	if (isFileAttachment(attachment)) {
		return <FileAttachment {...attachment} />;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment}/>;
	}
	const applyMardownFor = applyMarkdownIfRequires(attachment.mrkdwn_in);

	return <Attachment.Block color={attachment.color || 'neutral-600'} pre={attachment.pretext && <Attachment.Text>{applyMardownFor('pretext', attachment.pretext)}</Attachment.Text>}>
		{attachment.author_name && <Attachment.Author>
			{ attachment.author_icon && <Attachment.AuthorAvatar url={attachment.author_icon } />}
			<Attachment.AuthorName {...attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: undefined }}>{attachment.author_name}</Attachment.AuthorName>
		</Attachment.Author> }
		{attachment.title && <Attachment.Title {...attachment.title_link && { is: 'a', href: attachment.title_link, target: '_blank', color: undefined }}>{attachment.title}</Attachment.Title> }
		{attachment.text && <Attachment.Text>{applyMardownFor('text', attachment.text)}</Attachment.Text>}
		{attachment.fields && <FieldsAttachment fields={attachment.mrkdwn_in?.includes('fields') ? attachment.fields.map(({ value, ...rest }) => ({ ...rest, value: <MarkdownText withRichContent={null} content={value} /> })) : attachment.fields} />}
	</Attachment.Block>;
});

const Attachments: FC<{ attachments: Array<AttachmentPropsGeneric>}> = ({ attachments = null }): any => attachments && attachments.map((attachment, index) => <Item key={index} attachment={attachment} />);

export default Attachments;
