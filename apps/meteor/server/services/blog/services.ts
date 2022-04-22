import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IBlogService, IBlogCreateParams, IBlog } from '../../../definition/IBlog';
import { BlogsRaw } from '../../../app/models/server/raw/Blogs';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';

export class BlogService extends ServiceClassInternal implements IBlogService {
	protected name = 'blog';

	private BlogModel: BlogsRaw;

	constructor(db: Db) {
		super();

		this.BlogModel = new BlogsRaw(db.collection('blogs'));
	}

	async create(params: IBlogCreateParams): Promise<IBlog> {
		const result = await this.BlogModel.insertOne(params);
		return this.BlogModel.findOneById(result.insertedId);
	}

	async delete(blogId: string): Promise<void> {
		const blog = this.BlogModel.findOneById(blogId);
		if (!blog) {
			throw new Error('blog-does-not-exist');
		}
		await this.BlogModel.removeById(blogId);
	}

	async update(blogId: string, params: Partial<IBlogCreateParams>): Promise<IBlog> {
		const blog = this.BlogModel.findOneById(blogId);
		if (!blog) {
			throw new Error('blog-does-not-exist');
		}
		const query = {
			_id: blogId,
		};
		const result = await this.BlogModel.updateOne(query, params);
		return this.BlogModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IBlog> = { sort: {} },
	): Promise<IRecordsWithTotal<IBlog>> {
		const result = this.BlogModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
		return {
			total: await result.count(),
			records: await result.toArray(),
		};
	}
}
