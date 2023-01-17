"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._entityType = exports._EntityType = exports.TotalList = exports.crc32 = exports.bufferXor = exports.sleep = exports.getRandomInt = exports.getMinBigInt = exports.getByteArray = exports.modExp = exports.sha256 = exports.sha1 = exports.convertToLittle = exports.generateKeyDataFromNonce = exports.stripText = exports.generateRandomBytes = exports.bigIntMod = exports.mod = exports.generateRandomLong = exports.readBufferFromBigInt = exports.toSignedLittleBuffer = exports.isArrayLike = exports.betterConsoleLog = exports.groupBy = exports.escapeRegex = exports.generateRandomBigInt = exports.readBigIntFromBuffer = exports.IS_NODE = void 0;
const browser_or_node_1 = require("browser-or-node");
const big_integer_1 = __importDefault(require("big-integer"));
exports.IS_NODE = browser_or_node_1.isNode;
const crypto = require(browser_or_node_1.isNode ? "crypto" : "./crypto/crypto");
/**
 * converts a buffer to big int
 * @param buffer
 * @param little
 * @param signed
 * @returns {bigInt.BigInteger}
 */
function readBigIntFromBuffer(buffer, little = true, signed = false) {
    let randBuffer = Buffer.from(buffer);
    const bytesNumber = randBuffer.length;
    if (little) {
        randBuffer = randBuffer.reverse();
    }
    let bigIntVar = big_integer_1.default(randBuffer.toString("hex"), 16);
    if (signed && Math.floor(bigIntVar.toString(2).length / 8) >= bytesNumber) {
        bigIntVar = bigIntVar.subtract(big_integer_1.default(2).pow(big_integer_1.default(bytesNumber * 8)));
    }
    return bigIntVar;
}
exports.readBigIntFromBuffer = readBigIntFromBuffer;
function generateRandomBigInt() {
    return readBigIntFromBuffer(generateRandomBytes(8), false);
}
exports.generateRandomBigInt = generateRandomBigInt;
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
exports.escapeRegex = escapeRegex;
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        }
        else {
            collection.push(item);
        }
    });
    return map;
}
exports.groupBy = groupBy;
/**
 * Outputs the object in a better way by hiding all the private methods/attributes.
 * @param object - the class to use
 */
function betterConsoleLog(object) {
    const toPrint = {};
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            if (!key.startsWith("_") && key != "originalArgs") {
                toPrint[key] = object[key];
            }
        }
    }
    return toPrint;
}
exports.betterConsoleLog = betterConsoleLog;
/**
 * Helper to find if a given object is an array (or similar)
 */
const isArrayLike = (x) => x &&
    typeof x.length === "number" &&
    typeof x !== "function" &&
    typeof x !== "string";
exports.isArrayLike = isArrayLike;
/*
export function addSurrogate(text: string) {
    let temp = "";
    for (const letter of text) {
        const t = letter.charCodeAt(0);
        if (0x1000 < t && t < 0x10FFFF) {
            const b = Buffer.from(letter, "utf16le");
            const r = String.fromCharCode(b.readUInt16LE(0)) + String.fromCharCode(b.readUInt16LE(2));
            temp += r;
        } else {
            text += letter;
        }
    }
    return temp;
}

 */
/**
 * Special case signed little ints
 * @param big
 * @param number
 * @returns {Buffer}
 */
function toSignedLittleBuffer(big, number = 8) {
    const bigNumber = big_integer_1.default(big);
    const byteArray = [];
    for (let i = 0; i < number; i++) {
        byteArray[i] = bigNumber.shiftRight(8 * i).and(255);
    }
    // smh hacks
    return Buffer.from(byteArray);
}
exports.toSignedLittleBuffer = toSignedLittleBuffer;
/**
 * converts a big int to a buffer
 * @param bigIntVar {BigInteger}
 * @param bytesNumber
 * @param little
 * @param signed
 * @returns {Buffer}
 */
