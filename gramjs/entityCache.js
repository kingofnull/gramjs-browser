"use strict";
// Which updates have the following fields?
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityCache = void 0;
const Utils_1 = require("./Utils");
const Helpers_1 = require("./Helpers");
const tl_1 = require("./tl");
class EntityCache {
    constructor() {
        this.cacheMap = new Map();
    }
    add(entities) {
        const temp = [];
        if (!Helpers_1.isArrayLike(entities)) {
            if (entities != undefined) {
                if (typeof entities == "object") {
                    if ("chats" in entities) {
                        temp.push(...entities.chats);
                    }
                    if ("users" in entities) {
                        temp.push(...entities.users);
                    }
                    if ("user" in entities) {
                        temp.push(entities.user);
                    }
                }
            }
            if (temp.length) {
                entities = temp;
            }
            else {
                return;
            }
        }
        for (const entity of entities) {
            try {
                const pid = Utils_1.getPeerId(entity);
                if (!this.cacheMap.has(pid)) {
                    this.cacheMap.set(pid, Utils_1.getInputPeer(entity));
                }
            }
            catch (e) { }
        }
    }
    get(item) {
        if (!(typeof item === "number") || item < 0) {
            let res;
            try {
                res = this.cacheMap.get(Utils_1.getPeerId(item));
                if (res) {
                    return res;
                }
            }
            catch (e) {
                throw new Error("Invalid key will not have entity");
            }
        }
        for (const cls of [tl_1.Api.PeerUser, tl_1.Api.PeerChat, tl_1.Api.PeerChannel]) {
            // TODO remove these "as"
            const result = this.cacheMap.get(Utils_1.getPeerId(new cls({
                userId: item,
                chatId: item,
                channelId: item,
            })));
            if (result) {
                return result;
            }
        }
        throw new Error("No cached entity for the given key");
    }
}
exports.EntityCache = EntityCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5Q2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9ncmFtanMvZW50aXR5Q2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQzs7O0FBRTNDLG1DQUFrRDtBQUNsRCx1Q0FBd0M7QUFDeEMsNkJBQTJCO0FBRTNCLE1BQWEsV0FBVztJQUdwQjtRQUNJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQWE7UUFDYixNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLHFCQUFXLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEIsSUFBSSxRQUFRLElBQUksU0FBUyxFQUFFO2dCQUN2QixJQUFJLE9BQU8sUUFBUSxJQUFJLFFBQVEsRUFBRTtvQkFDN0IsSUFBSSxPQUFPLElBQUksUUFBUSxFQUFFO3dCQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNoQztvQkFDRCxJQUFJLE9BQU8sSUFBSSxRQUFRLEVBQUU7d0JBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ2hDO29CQUNELElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTt3QkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzVCO2lCQUNKO2FBQ0o7WUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2IsUUFBUSxHQUFHLElBQUksQ0FBQzthQUNuQjtpQkFBTTtnQkFDSCxPQUFPO2FBQ1Y7U0FDSjtRQUNELEtBQUssTUFBTSxNQUFNLElBQUksUUFBUSxFQUFFO1lBQzNCLElBQUk7Z0JBQ0EsTUFBTSxHQUFHLEdBQUcsaUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsb0JBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2lCQUNoRDthQUNKO1lBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRTtTQUNqQjtJQUNMLENBQUM7SUFFRCxHQUFHLENBQUMsSUFBUztRQUNULElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUU7WUFDekMsSUFBSSxHQUFHLENBQUM7WUFDUixJQUFJO2dCQUNBLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksR0FBRyxFQUFFO29CQUNMLE9BQU8sR0FBRyxDQUFDO2lCQUNkO2FBQ0o7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDUixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7YUFDdkQ7U0FDSjtRQUNELEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFHLENBQUMsUUFBUSxFQUFFLFFBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzdELHlCQUF5QjtZQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDNUIsaUJBQVMsQ0FDTCxJQUFJLEdBQUcsQ0FBQztnQkFDSixNQUFNLEVBQUUsSUFBYztnQkFDdEIsTUFBTSxFQUFFLElBQWM7Z0JBQ3RCLFNBQVMsRUFBRSxJQUFjO2FBQzVCLENBQUMsQ0FDTCxDQUNKLENBQUM7WUFDRixJQUFJLE1BQU0sRUFBRTtnQkFDUixPQUFPLE1BQU0sQ0FBQzthQUNqQjtTQUNKO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBQzFELENBQUM7Q0FDSjtBQXBFRCxrQ0FvRUMifQ==