import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { LayoutContext, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

const hiddenActionsDefaultValue = {
	roomToolbox: [],
	messageToolbox: [],
	composerToolbox: [],
	userToolbox: [],
};

const LayoutProvider: FC = ({ children }) => {
	const showTopNavbarEmbeddedLayout = Boolean(useSetting('UI_Show_top_navbar_embedded_layout'));
	const [isCollapsed, setIsCollapsed] = useState(false);
	const breakpoints = useBreakpoints(); // ["xs", "sm", "md", "lg", "xl", xxl"]
	const [hiddenActions, setHiddenActions] = useState(hiddenActionsDefaultValue);

	const router = useRouter();
	// Once the layout is embedded, it can't be changed
	const [isEmbedded] = useState(() => router.getSearchParameters().layout === 'embedded');

	const isMobile = !breakpoints.includes('md');

	useEffect(() => {
		setIsCollapsed(isMobile);
	}, [isMobile]);

	useEffect(() => {
		const eventHandler = (event: MessageEvent<any>) => {
			if (event.data?.event !== 'hide-actions') {
				return;
			}

			setHiddenActions({ ...hiddenActionsDefaultValue, ...event.data.actions });
		};
		window.addEventListener('message', eventHandler);
		return () => window.removeEventListener('message', eventHandler);
	}, []);

	return (
		<LayoutContext.Provider
			children={children}
			value={useMemo(
				() => ({
					isMobile,
					isEmbedded,
					showTopNavbarEmbeddedLayout,
					sidebar: {
						isCollapsed,
						toggle: () => setIsCollapsed((isCollapsed) => !isCollapsed),
						collapse: () => setIsCollapsed(true),
						expand: () => setIsCollapsed(false),
						close: () => (isEmbedded ? setIsCollapsed(true) : router.navigate('/home')),
					},
					size: {
						sidebar: '240px',
						// eslint-disable-next-line no-nested-ternary
						contextualBar: breakpoints.includes('sm') ? (breakpoints.includes('xl') ? '38%' : '380px') : '100%',
					},
					roomToolboxExpanded: breakpoints.includes('lg'),
					contextualBarExpanded: breakpoints.includes('sm'),
					// eslint-disable-next-line no-nested-ternary
					contextualBarPosition: breakpoints.includes('sm') ? (breakpoints.includes('lg') ? 'relative' : 'absolute') : 'fixed',
					hiddenActions,
				}),
				[isMobile, isEmbedded, showTopNavbarEmbeddedLayout, isCollapsed, breakpoints, router, hiddenActions],
			)}
		/>
	);
};

export default LayoutProvider;
