/// <reference types="node" />
import { SenderGetter } from "./senderGetter";
import type { Entity, EntityLike } from "../../define";
import { Api } from "../api";
import type { TelegramClient } from "../..";
import { Forward } from "./forward";
import type { File } from "./file";
import { EditMessageParams, SendMessageParams } from "../../client/messages";
import { DownloadMediaInterface } from "../../client/downloads";
import { inspect } from "util";
import { BigInteger } from "big-integer";
interface MessageBaseInterface {
    id: any;
    peerId?: any;
    date?: any;
    out?: any;
    mentioned?: any;
    mediaUnread?: any;
    silent?: any;
    post?: any;
    fromId?: any;
    replyTo?: any;
    message?: any;
    fwdFrom?: any;
    viaBotId?: any;
    media?: any;
    replyMarkup?: any;
    entities?: any;
    views?: any;
    editDate?: any;
    postAuthor?: any;
    groupedId?: any;
    fromScheduled?: any;
    legacy?: any;
    editHide?: any;
    pinned?: any;
    restrictionReason?: any;
    forwards?: any;
    ttlPeriod?: number;
    replies?: any;
    action?: any;
    _entities?: Map<number, Entity>;
}
/**
 * This custom class aggregates both {@link Api.Message} and {@link Api.MessageService} to ease accessing their members.<br/>
 * <br/>
 * Remember that this class implements {@link ChatGetter} and {@link SenderGetter}<br/>
 * which means you have access to all their sender and chat properties and methods.
 */
