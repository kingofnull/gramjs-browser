"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionTCPMTProxyAbridged = exports.TCPMTProxy = void 0;
const Connection_1 = require("./Connection");
const TCPAbridged_1 = require("./TCPAbridged");
const Helpers_1 = require("../../Helpers");
const CTR_1 = require("../../crypto/CTR");
class MTProxyIO {
    constructor(connection) {
        this.header = undefined;
        this.connection = connection.socket;
        this._packetClass =
            connection.PacketCodecClass;
        this._secret = connection._secret;
        this._dcId = connection._dcId;
    }
    async initHeader() {
        let secret = this._secret;
        const isDD = secret.length == 17 && secret[0] == 0xdd;
        secret = isDD ? secret.slice(1) : secret;
        if (secret.length != 16) {
            throw new Error("MTProxy secret must be a hex-string representing 16 bytes");
        }
        const keywords = [
            Buffer.from("50567247", "hex"),
            Buffer.from("474554", "hex"),
            Buffer.from("504f5354", "hex"),
            Buffer.from("eeeeeeee", "hex"),
        ];
        let random;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            random = Helpers_1.generateRandomBytes(64);
            if (random[0] !== 0xef &&
                !random.slice(4, 8).equals(Buffer.alloc(4))) {
                let ok = true;
                for (const key of keywords) {
                    if (key.equals(random.slice(0, 4))) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    break;
                }
            }
        }
        random = random.toJSON().data;
        const randomReversed = Buffer.from(random.slice(8, 56)).reverse();
        // Encryption has "continuous buffer" enabled
        const encryptKey = await Helpers_1.sha256(Buffer.concat([Buffer.from(random.slice(8, 40)), secret]));
        const encryptIv = Buffer.from(random.slice(40, 56));
        const decryptKey = await Helpers_1.sha256(Buffer.concat([Buffer.from(randomReversed.slice(0, 32)), secret]));
        const decryptIv = Buffer.from(randomReversed.slice(32, 48));
        const encryptor = new CTR_1.CTR(encryptKey, encryptIv);
        const decryptor = new CTR_1.CTR(decryptKey, decryptIv);
        random = Buffer.concat([
            Buffer.from(random.slice(0, 56)),
            this._packetClass.obfuscateTag,
            Buffer.from(random.slice(60)),
        ]);
        const dcIdBytes = Buffer.alloc(2);
        dcIdBytes.writeInt8(this._dcId);
        random = Buffer.concat([
            Buffer.from(random.slice(0, 60)),
            dcIdBytes,
            Buffer.from(random.slice(62)),
        ]);
        random = Buffer.concat([
            Buffer.from(random.slice(0, 56)),
            Buffer.from(encryptor.encrypt(random).slice(56, 64)),
            Buffer.from(random.slice(64)),
        ]);
        this.header = random;
        this._encrypt = encryptor;
        this._decrypt = decryptor;
    }
    async read(n) {
        const data = await this.connection.readExactly(n);
        return this._decrypt.encrypt(data);
    }
    write(data) {
        this.connection.write(this._encrypt.encrypt(data));
    }
}
class TCPMTProxy extends Connection_1.ObfuscatedConnection {
    constructor(ip, port, dcId, loggers, proxy) {
        super(proxy.ip, proxy.port, dcId, loggers);
        this.ObfuscatedIO = MTProxyIO;
        if (!proxy.MTProxy) {
            throw new Error("This connection only supports MPTProxies");
        }
        if (!proxy.secret) {
            throw new Error("You need to provide the secret for the MTProxy");
        }
        if (proxy.secret && proxy.secret.match(/^[0-9a-f]+$/i)) {
            // probably hex
            this._secret = Buffer.from(proxy.secret, "hex");
        }
        else {
            // probably b64
            this._secret = Buffer.from(proxy.secret, "base64");
        }
    }
}
exports.TCPMTProxy = TCPMTProxy;
class ConnectionTCPMTProxyAbridged extends TCPMTProxy {
    constructor() {
        super(...arguments);
        this.PacketCodecClass = TCPAbridged_1.AbridgedPacketCodec;
    }
}
exports.ConnectionTCPMTProxyAbridged = ConnectionTCPMTProxyAbridged;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVENQTVRQcm94eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2dyYW1qcy9uZXR3b3JrL2Nvbm5lY3Rpb24vVENQTVRQcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBb0Q7QUFDcEQsK0NBQW9EO0FBQ3BELDJDQUE0RDtBQU01RCwwQ0FBdUM7QUFXdkMsTUFBTSxTQUFTO0lBU1gsWUFBWSxVQUFzQjtRQVJsQyxXQUFNLEdBQVksU0FBUyxDQUFDO1FBU3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUNwQyxJQUFJLENBQUMsWUFBWTtZQUNiLFVBQVUsQ0FBQyxnQkFBa0QsQ0FBQztRQUVsRSxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUM7UUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVTtRQUNaLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUN0RCxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDekMsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUNYLDJEQUEyRCxDQUM5RCxDQUFDO1NBQ0w7UUFDRCxNQUFNLFFBQVEsR0FBRztZQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQztZQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUM7WUFDNUIsTUFBTSxDQUFD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