function readBufferFromBigInt(bigIntVar, bytesNumber, little = true, signed = false) {
    bigIntVar = big_integer_1.default(bigIntVar);
    const bitLength = bigIntVar.bitLength().toJSNumber();
    const bytes = Math.ceil(bitLength / 8);
    if (bytesNumber < bytes) {
        throw new Error("OverflowError: int too big to convert");
    }
    if (!signed && bigIntVar.lesser(BigInt(0))) {
        throw new Error("Cannot convert to unsigned");
    }
    let below = false;
    if (bigIntVar.lesser(BigInt(0))) {
        below = true;
        bigIntVar = bigIntVar.abs();
    }
    const hex = bigIntVar.toString(16).padStart(bytesNumber * 2, "0");
    let littleBuffer = Buffer.from(hex, "hex");
    if (little) {
        littleBuffer = littleBuffer.reverse();
    }
    if (signed && below) {
        if (little) {
            let reminder = false;
            if (littleBuffer[0] !== 0) {
                littleBuffer[0] -= 1;
            }
            for (let i = 0; i < littleBuffer.length; i++) {
                if (littleBuffer[i] === 0) {
                    reminder = true;
                    continue;
                }
                if (reminder) {
                    littleBuffer[i] -= 1;
                    reminder = false;
                }
                littleBuffer[i] = 255 - littleBuffer[i];
            }
        }
        else {
            littleBuffer[littleBuffer.length - 1] =
                256 - littleBuffer[littleBuffer.length - 1];
            for (let i = 0; i < littleBuffer.length - 1; i++) {
                littleBuffer[i] = 255 - littleBuffer[i];
            }
        }
    }
    return littleBuffer;
}
exports.readBufferFromBigInt = readBufferFromBigInt;
/**
 * Generates a random long integer (8 bytes), which is optionally signed
 * @returns {BigInteger}
 */
function generateRandomLong(signed = true) {
    return readBigIntFromBuffer(generateRandomBytes(8), true, signed);
}
exports.generateRandomLong = generateRandomLong;
/**
 * .... really javascript
 * @param n {number}
 * @param m {number}
 * @returns {number}
 */
function mod(n, m) {
    return ((n % m) + m) % m;
}
exports.mod = mod;
/**
 * returns a positive bigInt
 * @param n {bigInt.BigInteger}
 * @param m {bigInt.BigInteger}
 * @returns {bigInt.BigInteger}
 */
function bigIntMod(n, m) {
    return n.remainder(m).add(m).remainder(m);
}
exports.bigIntMod = bigIntMod;
/**
 * Generates a random bytes array
 * @param count
 * @returns {Buffer}
 */
function generateRandomBytes(count) {
    return Buffer.from(crypto.randomBytes(count));
}
exports.generateRandomBytes = generateRandomBytes;
/**
 * Calculate the key based on Telegram guidelines, specifying whether it's the client or not
 * @param sharedKey
 * @param msgKey
 * @param client
 * @returns {{iv: Buffer, key: Buffer}}
 */
/*CONTEST
this is mtproto 1 (mostly used for secret chats)
async function calcKey(sharedKey, msgKey, client) {
    const x = client === true ? 0 : 8
    const [sha1a, sha1b, sha1c, sha1d] = await Promise.all([
        sha1(Buffer.concat([msgKey, sharedKey.slice(x, x + 32)])),
        sha1(Buffer.concat([sharedKey.slice(x + 32, x + 48), msgKey, sharedKey.slice(x + 48, x + 64)])),
        sha1(Buffer.concat([sharedKey.slice(x + 64, x + 96), msgKey])),
        sha1(Buffer.concat([msgKey, sharedKey.slice(x + 96, x + 128)]))
    ])
    const key = Buffer.concat([sha1a.slice(0, 8), sha1b.slice(8, 20), sha1c.slice(4, 16)])
    const iv = Buffer.concat([sha1a.slice(8, 20), sha1b.slice(0, 8), sha1c.slice(16, 20), sha1d.slice(0, 8)])
    return {
        key,
        iv
    }
}

 */
