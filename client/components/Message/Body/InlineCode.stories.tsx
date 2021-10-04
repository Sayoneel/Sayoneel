/* eslint-disable @typescript-eslint/explicit-function-return-type */
// eslint-disable-next-line import/no-unresolved
import { Plain } from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import InlineCode from './InlineCode';

export default {
	title: 'Message/Body/InlineCode',
	component: InlineCode,
	decorators: [(storyFn: any): ReactElement => storyFn()],
};

const defaultValue: Plain = {
	type: 'PLAIN_TEXT',
	value: 'Test inline code',
};

export const Default = () => <InlineCode value={defaultValue} />;
