"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySession = void 0;
const Abstract_1 = require("./Abstract");
const tl_1 = require("../tl");
const big_integer_1 = __importDefault(require("big-integer"));
const Utils_1 = require("../Utils");
const Helpers_1 = require("../Helpers");
const __1 = require("../");
class MemorySession extends Abstract_1.Session {
    constructor() {
        super();
        this._serverAddress = undefined;
        this._dcId = 0;
        this._port = undefined;
        this._takeoutId = undefined;
        this._entities = new Set();
        this._updateStates = {};
    }
    setDC(dcId, serverAddress, port) {
        this._dcId = dcId | 0;
        this._serverAddress = serverAddress;
        this._port = port;
    }
    get dcId() {
        return this._dcId;
    }
    get serverAddress() {
        return this._serverAddress;
    }
    get port() {
        return this._port;
    }
    get authKey() {
        return this._authKey;
    }
    set authKey(value) {
        this._authKey = value;
    }
    get takeoutId() {
        return this._takeoutId;
    }
    set takeoutId(value) {
        this._takeoutId = value;
    }
    getAuthKey(dcId) {
        if (dcId && dcId !== this.dcId) {
            // Not supported.
            return undefined;
        }
        return this.authKey;
    }
    setAuthKey(authKey, dcId) {
        if (dcId && dcId !== this.dcId) {
            // Not supported.
            return undefined;
        }
        this.authKey = authKey;
    }
    close() { }
    save() { }
    async load() { }
    delete() { }
    _entityValuesToRow(id, hash, username, phone, name) {
        // While this is a simple implementation it might be overrode by,
        // other classes so they don't need to implement the plural form
        // of the method. Don't remove.
        return [id, hash, username, phone, name];
    }
    _entityToRow(e) {
        if (!(e.classType === "constructor")) {
            return;
        }
        let p;
        let markedId;
        try {
            p = Utils_1.getInputPeer(e, false);
            markedId = Utils_1.getPeerId(p);
        }
        catch (e) {
            return;
        }
        let pHash;
        if (p instanceof tl_1.Api.InputPeerUser ||
            p instanceof tl_1.Api.InputPeerChannel) {
            pHash = p.accessHash;
        }
        else if (p instanceof tl_1.Api.InputPeerChat) {
            pHash = big_integer_1.default.zero;
        }
        else {
            return;
        }
        let username = e.username;
        if (username) {
            username = username.toLowerCase();
        }
        const phone = e.phone;
        const name = Utils_1.getDisplayName(e);
        return this._entityValuesToRow(markedId, pHash, username, phone, name);
    }
    _entitiesToRows(tlo) {
        let entities = [];
        if (!(tlo.classType === "constructor") && Helpers_1.isArrayLike(tlo)) {
            // This may be a list of users already for instance
            entities = tlo;
        }
        else {
            if (typeof tlo === "object") {
                if ("user" in tlo) {
                    entities.push(tlo.user);
                }
                if ("chat" in tlo) {
                    entities.push(tlo.chat);
                }
                if ("channel" in tlo) {
                    entities.push(tlo.channel);
                }
                if ("chats" in tlo && Helpers_1.isArrayLike(tlo.chats)) {
                    entities = entities.concat(tlo.chats);
                }
                if ("users" in tlo && Helpers_1.isArrayLike(tlo.users)) {
                    entities = entities.concat(tlo.users);
                }
            }
        }
        const rows = []; // Rows to add (id, hash, username, phone, name)
        for (const e of entities) {
            const row = this._entityToRow(e);
            if (row) {
                rows.push(row);
            }
        }
        return rows;
    }
    processEntities(tlo) {
        const entitiesSet = this._entitiesToRows(tlo);
        for (const e of entitiesSet) {
            this._entities.add(e);
        }
    }
    getEntityRowsByPhone(phone) {
        for (const e of this._entities) {
            // id, hash, username, phone, name
            if (e[3] === phone) {
                return [e[0], e[1]];
            }
        }
    }
    getEntityRowsByUsername(username) {
        for (const e of this._entities) {
            // id, hash, username, phone, name
            if (e[2] === username) {
                return [e[0], e[1]];
            }
        }
    }
    getEntityRowsByName(name) {
        for (const e of this._entities) {
            // id, hash, username, phone, name
            if (e[4] === name) {
                return [e[0], e[1]];
            }
        }
    }
    getEntityRowsById(id, exact = true) {
        if (exact) {
            for (const e of this._entities) {
                // id, hash, username, phone, name
                if (e[0] === id) {
                    return [e[0], e[1]];
                }
            }
        }
        else {
            const ids = [
                __1.utils.getPeerId(new tl_1.Api.PeerUser({ userId: id })),
                __1.utils.getPeerId(new tl_1.Api.PeerChat({ chatId: id })),
                __1.utils.getPeerId(new tl_1.Api.PeerChannel({ channelId: id })),
            ];
            for (const e of this._entities) {
                // id, hash, username, phone, name
                if (ids.includes(e[0])) {
                    return [e[0], e[1]];
                }
            }
        }
    }
    getInputEntity(key) {
        let exact;
        if (typeof key === "object" && key.SUBCLASS_OF_ID) {
            if (key.SUBCLASS_OF_ID == 0xc91c90b6) {
                return key;
            }
            if (key.SUBCLASS_OF_ID == 0xe669bf46) {
                if (key instanceof tl_1.Api.InputUserSelf) {
                    return new tl_1.Api.InputPeerSelf();
                }
                if (key instanceof tl_1.Api.InputUserEmpty) {
                    return new tl_1.Api.InputPeerEmpty();
                }
                if (key instanceof tl_1.Api.InputUserFromMessage) {
                    return key.peer;
                }
                return new tl_1.Api.InputPeerUser({
                    userId: key.userId,
                    accessHash: key.accessHash,
                });
            }
            if (key.SUBCLASS_OF_ID == 0x40f202fd) {
                if (key instanceof tl_1.Api.InputChannelEmpty) {
                    return new tl_1.Api.InputPeerEmpty();
                }
                if (key instanceof tl_1.Api.InputChannelFromMessage) {
                    return key.peer;
                }
                return new tl_1.Api.InputPeerChannel({
                    channelId: key.channelId,
                    accessHash: key.accessHash,
                });
            }
            // Try to early return if this key can be casted as input peer
            return __1.utils.getInputPeer(key);
        }
        else {
            // Not a TLObject or can't be cast into InputPeer
            if (typeof key === "object") {
                key = __1.utils.getPeerId(key);
                exact = true;
            }
            else {
                exact = !(typeof key == "number") || key < 0;
            }
        }
        let result = undefined;
        if (typeof key === "string") {
            const phone = __1.utils.parsePhone(key);
            if (phone) {
                result = this.getEntityRowsByPhone(phone);
            }
            else {
                const { username, isInvite } = __1.utils.parseUsername(key);
                if (username && !isInvite) {
                    result = this.getEntityRowsByUsername(username);
                }
                else {
                    const tup = __1.utils.resolveInviteLink(key)[1];
                    if (tup) {
                        result = this.getEntityRowsById(tup, false);
                    }
                }
            }
        }
        else if (typeof key === "number") {
            result = this.getEntityRowsById(key, exact);
        }
        if (!result && typeof key === "string") {
            result = this.getEntityRowsByName(key);
        }
        if (result) {
            let entityId = result[0]; // unpack resulting tuple
            const entityHash = big_integer_1.default(result[1]);
            const resolved = __1.utils.resolveId(entityId);
            entityId = resolved[0];
            const kind = resolved[1];
            // removes the mark and returns type of entity
            if (kind === tl_1.Api.PeerUser) {
                return new tl_1.Api.InputPeerUser({
                    userId: entityId,
                    accessHash: entityHash,
                });
            }
            else if (kind === tl_1.Api.PeerChat) {
                return new tl_1.Api.InputPeerChat({ chatId: entityId });
            }
            else if (kind === tl_1.Api.PeerChannel) {
                return new tl_1.Api.InputPeerChannel({
                    channelId: entityId,
                    accessHash: entityHash,
                });
            }
        }
        else {
            throw new Error("Could not find input entity with key " + key);
        }
        throw new Error("Could not find input entity with key " + key);
    }
}
exports.MemorySession = MemorySession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVtb3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL3Nlc3Npb25zL01lbW9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx5Q0FBcUM7QUFFckMsOEJBQTRCO0FBQzVCLDhEQUFpQztBQUVqQyxvQ0FBbUU7QUFDbkUsd0NBQXlDO0FBQ3pDLDJCQUE0QjtBQUc1QixNQUFhLGFBQWMsU0FBUSxrQkFBTztJQVN0QztRQUNJLEtBQUssRUFBRSxDQUFDO1FBRVIsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7UUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztRQUU1QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFZLEVBQUUsYUFBcUIsRUFBRSxJQUFZO1FBQ25ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxJQUFJLGFBQWE7UUFDYixPQUFPLElBQUksQ0FBQyxjQUFlLENBQUM7SUFDaEMsQ0FBQztJQUVELElBQUksSUFBSTtRQUNKLE9BQU8sSUFBSSxDQUFDLEtBQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsSUFBSSxPQUFPO1FBQ1AsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxJQUFJLE9BQU8sQ0FB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