function stripText(text, entities) {
    if (!entities || !entities.length) {
        return text.trim();
    }
    while (text && text[text.length - 1].trim() === "") {
        const e = entities[entities.length - 1];
        if (e.offset + e.length == text.length) {
            if (e.length == 1) {
                entities.pop();
                if (!entities.length) {
                    return text.trim();
                }
            }
            else {
                e.length -= 1;
            }
        }
        text = text.slice(0, -1);
    }
    while (text && text[0].trim() === "") {
        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (e.offset != 0) {
                e.offset--;
                continue;
            }
            if (e.length == 1) {
                entities.shift();
                if (!entities.length) {
                    return text.trimLeft();
                }
            }
            else {
                e.length -= 1;
            }
        }
        text = text.slice(1);
    }
    return text;
}
exports.stripText = stripText;
/**
 * Generates the key data corresponding to the given nonces
 * @param serverNonceBigInt
 * @param newNonceBigInt
 * @returns {{key: Buffer, iv: Buffer}}
 */
async function generateKeyDataFromNonce(serverNonceBigInt, newNonceBigInt) {
    const serverNonce = toSignedLittleBuffer(serverNonceBigInt, 16);
    const newNonce = toSignedLittleBuffer(newNonceBigInt, 32);
    const [hash1, hash2, hash3] = await Promise.all([
        sha1(Buffer.concat([newNonce, serverNonce])),
        sha1(Buffer.concat([serverNonce, newNonce])),
        sha1(Buffer.concat([newNonce, newNonce])),
    ]);
    const keyBuffer = Buffer.concat([hash1, hash2.slice(0, 12)]);
    const ivBuffer = Buffer.concat([
        hash2.slice(12, 20),
        hash3,
        newNonce.slice(0, 4),
    ]);
    return {
        key: keyBuffer,
        iv: ivBuffer,
    };
}
exports.generateKeyDataFromNonce = generateKeyDataFromNonce;
function convertToLittle(buf) {
    const correct = Buffer.alloc(buf.length * 4);
    for (let i = 0; i < buf.length; i++) {
        correct.writeUInt32BE(buf[i], i * 4);
    }
    return correct;
}
exports.convertToLittle = convertToLittle;
/**
 * Calculates the SHA1 digest for the given data
 * @param data
 * @returns {Promise}
 */
function sha1(data) {
    const shaSum = crypto.createHash("sha1");
    shaSum.update(data);
    return shaSum.digest();
}
exports.sha1 = sha1;
/**
 * Calculates the SHA256 digest for the given data
 * @param data
 * @returns {Promise}
 */
function sha256(data) {
    const shaSum = crypto.createHash("sha256");
    shaSum.update(data);
    return shaSum.digest();
}
exports.sha256 = sha256;
/**
 * Fast mod pow for RSA calculation. a^b % n
 * @param a
 * @param b
 * @param n
 * @returns {bigInt.BigInteger}
 */
function modExp(a, b, n) {
    a = a.remainder(n);
    let result = big_integer_1.default.one;
    let x = a;
    while (b.greater(big_integer_1.default.zero)) {
        const leastSignificantBit = b.remainder(BigInt(2));
        b = b.divide(BigInt(2));
        if (leastSignificantBit.eq(big_integer_1.default.one)) {
            result = result.multiply(x);
            result = result.remainder(n);
        }
        x = x.multiply(x);
        x = x.remainder(n);
    }
    return result;
}
exports.modExp = modExp;
/**
 * Gets the arbitrary-length byte array corresponding to the given integer
 * @param integer {number,BigInteger}
 * @param signed {boolean}
 * @returns {Buffer}
 */
function getByteArray(integer, signed = false) {
    const bits = integer.toString(2).length;
    const byteLength = Math.floor((bits + 8 - 1) / 8);
    return readBufferFromBigInt(typeof integer == "number" ? big_integer_1.default(integer) : integer, byteLength, false, signed);
}
exports.getByteArray = getByteArray;
/**
 * Helper function to return the smaller big int in an array
 * @param arrayOfBigInts
 */
