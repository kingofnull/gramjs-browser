"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessages = exports.editMessage = exports.forwardMessages = exports.sendMessage = exports.getMessages = exports.iterMessages = exports._IDsIter = exports._MessagesIter = void 0;
const tl_1 = require("../tl");
const requestIter_1 = require("../requestIter");
const Helpers_1 = require("../Helpers");
const Utils_1 = require("../Utils");
const __1 = require("../");
const messageParse_1 = require("./messageParse");
const users_1 = require("./users");
const _MAX_CHUNK_SIZE = 100;
class _MessagesIter extends requestIter_1.RequestIter {
    async _init({ entity, offsetId, minId, maxId, fromUser, offsetDate, addOffset, filter, search, replyTo, }) {
        var e_1, _a;
        if (entity) {
            this.entity = await this.client.getInputEntity(entity);
        }
        else {
            this.entity = undefined;
            if (this.reverse) {
                throw new Error("Cannot reverse global search");
            }
        }
        if (this.reverse) {
            offsetId = Math.max(offsetId, minId);
            if (offsetId && maxId) {
                if (maxId - offsetId <= 1) {
                    return false;
                }
            }
            if (!maxId) {
                maxId = Number.MAX_SAFE_INTEGER;
            }
        }
        else {
            offsetId = Math.max(offsetId, maxId);
            if (offsetId && minId) {
                if (offsetId - minId <= 1) {
                    return false;
                }
            }
        }
        if (this.reverse) {
            if (offsetId) {
                offsetId += 1;
            }
            else if (!offsetDate) {
                offsetId = 1;
            }
        }
        if (fromUser) {
            fromUser = await this.client.getInputEntity(fromUser);
            this.fromId = await this.client.getPeerId(fromUser);
        }
        else {
            this.fromId = undefined;
        }
        if (!this.entity && fromUser) {
            this.entity = new tl_1.Api.InputPeerEmpty();
        }
        if (!filter) {
            filter = new tl_1.Api.InputMessagesFilterEmpty();
        }
        if (!this.entity) {
            this.request = new tl_1.Api.messages.SearchGlobal({
                q: search || "",
                filter: filter,
                minDate: undefined,
                // TODO fix this smh
                maxDate: offsetDate,
                offsetRate: undefined,
                offsetPeer: new tl_1.Api.InputPeerEmpty(),
                offsetId: offsetId,
                limit: 1,
            });
        }
        else if (replyTo !== undefined) {
            this.request = new tl_1.Api.messages.GetReplies({
                peer: this.entity,
                msgId: replyTo,
                offsetId: offsetId,
                offsetDate: offsetDate,
                addOffset: addOffset,
                limit: 0,
                maxId: 0,
                minId: 0,
                hash: 0,
            });
        }
        else if (search !== undefined ||
            filter !== undefined ||
            fromUser !== undefined) {
            const ty = Helpers_1._entityType(this.entity);
            if (ty == Helpers_1._EntityType.USER) {
                fromUser = undefined;
            }
            else {
                this.fromId = undefined;
            }
            this.request = new tl_1.Api.messages.Search({
                peer: this.entity,
                q: search || "",
                filter: typeof filter === "function" ? new filter() : filter,
                minDate: undefined,
                maxDate: offsetDate,
                offsetId: offsetId,
                addOffset: addOffset,
                limit: 0,
                maxId: 0,
                minId: 0,
                hash: 0,
                fromId: fromUser,
            });
            if (filter instanceof tl_1.Api.InputMessagesFilterEmpty &&
                offsetDate &&
                !search &&
                !offsetId) {
                try {
                    for (var _b = __asyncValues(this.client.iterMessages(this.entity, {
                        limit: 1,
                        offsetDate: offsetDate,
                    })), _c; _c = await _b.next(), !_c.done;) {
                        const m = _c.value;
                        this.request.offsetId = m.id + 1;
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
        }
        else {
            this.request = new tl_1.Api.messages.GetHistory({
                peer: this.entity,
                limit: 1,
                offsetDate: offsetDate,
                offsetId: offsetId,
                minId: 0,
                maxId: 0,
                addOffset: addOffset,
                hash: 0,
            });
        }
        if (this.limit <= 0) {
            const result = await this.client.invoke(this.request);
            if (result instanceof tl_1.Api.messages.MessagesNotModified) {
                this.total = result.count;
            }
            else {
                if ("count" in result) {
                    this.total = result.count;
                }
                else {
                    this.total = result.messages.length;
                }
            }
            return false;
        }
        if (!this.waitTime) {
            this.waitTime = this.limit > 3000 ? 1 : 0;
        }
        if (this.reverse &&
            !(this.request instanceof tl_1.Api.messages.SearchGlobal)) {
            this.request.addOffset -= _MAX_CHUNK_SIZE;
        }
        this.addOffset = addOffset;
        this.maxId = maxId;
        this.minId = minId;
        this.lastId = this.reverse ? 0 : Number.MAX_SAFE_INTEGER;
    }
    async _loadNextChunk() {
        var _a;
        if (!this.request) {
            throw new Error("Request not set yet");
        }
        this.request.limit = Math.min(this.left, _MAX_CHUNK_SIZE);
        if (this.reverse && this.request.limit != _MAX_CHUNK_SIZE) {
            if (!(this.request instanceof tl_1.Api.messages.SearchGlobal)) {
                this.request.addOffset = this.addOffset - this.request.limit;
            }
        }
        const r = await this.client.invoke(this.request);
        if (r instanceof tl_1.Api.messages.MessagesNotModified) {
            return true;
        }
        if ("count" in r) {
            this.total = r.count;
        }
        else {
            this.total = r.messages.length;
        }
        const entities = new Map();
        for (const x of [...r.users, ...r.chats]) {
            entities.set(Utils_1.getPeerId(x), x);
        }
        const messages = this.reverse
            ? r.messages.reverse()
            : r.messages;
        for (const message of messages) {
            if (this.fromId && message.senderId != this.fromId) {
                continue;
            }
            if (!this._messageInRange(message)) {
                return true;
            }
            this.lastId = message.id;
            try {
                // if this fails it shouldn't be a big problem
                message._finishInit(this.client, entities, this.entity);
            }
            catch (e) { }
            message._entities = entities;
            (_a = this.buffer) === null || _a === void 0 ? void 0 : _a.push(message);
        }
        if (r.messages.length < this.request.limit) {
            return true;
        }
        if (this.buffer) {
            this._updateOffset(this.buffer[this.buffer.length - 1], r);
        }
        else {
            return true;
        }
    }
    _messageInRange(message) {
        if (this.entity) {
            if (this.reverse) {
                if (message.id <= this.lastId || message.id >= this.maxId) {
                    return false;
                }
            }
            else {
                if (message.id >= this.lastId || message.id <= this.minId) {
                    return false;
                }
            }
        }
        return true;
    }
    [Symbol.asyncIterator]() {
        return super[Symbol.asyncIterator]();
    }
    _updateOffset(lastMessage, response) {
        if (!this.request) {
            throw new Error("Request not set yet");
        }
        this.request.offsetId = Number(lastMessage.id);
        if (this.reverse) {
            this.request.offsetId += 1;
        }
        if (this.request instanceof tl_1.Api.messages.Search) {
            this.request.maxDate = -1;
        }
        else {
            if (!(this.request instanceof tl_1.Api.messages.SearchGlobal)) {
                this.request.offsetDate = lastMessage.date;
            }
        }
        if (this.request instanceof tl_1.Api.messages.SearchGlobal) {
            if (lastMessage.inputChat) {
                this.request.offsetPeer = lastMessage.inputChat;
            }
            else {
                this.request.offsetPeer = new tl_1.Api.InputPeerEmpty();
            }
            this.request.offsetRate = response.nextRate;
        }
    }
}
exports._MessagesIter = _MessagesIter;
class _IDsIter extends requestIter_1.RequestIter {
    async _init({ entity, ids }) {
        this.total = ids.length;
        this._ids = this.reverse ? ids.reverse() : ids;
        this._offset = 0;
        this._entity = entity
            ? await this.client.getInputEntity(entity)
            : undefined;
        this._ty = this._entity ? Helpers_1._entityType(this._entity) : undefined;
        if (!this.waitTime) {
            this.waitTime = this.limit > 300 ? 10 : 0;
        }
    }
    [Symbol.asyncIterator]() {
        return super[Symbol.asyncIterator]();
    }
    async _loadNextChunk() {
        var _a, _b, _c;
        const ids = this._ids.slice(this._offset, this._offset + _MAX_CHUNK_SIZE);
        if (!ids.length) {
            return false;
        }
        this._offset += _MAX_CHUNK_SIZE;
        let fromId;
        let r;
        if (this._ty == Helpers_1._EntityType.CHANNEL) {
            try {
                r = await this.client.invoke(new tl_1.Api.channels.GetMessages({
                    channel: this._entity,
                    id: ids,
                }));
            }
            catch (e) {
                if (e.errorMessage == "MESSAGE_IDS_EMPTY") {
                    r = new tl_1.Api.messages.MessagesNotModified({
                        count: ids.length,
                    });
                }
                else {
                    throw e;
                }
            }
        }
        else {
            r = await this.client.invoke(new tl_1.Api.messages.GetMessages({
                id: ids,
            }));
            if (this._entity) {
                fromId = await users_1._getPeer(this.client, this._entity);
            }
        }
        if (r instanceof tl_1.Api.messages.MessagesNotModified) {
            (_a = this.buffer) === null || _a === void 0 ? void 0 : _a.push(...Array(ids.length));
            return;
        }
        const entities = new Map();
        for (const entity of [...r.users, ...r.chats]) {
            entities.set(__1.utils.getPeerId(entity), entity);
        }
        let message;
        for (message of r.messages) {
            if (message instanceof tl_1.Api.MessageEmpty ||
                (fromId &&
                    __1.utils.getPeerId(message.peerId) != __1.utils.getPeerId(fromId))) {
                (_b = this.buffer) === null || _b === void 0 ? void 0 : _b.push(undefined);
            }
            else {
                const temp = message;
                temp._finishInit(this.client, entities, this._entity);
                temp._entities = entities;
                (_c = this.buffer) === null || _c === void 0 ? void 0 : _c.push(temp);
            }
        }
    }
}
exports._IDsIter = _IDsIter;
const IterMessagesDefaults = {
    limit: undefined,
    offsetDate: undefined,
    offsetId: 0,
    maxId: 0,
    minId: 0,
    addOffset: 0,
    search: undefined,
    filter: undefined,
    fromUser: undefined,
    waitTime: undefined,
    ids: undefined,
    reverse: false,
    replyTo: undefined,
    scheduled: false,
};
/** @hidden */
function iterMessages(client, entity, options) {
    const { limit, offsetDate, offsetId, maxId, minId, addOffset, search, filter, fromUser, waitTime, ids, reverse, replyTo, } = Object.assign(Object.assign({}, IterMessagesDefaults), options);
    if (ids) {
        let idsArray;
        if (!Helpers_1.isArrayLike(ids)) {
            idsArray = [ids];
        }
        else {
            idsArray = ids;
        }
        return new _IDsIter(client, idsArray.length, {
            reverse: reverse,
            waitTime: waitTime,
        }, {
            entity: entity,
            ids: idsArray,
        });
    }
    return new _MessagesIter(client, limit, {
        waitTime: waitTime,
        reverse: reverse,
    }, {
        entity: entity,
        offsetId: offsetId,
        minId: minId,
        maxId: maxId,
        fromUser: fromUser,
        offsetDate: offsetDate,
        addOffset: addOffset,
        filter: filter,
        search: search,
        replyTo: replyTo,
    });
}
exports.iterMessages = iterMessages;
/** @hidden */
async function getMessages(client, entity, params) {
    var e_2, _a;
    if (Object.keys(params).length == 1 && params.limit === undefined) {
        if (params.minId === undefined && params.maxId === undefined) {
            params.limit = undefined;
        }
        else {
            params.limit = 1;
        }
    }
    const it = client.iterMessages(entity, params);
    const ids = params.ids;
    if (ids && !Helpers_1.isArrayLike(ids)) {
        try {
            for (var it_1 = __asyncValues(it), it_1_1; it_1_1 = await it_1.next(), !it_1_1.done;) {
                const message = it_1_1.value;
                return [message];
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (it_1_1 && !it_1_1.done && (_a = it_1.return)) await _a.call(it_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return [];
    }
    return (await it.collect());
}
exports.getMessages = getMessages;
// region Message
/** @hidden */
async function sendMessage(client, 
/** To who will it be sent. */
entity, 
/**  The message to be sent, or another message object to resend as a copy.<br/>
 * The maximum length for a message is 35,000 bytes or 4,096 characters.<br/>
 * Longer messages will not be sliced automatically, and you should slice them manually if the text to send is longer than said length. */
{ message, replyTo, attributes, parseMode, formattingEntities, linkPreview = true, file, thumb, forceDocument, clearDraft, buttons, silent, supportStreaming, schedule, } = {}) {
    if (file) {
        return client.sendFile(entity, {
            file: file,
            caption: message
                ? typeof message == "string"
                    ? message
                    : message.message
                : "",
            forceDocument: forceDocument,
            clearDraft: clearDraft,
            replyTo: replyTo,
            attributes: attributes,
            thumb: thumb,
            supportsStreaming: supportStreaming,
            parseMode: parseMode,
            formattingEntities: formattingEntities,
            silent: silent,
            scheduleDate: schedule,
            buttons: buttons,
        });
    }
    entity = await client.getInputEntity(entity);
    let markup, request;
    if (message && message instanceof tl_1.Api.Message) {
        if (buttons == undefined) {
            markup = message.replyMarkup;
        }
        else {
            markup = client.buildReplyMarkup(buttons);
        }
        if (silent == undefined) {
            silent = message.silent;
        }
        if (message.media &&
            !(message.media instanceof tl_1.Api.MessageMediaWebPage)) {
            throw new Error("Not Supported Yet");
            /*
                            return this.sendFile(entity, message.media, {
                                caption: message.message,
                                silent: silent,
                                replyTo: replyTo,
                                buttons: markup,
                                formattingEntities: message.entities,
                                schedule: schedule
                            })

             */
        }
        request = new tl_1.Api.messages.SendMessage({
            peer: entity,
            message: message.message || "",
            silent: silent,
            replyToMsgId: Utils_1.getMessageId(replyTo),
            replyMarkup: markup,
            entities: message.entities,
            clearDraft: clearDraft,
            noWebpage: !(message.media instanceof tl_1.Api.MessageMediaWebPage),
            scheduleDate: schedule,
        });
        message = message.message;
    }
    else {
        if (formattingEntities == undefined) {
            [message, formattingEntities] = await messageParse_1._parseMessageText(client, message || "", parseMode);
        }
        if (!message) {
            throw new Error("The message cannot be empty unless a file is provided");
        }
        request = new tl_1.Api.messages.SendMessage({
            peer: entity,
            message: message.toString(),
            entities: formattingEntities,
            noWebpage: !linkPreview,
            replyToMsgId: Utils_1.getMessageId(replyTo),
            clearDraft: clearDraft,
            silent: silent,
            replyMarkup: client.buildReplyMarkup(buttons),
            scheduleDate: schedule,
        });
    }
    const result = await client.invoke(request);
    if (result instanceof tl_1.Api.UpdateShortSentMessage) {
        const msg = new tl_1.Api.Message({
            id: result.id,
            peerId: await users_1._getPeer(client, entity),
            message: message,
            date: result.date,
            out: result.out,
            media: result.media,
            entities: result.entities,
            replyMarkup: request.replyMarkup,
            ttlPeriod: result.ttlPeriod,
        });
        msg._finishInit(client, new Map(), entity);
        return msg;
    }
    return client._getResponseMessage(request, result, entity);
}
exports.sendMessage = sendMessage;
/** @hidden */
async function forwardMessages(client, entity, { messages, fromPeer, silent, schedule }) {
    if (!Helpers_1.isArrayLike(messages)) {
        messages = [messages];
    }
    entity = await client.getInputEntity(entity);
    let fromPeerId;
    if (fromPeer) {
        fromPeer = await client.getInputEntity(fromPeer);
        fromPeerId = await client.getPeerId(fromPeer);
    }
    const getKey = (m) => {
        if (typeof m == "number") {
            if (fromPeerId !== undefined) {
                return fromPeerId;
            }
            throw new Error("fromPeer must be given if integer IDs are used");
        }
        else if (m instanceof tl_1.Api.Message) {
            return m.chatId;
        }
        else {
            throw new Error(`Cannot forward ${m}`);
        }
    };
    const sent = [];
    for (let [chatId, chunk] of Helpers_1.groupBy(messages, getKey)) {
        let chat;
        let numbers = [];
        if (typeof chunk[0] == "number") {
            chat = fromPeer;
            numbers = chunk;
        }
        else {
            chat = await chunk[0].getInputChat();
            numbers = chunk.map((m) => m.id);
        }
        chunk.push();
        const request = new tl_1.Api.messages.ForwardMessages({
            fromPeer: chat,
            id: numbers,
            toPeer: entity,
            silent: silent,
            scheduleDate: schedule,
        });
        const result = await client.invoke(request);
        sent.push(client._getResponseMessage(request, result, entity));
    }
    return sent;
}
exports.forwardMessages = forwardMessages;
/** @hidden */
async function editMessage(client, entity, { message, text, parseMode, formattingEntities, linkPreview = true, file, forceDocument, buttons, schedule, }) {
    entity = await client.getInputEntity(entity);
    if (formattingEntities == undefined) {
        [text, formattingEntities] = await messageParse_1._parseMessageText(client, text, parseMode);
    }
    const request = new tl_1.Api.messages.EditMessage({
        peer: entity,
        id: __1.utils.getMessageId(message),
        message: text,
        noWebpage: !linkPreview,
        entities: formattingEntities,
        //media: no media for now,
        replyMarkup: client.buildReplyMarkup(buttons),
        scheduleDate: schedule,
    });
    const result = await client.invoke(request);
    return client._getResponseMessage(request, result, entity);
}
exports.editMessage = editMessage;
/** @hidden */
async function deleteMessages(client, entity, messageIds, { revoke = false }) {
    let ty = Helpers_1._EntityType.USER;
    if (entity) {
        entity = await client.getInputEntity(entity);
        ty = Helpers_1._entityType(entity);
    }
    const ids = [];
    for (const messageId of messageIds) {
        if (messageId instanceof tl_1.Api.Message ||
            messageId instanceof tl_1.Api.MessageService ||
            messageId instanceof tl_1.Api.MessageEmpty) {
            ids.push(messageId.id);
        }
        else if (typeof messageId === "number") {
            ids.push(messageId);
        }
        else {
            throw new Error(`Cannot convert ${messageId} to an integer`);
        }
    }
    const results = [];
    if (ty == Helpers_1._EntityType.CHANNEL) {
        for (const chunk of __1.utils.chunks(ids)) {
            results.push(client.invoke(new tl_1.Api.channels.DeleteMessages({
                channel: entity,
                id: chunk,
            })));
        }
    }
    else {
        for (const chunk of __1.utils.chunks(ids)) {
            results.push(client.invoke(new tl_1.Api.messages.DeleteMessages({
                id: chunk,
                revoke: revoke,
            })));
        }
    }
    return Promise.all(results);
}
exports.deleteMessages = deleteMessages;
// TODO do the rest
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9ncmFtanMvY2xpZW50L21lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw4QkFBNEI7QUFTNUIsZ0RBQTZDO0FBQzdDLHdDQU1vQjtBQUNwQixvQ0FBbUQ7QUFFbkQsMkJBQTRCO0FBQzVCLGlEQUFtRDtBQUNuRCxtQ0FBbUM7QUFFbkMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBZTVCLE1BQWEsYUFBYyxTQUFRLHlCQUFXO0lBYTFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFDUixNQUFNLEVBQ04sUUFBUSxFQUNSLEtBQUssRUFDTCxLQUFLLEVBQ0wsUUFBUSxFQUNSLFVBQVUsRUFDVixTQUFTLEVBQ1QsTUFBTSxFQUNOLE1BQU0sRUFDTixPQUFPLEdBQ1M7O1FBQ2hCLElBQUksTUFBTSxFQUFFO1lBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDSCxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2FBQ25EO1NBQ0o7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDZCxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsSUFBSSxRQUFRLElBQUksS0FBSyxFQUFFO2dCQUNuQixJQUFJLEtBQUssR0FBRyxRQUFRLElBQUksQ0FBQyxFQUFFO29CQUN2QixPQUFPLEtBQUssQ0FBQztpQkFDaEI7YUFDSjtZQUNELElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQzthQUNu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