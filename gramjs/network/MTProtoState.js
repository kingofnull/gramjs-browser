"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTProtoState = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const __1 = require("../");
const tl_1 = require("../tl");
const Helpers_1 = require("../Helpers");
const core_1 = require("../tl/core");
const extensions_1 = require("../extensions");
const IGE_1 = require("../crypto/IGE");
const errors_1 = require("../errors");
class MTProtoState {
    /**
     *
     `telethon.network.mtprotosender.MTProtoSender` needs to hold a state
     in order to be able to encrypt and decrypt incoming/outgoing messages,
     as well as generating the message IDs. Instances of this class hold
     together all the required information.

     It doesn't make sense to use `telethon.sessions.abstract.Session` for
     the sender because the sender should *not* be concerned about storing
     this information to disk, as one may create as many senders as they
     desire to any other data center, or some CDN. Using the same session
     for all these is not a good idea as each need their own authkey, and
     the concept of "copying" sessions with the unnecessary entities or
     updates state for these connections doesn't make sense.

     While it would be possible to have a `MTProtoPlainState` that does no
     encryption so that it was usable through the `MTProtoLayer` and thus
     avoid the need for a `MTProtoPlainSender`, the `MTProtoLayer` is more
     focused to efficiency and this state is also more advanced (since it
     supports gzipping and invoking after other message IDs). There are too
     many methods that would be needed to make it convenient to use for the
     authentication process, at which point the `MTProtoPlainSender` is better
     * @param authKey
     * @param loggers
     */
    constructor(authKey, loggers) {
        this.authKey = authKey;
        this._log = loggers;
        this.timeOffset = 0;
        this.salt = big_integer_1.default.zero;
        this._sequence = 0;
        this.id = this._lastMsgId = big_integer_1.default.zero;
        this.msgIds = new Set();
        this.reset();
    }
    /**
     * Resets the state
     */
    reset() {
        // Session IDs can be random on every connection
        this.id = __1.helpers.generateRandomLong(true);
        this._sequence = 0;
        this._lastMsgId = big_integer_1.default.zero;
        this.msgIds = new Set();
    }
    /**
     * Updates the message ID to a new one,
     * used when the time offset changed.
     * @param message
     */
    updateMessageId(message) {
        message.msgId = this._getNewMsgId();
    }
    /**
     * Calculate the key based on Telegram guidelines, specifying whether it's the client or not
     * @param authKey
     * @param msgKey
     * @param client
     * @returns {{iv: Buffer, key: Buffer}}
     */
    async _calcKey(authKey, msgKey, client) {
        const x = client ? 0 : 8;
        const [sha256a, sha256b] = await Promise.all([
            Helpers_1.sha256(Buffer.concat([msgKey, authKey.slice(x, x + 36)])),
            Helpers_1.sha256(Buffer.concat([authKey.slice(x + 40, x + 76), msgKey])),
        ]);
        const key = Buffer.concat([
            sha256a.slice(0, 8),
            sha256b.slice(8, 24),
            sha256a.slice(24, 32),
        ]);
        const iv = Buffer.concat([
            sha256b.slice(0, 8),
            sha256a.slice(8, 24),
            sha256b.slice(24, 32),
        ]);
        return { key, iv };
    }
    /**
     * Writes a message containing the given data into buffer.
     * Returns the message id.
     * @param buffer
     * @param data
     * @param contentRelated
     * @param afterId
     */
    async writeDataAsMessage(buffer, data, contentRelated, afterId) {
        const msgId = this._getNewMsgId();
        const seqNo = this._getSeqNo(contentRelated);
        let body;
        if (!afterId) {
            body = await core_1.GZIPPacked.gzipIfSmaller(contentRelated, data);
        }
        else {
            body = await core_1.GZIPPacked.gzipIfSmaller(contentRelated, new tl_1.Api.InvokeAfterMsg({
                msgId: afterId,
                query: {
                    getBytes() {
                        return data;
                    },
                },
            }).getBytes());
        }
        const s = Buffer.alloc(4);
        s.writeInt32LE(seqNo, 0);
        const b = Buffer.alloc(4);
        b.writeInt32LE(body.length, 0);
        const m = Helpers_1.toSignedLittleBuffer(msgId, 8);
        buffer.write(Buffer.concat([m, s, b]));
        buffer.write(body);
        return msgId;
    }
    /**
     * Encrypts the given message data using the current authorization key
     * following MTProto 2.0 guidelines core.telegram.org/mtproto/description.
     * @param data
     */
    async encryptMessageData(data) {
        if (!this.authKey) {
            throw new Error("Auth key unset");
        }
        await this.authKey.waitForKey();
        const authKey = this.authKey.getKey();
        if (!authKey) {
            throw new Error("Auth key unset");
        }
        if (!this.salt || !this.id || !authKey || !this.authKey.keyId) {
            throw new Error("Unset params");
        }
        const s = Helpers_1.toSignedLittleBuffer(this.salt, 8);
        const i = Helpers_1.toSignedLittleBuffer(this.id, 8);
        data = Buffer.concat([Buffer.concat([s, i]), data]);
        const padding = __1.helpers.generateRandomBytes(__1.helpers.mod(-(data.length + 12), 16) + 12);
        // Being substr(what, offset, length); x = 0 for client
        // "msg_key_large = SHA256(substr(auth_key, 88+x, 32) + pt + padding)"
        const msgKeyLarge = await Helpers_1.sha256(Buffer.concat([authKey.slice(88, 88 + 32), data, padding]));
        // "msg_key = substr (msg_key_large, 8, 16)"
        const msgKey = msgKeyLarge.slice(8, 24);
        const { iv, key } = await this._calcKey(authKey, msgKey, true);
        const keyId = __1.helpers.readBufferFromBigInt(this.authKey.keyId, 8);
        return Buffer.concat([
            keyId,
            msgKey,
            new IGE_1.IGE(key, iv).encryptIge(Buffer.concat([data, padding])),
        ]);
    }
    /**
     * Inverse of `encrypt_message_data` for incoming server messages.
     * @param body
     */
    async decryptMessageData(body) {
        if (!this.authKey) {
            throw new Error("Auth key unset");
        }
        if (body.length < 8) {
            throw new errors_1.InvalidBufferError(body);
        }
        // TODO Check salt,sessionId, and sequenceNumber
        const keyId = __1.helpers.readBigIntFromBuffer(body.slice(0, 8));
        if (!this.authKey.keyId || keyId.neq(this.authKey.keyId)) {
            throw new errors_1.SecurityError("Server replied with an invalid auth key");
        }
        const authKey = this.authKey.getKey();
        if (!authKey) {
            throw new errors_1.SecurityError("Unset AuthKey");
        }
        const msgKey = body.slice(8, 24);
        const { iv, key } = await this._calcKey(authKey, msgKey, false);
        body = new IGE_1.IGE(key, iv).decryptIge(body.slice(24));
        // https://core.telegram.org/mtproto/security_guidelines
        // Sections "checking sha256 hash" and "message length"
        const ourKey = await Helpers_1.sha256(Buffer.concat([authKey.slice(96, 96 + 32), body]));
        if (!msgKey.equals(ourKey.slice(8, 24))) {
            throw new errors_1.SecurityError("Received msg_key doesn't match with expected one");
        }
        const reader = new extensions_1.BinaryReader(body);
        reader.readLong(); // removeSalt
        const serverId = reader.readLong();
        if (serverId !== this.id) {
            // throw new SecurityError('Server replied with a wrong session ID');
        }
        const remoteMsgId = reader.readLong();
        if (this.msgIds.has(remoteMsgId.toString())) {
            throw new errors_1.SecurityError("Duplicate msgIds");
        }
        if (remoteMsgId.lesser(this._lastMsgId)) {
            throw new errors_1.SecurityError("Received old message from server");
        }
        this.msgIds.add(remoteMsgId.toString());
        const remoteSequence = reader.readInt();
        reader.readInt(); // msgLen for the inner object, padding ignored
        // We could read msg_len bytes and use those in a new reader to read
        // the next TLObject without including the padding, but since the
        // reader isn't used for anything else after this, it's unnecessary.
        const obj = reader.tgReadObject();
        return new core_1.TLMessage(remoteMsgId, remoteSequence, obj);
    }
    /**
     * Generates a new unique message ID based on the current
     * time (in ms) since epoch, applying a known time offset.
     * @private
     */
    _getNewMsgId() {
        const now = new Date().getTime() / 1000 + this.timeOffset;
        const nanoseconds = Math.floor((now - Math.floor(now)) * 1e9);
        let newMsgId = big_integer_1.default(Math.floor(now))
            .shiftLeft(big_integer_1.default(32))
            .or(big_integer_1.default(nanoseconds).shiftLeft(big_integer_1.default(2)));
        if (this._lastMsgId.greaterOrEquals(newMsgId)) {
            newMsgId = this._lastMsgId.add(big_integer_1.default(4));
        }
        this._lastMsgId = newMsgId;
        return newMsgId;
    }
    /**
     * Updates the time offset to the correct
     * one given a known valid message ID.
     * @param correctMsgId {BigInteger}
     */
    updateTimeOffset(correctMsgId) {
        const bad = this._getNewMsgId();
        const old = this.timeOffset;
        const now = Math.floor(new Date().getTime() / 1000);
        const correct = correctMsgId.shiftRight(BigInt(32)).toJSNumber();
        this.timeOffset = correct - now;
        if (this.timeOffset !== old) {
            this._lastMsgId = big_integer_1.default.zero;
            this._log.debug(`Updated time offset (old offset ${old}, bad ${bad}, good ${correctMsgId}, new ${this.timeOffset})`);
        }
        return this.timeOffset;
    }
    /**
     * Generates the next sequence number depending on whether
     * it should be for a content-related query or not.
     * @param contentRelated
     * @private
     */
    _getSeqNo(contentRelated) {
        if (contentRelated) {
            const result = this._sequence * 2 + 1;
            this._sequence += 1;
            return result;
        }
        else {
            return this._sequence * 2;
        }
    }
}
exports.MTProtoState = MTProtoState;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTVRQcm90b1N0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL25ldHdvcmsvTVRQcm90b1N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhEQUFpQztBQUVqQywyQkFBOEI7QUFDOUIsOEJBQTRCO0FBQzVCLHdDQUEwRDtBQUMxRCxxQ0FBbUQ7QUFDbkQsOENBQTZDO0FBRTdDLHVDQUFvQztBQUNwQyxzQ0FBOEQ7QUFFOUQsTUFBYSxZQUFZO0lBVXJCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F3Qkc7SUFDSCxZQUFZLE9BQWlCLEVBQUUsT0FBYTtRQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNwQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBTSxDQUFDLElBQUksQ0FBQztRQUN4QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUs7UUFDRCxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLEVBQUUsR0FBRyxXQUFPLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBTSxDQUFDLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFDcEMsQ0FBQztJQUVE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