function getMinBigInt(arrayOfBigInts) {
    if (arrayOfBigInts.length == 0) {
        return big_integer_1.default.zero;
    }
    if (arrayOfBigInts.length == 1) {
        return arrayOfBigInts[0];
    }
    let smallest = arrayOfBigInts[0];
    for (let i = 1; i < arrayOfBigInts.length; i++) {
        if (arrayOfBigInts[i] < smallest) {
            smallest = arrayOfBigInts[i];
        }
    }
    return smallest;
}
exports.getMinBigInt = getMinBigInt;
/**
 * returns a random int from min (inclusive) and max (inclusive)
 * @param min
 * @param max
 * @returns {number}
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInt = getRandomInt;
/**
 * Sleeps a specified amount of time
 * @param ms time in milliseconds
 * @returns {Promise}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
/**
 * Helper to export two buffers of same length
 * @returns {Buffer}
 */
function bufferXor(a, b) {
    const res = [];
    for (let i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i]);
    }
    return Buffer.from(res);
}
exports.bufferXor = bufferXor;
// Taken from https://stackoverflow.com/questions/18638900/javascript-crc32/18639999#18639999
function makeCRCTable() {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    return crcTable;
}
let crcTable = undefined;
function crc32(buf) {
    if (!crcTable) {
        crcTable = makeCRCTable();
    }
    if (!Buffer.isBuffer(buf)) {
        buf = Buffer.from(buf);
    }
    let crc = -1;
    for (let index = 0; index < buf.length; index++) {
        const byte = buf[index];
        crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
}
exports.crc32 = crc32;
class TotalList extends Array {
    constructor() {
        super();
        this.total = 0;
    }
}
exports.TotalList = TotalList;
exports._EntityType = {
    USER: 0,
    CHAT: 1,
    CHANNEL: 2,
};
Object.freeze(exports._EntityType);
function _entityType(entity) {
    if (typeof entity !== "object" || !("SUBCLASS_OF_ID" in entity)) {
        throw new Error(`${entity} is not a TLObject, cannot determine entity type`);
    }
    if (![
        0x2d45687,
        0xc91c90b6,
        0xe669bf46,
        0x40f202fd,
        0x2da17977,
        0xc5af5d94,
        0x1f4661b9,
        0xd49a2697, // crc32('ChatFull')
    ].includes(entity.SUBCLASS_OF_ID)) {
        throw new Error(`${entity} does not have any entity type`);
    }
    const name = entity.className;
    if (name.includes("User")) {
        return exports._EntityType.USER;
    }
    else if (name.includes("Chat")) {
        return exports._EntityType.CHAT;
    }
    else if (name.includes("Channel")) {
        return exports._EntityType.CHANNEL;
    }
    else if (name.includes("Self")) {
        return exports._EntityType.USER;
    }
    // 'Empty' in name or not found, we don't care, not a valid entity.
    throw new Error(`${entity} does not have any entity type`);
}
exports._entityType = _entityType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2dyYW1qcy9IZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUF5QztBQUN6Qyw4REFBaUM7QUFJcEIsUUFBQSxPQUFPLEdBQUcsd0JBQU0sQ0FBQztBQUM5QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsd0JBQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBRTlEOzs7Ozs7R0FNRztBQUNILFNBQWdCLG9CQUFvQixDQUNoQyxNQUFjLEVBQ2QsTUFBTSxHQUFHLElBQUksRUFDYixNQUFNLEdBQUcsS0FBSztJQUVkLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckMsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUN0QyxJQUFJLE1BQU0sRUFBRTtRQUNSLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckM7SUFDRCxJQUFJLFNBQVMsR0FBRyxxQkFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFzQixDQUFDO0lBRTVFLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksV0FBVyxFQUFFO1FBQ3ZFLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLHFCQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLHFCQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMxRTtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFoQkQsb0RBZ0JDO0FBRUQsU0FBZ0Isb0JBQW9CO0lBQ2hDLE9BQU8sb0JB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