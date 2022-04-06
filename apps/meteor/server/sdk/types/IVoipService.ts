import { IVoipCallServerConfig, IVoipManagementServerConfig, ServerType } from '@rocket.chat/core-typings';
import { CommandHandler } from '../../services/voip/connector/asterisk/CommandHandler';
import type { IVoipConnectorResult } from '@rocket.chat/core-typings';
import { IRegistrationInfo } from '@rocket.chat/core-typings';
import type { IManagementServerConnectionStatus } from '@rocket.chat/core-typings';

export interface IVoipService {
	getServerConfigData(serverType: ServerType): IVoipCallServerConfig | IVoipManagementServerConfig;
	getConnector(): CommandHandler;
	getConnectorVersion(): string;
	getQueueSummary(): Promise<IVoipConnectorResult>;
	getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult>;
	getQueueMembership(requestParams: any): Promise<IVoipConnectorResult>;
	getExtensionList(): Promise<IVoipConnectorResult>;
	getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult>;
	getRegistrationInfo(requestParams: any): Promise<{ result: IRegistrationInfo }>; // TODO: Check the reason behind IVoipConnectorResult
	checkManagementConnection(host: string, port: string, userName: string, password: string): Promise<IManagementServerConnectionStatus>;
	checkCallserverConnection(websocketUrl: string, protocol?: string): Promise<IManagementServerConnectionStatus>;
	cachedQueueDetails(): () => Promise<{ name: string; members: string[] }[]>;
	init(): Promise<void>;
	stop(): Promise<void>;
	refresh(): Promise<void>;
}
