"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getResponseMessage = exports._parseMessageText = exports._replaceWithMention = exports.DEFAULT_DELIMITERS = void 0;
const Utils_1 = require("../Utils");
const tl_1 = require("../tl");
const index_1 = require("../index");
const Helpers_1 = require("../Helpers");
const big_integer_1 = __importDefault(require("big-integer"));
exports.DEFAULT_DELIMITERS = {
    "**": tl_1.Api.MessageEntityBold,
    __: tl_1.Api.MessageEntityItalic,
    "~~": tl_1.Api.MessageEntityStrike,
    "`": tl_1.Api.MessageEntityCode,
    "```": tl_1.Api.MessageEntityPre,
};
/** @hidden */
async function _replaceWithMention(client, entities, i, user) {
    try {
        entities[i] = new tl_1.Api.InputMessageEntityMentionName({
            offset: entities[i].offset,
            length: entities[i].length,
            userId: (await client.getInputEntity(user)),
        });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports._replaceWithMention = _replaceWithMention;
/** @hidden */
async function _parseMessageText(client, message, parseMode) {
    if (parseMode == false) {
        return [message, []];
    }
    if (parseMode == undefined) {
        if (client.parseMode == undefined) {
            return [message, []];
        }
        parseMode = client.parseMode;
    }
    else if (typeof parseMode === "string") {
        parseMode = Utils_1.sanitizeParseMode(parseMode);
    }
    const [rawMessage, msgEntities] = parseMode.parse(message);
    for (let i = msgEntities.length - 1; i >= 0; i--) {
        const e = msgEntities[i];
        if (e instanceof tl_1.Api.MessageEntityTextUrl) {
            const m = /^@|\+|tg:\/\/user\?id=(\d+)/.exec(e.url);
            if (m) {
                const userIdOrUsername = m[1] ? Number(m[1]) : e.url;
                const isMention = await _replaceWithMention(client, msgEntities, i, userIdOrUsername);
                if (!isMention) {
                    msgEntities.splice(i, 1);
                }
            }
        }
    }
    return [rawMessage, msgEntities];
}
exports._parseMessageText = _parseMessageText;
/** @hidden */
function _getResponseMessage(client, request, result, inputChat) {
    let updates = [];
    let entities = new Map();
    if (result instanceof tl_1.Api.UpdateShort) {
        updates = [result.update];
    }
    else if (result instanceof tl_1.Api.Updates ||
        result instanceof tl_1.Api.UpdatesCombined) {
        updates = result.updates;
        for (const x of [...result.users, ...result.chats]) {
            entities.set(index_1.utils.getPeerId(x), x);
        }
    }
    else {
        return;
    }
    const randomToId = new Map();
    const idToMessage = new Map();
    const schedToMessage = new Map();
    for (const update of updates) {
        if (update instanceof tl_1.Api.UpdateMessageID) {
            randomToId.set(update.randomId.toString(), update.id);
        }
        else if (update instanceof tl_1.Api.UpdateNewChannelMessage ||
            update instanceof tl_1.Api.UpdateNewMessage) {
            update.message._finishInit(client, entities, inputChat);
            if ("randomId" in request || Helpers_1.isArrayLike(request)) {
                idToMessage.set(update.message.id, update.message);
            }
            else {
                return update.message;
            }
        }
        else if (update instanceof tl_1.Api.UpdateEditMessage &&
            "peer" in request &&
            Helpers_1._entityType(request.peer) != Helpers_1._EntityType.CHANNEL) {
            update.message._finishInit(client, entities, inputChat);
            if ("randomId" in request) {
                idToMessage.set(update.message.id, update.message);
            }
            else if ("id" in request && request.id === update.message.id) {
                return update.message;
            }
        }
        else if (update instanceof tl_1.Api.UpdateEditChannelMessage &&
            "peer" in request &&
            Utils_1.getPeerId(request.peer) ==
                Utils_1.getPeerId(update.message.peerId)) {
            if (request.id == update.message.id) {
                update.message._finishInit(client, entities, inputChat);
                return update.message;
            }
        }
        else if (update instanceof tl_1.Api.UpdateNewScheduledMessage) {
            update.message._finishInit(client, entities, inputChat);
            schedToMessage.set(update.message.id, update.message);
        }
        else if (update instanceof tl_1.Api.UpdateMessagePoll) {
            if (request.media.poll.id == update.pollId) {
                const m = new tl_1.Api.Message({
                    id: request.id,
                    peerId: index_1.utils.getPeerId(request.peer),
                    media: new tl_1.Api.MessageMediaPoll({
                        poll: update.poll,
                        results: update.results,
                    }),
                    message: "",
                    date: 0,
                });
                m._finishInit(client, entities, inputChat);
                return m;
            }
        }
    }
    if (request == undefined) {
        return idToMessage;
    }
    let mapping;
    let opposite = new Map();
    if ("scheduleDate" in request && request.scheduleDate != undefined) {
        mapping = schedToMessage;
        opposite = idToMessage;
    }
    else {
        mapping = idToMessage;
    }
    let randomId = Helpers_1.isArrayLike(request) ||
        typeof request == "number" ||
        big_integer_1.default.isInstance(request)
        ? request
        : request.randomId.toString();
    if (!randomId) {
        client._log.warn(`No randomId in ${request} to map to. returning undefined for ${result}`);
        return undefined;
    }
    if (!Helpers_1.isArrayLike(randomId)) {
        let msg = mapping.get(randomToId.get(randomId));
        if (!msg) {
            msg = opposite.get(randomToId.get(randomId));
        }
        if (!msg) {
            client._log.warn(`Request ${request.className} had missing message mapping ${result.className}`);
        }
        return msg;
    }
    else {
        const mappingToReturn = [];
        let warned = false;
        for (let i = 0; i < randomId.length; i++) {
            const rnd = randomId[i] + "";
            const msg = mapping.get(randomToId.get(rnd));
            if (!msg) {
                warned = true;
                break;
            }
            else {
                mappingToReturn.push(msg);
            }
        }
        if (!warned) {
            return mappingToReturn;
        }
        const oppositeToReturn = [];
        warned = false;
        for (let i = 0; i < randomId.length; i++) {
            const rnd = randomId[i] + "";
            const msg = opposite.get(randomToId.get(rnd));
            if (!msg) {
                client._log.warn(`Request ${request} had missing message mapping ${result}`);
                warned = true;
                break;
            }
            else {
                oppositeToReturn.push(msg);
            }
        }
        if (!warned) {
            return mappingToReturn;
        }
    }
    const finalToReturn = [];
    for (let i = 0; i < randomId.length; i++) {
        const rnd = randomId[i] + "";
        if (randomToId.has(rnd)) {
            finalToReturn.push(mapping.get(randomToId.get(rnd)) ||
                opposite.get(randomToId.get(rnd)));
        }
    }
    return finalToReturn;
}
exports._getResponseMessage = _getResponseMessage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZVBhcnNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2NsaWVudC9tZXNzYWdlUGFyc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQXdEO0FBQ3hELDhCQUE0QjtBQUc1QixvQ0FBaUM7QUFDakMsd0NBQW1FO0FBQ25FLDhEQUFpQztBQVFwQixRQUFBLGtCQUFrQixHQUUzQjtJQUNBLElBQUksRUFBRSxRQUFHLENBQUMsaUJBQWlCO0lBQzNCLEVBQUUsRUFBRSxRQUFHLENBQUMsbUJBQW1CO0lBQzNCLElBQUksRUFBRSxRQUFHLENBQUMsbUJBQW1CO0lBQzdCLEdBQUcsRUFBRSxRQUFHLENBQUMsaUJBQWlCO0lBQzFCLEtBQUssRUFBRSxRQUFHLENBQUMsZ0JBQWdCO0NBQzlCLENBQUM7QUFPRixjQUFjO0FBQ1AsS0FBSyxVQUFVLG1CQUFtQixDQUNyQyxNQUFzQixFQUN0QixRQUFpQyxFQUNqQyxDQUFTLEVBQ1QsSUFBZ0I7SUFFaEIsSUFBSTtRQUNBLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLFFBQUcsQ0FBQyw2QkFBNkIsQ0FBQztZQUNoRCxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU07WUFDMUIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO1lBQzFCLE1BQU0sRUFBRSxDQUFDLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FDaEMsSUFBSSxDQUNQLENBQWlDO1NBQ3JDLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNSLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0FBQ0wsQ0FBQztBQWxCRCxrREFrQkM7QUFFRCxjQUFjO0FBQ1AsS0FBSyxVQUFVLGlCQUFpQixDQUNuQyxNQUFzQixFQUN0QixPQUFlLEVBQ2YsU0FBMEM7SUFFMUMsSUFBSSxTQUFTLElBQUksS0FBSyxF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