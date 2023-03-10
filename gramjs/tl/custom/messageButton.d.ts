/// <reference types="node" />
import type { TelegramClient } from "../../client/TelegramClient";
import type { ButtonLike, EntityLike, MessageIDLike } from "../../define";
import { Api } from "../api";
import { inspect } from "util";
export declare class MessageButton {
    private readonly _client;
    private readonly _chat;
    readonly button: ButtonLike;
    private readonly _bot;
    private readonly _msgId;
    [inspect.custom](): {
        [key: string]: any;
    };
    constructor(client: TelegramClient, original: ButtonLike, chat: EntityLike, bot: EntityLike, msgId: MessageIDLike);
    get client(): TelegramClient;
    get text(): string;
    get data(): Buffer | undefined;
    get inlineQuery(): string | undefined;
    get url(): string | undefined;
    click({ sharePhone, shareGeo }: {
        sharePhone?: boolean | undefined;
        shareGeo?: number[] | undefined;
    }): Promise<string | Api.Message | Api.messages.BotCallbackAnswer | Api.TypeUpdates | null | undefined>;
}
