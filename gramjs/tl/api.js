"use strict";
const { inspect } = require("util");
const bigInt = require("big-integer");
const { generateRandomBytes, readBigIntFromBuffer, isArrayLike, betterConsoleLog, } = require("../Helpers");
function generateRandomBigInt() {
    return readBigIntFromBuffer(generateRandomBytes(8), false, true);
}
const { parseTl, serializeBytes, serializeDate, } = require("./generationHelpers");
const { IS_NODE, toSignedLittleBuffer } = require("../Helpers");
let tlContent, schemeContent;
if (IS_NODE) {
    const fs = require("fs");
    tlContent = fs.readFileSync(__dirname + "/static/api.tl", "utf-8");
    schemeContent = fs.readFileSync(__dirname + "/static/schema.tl", "utf-8");
}
else {
    tlContent = require("!!raw-loader!./static/api.tl").default;
    schemeContent = require("!!raw-loader!./static/schema.tl").default;
}
const NAMED_AUTO_CASTS = new Set(["chatId,int"]);
const NAMED_BLACKLIST = new Set(["discardEncryption"]);
const AUTO_CASTS = new Set([
    "InputPeer",
    "InputChannel",
    "InputUser",
    "InputDialogPeer",
    "InputNotifyPeer",
    "InputMedia",
    "InputPhoto",
    "InputMessage",
    "InputDocument",
    "InputChatPhoto",
]);
class CastError extends Error {
    constructor(objectName, expected, actual, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        const message = "Found wrong type for " +
            objectName +
            ". expected " +
            expected +
            " but received " +
            actual +
            ".If you think this is a mistake please report it.";
        super(message, ...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CastError);
        }
        this.name = "CastError";
        // Custom debugging information
    }
}
const CACHING_SUPPORTED = typeof self !== "undefined" && self.localStorage !== undefined;
const CACHE_KEY = "GramJs:apiCache";
function buildApiFromTlSchema() {
    let definitions;
    const fromCache = CACHING_SUPPORTED && loadFromCache();
    if (fromCache) {
        definitions = fromCache;
    }
    else {
        definitions = loadFromTlSchemas();
        if (CACHING_SUPPORTED) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(definitions));
        }
    }
    return createClasses("all", definitions);
}
function loadFromCache() {
    const jsonCache = localStorage.getItem(CACHE_KEY);
    return jsonCache && JSON.parse(jsonCache);
}
function loadFromTlSchemas() {
    const [constructorParamsApi, functionParamsApi] = extractParams(tlContent);
    const [constructorParamsSchema, functionParamsSchema] = extractParams(schemeContent);
    const constructors = [].concat(constructorParamsApi, constructorParamsSchema);
    const requests = [].concat(functionParamsApi, functionParamsSchema);
    return [].concat(constructors, requests);
}
function extractParams(fileContent) {
    const f = parseTl(fileContent, 109);
    const constructors = [];
    const functions = [];
    for (const d of f) {
        d.isFunction ? functions.push(d) : constructors.push(d);
    }
    return [constructors, functions];
}
function argToBytes(x, type, argName, requestName) {
    switch (type) {
        case "int":
            const i = Buffer.alloc(4);
            i.writeInt32LE(x, 0);
            return i;
        case "long":
            return toSignedLittleBuffer(x, 8);
        case "int128":
            return toSignedLittleBuffer(x, 16);
        case "int256":
            return toSignedLittleBuffer(x, 32);
        case "double":
            const d = Buffer.alloc(8);
            d.writeDoubleLE(x, 0);
            return d;
        case "string":
            return serializeBytes(x);
        case "Bool":
            return x
                ? Buffer.from("b5757299", "hex")
                : Buffer.from("379779bc", "hex");
        case "true":
            return Buffer.alloc(0);
        case "bytes":
            return serializeBytes(x);
        case "date":
            return serializeDate(x);
        default:
            if (x === undefined || typeof x.getBytes !== "function") {
                throw new Error(`Required object ${argName} of ${requestName} is undefined`);
            }
            return x.getBytes();
    }
}
async function getInputFromResolve(utils, client, peer, peerType) {
    switch (peerType) {
        case "InputPeer":
            return utils.getInputPeer(await client.getInputEntity(peer));
        case "InputChannel":
            return utils.getInputChannel(await client.getInputEntity(peer));
        case "InputUser":
            return utils.getInputUser(await client.getInputEntity(peer));
        case "InputDialogPeer":
            return await client._getInputDialog(peer);
        case "InputNotifyPeer":
            return await client._getInputNotify(peer);
        case "InputMedia":
            return utils.getInputMedia(peer);
        case "InputPhoto":
            return utils.getInputPhoto(peer);
        case "InputMessage":
            return utils.getInputMessage(peer);
        case "InputDocument":
            return utils.getInputDocument(peer);
        case "InputChatPhoto":
            return utils.getInputChatPhoto(peer);
        case "chatId,int":
            return await client.getPeerId(peer, false);
        default:
            throw new Error("unsupported peer type : " + peerType);
    }
}
function getArgFromReader(reader, arg) {
    if (arg.isVector) {
        if (arg.useVectorId) {
            reader.readInt();
        }
        const temp = [];
        const len = reader.readInt();
        arg.isVector = false;
        for (let i = 0; i < len; i++) {
            temp.push(getArgFromReader(reader, arg));
        }
        arg.isVector = true;
        return temp;
    }
    else if (arg.flagIndicator) {
        return reader.readInt();
    }
    else {
        switch (arg.type) {
            case "int":
                return reader.readInt();
            case "long":
                return reader.readLong();
            case "int128":
                return reader.readLargeInt(128);
            case "int256":
                return reader.readLargeInt(256);
            case "double":
                return reader.readDouble();
            case "string":
                return reader.tgReadString();
            case "Bool":
                return reader.tgReadBool();
            case "true":
                return true;
            case "bytes":
                return reader.tgReadBytes();
            case "date":
                return reader.tgReadDate();
            default:
                if (!arg.skipConstructorId) {
                    return reader.tgReadObject();
                }
                else {
                    return api.constructors[arg.type].fromReader(reader);
                }
        }
    }
}
function compareType(value, type) {
    let correct = true;
    switch (type) {
        case "number":
            correct = typeof value === "number" || value === undefined;
            break;
        case "string":
        case "boolean":
            correct = typeof value === type;
            break;
        case "bigInt":
            correct =
                bigInt.isInstance(value) ||
                    typeof value === "bigint" ||
                    value === undefined;
            break;
        case "true":
            // true value is always correct
            break;
        case "buffer":
            correct = Buffer.isBuffer(value);
            break;
        case "date":
            correct =
                (value &&
                    Object.prototype.toString.call(value) === "[object Date]" &&
                    !isNaN(value)) ||
                    typeof value === "number";
            break;
        default:
            console.error(new Error("Unknown type." + type));
    }
    return correct;
}
function createClasses(classesType, params) {
    const classes = {};
    for (const classParams of params) {
        const { name, constructorId, subclassOfId, argsConfig, namespace, isFunction, result, } = classParams;
        const fullName = [namespace, name].join(".").replace(/^\./, "");
        class VirtualClass {
            constructor(args) {
                this.CONSTRUCTOR_ID = constructorId;
                this.SUBCLASS_OF_ID = subclassOfId;
                this.className = fullName;
                this.classType = isFunction ? "request" : "constructor";
                args = args || {};
                this.originalArgs = args;
                this.init(args);
                for (const argName in argsConfig) {
                    if (argName === "randomId" && !args[argName]) {
                        if (argsConfig[argName].isVector) {
                            const rands = [];
                            for (let i = 0; i < args["id"].length; i++) {
                                rands.push(generateRandomBigInt());
                            }
                            this[argName] = rands;
                        }
                        else {
                            this[argName] = generateRandomBigInt();
                        }
                    }
                    else {
                        this[argName] = args[argName];
                    }
                }
            }
            init(args) { }
            static fromReader(reader) {
                const args = {};
                for (const argName in argsConfig) {
                    if (argsConfig.hasOwnProperty(argName)) {
                        const arg = argsConfig[argName];
                        if (arg.isFlag) {
                            if (arg.type === "true") {
                                args[argName] = Boolean(args["flags"] & (1 << arg.flagIndex));
                                continue;
                            }
                            if (args["flags"] & (1 << arg.flagIndex)) {
                                args[argName] = getArgFromReader(reader, arg);
                            }
                            else {
                                args[argName] = null;
                            }
                        }
                        else {
                            if (arg.flagIndicator) {
                                arg.name = "flags";
                            }
                            args[argName] = getArgFromReader(reader, arg);
                        }
                    }
                }
                return new this(args);
            }
            validate() {
                for (const arg in argsConfig) {
                    if (argsConfig.hasOwnProperty(arg)) {
                        if (arg === "flags" || argsConfig[arg].isFlag) {
                            // we don't care about flags
                            continue;
                        }
                        const currentValue = this[arg];
                        this.assertType(arg, argsConfig[arg], currentValue);
                    }
                }
            }
            assertType(objectName, object, value) {
                let expected;
                if (object["isVector"]) {
                    if (!isArrayLike(value)) {
                        console.error(new CastError(objectName, "array", value));
                    }
                    if (value == undefined) {
                        value = [];
                    }
                    for (const o of value) {
                        this.assertType(objectName, Object.assign(Object.assign({}, object), { isVector: false }), o);
                    }
                }
                else {
                    switch (object["type"]) {
                        case "int":
                            expected = "number";
                            break;
                        case "long":
                        case "int128":
                        case "int256":
                            expected = "bigInt";
                            break;
                        case "double":
                            expected = "number";
                            break;
                        case "string":
                            expected = "string";
                            break;
                        case "Bool":
                            expected = "boolean";
                            break;
                        case "true":
                            expected = "true";
                            break;
                        case "bytes":
                            expected = "buffer";
                            break;
                        case "date":
                            expected = "date";
                            break;
                        default:
                            expected = "object";
                    }
                    if (expected === "object") {
                        // will be validated in get byte();
                    }
                    else {
                        const isCorrectType = compareType(value, expected);
                        if (isCorrectType !== true) {
                            console.error(new CastError(objectName, expected, value));
                        }
                    }
                }
            }
            getBytes() {
                try {
                    this.validate();
                }
                catch (e) {
                    // feature still in alpha so errors are expected.
                }
                const idForBytes = this.CONSTRUCTOR_ID;
                const c = Buffer.alloc(4);
                c.writeUInt32LE(idForBytes, 0);
                const buffers = [c];
                for (const arg in argsConfig) {
                    if (argsConfig.hasOwnProperty(arg)) {
                        if (argsConfig[arg].isFlag) {
                            if (this[arg] === false ||
                                this[arg] === null ||
                                this[arg] === undefined ||
                                argsConfig[arg].type === "true") {
                                continue;
                            }
                        }
                        if (argsConfig[arg].isVector) {
                            if (argsConfig[arg].useVectorId) {
                                buffers.push(Buffer.from("15c4b51c", "hex"));
                            }
                            const l = Buffer.alloc(4);
                            l.writeInt32LE(this[arg].length, 0);
                            buffers.push(l, Buffer.concat(this[arg].map((x) => argToBytes(x, argsConfig[arg].type, fullName))));
                        }
                        else if (argsConfig[arg].flagIndicator) {
                            if (!Object.values(argsConfig).some((f) => f.isFlag)) {
                                buffers.push(Buffer.alloc(4));
                            }
                            else {
                                let flagCalculate = 0;
                                for (const f in argsConfig) {
                                    if (argsConfig[f].isFlag) {
                                        if (this[f] === false ||
                                            this[f] === undefined ||
                                            this[f] === null) {
                                            flagCalculate |= 0;
                                        }
                                        else {
                                            flagCalculate |=
                                                1 << argsConfig[f].flagIndex;
                                        }
                                    }
                                }
                                const f = Buffer.alloc(4);
                                f.writeUInt32LE(flagCalculate, 0);
                                buffers.push(f);
                            }
                        }
                        else {
                            buffers.push(argToBytes(this[arg], argsConfig[arg].type, arg, fullName));
                            if (this[arg] &&
                                typeof this[arg].getBytes === "function") {
                                let boxed = argsConfig[arg].type.charAt(argsConfig[arg].type.indexOf(".") + 1);
                                boxed = boxed === boxed.toUpperCase();
                                if (!boxed) {
                                    buffers.shift();
                                }
                            }
                        }
                    }
                }
                return Buffer.concat(buffers);
            }
            readResult(reader) {
                if (!isFunction) {
                    throw new Error("`readResult()` called for non-request instance");
                }
                const m = result.match(/Vector<(int|long)>/);
                if (m) {
                    reader.readInt();
                    const temp = [];
                    const len = reader.readInt();
                    if (m[1] === "int") {
                        for (let i = 0; i < len; i++) {
                            temp.push(reader.readInt());
                        }
                    }
                    else {
                        for (let i = 0; i < len; i++) {
                            temp.push(reader.readLong());
                        }
                    }
                    return temp;
                }
                else {
                    return reader.tgReadObject();
                }
            }
            async resolve(client, utils) {
                if (!isFunction) {
                    throw new Error("`resolve()` called for non-request instance");
                }
                for (const arg in argsConfig) {
                    if (argsConfig.hasOwnProperty(arg)) {
                        if (!AUTO_CASTS.has(argsConfig[arg].type)) {
                            if (!NAMED_AUTO_CASTS.has(`${argsConfig[arg].name},${argsConfig[arg].type}`)) {
                                continue;
                            }
                        }
                        if (argsConfig[arg].isFlag) {
                            if (!this[arg]) {
                                continue;
                            }
                        }
                        if (argsConfig[arg].isVector) {
                            const temp = [];
                            for (const x of this[arg]) {
                                temp.push(await getInputFromResolve(utils, client, x, argsConfig[arg].type));
                            }
                            this[arg] = temp;
                        }
                        else {
                            this[arg] = await getInputFromResolve(utils, client, this[arg], argsConfig[arg].type);
                        }
                    }
                }
            }
            [inspect.custom]() {
                return betterConsoleLog(this);
            }
            toJSON() {
                return this.originalArgs;
            }
        }
        VirtualClass.CONSTRUCTOR_ID = constructorId;
        VirtualClass.SUBCLASS_OF_ID = subclassOfId;
        VirtualClass.className = fullName;
        VirtualClass.classType = isFunction ? "request" : "constructor";
        if (namespace) {
            if (!classes[namespace]) {
                classes[namespace] = {};
            }
            classes[namespace][name] = VirtualClass;
        }
        else {
            classes[name] = VirtualClass;
        }
    }
    return classes;
}
const api = buildApiFromTlSchema();
module.exports = { Api: api };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL3RsL2FwaS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFdEMsTUFBTSxFQUNGLG1CQUFtQixFQUNuQixvQkFBb0IsRUFDcEIsV0FBVyxFQUNYLGdCQUFnQixHQUNuQixHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUUxQixTQUFTLG9CQUFvQjtJQUN6QixPQUFPLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRUQsTUFBTSxFQUNGLE9BQU8sRUFDUCxjQUFjLEVBQ2QsYUFBYSxHQUNoQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDaEUsSUFBSSxTQUFTLEVBQUUsYUFBYSxDQUFDO0FBQzdCLElBQUksT0FBTyxFQUFFO0lBQ1QsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXpCLFNBQVMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRSxhQUFhLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDN0U7S0FBTTtJQUNILFNBQVMsR0FBRyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDNUQsYUFBYSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFD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