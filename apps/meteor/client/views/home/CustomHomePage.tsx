import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../components/Page/Page';
import PageScrollableContentWithShadow from '../../components/Page/PageScrollableContentWithShadow';
import HomePageHeader from './HomePageHeader';
import CustomCard from './cards/CustomCard';

const CustomHomePage = (): ReactElement => {
	return (
		<Page data-qa='page-home' data-qa-type='custom' color='default' background='tint'>
			<HomePageHeader />
			<PageScrollableContentWithShadow>
				<CustomCard />
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default CustomHomePage;
