"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCommonSender = exports.EventCommon = exports.EventBuilder = exports._intoIdSet = void 0;
const tl_1 = require("../tl");
const custom_1 = require("../tl/custom");
const Helpers_1 = require("../Helpers");
const __1 = require("../");
const senderGetter_1 = require("../tl/custom/senderGetter");
/** @hidden */
async function _intoIdSet(client, chats) {
    if (chats == undefined) {
        return undefined;
    }
    if (!Helpers_1.isArrayLike(chats)) {
        chats = [chats];
    }
    const result = new Set();
    for (let chat of chats) {
        if (typeof chat == "number") {
            if (chat < 0) {
                result.add(chat);
            }
            else {
                result.add(__1.utils.getPeerId(new tl_1.Api.PeerUser({
                    userId: chat,
                })));
                result.add(__1.utils.getPeerId(new tl_1.Api.PeerChat({
                    chatId: chat,
                })));
                result.add(__1.utils.getPeerId(new tl_1.Api.PeerChannel({
                    channelId: chat,
                })));
            }
        }
        else if (typeof chat == "object" &&
            chat.SUBCLASS_OF_ID == 0x2d45687) {
            result.add(__1.utils.getPeerId(chat));
        }
        else {
            chat = await client.getInputEntity(chat);
            if (chat instanceof tl_1.Api.InputPeerSelf) {
                chat = await client.getMe(true);
            }
            result.add(__1.utils.getPeerId(chat));
        }
    }
    return Array.from(result);
}
exports._intoIdSet = _intoIdSet;
/**
 * The common event builder, with builtin support to filter per chat.<br/>
 * All events inherit this.
 */
