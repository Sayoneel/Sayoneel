import type { ConnectedPayload, FailedPayload } from './types/connectionPayloads';
import type { ResultPayload, ServerMethodPayloads } from './types/methodsPayloads';
import type { ServerPublicationPayloads } from './types/publicationPayloads';
import type { OutgoingPayload } from './types/OutgoingPayload';
import type { IncomingPayload } from './types/IncomingPayload';
import type { RemoveListener } from './types/RemoveListener';

/**
 * A low-level DDP client that can be used to communicate with a DDP server.
 */

export interface DDPClient {
	/**
	 * Invokes a remote method.
	 * @param method The name of the method to invoke.
	 * @param params The parameters to pass to the method.
	 * @returns A string representing the method call.
	 */
	call(method: string, ...params: any[]): string;

	/**
	 * Subscribes to a queue of stream messages.
	 * @param name The name of the queue to subscribe to.
	 * @param params The parameters that the queue takes.
	 * @returns A string representing the subscription id.
	 */
	subscribe(name: string, ...params: any[]): string;

	/**
	 * Unsubscribes from a queue of stream messages.
	 * @param id The id of the subscription to unsubscribe from.
	 */
	unsubscribe(id: string): void;

	/**
	 * Sends a message to the server.
	 * @param msg The message to send.
	 */
	sendSerialized(msg: OutgoingPayload): void;

	/**
	 * Handles a message received from the server.
	 */
	handleMessage(msg: string): void;

	/**
	 * Sends a connect message to the server.
	 */
	connect(): void;

	/**
	 * Registers a callback to be called once after the subscription is ready or rejected.
	 * @param id The id of the subscription.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onPublish(name: string, callback: (payload: ServerPublicationPayloads) => void): RemoveListener;

	/**
	 * Registers a callback to be called once after the method is resolved or rejected.
	 * @param id The id of the method.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onResult(id: string, callback: (payload: ResultPayload) => void): RemoveListener;

	/**
	 * Registers a callback to be called every time the subscription is updated.
	 * @param id The id of the subscription.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onUpdate(id: string, callback: (payload: ServerMethodPayloads) => void): RemoveListener;

	/**
	 * Registers a callback to be called once after the subscription is stopped.
	 * @param id The id of the subscription.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onNoSub(id: string, callback: (payload: ServerMethodPayloads) => void): RemoveListener;

	/**
	 * Registers a callback to be called every time a new document is added/updated/removed from the collection.
	 * @param name The name of the collection.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onCollection(name: string, callback: (payload: ServerPublicationPayloads) => void): RemoveListener;

	/**
	 * Registers a callback to be called once after the connection is established or rejected.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onConnection(callback: (payload: ConnectedPayload | FailedPayload) => void): RemoveListener;

	/**
	 * Registers a callback to be called every time a message is received.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onMessage(callback: (payload: IncomingPayload) => void): RemoveListener;

	/**
	 * Registers a callback to be called once after a message is received.
	 * @param callback The callback to be called.
	 * @returns A function to unregister the callback.
	 */
	onceMessage(callback: (payload: IncomingPayload) => void): RemoveListener;
}
