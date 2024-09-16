import { Badge } from '@rocket.chat/fuselage';
import { usePreferenceFeaturePreviewList } from '../../hooks/useFeaturePreviewList';
import { useTranslation } from 'react-i18next';

const FeaturePreviewBadge = () => {
	const t = useTranslation();
	const { unseenFeatures } = usePreferenceFeaturePreviewList();

	if (!unseenFeatures) {
		return null;
	}

	return (
		<Badge variant='primary' aria-label={t('Unseen_features')}>
			{unseenFeatures}
		</Badge>
	);
};

export default FeaturePreviewBadge;
