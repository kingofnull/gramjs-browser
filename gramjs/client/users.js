"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._selfId = exports._getInputNotify = exports._getInputDialog = exports._getPeer = exports.getPeerId = exports._getEntityFromString = exports.getInputEntity = exports.getEntity = exports.isUserAuthorized = exports.isBot = exports.getMe = exports.invoke = void 0;
const tl_1 = require("../tl");
const Utils_1 = require("../Utils");
const Helpers_1 = require("../Helpers");
const __1 = require("../");
const big_integer_1 = __importDefault(require("big-integer"));
// UserMethods {
// region Invoking Telegram request
/** @hidden */
async function invoke(client, request) {
    if (request.classType !== "request") {
        throw new Error("You can only invoke MTProtoRequests");
    }
    if (client._sender == undefined) {
        throw new Error("Cannot send requests while disconnected. You need to call .connect()");
    }
    await request.resolve(client, __1.utils);
    client._lastRequest = new Date().getTime();
    let attempt;
    for (attempt = 0; attempt < client._requestRetries; attempt++) {
        try {
            const promise = client._sender.send(request);
            const result = await promise;
            client.session.processEntities(result);
            client._entityCache.add(result);
            return result;
        }
        catch (e) {
            if (e instanceof __1.errors.ServerError ||
                e.errorMessage === "RPC_CALL_FAIL" ||
                e.errorMessage === "RPC_MCGET_FAIL") {
                client._log.warn(`Telegram is having internal issues ${e.constructor.name}`);
                await Helpers_1.sleep(2000);
            }
            else if (e instanceof __1.errors.FloodWaitError ||
                e instanceof __1.errors.FloodTestPhoneWaitError) {
                if (e.seconds <= client.floodSleepThreshold) {
                    client._log.info(`Sleeping for ${e.seconds}s on flood wait`);
                    await Helpers_1.sleep(e.seconds * 1000);
                }
                else {
                    throw e;
                }
            }
            else if (e instanceof __1.errors.PhoneMigrateError ||
                e instanceof __1.errors.NetworkMigrateError ||
                e instanceof __1.errors.UserMigrateError) {
                client._log.info(`Phone migrated to ${e.newDc}`);
                const shouldRaise = e instanceof __1.errors.PhoneMigrateError ||
                    e instanceof __1.errors.NetworkMigrateError;
                if (shouldRaise && (await client.isUserAuthorized())) {
                    throw e;
                }
                await client._switchDC(e.newDc);
            }
            else {
                throw e;
            }
        }
    }
    throw new Error(`Request was unsuccessful ${attempt} time(s)`);
}
exports.invoke = invoke;
/** @hidden */
async function getMe(client, inputPeer = false) {
    if (inputPeer && client._selfInputPeer) {
        return client._selfInputPeer;
    }
    const me = (await client.invoke(new tl_1.Api.users.GetUsers({ id: [new tl_1.Api.InputUserSelf()] })))[0];
    client._bot = me.bot;
    if (!client._selfInputPeer) {
        client._selfInputPeer = __1.utils.getInputPeer(me, false);
    }
    return inputPeer ? client._selfInputPeer : me;
}
exports.getMe = getMe;
/** @hidden */
async function isBot(client) {
    if (client._bot === undefined) {
        const me = await client.getMe();
        if (me) {
            return !(me instanceof tl_1.Api.InputPeerUser) ? me.bot : undefined;
        }
    }
    return client._bot;
}
exports.isBot = isBot;
/** @hidden */
async function isUserAuthorized(client) {
    try {
        await client.invoke(new tl_1.Api.updates.GetState());
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isUserAuthorized = isUserAuthorized;
/** @hidden */
async function getEntity(client, entity) {
    const single = !Helpers_1.isArrayLike(entity);
    let entityArray = [];
    if (Helpers_1.isArrayLike(entity)) {
        entityArray = entity;
    }
    else {
        entityArray.push(entity);
    }
    const inputs = [];
    for (const x of entityArray) {
        if (typeof x === "string") {
            inputs.push(x);
        }
        else {
            inputs.push(await client.getInputEntity(x));
        }
    }
    const lists = new Map([
        [Helpers_1._EntityType.USER, []],
        [Helpers_1._EntityType.CHAT, []],
        [Helpers_1._EntityType.CHANNEL, []],
    ]);
    for (const x of inputs) {
        try {
            lists.get(Helpers_1._entityType(x)).push(x);
        }
        catch (e) { }
    }
    let users = lists.get(Helpers_1._EntityType.USER);
    let chats = lists.get(Helpers_1._EntityType.CHAT);
    let channels = lists.get(Helpers_1._EntityType.CHANNEL);
    if (users.length) {
        users = await client.invoke(new tl_1.Api.users.GetUsers({
            id: users,
        }));
    }
    if (chats.length) {
        const chatIds = chats.map((x) => x.chatId);
        chats = (await client.invoke(new tl_1.Api.messages.GetChats({ id: chatIds }))).chats;
    }
    if (channels.length) {
        channels = (await client.invoke(new tl_1.Api.channels.GetChannels({ id: channels }))).chats;
    }
    const idEntity = new Map();
    for (const user of users) {
        idEntity.set(Utils_1.getPeerId(user), user);
    }
    for (const channel of channels) {
        idEntity.set(Utils_1.getPeerId(channel), channel);
    }
    for (const chat of chats) {
        idEntity.set(Utils_1.getPeerId(chat), chat);
    }
    const result = [];
    for (const x of inputs) {
        if (typeof x === "string") {
            result.push(await _getEntityFromString(client, x));
        }
        else if (!(x instanceof tl_1.Api.InputPeerSelf)) {
            result.push(idEntity.get(Utils_1.getPeerId(x)));
        }
        else {
            for (const [key, u] of idEntity.entries()) {
                if (u instanceof tl_1.Api.User && u.self) {
                    result.push(u);
                    break;
                }
            }
        }
    }
    return single ? result[0] : result;
}
exports.getEntity = getEntity;
/** @hidden */
async function getInputEntity(client, peer) {
    // Short-circuit if the input parameter directly maps to an InputPeer
    try {
        return __1.utils.getInputPeer(peer);
        // eslint-disable-next-line no-empty
    }
    catch (e) { }
    // Next in priority is having a peer (or its ID) cached in-memory
    try {
        // 0x2d45687 == crc32(b'Peer')
        if (typeof peer !== "string" &&
            (typeof peer === "number" || peer.SUBCLASS_OF_ID === 0x2d45687)) {
            const res = client._entityCache.get(peer);
            if (res) {
                return res;
            }
        }
        // eslint-disable-next-line no-empty
    }
    catch (e) { }
    // Then come known strings that take precedence
    if (typeof peer == "string") {
        if (["me", "this", "self"].includes(peer)) {
            return new tl_1.Api.InputPeerSelf();
        }
    }
    // No InputPeer, cached peer, or known string. Fetch from disk cache
    try {
        if (peer != undefined) {
            return client.session.getInputEntity(peer);
        }
        // eslint-disable-next-line no-empty
    }
    catch (e) { }
    // Only network left to try
    if (typeof peer === "string") {
        return __1.utils.getInputPeer(await _getEntityFromString(client, peer));
    }
    // If we're a bot and the user has messaged us privately users.getUsers
    // will work with accessHash = 0. Similar for channels.getChannels.
    // If we're not a bot but the user is in our contacts, it seems to work
    // regardless. These are the only two special-cased requests.
    peer = __1.utils.getPeer(peer);
    if (peer instanceof tl_1.Api.PeerUser) {
        const users = await client.invoke(new tl_1.Api.users.GetUsers({
            id: [
                new tl_1.Api.InputUser({
                    userId: peer.userId,
                    accessHash: big_integer_1.default.zero,
                }),
            ],
        }));
        if (users.length && !(users[0] instanceof tl_1.Api.UserEmpty)) {
            // If the user passed a valid ID they expect to work for
            // channels but would be valid for users, we get UserEmpty.
            // Avoid returning the invalid empty input peer for that.
            //
            // We *could* try to guess if it's a channel first, and if
            // it's not, work as a chat and try to validate it through
            // another request, but that becomes too much work.
            return __1.utils.getInputPeer(users[0]);
        }
    }
    else if (peer instanceof tl_1.Api.PeerChat) {
        return new tl_1.Api.InputPeerChat({
            chatId: peer.chatId,
        });
    }
    else if (peer instanceof tl_1.Api.PeerChannel) {
        try {
            const channels = await client.invoke(new tl_1.Api.channels.GetChannels({
                id: [
                    new tl_1.Api.InputChannel({
                        channelId: peer.channelId,
                        accessHash: big_integer_1.default.zero,
                    }),
                ],
            }));
            return __1.utils.getInputPeer(channels.chats[0]);
        }
        catch (e) {
            if (client._log.canSend("error")) {
                console.error(e);
            }
        }
    }
    throw new Error(`Could not find the input entity for ${JSON.stringify(peer)}.
         Please read https://` +
        "docs.telethon.dev/en/latest/concepts/entities.html to" +
        " find out more details.");
}
exports.getInputEntity = getInputEntity;
/** @hidden */
async function _getEntityFromString(client, string) {
    const phone = __1.utils.parsePhone(string);
    if (phone) {
        try {
            const result = await client.invoke(new tl_1.Api.contacts.GetContacts({
                hash: 0,
            }));
            if (!(result instanceof tl_1.Api.contacts.ContactsNotModified)) {
                for (const user of result.users) {
                    if (!(user instanceof tl_1.Api.User) || user.phone === phone) {
                        return user;
                    }
                }
            }
        }
        catch (e) {
            if (e.errorMessage === "BOT_METHOD_INVALID") {
                throw new Error("Cannot get entity by phone number as a " +
                    "bot (try using integer IDs, not strings)");
            }
            throw e;
        }
    }
    else if (["me", "this"].includes(string.toLowerCase())) {
        return client.getMe();
    }
    else {
        const { username, isInvite } = __1.utils.parseUsername(string);
        if (isInvite) {
            const invite = await client.invoke(new tl_1.Api.messages.CheckChatInvite({
                hash: username,
            }));
            if (invite instanceof tl_1.Api.ChatInvite) {
                throw new Error("Cannot get entity from a channel (or group) " +
                    "that you are not part of. Join the group and retry");
            }
            else if (invite instanceof tl_1.Api.ChatInviteAlready) {
                return invite.chat;
            }
        }
        else if (username) {
            try {
                const result = await client.invoke(new tl_1.Api.contacts.ResolveUsername({ username: username }));
                const pid = __1.utils.getPeerId(result.peer, false);
                if (result.peer instanceof tl_1.Api.PeerUser) {
                    for (const x of result.users) {
                        if (x.id === pid) {
                            return x;
                        }
                    }
                }
                else {
                    for (const x of result.chats) {
                        if (x.id === pid) {
                            return x;
                        }
                    }
                }
            }
            catch (e) {
                if (e.errorMessage === "USERNAME_NOT_OCCUPIED") {
                    throw new Error(`No user has "${username}" as username`);
                }
                throw e;
            }
        }
    }
    throw new Error(`Cannot find any entity corresponding to "${string}"`);
}
exports._getEntityFromString = _getEntityFromString;
/** @hidden */
async function getPeerId(client, peer, addMark = true) {
    if (typeof peer == "number") {
        return __1.utils.getPeerId(peer, addMark);
    }
    if (typeof peer == "string") {
        peer = await client.getInputEntity(peer);
    }
    if (peer.SUBCLASS_OF_ID == 0x2d45687 || peer.SUBCLASS_OF_ID == 0xc91c90b6) {
        peer = await client.getInputEntity(peer);
    }
    if (peer instanceof tl_1.Api.InputPeerSelf) {
        peer = await client.getMe(true);
    }
    return __1.utils.getPeerId(peer, addMark);
}
exports.getPeerId = getPeerId;
/** @hidden */
async function _getPeer(client, peer) {
    if (!peer) {
        return undefined;
    }
    const [i, cls] = __1.utils.resolveId(await client.getPeerId(peer));
    return new cls({
        userId: i,
        channelId: i,
        chatId: i,
    });
}
exports._getPeer = _getPeer;
/** @hidden */
async function _getInputDialog(client, dialog) {
    try {
        if (dialog.SUBCLASS_OF_ID == 0xa21c9795) {
            // crc32(b'InputDialogPeer')
            dialog.peer = await client.getInputEntity(dialog.peer);
            return dialog;
        }
        else if (dialog.SUBCLASS_OF_ID == 0xc91c90b6) {
            //crc32(b'InputPeer')
            return new tl_1.Api.InputDialogPeer({
                peer: dialog,
            });
        }
    }
    catch (e) { }
    return new tl_1.Api.InputDialogPeer({
        peer: dialog,
    });
}
exports._getInputDialog = _getInputDialog;
/** @hidden */
async function _getInputNotify(client, notify) {
    try {
        if (notify.SUBCLASS_OF_ID == 0x58981615) {
            if (notify instanceof tl_1.Api.InputNotifyPeer) {
                notify.peer = await client.getInputEntity(notify.peer);
            }
            return notify;
        }
    }
    catch (e) { }
    return new tl_1.Api.InputNotifyPeer({
        peer: await client.getInputEntity(notify),
    });
}
exports._getInputNotify = _getInputNotify;
/** @hidden */
function _selfId(client) {
    return client._selfInputPeer ? client._selfInputPeer.userId : undefined;
}
exports._selfId = _selfId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9ncmFtanMvY2xpZW50L3VzZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhCQUE0QjtBQUU1QixvQ0FBa0Q7QUFDbEQsd0NBQTBFO0FBQzFFLDJCQUFvQztBQUVwQyw4REFBaUM7QUFFakMsZ0JBQWdCO0FBQ2hCLG1DQUFtQztBQUVuQyxjQUFjO0FBQ1AsS0FBSyxVQUFVLE1BQU0sQ0FDeEIsTUFBc0IsRUFDdEIsT0FBVTtJQUVWLElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0tBQzFEO0lBQ0QsSUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLFNBQVMsRUFBRTtRQUM3QixNQUFNLElBQUksS0FBSyxDQUNYLHNFQUFzRSxDQUN6RSxDQUFDO0tBQ0w7SUFDRCxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFNBQUssQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQyxJQUFJLE9BQWUsQ0FBQztJQUNwQixLQUFLLE9BQU8sR0FBRyxDQUFDLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDM0QsSUFBSTtZQUNBLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdDLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sTUFBTSxDQUFDO1NBQ2pCO1FBQUMs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