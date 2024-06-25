import { ContextualbarV2Footer, ContextualbarFooter as ContextualbarFooterComponent } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarFooter = (props: ComponentProps<typeof ContextualbarFooterComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarFooterComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Footer {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarFooter);
