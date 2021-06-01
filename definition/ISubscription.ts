import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

type RoomType = 'c' | 'd' | 'p' | 'l' | 'e';

type RoomID = string;

export interface ISubscription extends IRocketChatRecord {
	u: Pick<IUser, '_id' | 'username' | 'name'>;
	rid: RoomID;
	open: boolean;
	ts: Date;

	name: string;

	alert?: boolean;
	unread: number;
	t: RoomType;
	ls: Date;
	f?: true;
	lr: Date;
	hideUnreadStatus?: true;
	teamMain?: boolean;
	teamId?: string;

	userMentions: number;
	groupMentions: number;

	tunread: Array<string>;
	tunreadGroup: Array<string>;
	tunreadUser: Array<string>;

	prid?: RoomID;

	roles?: string[];

	onHold?: boolean;
	encrypted?: boolean;
	E2EKey?: string;
	unreadAlert?: 'default' | 'all' | 'mentions' | 'nothing';
}

export interface ISubscriptionDirectMessage extends Omit<ISubscription, 'name'> {
	t: 'd';
}
