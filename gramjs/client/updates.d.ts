import type { EventBuilder } from "../events/common";
import { Api } from "../tl";
import type { TelegramClient } from "../";
import { UpdateConnectionState } from "../network";
/** @hidden */
export declare function on(client: TelegramClient, event?: EventBuilder): (f: (event: any) => void) => (event: any) => void;
/** @hidden */
export declare function addEventHandler(client: TelegramClient, callback: CallableFunction, event?: EventBuilder): void;
/** @hidden */
export declare function removeEventHandler(client: TelegramClient, callback: CallableFunction, event: EventBuilder): void;
/** @hidden */
export declare function listEventHandlers(client: TelegramClient): [EventBuilder, CallableFunction][];
/** @hidden */
export declare function catchUp(): void;
/** @hidden */
export declare function _handleUpdate(client: TelegramClient, update: Api.TypeUpdate | number): void;
/** @hidden */
export declare function _processUpdate(client: TelegramClient, update: any, others: any, entities?: any): void;
/** @hidden */
export declare function _dispatchUpdate(client: TelegramClient, args: {
    update: UpdateConnectionState | any;
}): Promise<void>;
/** @hidden */
export declare function _updateLoop(client: TelegramClient): Promise<void>;
