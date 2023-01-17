"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewMessageEvent = exports.NewMessage = void 0;
const common_1 = require("./common");
const tl_1 = require("../tl");
/**
 * Occurs whenever a new text message or a message with media arrives.
 * @example
 * ```ts
 * async function eventPrint(event: NewMessageEvent) {
 * const message = event.message;
 *
 *   // Checks if it's a private message (from user or bot)
 *   if (event.isPrivate){
 *       // prints sender id
 *       console.log(message.senderId);
 *       // read message
 *       if (message.text == "hello"){
 *           const sender = await message.getSender();
 *           console.log("sender is",sender);
 *           await client.sendMessage(sender,{
 *               message:`hi your id is ${message.senderId}`
 *           });
 *       }
 *   }
 * }
 * // adds an event handler for new messages
 * client.addEventHandler(eventPrint, new NewMessage({}));
 * ```
 */
class NewMessage extends common_1.EventBuilder {
    constructor(newMessageParams) {
        let { chats, func, incoming, outgoing, fromUsers, forwards, pattern, blacklistChats = false, } = newMessageParams;
        if (incoming && outgoing) {
            incoming = outgoing = undefined;
        }
        else if (incoming != undefined && outgoing == undefined) {
            outgoing = !incoming;
        }
        else if (outgoing != undefined && incoming == undefined) {
            incoming = !outgoing;
        }
        else if (outgoing == false && incoming == false) {
            throw new Error("Don't create an event handler if you don't want neither incoming nor outgoing!");
        }
        super({ chats, blacklistChats, func });
        this.incoming = incoming;
        this.outgoing = outgoing;
        this.fromUsers = fromUsers;
        this.forwards = forwards;
        this.pattern = pattern;
        this._noCheck = [
            incoming,
            outgoing,
            chats,
            pattern,
            fromUsers,
            forwards,
            func,
        ].every((v) => v == undefined);
    }
    async _resolve(client) {
        await super._resolve(client);
        this.fromUsers = await common_1._intoIdSet(client, this.fromUsers);
    }
    build(update, others = null) {
        if (update instanceof tl_1.Api.UpdateNewMessage ||
            update instanceof tl_1.Api.UpdateNewChannelMessage) {
            if (!(update.message instanceof tl_1.Api.Message)) {
                return undefined;
            }
            const event = new NewMessageEvent(update.message, update);
            this.addAttributes(event);
            return event;
        }
        else if (update instanceof tl_1.Api.UpdateShortMessage) {
            return new NewMessageEvent(new tl_1.Api.Message({
                out: update.out,
                mentioned: update.mentioned,
                mediaUnread: update.mediaUnread,
                silent: update.silent,
                id: update.id,
                peerId: new tl_1.Api.PeerUser({ userId: update.userId }),
                fromId: new tl_1.Api.PeerUser({ userId: update.userId }),
                message: update.message,
                date: update.date,
                fwdFrom: update.fwdFrom,
                viaBotId: update.viaBotId,
                replyTo: update.replyTo,
                entities: update.entities,
                // ttlPeriod:update.ttlPeriod
            }), update);
        }
        else if (update instanceof tl_1.Api.UpdateShortChatMessage) {
            return new NewMessageEvent(new tl_1.Api.Message({
                out: update.out,
                mentioned: update.mentioned,
                mediaUnread: update.mediaUnread,
                silent: update.silent,
                id: update.id,
                peerId: new tl_1.Api.PeerChat({ chatId: update.chatId }),
                fromId: new tl_1.Api.PeerUser({ userId: update.fromId }),
                message: update.message,
                date: update.date,
                fwdFrom: update.fwdFrom,
                viaBotId: update.viaBotId,
                replyTo: update.replyTo,
                entities: update.entities,
                // ttlPeriod:update.ttlPeriod
            }), update);
        }
    }
    filter(event) {
        var _a;
        if (this._noCheck) {
            return event;
        }
        if (this.incoming && event.message.out) {
            return;
        }
        if (this.outgoing && !event.message.out) {
            return;
        }
        if (this.forwards != undefined) {
            if (this.forwards != !!event.message.fwdFrom) {
                return;
            }
        }
        if (this.fromUsers != undefined) {
            if (!this.fromUsers.includes(event.message.senderId)) {
                return;
            }
        }
        if (this.pattern) {
            const match = (_a = event.message.message) === null || _a === void 0 ? void 0 : _a.match(this.pattern);
            if (!match) {
                return;
            }
            event.message.patternMatch = match;
        }
        return super.filter(event);
    }
    addAttributes(update) {
        //update.patternMatch =
    }
}
exports.NewMessage = NewMessage;
class NewMessageEvent extends common_1.EventCommon {
    constructor(message, originalUpdate) {
        super({
            msgId: message.id,
            chatPeer: message.peerId,
            broadcast: message.post,
        });
        this.originalUpdate = originalUpdate;
        this.message = message;
    }
    _setClient(client) {
        super._setClient(client);
        const m = this.message;
        try {
            // todo make sure this never fails
            m._finishInit(client, this.originalUpdate._entities || new Map(), undefined);
        }
        catch (e) {
            client._log.error("Got error while trying to finish init message with id " + m.id);
            if (client._log.canSend("error")) {
                console.error(e);
            }
        }
    }
}
exports.NewMessageEvent = NewMessageEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV3TWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2dyYW1qcy9ldmVudHMvTmV3TWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FLa0I7QUFHbEIsOEJBQTRCO0FBbUM1Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBQ0gsTUFBYSxVQUFXLFNBQVEscUJBQVk7SUFZeEMsWUFBWSxnQkFBcUM7UUFDN0MsSUFBSSxFQUNBLEtBQUssRUFDTCxJQUFJLEVBQ0osUUFBUSxFQUNSLFFBQVEsRUFDUixTQUFTLEVBQ1QsUUFBUSxFQUNSLE9BQU8sRUFDUCxjQUFjLEdBQUcsS0FBSyxHQUN6QixHQUFHLGdCQUFnQixDQUFDO1FBQ3JCLElBQUksUUFBUSxJQUFJLFFBQVEsRUFBRTtZQUN0QixRQUFRLEdBQUcsUUFBUSxHQUFHLFNBQVMsQ0FBQztTQUNuQzthQUFNLElBQUksUUFBUSxJQUFJLFNBQVMsSUFBSSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQ3ZELFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQztTQUN4QjthQUFNLElBQUksUUFBUSxJQUFJLFNBQVMsSUFBSSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQ3ZELFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQztTQUN4QjthQUFNLElBQUksUUFBUSxJQUFJLEtBQUssSUFBSSxRQUFRLElBQUksS0FBSyxFQUFFO1lBQy9DLE1BQU0sSUFBSSxLQUFLLENBQ1gsZ0ZBQWdGLENBQ25GLENBQUM7U0FDTDtRQUNELEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEs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