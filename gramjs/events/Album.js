"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumEvent = exports.Album = void 0;
const common_1 = require("./common");
const tl_1 = require("../tl");
const _ALBUM_DELAY = 500; // 0.5 sec
/**
 * Occurs whenever an album (multiple grouped messages with media) arrive.
 * @example
 * ```ts
 * // Albums are basically a list of messages. so event is a list
 *   async function listenForAlbums(event: AlbumEvent) {
 *       const messages = event.messages;
 *       for (const message of messages){
 *           console.log("Caption is",message.text);
 *           console.log("Message id is",message.id);
 *           console.log("Chat id is",message.chatId);
 *       }
 *   }
 * // adds an event handler for new messages
 * client.addEventHandler(listenForAlbums, new Album({}));
 * ```
 */
class Album extends common_1.EventBuilder {
    constructor(albumParams) {
        let { chats, func, blacklistChats = false } = albumParams;
        super({ chats, blacklistChats, func });
    }
    build(update, others = null, dispatch) {
        if (!("message" in update && update.message instanceof tl_1.Api.Message)) {
            return;
        }
        const groupedId = update.message.groupedId;
        if (!groupedId) {
            return;
        }
        const albums = this.client._ALBUMS;
        const oldTimeout = albums.get(groupedId.toString());
        let oldValues = [];
        if (oldTimeout) {
            clearTimeout(oldTimeout[0]);
            oldValues.push(...oldTimeout[1]);
        }
        albums.set(groupedId.toString(), [
            setTimeout(() => {
                const values = albums.get(groupedId.toString());
                albums.delete(groupedId.toString());
                if (!values) {
                    return;
                }
                const updates = values[1];
                if (!updates) {
                    return;
                }
                const messages = [];
                for (const update of updates) {
                    // there is probably an easier way
                    if ("message" in update &&
                        update.message instanceof tl_1.Api.Message) {
                        messages.push(update.message);
                    }
                }
                const event = new AlbumEvent(messages, values[1]);
                event._setClient(this.client);
                event._entities = messages[0]._entities;
                dispatch(event);
            }, _ALBUM_DELAY),
            [...oldValues, update],
        ]);
    }
}
exports.Album = Album;
class AlbumEvent extends common_1.EventCommon {
    constructor(messages, originalUpdates) {
        super({
            msgId: messages[0].id,
            chatPeer: messages[0].peerId,
            broadcast: messages[0].post,
        });
        this.originalUpdates = originalUpdates;
        this.messages = messages;
    }
    _setClient(client) {
        super._setClient(client);
        for (let i = 0; i < this.messages.length; i++) {
            try {
                // todo make sure this never fails
                this.messages[i]._finishInit(client, this.originalUpdates[i]._entities || new Map(), undefined);
            }
            catch (e) {
                client._log.error("Got error while trying to finish init message with id " +
                    this.messages[i].id);
                if (client._log.canSend("error")) {
                    console.error(e);
                }
            }
        }
    }
}
exports.AlbumEvent = AlbumEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWxidW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9ncmFtanMvZXZlbnRzL0FsYnVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUE0RTtBQUU1RSw4QkFBNEI7QUFHNUIsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUMsVUFBVTtBQUVwQzs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILE1BQWEsS0FBTSxTQUFRLHFCQUFZO0lBSW5DLFlBQVksV0FBa0M7UUFDMUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsY0FBYyxHQUFHLEtBQUssRUFBRSxHQUFHLFdBQVcsQ0FBQztRQUMxRCxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELEtBQUssQ0FDRCxNQUFzQixFQUN0QixTQUFjLElBQUksRUFDbEIsUUFBMkI7UUFFM0IsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxZQUFZLFFBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNqRSxPQUFPO1NBQ1Y7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ1osT0FBTztTQUNWO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU8sQ0FBQyxPQUFPLENBQUM7UUFDcEMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsR0FBcUIsRUFBRSxDQUFDO1FBQ3JDLElBQUksVUFBVSxFQUFFO1lBQ1osWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FB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