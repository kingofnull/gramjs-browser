"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBaseClient = void 0;
const __1 = require("../");
const Helpers_1 = require("../Helpers");
const connection_1 = require("../network/connection");
const sessions_1 = require("../sessions");
const extensions_1 = require("../extensions");
const tl_1 = require("../tl");
const os_1 = __importDefault(require("os"));
const entityCache_1 = require("../entityCache");
const markdown_1 = require("../extensions/markdown");
const network_1 = require("../network");
const AllTLObjects_1 = require("../tl/AllTLObjects");
const TCPMTProxy_1 = require("../network/connection/TCPMTProxy");
const EXPORTED_SENDER_RECONNECT_TIMEOUT = 1000; // 1 sec
const EXPORTED_SENDER_RELEASE_TIMEOUT = 30000; // 30 sec
const DEFAULT_DC_ID = 4;
const DEFAULT_IPV4_IP = Helpers_1.IS_NODE ? "149.154.167.91" : "vesta.web.telegram.org";
const DEFAULT_IPV6_IP = "2001:067c:04e8:f004:0000:0000:0000:000a";
const clientParamsDefault = {
    connection: Helpers_1.IS_NODE ? connection_1.ConnectionTCPFull : connection_1.ConnectionTCPObfuscated,
    useIPV6: false,
    timeout: 10,
    requestRetries: 5,
    connectionRetries: Infinity,
    retryDelay: 1000,
    downloadRetries: 5,
    autoReconnect: true,
    sequentialUpdates: false,
    floodSleepThreshold: 60,
    deviceModel: "",
    systemVersion: "",
    appVersion: "",
    langCode: "en",
    systemLangCode: "en",
    baseLogger: "gramjs",
    useWSS: typeof window !== "undefined"
        ? window.location.protocol == "https:"
        : false,
};
class TelegramBaseClient {
    constructor(session, apiId, apiHash, clientParams) {
        var _a;
        /** The current gramJS version. */
        this.__version__ = __1.version;
        /** @hidden */
        this._ALBUMS = new Map();
        this._exportedSenderPromises = new Map();
        this._exportedSenderReleaseTimeouts = new Map();
        clientParams = Object.assign(Object.assign({}, clientParamsDefault), clientParams);
        if (!apiId || !apiHash) {
            throw new Error("Your API ID or Hash cannot be empty or undefined");
        }
        if (typeof clientParams.baseLogger == "string") {
            this._log = new extensions_1.Logger();
        }
        else {
            this._log = clientParams.baseLogger;
        }
        this._log.info("Running gramJS version " + __1.version);
        if (session && typeof session == "string") {
            session = new sessions_1.StoreSession(session);
        }
        if (!(session instanceof sessions_1.Session)) {
            throw new Error("Only StringSession and StoreSessions are supported currently :( ");
        }
        this._floodSleepThreshold = clientParams.floodSleepThreshold;
        this.session = session;
        this.apiId = apiId;
        this.apiHash = apiHash;
        this._useIPV6 = clientParams.useIPV6;
        this._requestRetries = clientParams.requestRetries;
        this._downloadRetries = clientParams.downloadRetries;
        this._connectionRetries = clientParams.connectionRetries;
        this._retryDelay = clientParams.retryDelay || 0;
        this._timeout = clientParams.timeout;
        this._autoReconnect = clientParams.autoReconnect;
        this._proxy = clientParams.proxy;
        if (!(clientParams.connection instanceof Function)) {
            throw new Error("Connection should be a class not an instance");
        }
        this._connection = clientParams.connection;
        let initProxy;
        if ((_a = this._proxy) === null || _a === void 0 ? void 0 : _a.MTProxy) {
            this._connection = TCPMTProxy_1.ConnectionTCPMTProxyAbridged;
            initProxy = new tl_1.Api.InputClientProxy({
                address: this._proxy.ip,
                port: this._proxy.port,
            });
        }
        this._initRequest = new tl_1.Api.InitConnection({
            apiId: this.apiId,
            deviceModel: clientParams.deviceModel || os_1.default.type().toString() || "Unknown",
            systemVersion: clientParams.systemVersion || os_1.default.release().toString() || "1.0",
            appVersion: clientParams.appVersion || "1.0",
            langCode: clientParams.langCode,
            langPack: "",
            systemLangCode: clientParams.systemLangCode,
            proxy: initProxy,
        });
        this._eventBuilders = [];
        this._floodWaitedRequests = {};
        this._borrowedSenderPromises = {};
        this._bot = undefined;
        this._selfInputPeer = undefined;
        this.useWSS = clientParams.useWSS;
        if (this.useWSS && this._proxy) {
            throw new Error("Cannot use SSL with proxies. You need to disable the useWSS client param in TelegramClient");
        }
        this._entityCache = new entityCache_1.EntityCache();
        // These will be set later
        this._config = undefined;
        this._loopStarted = false;
        this._reconnecting = false;
        this._destroyed = false;
        // parse mode
        this._parseMode = markdown_1.MarkdownParser;
    }
    get floodSleepThreshold() {
        return this._floodSleepThreshold;
    }
    set floodSleepThreshold(value) {
        this._floodSleepThreshold = Math.min(value || 0, 24 * 60 * 60);
    }
    // region connecting
    async _initSession() {
        await this.session.load();
        if (!this.session.serverAddress ||
            this.session.serverAddress.includes(":") !== this._useIPV6) {
            this.session.setDC(DEFAULT_DC_ID, this._useIPV6 ? DEFAULT_IPV6_IP : DEFAULT_IPV4_IP, this.useWSS ? 443 : 80);
        }
    }
    get connected() {
        return this._sender && this._sender.isConnected();
    }
    async disconnect() {
        if (this._sender) {
            await this._sender.disconnect();
        }
        await Promise.all(Object.values(this._exportedSenderPromises).map((promise) => {
            return (promise &&
                promise.then((sender) => {
                    if (sender) {
                        return sender.disconnect();
                    }
                    return undefined;
                }));
        }));
        this._exportedSenderPromises = new Map();
    }
    get disconnected() {
        return !this._sender || this._sender._disconnected;
    }
    /**
     * Disconnects all senders and removes all handlers
     * @remarks
     * This will also delete your session (not log out) so be careful with usage.
     * Disconnect is safer as it will do almost the same while keeping your session file/
     */
    async destroy() {
        await Promise.all([
            this.disconnect(),
            this.session.delete(),
            ...Object.values(this._borrowedSenderPromises).map((promise) => {
                return promise.then((sender) => sender.disconnect());
            }),
        ]);
        this._eventBuilders = [];
    }
    async _authKeyCallback(authKey, dcId) {
        this.session.setAuthKey(authKey, dcId);
        await this.session.save();
    }
    async _cleanupExportedSender(dcId) {
        if (this.session.dcId !== dcId) {
            this.session.setAuthKey(undefined, dcId);
        }
        let sender = await this._exportedSenderPromises.get(dcId);
        this._exportedSenderPromises.delete(dcId);
        await (sender === null || sender === void 0 ? void 0 : sender.disconnect());
    }
    async _connectSender(sender, dcId) {
        // if we don't already have an auth key we want to use normal DCs not -1
        const dc = await this.getDC(dcId, !!sender.authKey.getKey());
        while (true) {
            try {
                await sender.connect(new this._connection(dc.ipAddress, dc.port, dcId, this._log, this._proxy));
                if (this.session.dcId !== dcId && !sender._authenticated) {
                    this._log.info(`Exporting authorization for data center ${dc.ipAddress}`);
                    const auth = await this.invoke(new tl_1.Api.auth.ExportAuthorization({ dcId: dcId }));
                    this._initRequest.query = new tl_1.Api.auth.ImportAuthorization({
                        id: auth.id,
                        bytes: auth.bytes,
                    });
                    const req = new tl_1.Api.InvokeWithLayer({
                        layer: AllTLObjects_1.LAYER,
                        query: this._initRequest,
                    });
                    await sender.send(req);
                    sender._authenticated = true;
                }
                sender.dcId = dcId;
                sender.userDisconnected = false;
                return sender;
            }
            catch (err) {
                if (err.errorMessage === "DC_ID_INVALID") {
                    sender._authenticated = true;
                    sender.userDisconnected = false;
                    return sender;
                }
                if (this._log.canSend("error")) {
                    console.error(err);
                }
                await Helpers_1.sleep(1000);
                await sender.disconnect();
            }
        }
    }
    async _borrowExportedSender(dcId, shouldReconnect, existingSender) {
        if (!this._exportedSenderPromises.get(dcId) || shouldReconnect) {
            this._exportedSenderPromises.set(dcId, this._connectSender(existingSender || this._createExportedSender(dcId), dcId));
        }
        let sender;
        try {
            sender = await this._exportedSenderPromises.get(dcId);
            if (!sender.isConnected()) {
                if (sender.isConnecting) {
                    await Helpers_1.sleep(EXPORTED_SENDER_RECONNECT_TIMEOUT);
                    return this._borrowExportedSender(dcId, false, sender);
                }
                else {
                    return this._borrowExportedSender(dcId, true, sender);
                }
            }
        }
        catch (err) {
            if (this._log.canSend("error")) {
                console.error(err);
            }
            return this._borrowExportedSender(dcId, true);
        }
        if (this._exportedSenderReleaseTimeouts.get(dcId)) {
            clearTimeout(this._exportedSenderReleaseTimeouts.get(dcId));
            this._exportedSenderReleaseTimeouts.delete(dcId);
        }
        this._exportedSenderReleaseTimeouts.set(dcId, setTimeout(() => {
            this._exportedSenderReleaseTimeouts.delete(dcId);
            sender.disconnect();
        }, EXPORTED_SENDER_RELEASE_TIMEOUT));
        return sender;
    }
    _createExportedSender(dcId) {
        return new network_1.MTProtoSender(this.session.getAuthKey(dcId), {
            logger: this._log,
            dcId,
            retries: this._connectionRetries,
            delay: this._retryDelay,
            autoReconnect: this._autoReconnect,
            connectTimeout: this._timeout,
            authKeyCallback: this._authKeyCallback.bind(this),
            isMainSender: dcId === this.session.dcId,
            onConnectionBreak: this._cleanupExportedSender.bind(this),
            client: this,
        });
    }
    getSender(dcId) {
        return dcId
            ? this._borrowExportedSender(dcId)
            : Promise.resolve(this._sender);
    }
    // endregion
    async getDC(dcId, download) {
        throw new Error("Cannot be called from here!");
    }
    invoke(request) {
        throw new Error("Cannot be called from here!");
    }
}
exports.TelegramBaseClient = TelegramBaseClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZWdyYW1CYXNlQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2NsaWVudC90ZWxlZ3JhbUJhc2VDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQTBEO0FBQzFELHdDQUE0QztBQUM1QyxzREFHK0I7QUFDL0IsMENBQW9EO0FBQ3BELDhDQUF1QztBQUN2Qyw4QkFBNEI7QUFFNUIsNENBQW9CO0FBRXBCLGdEQUE2QztBQUc3QyxxREFBd0Q7QUFDeEQsd0NBQTJDO0FBQzNDLHFEQUEyQztBQUMzQyxpRUFJMEM7QUFFMUMsTUFBTSxpQ0FBaUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxRQUFRO0FBQ3hELE1BQU0sK0JBQStCLEdBQUcsS0FBSyxDQUFDLENBQUMsU0FBUztBQUV4RCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDeEIsTUFBTSxlQUFlLEdBQUcsaUJBQU8sQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDO0FBQzlFLE1BQU0sZUFBZSxHQUFHLHlDQUF5QyxDQUFDO0FBZ0ZsRSxNQUFNLG1CQUFtQixHQUFHO0lBQ3hCLFVBQVUsRUFBRSxpQkFBTyxDQUFDLENBQUMsQ0FBQyw4QkFBaUIsQ0FBQyxDQUFDLENBQUMsb0NBQXVCO0lBQ2pFLE9BQU8sRUFBRSxLQUFLO0lBQ2QsT0FBTyxFQUFFLEVBQUU7SUFDWCxjQUFjLEVBQUUsQ0FBQztJQUNqQixpQkFBaUIsRUFBRSxRQUFRO0lBQzNCLFVBQVUsRUFBRSxJQUFJO0lBQ2hCLGVBQWUsRUFBRSxDQUFDO0lBQ2xCLGFBQWEsRUFBRSxJQUFJO0lBQ25CLGlCQUFpQixFQUFFLEtBQUs7SUFDeEIsbUJBQW1CLEVBQUUsRUFBRTtJQUN2QixXQUFXLEVBQUUsRUFBRTtJQUNmLGFBQWEsRUFBRSxFQUFFO0lBQ2pCLFVBQVUsRUFBRSxFQUFFO0lBQ2QsUUFBUSxFQUFFLElBQUk7SUFDZCxjQUFj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