class EventBuilder {
    constructor(eventParams) {
        this.chats = eventParams.chats;
        this.blacklistChats = eventParams.blacklistChats || false;
        this.resolved = false;
        this.func = eventParams.func;
    }
    build(update, others, callback) {
        if (update)
            return update;
    }
    async resolve(client) {
        if (this.resolved) {
            return;
        }
        await this._resolve(client);
        this.resolved = true;
    }
    async _resolve(client) {
        this.chats = await _intoIdSet(client, this.chats);
    }
    filter(event) {
        if (!this.resolved) {
            return;
        }
        if (this.chats != undefined) {
            if (event.chatId == undefined) {
                return;
            }
            const inside = this.chats.includes(event.chatId);
            if (inside == this.blacklistChats) {
                // If this chat matches but it's a blacklist ignore.
                // If it doesn't match but it's a whitelist ignore.
                return;
            }
        }
        if (this.func && !this.func(event)) {
            return;
        }
        return event;
    }
}
exports.EventBuilder = EventBuilder;
class EventCommon extends custom_1.ChatGetter {
    constructor({ chatPeer = undefined, msgId = undefined, broadcast = undefined, }) {
        super();
        this._eventName = "Event";
        custom_1.ChatGetter.initChatClass(this, { chatPeer, broadcast });
        this._entities = new Map();
        this._client = undefined;
        this._messageId = msgId;
    }
    _setClient(client) {
        this._client = client;
    }
    get client() {
        return this._client;
    }
}
exports.EventCommon = EventCommon;
class EventCommonSender extends senderGetter_1.SenderGetter {
    constructor({ chatPeer = undefined, msgId = undefined, broadcast = undefined, }) {
        super();
        this._eventName = "Event";
        custom_1.ChatGetter.initChatClass(this, { chatPeer, broadcast });
        senderGetter_1.SenderGetter.initChatClass(this, { chatPeer, broadcast });
        this._entities = new Map();
        this._client = undefined;
        this._messageId = msgId;
    }
    _setClient(client) {
        this._client = client;
    }
    get client() {
        return this._client;
    }
}
exports.EventCommonSender = EventCommonSender;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2V2ZW50cy9jb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOEJBQTRCO0FBRTVCLHlDQUEwQztBQUcxQyx3Q0FBeUM7QUFDekMsMkJBQTRCO0FBQzVCLDREQUF5RDtBQUV6RCxjQUFjO0FBQ1AsS0FBSyxVQUFVLFVBQVUsQ0FDNUIsTUFBc0IsRUFDdEIsS0FBNEM7SUFFNUMsSUFBSSxLQUFLLElBQUksU0FBUyxFQUFFO1FBQ3BCLE9BQU8sU0FBUyxDQUFDO0tBQ3BCO0lBQ0QsSUFBSSxDQUFDLHFCQUFXLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDckIsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkI7SUFDRCxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUM5QyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtRQUNwQixJQUFJLE9BQU8sSUFBSSxJQUFJLFFBQVEsRUFBRTtZQUN6QixJQUFJLElBQUksR0FBRyxDQUFDLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtpQkFBTTtnQkFDSCxNQUFNLENBQUMsR0FBRyxDQUNOLFNBQUssQ0FBQyxTQUFTLENBQ1gsSUFBSSxRQUFHLENBQUMsUUFBUSxDQUFDO29CQUNiLE1BQU0sRUFBRSxJQUFJO2lCQUNmLENBQUMsQ0FDTCxDQUNKLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FDTixTQUFLLENBQUMsU0FBUyxDQUNYLElBQUksUUFBRyxDQUFDLFFBQVEsQ0FBQztvQkFDYixNQUFNLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQ0wsQ0FDSixDQUFDO2dCQUNGLE1BQU0sQ0FBQyxHQUFHLENBQ04sU0FBSyxDQUFDLFNBQVMsQ0FDWCxJQUFJLFFBQUcsQ0FBQyxXQUFXLENBQUM7b0JBQ2hCLFNBQVMsRUFBRSxJQUFJO2lCQUNsQixDQUFDLENBQ0wsQ0FDSixDQUFDO2FBQ0w7U0FDSjthQUFNLElBQ0gsT0FBTyxJQUFJLElBQUksUUFBUTtZQUN2QixJQUFJLENBQUMsY0FBYyxJQUFJLFNBQVMsRUFDbEM7WUFDRSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNyQzthQUFNO1lBQ0gsSUFBSSxHQUFHLE1BQU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxJQUFJLElBQUksWUFBWSxRQUFHLENBQUMsYUFBYSxFQUFFO2dCQUNuQyxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ25DO1lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDckM7S0FDSjtJQUNELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBcERELGdDQW9EQztBQXVCRDs7O0dBR0c7QUFDSCxNQUFhLFlBQVk7SUFPckIsWUFBWSxXQUFrQztRQUMxQyxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQztRQUMxRCxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVELEtBQUssQ0FDRCxNQUFzQixFQUN0QixNQUFZLEVBQ1osUUFBMkI7UUFFM0IsSUFBSSxNQUFNO1lBQUUsT0FBTyxNQUFNLENBQUM7SUFDOUIsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBc0I7UUFDaEMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2YsT0FBTztTQUNWO1FBQ0QsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQXNCO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQWtCO1FBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2hCLE9BQU87U0FDVjtRQUNELElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxTQUFTLEVBQUU7WUFDekIsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLFNBQVMsRUFBRTtnQkFDM0IsT0FBTzthQUNWO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQy9CLG9EQUFvRDtnQkFDcEQsbURBQW1EO2dCQUNuRCxPQUFPO2FBQ1Y7U0FDSjtRQUNELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDaEMsT0FBTztTQUNWO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztDQUNKO0FBdERELG9DQXNEQztBQVFELE1BQWEsV0FBWSxTQUFRLG1CQUFVO0lBS3ZDLFlBQVksRUFDUixRQUFRLEdBQUcsU0FBUyxFQUNwQixLQUFLLEdBQUcsU0FBUyxFQUNqQixTQUFTLEdBQUcsU0FBUyxHQUNGO1FBQ25CLEtBQUssRUFBRSxDQUFDO1FBVFosZUFBVSxHQUFHLE9BQU8sQ0FBQztRQVVqQixtQkFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7UUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFzQjtRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ04sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7Q0FDSjtBQXhCRCxrQ0F3QkM7QUFDRCxNQUFhLGlCQUFrQixTQUFRLDJCQUFZO0lBSy9DLFlBQVksRUFDUixRQUFRLEdBQUcsU0FBUyxFQUNwQixLQUFLLEdBQUcsU0FBUyxFQUNqQixTQUFTLEdBQUcsU0FBUyxHQUNGO1FBQ25CLEtBQUssRUFBRSxDQUFDO1FBVFosZUFBVSxHQUFHLE9BQU8sQ0FBQztRQVVqQixtQkFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUN4RCwyQkFBWSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7UUFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFzQjtRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ04sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7Q0FDSjtBQXpCRCw4Q0F5QkMifQ==