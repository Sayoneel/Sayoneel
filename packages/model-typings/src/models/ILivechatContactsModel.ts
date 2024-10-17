import type { AtLeast, ILivechatContact, ILivechatContactChannel, ILivechatVisitor } from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult, UpdateFilter } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']>;
	upsertContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact | null>;
	updateContact(contactId: string, visitorId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	updateContactChannel(contactId: string, visitorId: string, data: UpdateFilter<ILivechatContact>['$set']): Promise<UpdateResult>;
	addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void>;
	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>>;
	updateLastChatById(contactId: string, visitorId: string, lastChat: ILivechatContact['lastChat']): Promise<UpdateResult>;
	findContactMatchingVisitor(visitor: AtLeast<ILivechatVisitor, 'visitorEmails' | 'phone'>): Promise<ILivechatContact | null>;
	findOneByVisitorId<T extends Document = ILivechatContact>(
		visitorId: ILivechatVisitor['_id'],
		options?: FindOptions<ILivechatContact>,
	): Promise<T | null>;
	findSimilarVerifiedContacts(
		channel: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: FindOptions<ILivechatContact>,
	): Promise<ILivechatContact[]>;
}
