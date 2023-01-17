"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreSession = void 0;
const Memory_1 = require("./Memory");
const store2_1 = __importDefault(require("store2"));
const AuthKey_1 = require("../crypto/AuthKey");
class StoreSession extends Memory_1.MemorySession {
    constructor(sessionName) {
        super();
        if (typeof localStorage === "undefined" || localStorage === null) {
            const LocalStorage = require("node-localstorage").LocalStorage;
            this.store = store2_1.default.area("fs", new LocalStorage("./" + sessionName));
        }
        else {
            this.store = store2_1.default.area("fs", localStorage);
        }
        this.sessionName = sessionName + ":";
    }
    async load() {
        let authKey = this.store.get(this.sessionName + "authKey");
        if (authKey && typeof authKey === "object") {
            this._authKey = new AuthKey_1.AuthKey();
            if ("data" in authKey) {
                authKey = Buffer.from(authKey.data);
            }
            await this._authKey.setKey(authKey);
        }
        const dcId = this.store.get(this.sessionName + "dcId");
        if (dcId) {
            this._dcId = dcId;
        }
        const port = this.store.get(this.sessionName + "port");
        if (port) {
            this._port = port;
        }
        const serverAddress = this.store.get(this.sessionName + "serverAddress");
        if (serverAddress) {
            this._serverAddress = serverAddress;
        }
    }
    setDC(dcId, serverAddress, port) {
        this.store.set(this.sessionName + "dcId", dcId);
        this.store.set(this.sessionName + "port", port);
        this.store.set(this.sessionName + "serverAddress", serverAddress);
        super.setDC(dcId, serverAddress, port);
    }
    set authKey(value) {
        this._authKey = value;
        this.store.set(this.sessionName + "authKey", value === null || value === void 0 ? void 0 : value.getKey());
    }
    get authKey() {
        return this._authKey;
    }
    processEntities(tlo) {
        const rows = this._entitiesToRows(tlo);
        if (!rows) {
            return;
        }
        for (const row of rows) {
            row.push(new Date().getTime());
            this.store.set(this.sessionName + row[0], row);
        }
    }
    getEntityRowsById(id, exact = true) {
        return this.store.get(this.sessionName + id);
    }
}
exports.StoreSession = StoreSession;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RvcmVTZXNzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL3Nlc3Npb25zL1N0b3JlU2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxQ0FBeUM7QUFDekMsb0RBQTJCO0FBQzNCLCtDQUE0QztBQUU1QyxNQUFhLFlBQWEsU0FBUSxzQkFBYTtJQUkzQyxZQUFZLFdBQW1CO1FBQzNCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxPQUFPLFlBQVksS0FBSyxXQUFXLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtZQUM5RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxZQUFZLENBQUM7WUFDL0QsSUFBSSxDQUFDLEtBQUssR0FBRyxnQkFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDdkU7YUFBTTtZQUNILElBQUksQ0FBQyxLQUFLLEdBQUcsZ0JBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQy9DO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLEdBQUcsR0FBRyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSTtRQUNOLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDM0QsSUFBSSxPQUFPLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQ3hDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBTyxFQUFFLENBQUM7WUFDOUIsSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFO2dCQUNuQixPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdkM7WUFDRCxN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