/// <reference types="node" />
import type { TelegramClient } from "../..";
import { Api } from "../api";
import type { Entity } from "../../define";
import { Draft } from "./draft";
import { inspect } from "util";
export declare class Dialog {
    _client: TelegramClient;
    dialog: Api.Dialog;
    pinned: boolean;
    folderId?: number;
    archived: boolean;
    message?: Api.Message;
    date: number;
    entity?: Entity;
    inputEntity: Api.TypeInputPeer;
    id?: number;
    name?: string;
    title?: string;
    unreadCount: number;
    unreadMentionsCount: number;
    draft: Draft;
    isUser: boolean;
    isGroup: boolean;
    isChannel: boolean;
    [inspect.custom](): {
        [key: string]: any;
    };
    constructor(client: TelegramClient, dialog: Api.Dialog, entities: Map<number, Entity>, message?: Api.Message);
}
