import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const getUnreadTitle = (
	{
		mentions,
		threads,
		groupMentions,
		total,
	}: {
		mentions: number;
		threads: number;
		groupMentions: number;
		total: number;
	},
	t: TFunction,
) => {
	const title = [] as string[];
	if (mentions) {
		title.push(t('mentions_counter', { count: mentions }));
	}
	if (threads) {
		title.push(t('threads_counter', { count: threads }));
	}
	if (groupMentions) {
		title.push(t('group_mentions_counter', { count: groupMentions }));
	}
	const count = total - mentions - groupMentions - threads;
	if (count > 0) {
		title.push(t('unread_messages_counter', { count }));
	}

	return title.join(', ');
};

export const useUnreadDisplay = ({
	alert,
	userMentions,
	unread,
	tunread,
	tunreadUser,
	groupMentions,
	hideMentionStatus,
	hideUnreadStatus,
}: Pick<
	SubscriptionWithRoom,
	'alert' | 'userMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'groupMentions' | 'hideMentionStatus' | 'hideUnreadStatus'
>) => {
	const { t } = useTranslation();

	return useMemo(() => {
		const unreadCount = {
			mentions: userMentions + (tunreadUser?.length || 0),
			threads: tunread?.length || 0,
			groupMentions,
			total: unread + (tunread?.length || 0),
		};

		const unreadTitle = getUnreadTitle(unreadCount, t);

		const unreadVariant: 'primary' | 'warning' | 'danger' | 'secondary' =
			(unreadCount.mentions && 'danger') || (unreadCount.threads && 'primary') || (unreadCount.groupMentions && 'warning') || 'secondary';

		const showUnread =
			(!hideUnreadStatus || (!hideMentionStatus && (Boolean(unreadCount.mentions) || Boolean(unreadCount.groupMentions)))) &&
			Boolean(unreadCount.total);

		const highlightUnread = Boolean(!hideUnreadStatus && (alert || unread));

		return { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread };
	}, [alert, groupMentions, hideMentionStatus, hideUnreadStatus, t, tunread?.length, tunreadUser?.length, unread, userMentions]);
};
