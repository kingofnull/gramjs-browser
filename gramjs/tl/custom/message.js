"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMessage = void 0;
const senderGetter_1 = require("./senderGetter");
const api_1 = require("../api");
const chatGetter_1 = require("./chatGetter");
const utils = __importStar(require("../../Utils"));
const forward_1 = require("./forward");
const util_1 = require("util");
const Helpers_1 = require("../../Helpers");
const users_1 = require("../../client/users");
/**
 * This custom class aggregates both {@link Api.Message} and {@link Api.MessageService} to ease accessing their members.<br/>
 * <br/>
 * Remember that this class implements {@link ChatGetter} and {@link SenderGetter}<br/>
 * which means you have access to all their sender and chat properties and methods.
 */
class CustomMessage extends senderGetter_1.SenderGetter {
    constructor(args) {
        super();
        this.init(args);
    }
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    init({ id, peerId = undefined, date = undefined, out = undefined, mentioned = undefined, mediaUnread = undefined, silent = undefined, post = undefined, fromId = undefined, replyTo = undefined, message = undefined, fwdFrom = undefined, viaBotId = undefined, media = undefined, replyMarkup = undefined, entities = undefined, views = undefined, editDate = undefined, postAuthor = undefined, groupedId = undefined, fromScheduled = undefined, legacy = undefined, editHide = undefined, pinned = undefined, restrictionReason = undefined, forwards = undefined, replies = undefined, action = undefined, ttlPeriod = undefined, _entities = new Map(), }) {
        if (!id)
            throw new Error("id is a required attribute for Message");
        let senderId = undefined;
        if (fromId) {
            senderId = utils.getPeerId(fromId);
        }
        else if (peerId) {
            if (post || (!out && peerId instanceof api_1.Api.PeerUser)) {
                senderId = utils.getPeerId(peerId);
            }
        }
        // Common properties to all messages
        this._entities = _entities;
        this.out = out;
        this.mentioned = mentioned;
        this.mediaUnread = mediaUnread;
        this.silent = silent;
        this.post = post;
        this.post = post;
        this.fromScheduled = fromScheduled;
        this.legacy = legacy;
        this.editHide = editHide;
        this.ttlPeriod = ttlPeriod;
        this.id = id;
        this.fromId = fromId;
        this.peerId = peerId;
        this.fwdFrom = fwdFrom;
        this.viaBotId = viaBotId;
        this.replyTo = replyTo;
        this.date = date;
        this.message = message;
        this.media = media instanceof api_1.Api.MessageMediaEmpty ? media : undefined;
        this.replyMarkup = replyMarkup;
        this.entities = entities;
        this.views = views;
        this.forwards = forwards;
        this.replies = replies;
        this.editDate = editDate;
        this.pinned = pinned;
        this.postAuthor = postAuthor;
        this.groupedId = groupedId;
        this.restrictionReason = restrictionReason;
        this.action = action;
        this._client = undefined;
        this._text = undefined;
        this._file = undefined;
        this._replyMessage = undefined;
        this._buttons = undefined;
        this._buttonsFlat = undefined;
        this._buttonsCount = 0;
        this._viaBot = undefined;
        this._viaInputBot = undefined;
        this._actionEntities = undefined;
        // Note: these calls would reset the client
        chatGetter_1.ChatGetter.initChatClass(this, { chatPeer: peerId, broadcast: post });
        senderGetter_1.SenderGetter.initSenderClass(this, { senderId: senderId });
        this._forward = undefined;
    }
    _finishInit(client, entities, inputChat) {
        this._client = client;
        const cache = client._entityCache;
        if (this.senderId) {
            [this._sender, this._inputSender] = utils._getEntityPair(this.senderId, entities, cache);
        }
        if (this.chatId) {
            [this._chat, this._inputChat] = utils._getEntityPair(this.chatId, entities, cache);
        }
        if (inputChat) {
            // This has priority
            this._inputChat = inputChat;
        }
        if (this.viaBotId) {
            [this._viaBot, this._viaInputBot] = utils._getEntityPair(this.viaBotId, entities, cache);
        }
        if (this.fwdFrom) {
            this._forward = new forward_1.Forward(this._client, this.fwdFrom, entities);
        }
        if (this.action) {
            if (this.action instanceof api_1.Api.MessageActionChatAddUser ||
                this.action instanceof api_1.Api.MessageActionChatCreate) {
                this._actionEntities = this.action.users.map((i) => entities.get(i));
            }
            else if (this.action instanceof api_1.Api.MessageActionChatDeleteUser) {
                this._actionEntities = [entities.get(this.action.userId)];
            }
            else if (this.action instanceof api_1.Api.MessageActionChatJoinedByLink) {
                this._actionEntities = [
                    entities.get(utils.getPeerId(new api_1.Api.PeerChannel({
                        channelId: this.action.inviterId,
                    }))),
                ];
            }
            else if (this.action instanceof api_1.Api.MessageActionChannelMigrateFrom) {
                this._actionEntities = [
                    entities.get(utils.getPeerId(new api_1.Api.PeerChat({ chatId: this.action.chatId }))),
                ];
            }
        }
    }
    get client() {
        return this._client;
    }
    get text() {
        if (this._text === undefined && this._client) {
            if (!this._client.parseMode) {
                this._text = this.message;
            }
            else {
                this._text = this._client.parseMode.unparse(this.message || "", this.entities || []);
            }
        }
        return this._text || "";
    }
    set text(value) {
        this._text = value;
        if (this._client && this._client.parseMode) {
            [this.message, this.entities] = this._client.parseMode.parse(value);
        }
        else {
            this.message = value;
            this.entities = [];
        }
    }
    get rawText() {
        return this.message || "";
    }
    /**
     * @param {string} value
     */
    set rawText(value) {
        this.message = value;
        this.entities = [];
        this._text = "";
    }
    get isReply() {
        return !!this.replyTo;
    }
    get forward() {
        return this._forward;
    }
    async _refetchSender() {
        await this._reloadMessage();
    }
    /**
     * Re-fetches this message to reload the sender and chat entities,
     * along with their input versions.
     * @private
     */
    async _reloadMessage() {
        if (!this._client)
            return;
        let msg = undefined;
        try {
            const chat = this.isChannel ? await this.getInputChat() : undefined;
            let temp = await this._client.getMessages(chat, { ids: this.id });
            if (temp) {
                msg = temp[0];
            }
        }
        catch (e) {
            this._client._log.error("Got error while trying to finish init message with id " +
                this.id);
            if (this._client._log.canSend("error")) {
                console.error(e);
            }
        }
        if (msg == undefined)
            return;
        this._sender = msg._sender;
        this._inputSender = msg._inputSender;
        this._chat = msg._chat;
        this._inputChat = msg._inputChat;
        this._viaBot = msg._viaBot;
        this._viaInputBot = msg._viaInputBot;
        this._forward = msg._forward;
        this._actionEntities = msg._actionEntities;
    }
    /*
            get buttons() {
                if (!this._buttons && this.replyMarkup) {
                    if (!this.inputChat) {
                        return undefined
                    }

                    const bot = this._neededMarkupBot();
                    if (!bot) {
                        this._setButtons(this._inputChat, bot)
                    }
                }
                return this._buttons
            }
            async getButtons() {
                if (!this.buttons && this.replyMarkup) {
                    const chat = await this.getInputChat();
                    if (!chat) return;
                    let bot = this._neededMarkupBot();
                    if (!bot) {
                        await this._reloadMessage();
                        bot = this._neededMarkupBot()
                    }
                    this._setButtons(chat, bot)
                }
                return this._buttons
            }
        /
            get buttonCount() {
                if (!this._buttonsCount) {
                    if ((this.replyMarkup instanceof Api.ReplyInlineMarkup) ||
                        (this.replyMarkup instanceof Api.ReplyKeyboardMarkup)) {
                        this._buttonsCount = (this.replyMarkup.rows.map((r) => r.buttons.length)).reduce(function (a, b) {
                            return a + b;
                        }, 0);
                    } else {
                        this._buttonsCount = 0
                    }
                }
                return this._buttonsCount
            }

            get file() {
                if (!this._file) {
                    const media = this.photo || this.document;
                    if (media) {
                        this._file = new File(media);
                    }
                }
                return this._file
            }
    */
    get photo() {
        if (this.media instanceof api_1.Api.MessageMediaPhoto) {
            if (this.media.photo instanceof api_1.Api.Photo)
                return this.media.photo;
        }
        else if (this.action instanceof api_1.Api.MessageActionChatEditPhoto) {
            return this.action.photo;
        }
        else {
            return this.webPreview && this.webPreview.photo instanceof api_1.Api.Photo
                ? this.webPreview.photo
                : undefined;
        }
        return undefined;
    }
    get document() {
        if (this.media instanceof api_1.Api.MessageMediaDocument) {
            if (this.media.document instanceof api_1.Api.Document)
                return this.media.document;
        }
        else {
            const web = this.webPreview;
            return web && web.document instanceof api_1.Api.Document
                ? web.document
                : undefined;
        }
        return undefined;
    }
    get webPreview() {
        if (this.media instanceof api_1.Api.MessageMediaWebPage) {
            if (this.media.webpage instanceof api_1.Api.WebPage)
                return this.media.webpage;
        }
    }
    get audio() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeAudio, (attr) => !attr.voice);
    }
    get voice() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeAudio, (attr) => !!attr.voice);
    }
    get video() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeVideo);
    }
    get videoNote() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeVideo, (attr) => !!attr.roundMessage);
    }
    get gif() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeAnimated);
    }
    get sticker() {
        return this._documentByAttribute(api_1.Api.DocumentAttributeSticker);
    }
    get contact() {
        if (this.media instanceof api_1.Api.MessageMediaContact) {
            return this.media;
        }
    }
    get game() {
        if (this.media instanceof api_1.Api.MessageMediaGame) {
            return this.media.game;
        }
    }
    get geo() {
        if (this.media instanceof api_1.Api.MessageMediaGeo ||
            this.media instanceof api_1.Api.MessageMediaGeoLive ||
            this.media instanceof api_1.Api.MessageMediaVenue) {
            return this.media.geo;
        }
    }
    get invoice() {
        if (this.media instanceof api_1.Api.MessageMediaInvoice) {
            return this.media;
        }
    }
    get poll() {
        if (this.media instanceof api_1.Api.MessageMediaPoll) {
            return this.media;
        }
    }
    get venue() {
        if (this.media instanceof api_1.Api.MessageMediaVenue) {
            return this.media;
        }
    }
    get dice() {
        if (this.media instanceof api_1.Api.MessageMediaDice) {
            return this.media;
        }
    }
    get actionEntities() {
        return this._actionEntities;
    }
    get viaBot() {
        return this._viaBot;
    }
    get viaInputBot() {
        return this._viaInputBot;
    }
    get replyToMsgId() {
        var _a;
        return (_a = this.replyTo) === null || _a === void 0 ? void 0 : _a.replyToMsgId;
    }
    get toId() {
        if (this._client && !this.out && this.isPrivate) {
            return new api_1.Api.PeerUser({
                userId: users_1._selfId(this._client),
            });
        }
        return this.peerId;
    }
    getEntitiesText(cls) {
        let ent = this.entities;
        if (!ent || ent.length == 0)
            return;
        if (cls) {
            ent = ent.filter((v) => v instanceof cls);
        }
        const texts = utils.getInnerText(this.message || "", ent);
        const zip = (rows) => rows[0].map((_, c) => rows.map((row) => row[c]));
        return zip([ent, texts]);
    }
    async getReplyMessage() {
        if (!this._replyMessage && this._client) {
            if (!this.replyTo)
                return undefined;
            // Bots cannot access other bots' messages by their ID.
            // However they can access them through replies...
            this._replyMessage = (await this._client.getMessages(this.isChannel ? await this.getInputChat() : undefined, {
                ids: new api_1.Api.InputMessageReplyTo({ id: this.id }),
            }))[0];
            if (!this._replyMessage) {
                // ...unless the current message got deleted.
                //
                // If that's the case, give it a second chance accessing
                // directly by its ID.
                this._replyMessage = (await this._client.getMessages(this.isChannel ? this._inputChat : undefined, {
                    ids: this.replyToMsgId,
                }))[0];
            }
        }
        return this._replyMessage;
    }
    async respond(params) {
        if (this._client) {
            return this._client.sendMessage((await this.getInputChat()), params);
        }
    }
    async reply(params) {
        if (this._client) {
            params.replyTo = this.id;
            return this._client.sendMessage((await this.getInputChat()), params);
        }
    }
    async forwardTo(entity) {
        if (this._client) {
            entity = await this._client.getInputEntity(entity);
            const params = {
                messages: [this.id],
                fromPeer: (await this.getInputChat()),
            };
            return this._client.forwardMessages(entity, params);
        }
    }
    async edit(params) {
        const param = params;
        if (this.fwdFrom || !this.out || !this._client)
            return undefined;
        if (param.linkPreview == undefined) {
            param.linkPreview = !!this.webPreview;
        }
        if (param.buttons == undefined) {
            param.buttons = this.replyMarkup;
        }
        param.message = this.id;
        return this._client.editMessage((await this.getInputChat()), param);
    }
    async delete({ revoke } = { revoke: false }) {
        if (this._client) {
            return this._client.deleteMessages(await this.getInputChat(), [this.id], {
                revoke,
            });
        }
    }
    async downloadMedia(params) {
        // small hack for patched method
        if (this._client)
            return this._client.downloadMedia(this, params);
    }
    /* TODO doesn't look good enough.
    async click({ i = undefined, j = undefined, text = undefined, filter = undefined, data = undefined }) {
        if (!this._client) return;

        if (data) {
            if (!(await this._getInputChat()))
                return undefined;

            try {
                return await this._client.invoke(functions.messages.GetBotCallbackAnswerRequest({
                    peer: this._inputChat,
                    msgId: this.id,
                    data: data
                }));
            } catch (e) {
                if (e instanceof errors.BotTimeout)
                    return undefined;
            }
        }

        if ([i, text, filter].filter((x) => !!x) > 1)
            throw new Error("You can only set either of i, text or filter");

        if (!(await this.getButtons()))
            return;

        if (text) {
            if (callable(text)) {
                for (const button of this._buttonsFlat) {
                    if (text(button.text)) {
                        return button.click();
                    }
                }
            } else {
                for (const button of this._buttonsFlat) {
                    if (button.text === text) {
                        return button.click();
                    }
                }
            }
        }

        if (filter && callable(filter)) {
            for (const button of this._buttonsFlat) {
                if (filter(button)) {
                    return button.click();
                }
            }
            return undefined;
        }

        i = !i ? 0 : i;
        if (!j) return this._buttonsFlat[i].click();
        else return this._buttons[i][j].click();
    }
*/
    /* TODO add missing friendly functions
    async markRead() {
        if (this._client) {
            await this._client.sendReadAcknowledge({
                entity: await this.getInputChat(),
                maxId: this.id
            });
        }
    }

    async pin(notify = false) {
        if (this._client) {
            await this._client.pinMessage({
                entity: await this.getInputChat(),
                message: this.id,
                notify: notify
            });
        }
    }
*/
    /*
        _setButtons(chat, bot) {
            // TODO: Implement MessageButton
            // if (this._client && (this.replyMarkup instanceof types.ReplyInlineMarkup ||
            //         this.replyMarkup instanceof types.ReplyKeyboardMarkup)) {
            //     this._buttons = this.replyMarkup.rows.map((row) =>
            //         row.buttons.map((button) => new Messagebutton(this._client, button, chat, bot, this.id)))
            // }
            // this._buttonsFlat = this._buttons.flat()
        }

        _neededMarkupBot() {
            if (this._client && !(this.replyMarkup instanceof types.ReplyInlineMarkup ||
                this.replyMarkup instanceof types.ReplyKeyboardMarkup)) {
                return undefined;
            }

            for (const row of this.replyMarkup.rows) {
                for (const button of row.buttons) {
                    if (button instanceof types.KeyboardButtonSwitchInline) {
                        if (button.samePeer) {
                            const bot = this._inputSender;
                            if (!bot) throw new Error("No input sender");
                            return bot;
                        } else {
                            const ent = this._client._entityCache[this.viaBotId];
                            if (!ent) throw new Error("No input sender");
                            return ent;
                        }
                    }
                }
            }
        }
    */
    // TODO fix this
    _documentByAttribute(kind, condition) {
        const doc = this.document;
        if (doc) {
            for (const attr of doc.attributes) {
                if (attr instanceof kind) {
                    if (condition == undefined ||
                        (typeof condition == "function" && condition(attr))) {
                        return doc;
                    }
                    return undefined;
                }
            }
        }
    }
}
exports.CustomMessage = CustomMessage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2dyYW1qcy90bC9jdXN0b20vbWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQThDO0FBRTlDLGdDQUE2QjtBQUU3Qiw2Q0FBMEM7QUFDMUMsbURBQXFDO0FBQ3JDLHVDQUFvQztBQUlwQywrQkFBK0I7QUFDL0IsMkNBQWlEO0FBQ2pELDhDQUE2QztBQW9DN0M7Ozs7O0dBS0c7QUFDSCxNQUFhLGFBQWMsU0FBUSwyQkFBWTtJQW1TM0MsWUFBWSxJQUEwQjtRQUNsQyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQXZHRCxDQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUM7UUFDWixPQUFPLDBCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxJQUFJLENBQUMsRUFDRCxFQUFFLEVBQ0YsTUFBTSxHQUFHLFNBQVMsRUFDbEIsSUFBSSxHQUFHLFNBQVMsRUFFaEIsR0FBRyxHQUFHLFNBQVMsRUFDZixTQUFTLEdBQUcsU0FBUyxFQUNyQixXQUFXLEdBQUcsU0FBUyxFQUN2QixNQUFNLEdBQUcsU0FBUyxFQUNsQixJQUFJLEdBQUcsU0FBUyxFQUNoQixNQUFNLEdBQUcsU0FBUyxFQUNsQixPQUFPLEdBQUcsU0FBUyxFQUVuQixPQUFPLEdBQUcsU0FBUyxFQUVuQixPQUFPLEdBQUcsU0FBUyxFQUNuQixRQUFRLEdBQUcsU0FBUyxFQUNwQixLQUFLLEdBQUcsU0FBUyxFQUNqQixXQUFXLEdBQUcsU0FBUyxFQUN2QixRQUFRLEdBQUcsU0FBUyxFQUNwQixLQUFLLEdBQUcsU0FBUyxFQUNqQixRQUFRLEdBQUcsU0FBUyxFQUNwQixVQUFVLEdBQUcsU0FBUyxFQUN0QixTQUFTLEdBQUcsU0FBUyxFQUNyQixhQUFhLEdBQUcsU0FB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