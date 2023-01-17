"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGetter = void 0;
const __1 = require("../../");
const api_1 = require("../api");
const util_1 = require("util");
const Helpers_1 = require("../../Helpers");
class ChatGetter {
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    static initChatClass(c, { chatPeer, inputChat, chat, broadcast }) {
        c._chatPeer = chatPeer;
        c._inputChat = inputChat;
        c._chat = chat;
        c._broadcast = broadcast;
        c._client = undefined;
    }
    get chat() {
        return this._chat;
    }
    async getChat() {
        var _a;
        if (!this._chat ||
            ("min" in this._chat && (await this.getInputChat()))) {
            try {
                if (this._inputChat) {
                    this._chat = await ((_a = this._client) === null || _a === void 0 ? void 0 : _a.getEntity(this._inputChat));
                }
            }
            catch (e) {
                await this._refetchChat();
            }
        }
        return this._chat;
    }
    get inputChat() {
        if (!this._inputChat && this._chatPeer && this._client) {
            try {
                this._inputChat = this._client._entityCache.get(this._chatPeer);
            }
            catch (e) { }
        }
        return this._inputChat;
    }
    async getInputChat() {
        var e_1, _a;
        if (!this.inputChat && this.chatId && this._client) {
            try {
                const target = this.chatId;
                try {
                    for (var _b = __asyncValues(this._client.iterDialogs({
                        limit: 100,
                    })), _c; _c = await _b.next(), !_c.done;) {
                        const dialog = _c.value;
                        if (dialog.id === target) {
                            this._chat = dialog.entity;
                            this._inputChat = dialog.inputEntity;
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            catch (e) {
                // do nothing
            }
            return this._inputChat;
        }
        return this._inputChat;
    }
    get chatId() {
        return this._chatPeer ? __1.utils.getPeerId(this._chatPeer) : undefined;
    }
    get isPrivate() {
        return this._chatPeer
            ? this._chatPeer instanceof api_1.Api.PeerUser
            : undefined;
    }
    get isGroup() {
        if (!this._broadcast && this.chat && "broadcast" in this.chat) {
            this._broadcast = Boolean(this.chat.broadcast);
        }
        if (this._chatPeer instanceof api_1.Api.PeerChannel) {
            if (this._broadcast === undefined) {
                return undefined;
            }
            else {
                return !this._broadcast;
            }
        }
        return this._chatPeer instanceof api_1.Api.PeerChat;
    }
    get isChannel() {
        return this._chatPeer instanceof api_1.Api.PeerChannel;
    }
    async _refetchChat() { }
}
exports.ChatGetter = ChatGetter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEdldHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2dyYW1qcy90bC9jdXN0b20vY2hhdEdldHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBRUEsOEJBQStCO0FBQy9CLGdDQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsMkNBQWlEO0FBU2pELE1BQWEsVUFBVTtJQU9uQixDQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUM7UUFDWixPQUFPLDBCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxNQUFNLENBQUMsYUFBYSxDQUNoQixDQUFNLEVBQ04sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQStCO1FBRXJFLENBQUMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksSUFBSTtRQUNKLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU87O1FBQ1QsSUFDSSxDQUFDLElBQUksQ0FBQyxLQUFLO1lBQ1gsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFDdEQ7WUFDRSxJQUFJO2dCQUNBLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUEsTUFBQSxJQUFJLENBQUMsT0FBTywwQ0FBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBLENBQUM7aUJBQy9E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