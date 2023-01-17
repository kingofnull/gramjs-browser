"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackQueryEvent = exports.CallbackQuery = exports.NewCallbackQueryDefaults = void 0;
const common_1 = require("./common");
const tl_1 = require("../tl");
const Helpers_1 = require("../Helpers");
const Utils_1 = require("../Utils");
exports.NewCallbackQueryDefaults = {
    chats: [],
    fromUsers: [],
    blacklistUsers: [],
};
/**
 * Occurs whenever you sign in as a bot and a user
 * clicks one of the inline buttons on your messages.
 * Note that the `chats` parameter will **not** work with normal
 * IDs or peers if the clicked inline button comes from a "via bot"
 * message. The `chats` parameter also supports checking against the
 * `chat_instance` which should be used for inline callbacks.
 *
 * @example
 * ```ts
 * async function printQuery(event: NewCallbackQueryEvent) {
 *     // TODO
 * }
 * ```
 */
class CallbackQuery extends common_1.EventBuilder {
    constructor(inlineQueryParams = {}) {
        const { chats, func, pattern } = inlineQueryParams;
        super({ chats, func, blacklistChats: false });
        this.match = pattern;
        this._noCheck = [this.chats, this.func, this.match].every((i) => i === null || i === undefined);
    }
    build(update, others = null) {
        if (update instanceof tl_1.Api.UpdateBotCallbackQuery) {
            console.log("returning her!");
            return new CallbackQueryEvent(update, update.peer, update.msgId);
        }
        else if (update instanceof tl_1.Api.UpdateInlineBotCallbackQuery) {
            const b = Helpers_1.toSignedLittleBuffer(update.msgId.id, 8);
            const msgId = b.readInt32LE();
            const peerId = b.readInt32LE(4);
            const peer = peerId < 0
                ? new tl_1.Api.PeerChannel({ channelId: -peerId })
                : new tl_1.Api.PeerUser({ userId: peerId });
            return new CallbackQueryEvent(update, peer, msgId);
        }
    }
    filter(event) {
        if (this._noCheck)
            return event;
        if (this.chats) {
            let inside = this.chats.includes(event.query.chatInstance);
            if (event.chatId) {
                inside = inside || this.chats.includes(event.chatId);
            }
            if (inside === this.blacklistChats) {
                return;
            }
        }
        if (this.match) {
            const data = new TextDecoder().decode(event.query.data);
            const result = this.match.exec(data);
            if (result) {
                event.patternMatch = result;
            }
            else {
                return;
            }
        }
        if (this.func) {
            return this.func(event);
        }
        return true;
    }
}
exports.CallbackQuery = CallbackQuery;
class CallbackQueryEvent extends common_1.EventCommonSender {
    constructor(query, peer, msgId) {
        super({
            msgId,
            chatPeer: peer,
            broadcast: false,
        });
        this.query = query;
        this.patternMatch = undefined;
        this._senderId = query.userId;
        this._message = undefined;
        this._answered = false;
    }
    _setClient(client) {
        super._setClient(client);
        const [sender, inputSender] = Utils_1._getEntityPair(this._senderId, this._entities, client._entityCache);
        this._sender = sender;
        this._inputSender = inputSender;
    }
    get id() {
        return this.query.queryId;
    }
    get messageId() {
        return this._messageId;
    }
    get data() {
        return this.query.data;
    }
    get chatInstance() {
        return this.query.chatInstance;
    }
    async getMessage() {
        if (this._message) {
            return this._message;
        }
        const chat = this.isChannel ? await this.getInputChat() : undefined;
        if (!chat)
            return;
        const messages = await this._client.getMessages(chat, {
            ids: this._messageId,
        });
        this._message = messages[0];
        return this._message;
    }
    async _refetchSender() {
        if (this._entities.has(this._senderId)) {
            this._sender = this._entities.get(this._senderId);
        }
        if (!this._sender)
            return;
        this._inputSender = Utils_1.getInputPeer(this._chat);
        if (!this._inputSender.hasOwnProperty("accessHash")) {
            try {
                this._inputSender = this._client._entityCache.get(this._senderId);
            }
            catch (e) {
                const m = await this.getMessage();
                if (m) {
                    this._sender = m._sender;
                    this._inputSender = m._inputSender;
                }
            }
        }
    }
    async answer({ message, cacheTime, url, alert, } = {}) {
        if (this._answered)
            return;
        return await this._client.invoke(new tl_1.Api.messages.SetBotCallbackAnswer({
            queryId: this.query.queryId,
            cacheTime,
            alert,
            message,
            url,
        })).then((res) => {
            this._answered = true;
            return res;
        });
    }
    get viaInline() {
        return this.query instanceof tl_1.Api.UpdateInlineBotCallbackQuery;
    }
    async respond(params = {}) {
        await this.answer();
        const inputChat = await this.getInputChat();
        await this._client.sendMessage(inputChat, params);
    }
    async reply(params = {}) {
        await this.answer();
        params.replyTo = this.messageId;
        const inputChat = await this.getInputChat();
        await this._client.sendMessage(inputChat, params);
    }
    async edit(params) {
        if (this.query.msgId instanceof tl_1.Api.InputBotInlineMessageID) {
            return await this._client.editMessage(this.messageId, params).then(async (res) => {
                await this.answer();
                return res;
            });
        }
        else {
            const inputChat = await this.getInputChat();
            return await this._client.editMessage(inputChat, params).then(async (res) => {
                await this.answer();
                return res;
            });
        }
    }
    async delete({ revoke } = { revoke: false }) {
        if (this._client) {
            return this._client.deleteMessages(await this.getInputChat(), [this.messageId], { revoke });
        }
    }
    get sender() {
        return this._sender;
    }
}
exports.CallbackQueryEvent = CallbackQueryEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsbGJhY2tRdWVyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2dyYW1qcy9ldmVudHMvQ2FsbGJhY2tRdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBMkQ7QUFDM0QsOEJBQTRCO0FBQzVCLHdDQUFrRDtBQUVsRCxvQ0FBd0Q7QUFXM0MsUUFBQSx3QkFBd0IsR0FBOEI7SUFDL0QsS0FBSyxFQUFFLEVBQUU7SUFDVCxTQUFTLEVBQUUsRUFBRTtJQUNiLGNBQWMsRUFBRSxFQUFFO0NBQ3JCLENBQUM7QUFFRjs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUNILE1BQWEsYUFBYyxTQUFRLHFCQUFZO0lBSzNDLFlBQVksb0JBQXdELEVBQUU7UUFDbEUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsaUJBQWlCLENBQUM7UUFDbkQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUU5QyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztRQUVyQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQ3JELENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxTQUFTLENBQ3ZDLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQXdDLEVBQUUsU0FBYyxJQUFJO1FBQzlELElBQUksTUFBTSxZQUFZLFFBQUcsQ0FBQyxzQkFBc0IsRUFBRTtZQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDOUIsT0FBTyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxL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