export declare class CustomMessage extends SenderGetter {
    static CONSTRUCTOR_ID: number;
    static SUBCLASS_OF_ID: number;
    CONSTRUCTOR_ID: number;
    SUBCLASS_OF_ID: number;
    /**
     * Whether the message is outgoing (i.e. you sent it from
     * another session) or incoming (i.e. someone else sent it).
     * <br/>
     * Note that messages in your own chat are always incoming,
     * but this member will be `true` if you send a message
     * to your own chat. Messages you forward to your chat are
     * **not** considered outgoing, just like official clients
     * display them.
     */
    out?: boolean;
    /**
     * Whether you were mentioned in this message or not.
     * Note that replies to your own messages also count as mentions.
     */
    mentioned?: boolean;
    /** Whether you have read the media in this message
     * or not, e.g. listened to the voice note media.
     */
    mediaUnread?: boolean;
    /**
     * Whether the message should notify people with sound or not.
     * Previously used in channels, but since 9 August 2019, it can
     * also be {@link https://telegram.org/blog/silent-messages-slow-mode|used in private chats}
     */
    silent?: boolean;
    /**
     * Whether this message is a post in a broadcast
     * channel or not.
     */
    post?: boolean;
    /**
     * Whether this message was originated from a previously-scheduled
     * message or not.
     */
    fromScheduled?: boolean;
    /**
     * Whether this is a legacy message or not.
     */
    legacy?: boolean;
    /**
     * Whether the edited mark of this message is edited
     * should be hidden (e.g. in GUI clients) or shown.
     */
    editHide?: boolean;
    /**
     *  Whether this message is currently pinned or not.
     */
    pinned?: boolean;
    /**
     * The ID of this message. This field is *always* present.
     * Any other member is optional and may be `undefined`.
     */
    id: number;
    /**
     * The peer who sent this message, which is either
     * {@link Api.PeerUser}, {@link Api.PeerChat} or {@link Api.PeerChannel}.
     * This value will be `undefined` for anonymous messages.
     */
    fromId?: Api.TypePeer;
    /**
     * The peer to which this message was sent, which is either
     * {@link Api.PeerUser}, {@link Api.PeerChat} or {@link Api.PeerChannel}.
     * This will always be present except for empty messages.
     */
    peerId: Api.TypePeer;
    /**
     * The original forward header if this message is a forward.
     * You should probably use the `forward` property instead.
     */
    fwdFrom?: Api.TypeMessageFwdHeader;
    /**
     * The ID of the bot used to send this message
     * through its inline mode (e.g. "via @like").
     */
    viaBotId?: number;
    /**
     * The original reply header if this message is replying to another.
     */
    replyTo?: Api.MessageReplyHeader;
    /**
     * The timestamp indicating when this message was sent.
     * This will always be present except for empty messages.
     */
    date: number;
    /**
     * The string text of the message for {@link Api.Message} instances,
     * which will be `undefined` for other types of messages.
     */
    message: string;
    /**
     * The media sent with this message if any (such as photos, videos, documents, gifs, stickers, etc.).
     *
     * You may want to access the `photo`, `document` etc. properties instead.
     *
     * If the media was not present or it was {@link Api.MessageMediaEmpty},
     * this member will instead be `undefined` for convenience.
     */
    media?: Api.TypeMessageMedia;
    /**
     * The reply markup for this message (which was sent either via a bot or by a bot).
     * You probably want to access `buttons` instead.
     */
    replyMarkup?: Api.TypeReplyMarkup;
    /**
     * The list of markup entities in this message,
     * such as bold, italics, code, hyperlinks, etc.
     */
    entities?: Api.TypeMessageEntity[];
    /**
     *  The number of views this message from a broadcast channel has.
     *  This is also present in forwards.
     */
    views?: number;
    /**
     * The number of times this message has been forwarded.
     */
    forwards?: number;
    /**
     *  The number of times another message has replied to this message.
     */
    replies?: Api.TypeMessageReplies;
    /**
     * The date when this message was last edited.
     */
    editDate?: number;
    /**
     * The display name of the message sender to show in messages sent to broadcast channels.
     */
    postAuthor?: string;
    /**
     *  If this message belongs to a group of messages (photo albums or video albums),
     *  all of them will have the same value here.
     */
    groupedId?: BigInteger;
    /**
     * An optional list of reasons why this message was restricted.
     * If the list is `undefined`, this message has not been restricted.
     */
    restrictionReason?: Api.TypeRestrictionReason[];
    /**
     * The message action object of the message for {@link Api.MessageService}
     * instances, which will be `undefined` for other types of messages.
     */
    action: Api.TypeMessageAction;
    /**
     * The Time To Live period configured for this message.
     * The message should be erased from wherever it's stored (memory, a
     * local database, etc.) when this threshold is met.
     */
    ttlPeriod?: number;
    /** @hidden */
    _actionEntities?: any;
    /** @hidden */
    _client?: TelegramClient;
    /** @hidden */
    _text?: string;
    /** @hidden */
    _file?: File;
    /** @hidden */
    _replyMessage?: Api.Message;
    /** @hidden */
    _buttons?: undefined;
    /** @hidden */
    _buttonsFlat?: undefined;
    /** @hidden */
    _buttonsCount?: number;
    /** @hidden */
    _viaBot?: EntityLike;
    /** @hidden */
    _viaInputBot?: EntityLike;
    /** @hidden */
    _inputSender?: any;
    /** @hidden */
    _forward?: Forward;
    /** @hidden */
    _sender?: any;
    /** @hidden */
    _entities?: Map<number, Entity>;
    /** @hidden */
    getBytes(): Buffer;
    originalArgs: any;
    patternMatch?: RegExpMatchArray;
    [inspect.custom](): {
        [key: string]: any;
    };
    init({ id, peerId, date, out, mentioned, mediaUnread, silent, post, fromId, replyTo, message, fwdFrom, viaBotId, media, replyMarkup, entities, views, editDate, postAuthor, groupedId, fromScheduled, legacy, editHide, pinned, restrictionReason, forwards, replies, action, ttlPeriod, _entities, }: MessageBaseInterface): void;
    constructor(args: MessageBaseInterface);
    _finishInit(client: TelegramClient, entities: Map<number, Entity>, inputChat?: EntityLike): void;
    get client(): TelegramClient | undefined;
    get text(): string;
    set text(value: string);
    get rawText(): string;
    /**
     * @param {string} value
     */
    set rawText(value: string);
    get isReply(): boolean;
    get forward(): Forward | undefined;
    _refetchSender(): Promise<void>;
    /**
     * Re-fetches this message to reload the sender and chat entities,
     * along with their input versions.
     * @private
     */
    _reloadMessage(): Promise<void>;
    get photo(): Api.TypePhoto | undefined;
    get document(): Api.Document | undefined;
    get webPreview(): Api.WebPage | undefined;
    get audio(): Api.Document | undefined;
    get voice(): Api.Document | undefined;
    get video(): Api.Document | undefined;
    get videoNote(): Api.Document | undefined;
    get gif(): Api.Document | undefined;
    get sticker(): Api.Document | undefined;
    get contact(): Api.MessageMediaContact | undefined;
    get game(): Api.Game | undefined;
    get geo(): Api.TypeGeoPoint | undefined;
    get invoice(): Api.MessageMediaInvoice | undefined;
    get poll(): Api.MessageMediaPoll | undefined;
    get venue(): Api.MessageMediaVenue | undefined;
    get dice(): Api.MessageMediaDice | undefined;
    get actionEntities(): any;
    get viaBot(): EntityLike | undefined;
    get viaInputBot(): EntityLike | undefined;
    get replyToMsgId(): number | undefined;
    get toId(): Api.TypePeer;
    getEntitiesText(cls?: Function): any;
    getReplyMessage(): Promise<Api.Message | undefined>;
    respond(params: SendMessageParams): Promise<Api.Message | undefined>;
    reply(params: SendMessageParams): Promise<Api.Message | undefined>;
    forwardTo(entity: EntityLike): Promise<Api.Message[] | undefined>;
    edit(params: Omit<EditMessageParams, "message">): Promise<Api.Message | undefined>;
    delete({ revoke }?: {
        revoke: boolean;
    }): Promise<Api.messages.AffectedMessages[] | undefined>;
    downloadMedia(params: DownloadMediaInterface): Promise<Buffer | undefined>;
    _documentByAttribute(kind: Function, condition?: Function): Api.Document | undefined;
}
export {};
