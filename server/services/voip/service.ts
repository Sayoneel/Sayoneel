import { Db } from 'mongodb';

import { IVoipService } from '../../sdk/types/IVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { VoipServerConfigurationRaw } from '../../../app/models/server/raw/VoipServerConfiguration';
import { ServerType, IVoipServerConfig } from '../../../definition/IVoipServerConfig';

export class VoipService extends ServiceClass implements IVoipService {
	protected name = 'voip';

	// this will hold the multiple call server connection settings that can be supported
	// They should only be modified through this service
	private VoipServerConfiguration: VoipServerConfigurationRaw;

	constructor(db: Db) {
		super();

		this.VoipServerConfiguration = new VoipServerConfigurationRaw(db.collection('rocketchat_voip_server_configuration'));
	}

	async addServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		const existingConfig = await this.getServerConfigData(type);
		if (existingConfig) {
			throw new Error(`Error! There already exists a record of type ${ type }`);
		}

		await this.VoipServerConfiguration.insertOne(config);

		return true;
	}

	async updateServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		const existingConfig = await this.getServerConfigData(type);
		if (!existingConfig) {
			throw new Error(`Error! No record exists of type ${ type }`);
		}

		await this.VoipServerConfiguration.updateOne({ type }, config);

		return true;
	}

	async deleteServerConfigDataIfAvailable(serverType: ServerType): Promise<boolean> {
		await this.VoipServerConfiguration.removeByType(serverType);
		return true;
	}

	async getServerConfigData(type: ServerType): Promise<IVoipServerConfig | null> {
		return this.VoipServerConfiguration.findOne({ type });
	}

	// this is a dummy function to avoid having an empty IVoipService interface
	getConfiguration(): any {
		return {};
	}
}
