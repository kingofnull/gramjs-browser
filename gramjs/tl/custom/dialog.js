"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dialog = void 0;
const api_1 = require("../api");
const Utils_1 = require("../../Utils");
const draft_1 = require("./draft");
const util_1 = require("util");
const Helpers_1 = require("../../Helpers");
class Dialog {
    constructor(client, dialog, entities, message) {
        this._client = client;
        this.dialog = dialog;
        this.pinned = !!dialog.pinned;
        this.folderId = dialog.folderId;
        this.archived = dialog.folderId != undefined;
        this.message = message;
        this.date = this.message.date;
        this.entity = entities.get(Utils_1.getPeerId(dialog.peer));
        this.inputEntity = Utils_1.getInputPeer(this.entity);
        if (this.entity) {
            this.id = Utils_1.getPeerId(this.entity); // ^ May be InputPeerSelf();
            this.name = this.title = Utils_1.getDisplayName(this.entity);
        }
        this.unreadCount = dialog.unreadCount;
        this.unreadMentionsCount = dialog.unreadMentionsCount;
        if (!this.entity) {
            throw new Error("Entity not found for dialog");
        }
        this.draft = new draft_1.Draft(client, this.entity, this.dialog.draft);
        this.isUser = this.entity instanceof api_1.Api.User;
        this.isGroup = !!((this.entity instanceof api_1.Api.Chat &&
            this.entity instanceof api_1.Api.ChatForbidden) ||
            (this.entity instanceof api_1.Api.Channel && this.entity.megagroup));
        this.isChannel = this.entity instanceof api_1.Api.Channel;
    }
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
}
exports.Dialog = Dialog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vZ3JhbWpzL3RsL2N1c3RvbS9kaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsZ0NBQTZCO0FBRTdCLHVDQUFzRTtBQUN0RSxtQ0FBZ0M7QUFDaEMsK0JBQStCO0FBQy9CLDJDQUFpRDtBQUVqRCxNQUFhLE1BQU07SUF1QmYsWUFDSSxNQUFzQixFQUN0QixNQUFrQixFQUNsQixRQUE2QixFQUM3QixPQUFxQjtRQUVyQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLElBQUksU0FBUyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQVEsQ0FBQyxJQUFLLENBQUM7UUFFaEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLFdBQVcsR0FBRyxvQkFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLGlCQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1lBQzlELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxzQkFBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN4RDtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUN0QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDO1FBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1NBQ2xEO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9ELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sWUFBWSxTQUFHLENBQUMsSUFBSSxDQUFDO1FBQzlDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQ2IsQ0FBQyxJQUFJLENBQUMsTUFBTSxZQUFZLFNBQUcsQ0FBQyxJQUFJO1lBQzVCLElBQUksQ0FBQyxNQUFNLFlBQVksU0FBRyxDQUFDLGFBQWEsQ0FBQztZQUM3QyxDQUFDLElBQUksQ0FBQyxNQUFNLFlBQVksU0FBRyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUNoRSxDQUFDO1FBQ0YsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxZQUFZLFNBQUcsQ0FBQyxPQUFPLENBQUM7SUFDeEQsQ0FBQztJQXZDRCxDQUFDLGNBQU8sQ0FBQyxNQUFNLENBQUM7UUFDWixPQUFPLDBCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0F3Q0o7QUE3REQsd0JBNkRDIn0=