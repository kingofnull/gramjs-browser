"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisplayName = exports.rtrim = exports.parseUsername = exports.resolveInviteLink = exports.parsePhone = exports.getMessageId = exports.resolveId = exports.getPeerId = exports.sanitizeParseMode = exports.getPeer = exports.getAppropriatedPartSize = exports.getInputMedia = exports.getInputGeo = exports.getAttributes = exports.getExtension = exports.isImage = exports.isAudio = exports.getInputDocument = exports.getInputPhoto = exports.strippedPhotoToJpg = exports.getInputChatPhoto = exports.getInputMessage = exports.getInputUser = exports.getInputChannel = exports.getInnerText = exports._getEntityPair = exports._photoSizeByteCount = exports.getInputPeer = exports.chunks = void 0;
const tl_1 = require("./tl");
const big_integer_1 = __importDefault(require("big-integer"));
const mime_types_1 = __importDefault(require("mime-types"));
const markdown_1 = require("./extensions/markdown");
/**
 * Turns the given iterable into chunks of the specified size,
 * which is 100 by default since that's what Telegram uses the most.
 */
function* chunks(arr, size = 100) {
    for (let i = 0; i < arr.length; i += size) {
        yield arr.slice(i, i + size);
    }
}
exports.chunks = chunks;
const html_1 = require("./extensions/html");
const USERNAME_RE = new RegExp("@|(?:https?:\\/\\/)?(?:www\\.)?" +
    "(?:telegram\\.(?:me|dog)|t\\.me)\\/(@|joinchat\\/)?", "i");
const JPEG_HEADER = Buffer.from("ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e19282321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a0aadaad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2d2d3c353c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc00011080000000003012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00", "hex");
const JPEG_FOOTER = Buffer.from("ffd9", "hex");
const TG_JOIN_RE = new RegExp("tg:\\/\\/(join)\\?invite=", "i");
const VALID_USERNAME_RE = new RegExp("^([a-z]((?!__)[\\w\\d]){3,30}[a-z\\d]|gif|vid|" +
    "pic|bing|wiki|imdb|bold|vote|like|coub)$", "i");
function _raiseCastFail(entity, target) {
    let toWrite = entity;
    if (typeof entity === "object" && "className" in entity) {
        toWrite = entity.className;
    }
    throw new Error(`Cannot cast ${toWrite} to any kind of ${target}`);
}
/**
 Gets the input peer for the given "entity" (user, chat or channel).

 A ``TypeError`` is raised if the given entity isn't a supported type
 or if ``check_hash is True`` but the entity's ``accessHash is None``
 *or* the entity contains ``min`` information. In this case, the hash
 cannot be used for general purposes, and thus is not returned to avoid
 any issues which can derive from invalid access hashes.

 Note that ``checkHash`` **is ignored** if an input peer is already
 passed since in that case we assume the user knows what they're doing.
 This is key to getting entities by explicitly passing ``hash = 0``.

 * @param entity
 * @param allowSelf
 * @param checkHash
 */
function getInputPeer(entity, allowSelf = true, checkHash = true) {
    if (entity.SUBCLASS_OF_ID === undefined) {
        // e.g. custom.Dialog (can't cyclic import).
        if (allowSelf && "inputEntity" in entity) {
            return entity.inputEntity;
        }
        else if ("entity" in entity) {
            return getInputPeer(entity.entity);
        }
        else {
            _raiseCastFail(entity, "InputPeer");
        }
    }
    if (entity.SUBCLASS_OF_ID === 0xc91c90b6) {
        // crc32(b'InputPeer')
        return entity;
    }
    if (entity instanceof tl_1.Api.User) {
        if (entity.self && allowSelf) {
            return new tl_1.Api.InputPeerSelf();
        }
        else if ((entity.accessHash !== undefined && !entity.min) ||
            !checkHash) {
            return new tl_1.Api.InputPeerUser({
                userId: entity.id,
                accessHash: entity.accessHash || big_integer_1.default(0),
            });
        }
        else {
            throw new Error("User without accessHash or min cannot be input");
        }
    }
    if (entity instanceof tl_1.Api.Chat ||
        entity instanceof tl_1.Api.ChatEmpty ||
        entity instanceof tl_1.Api.ChatForbidden) {
        return new tl_1.Api.InputPeerChat({ chatId: entity.id });
    }
    if (entity instanceof tl_1.Api.Channel) {
        if ((entity.accessHash !== undefined && !entity.min) || !checkHash) {
            return new tl_1.Api.InputPeerChannel({
                channelId: entity.id,
                accessHash: entity.accessHash || big_integer_1.default(0),
            });
        }
        else {
            throw new TypeError("Channel without accessHash or min info cannot be input");
        }
    }
    if (entity instanceof tl_1.Api.ChannelForbidden) {
        // "channelForbidden are never min", and since their hash is
        // also not optional, we assume that this truly is the case.
        return new tl_1.Api.InputPeerChannel({
            channelId: entity.id,
            accessHash: entity.accessHash,
        });
    }
    if (entity instanceof tl_1.Api.InputUser) {
        return new tl_1.Api.InputPeerUser({
            userId: entity.userId,
            accessHash: entity.accessHash,
        });
    }
    if (entity instanceof tl_1.Api.InputChannel) {
        return new tl_1.Api.InputPeerChannel({
            channelId: entity.channelId,
            accessHash: entity.accessHash,
        });
    }
    if (entity instanceof tl_1.Api.UserEmpty) {
        return new tl_1.Api.InputPeerEmpty();
    }
    if (entity instanceof tl_1.Api.UserFull) {
        return getInputPeer(entity.user);
    }
    if (entity instanceof tl_1.Api.ChatFull) {
        return new tl_1.Api.InputPeerChat({ chatId: entity.id });
    }
    if (entity instanceof tl_1.Api.PeerChat) {
        return new tl_1.Api.InputPeerChat({
            chatId: entity.chatId,
        });
    }
    _raiseCastFail(entity, "InputPeer");
}
exports.getInputPeer = getInputPeer;
function _photoSizeByteCount(size) {
    if (size instanceof tl_1.Api.PhotoSize) {
        return size.size;
    }
    else if (size instanceof tl_1.Api.PhotoStrippedSize) {
        if (size.bytes.length < 3 || size.bytes[0] != 1) {
            return size.bytes.length;
        }
        return size.bytes.length + 622;
    }
    else if (size instanceof tl_1.Api.PhotoCachedSize) {
        return size.bytes.length;
    }
    else if (size instanceof tl_1.Api.PhotoSizeEmpty) {
        return 0;
    }
    else {
        return undefined;
    }
}
exports._photoSizeByteCount = _photoSizeByteCount;
function _getEntityPair(entityId, entities, cache, getInputPeerFunction = getInputPeer) {
    const entity = entities.get(entityId);
    let inputEntity;
    try {
        inputEntity = cache.get(entityId);
    }
    catch (e) {
        try {
            inputEntity = getInputPeerFunction(inputEntity);
        }
        catch (e) { }
    }
    return [entity, inputEntity];
}
exports._getEntityPair = _getEntityPair;
function getInnerText(text, entities) {
    const result = [];
    entities.forEach(function (value, key) {
        const start = value.offset;
        const end = value.offset + value.length;
        result.push(text.slice(start, end));
    });
    return result;
}
exports.getInnerText = getInnerText;
/**
 Similar to :meth:`get_input_peer`, but for :tl:`InputChannel`'s alone.

 .. important::

 This method does not validate for invalid general-purpose access
 hashes, unlike `get_input_peer`. Consider using instead:
 ``get_input_channel(get_input_peer(channel))``.

 * @param entity
 * @returns {InputChannel|*}
 */
function getInputChannel(entity) {
    if (typeof entity === "string" || typeof entity == "number") {
        _raiseCastFail(entity, "InputChannel");
    }
    if (entity.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(entity, "InputChannel");
    }
    if (entity.SUBCLASS_OF_ID === 0x40f202fd) {
        // crc32(b'InputChannel')
        return entity;
    }
    if (entity instanceof tl_1.Api.Channel ||
        entity instanceof tl_1.Api.ChannelForbidden) {
        return new tl_1.Api.InputChannel({
            channelId: entity.id,
            accessHash: entity.accessHash || big_integer_1.default.zero,
        });
    }
    if (entity instanceof tl_1.Api.InputPeerChannel) {
        return new tl_1.Api.InputChannel({
            channelId: entity.channelId,
            accessHash: entity.accessHash,
        });
    }
    _raiseCastFail(entity, "InputChannel");
}
exports.getInputChannel = getInputChannel;
/**
 Similar to :meth:`getInputPeer`, but for :tl:`InputUser`'s alone.

 .. important::

 This method does not validate for invalid general-purpose access
 hashes, unlike `get_input_peer`. Consider using instead:
 ``get_input_channel(get_input_peer(channel))``.

 * @param entity
 */
function getInputUser(entity) {
    if (typeof entity === "string" || typeof entity == "number") {
        _raiseCastFail(entity, "InputUser");
    }
    if (entity.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(entity, "InputUser");
    }
    if (entity.SUBCLASS_OF_ID === 0xe669bf46) {
        // crc32(b'InputUser')
        return entity;
    }
    if (entity instanceof tl_1.Api.User) {
        if (entity.self) {
            return new tl_1.Api.InputUserSelf();
        }
        else {
            return new tl_1.Api.InputUser({
                userId: entity.id,
                accessHash: entity.accessHash || big_integer_1.default.zero,
            });
        }
    }
    if (entity instanceof tl_1.Api.InputPeerSelf) {
        return new tl_1.Api.InputUserSelf();
    }
    if (entity instanceof tl_1.Api.UserEmpty ||
        entity instanceof tl_1.Api.InputPeerEmpty) {
        return new tl_1.Api.InputUserEmpty();
    }
    if (entity instanceof tl_1.Api.UserFull) {
        return getInputUser(entity.user);
    }
    if (entity instanceof tl_1.Api.InputPeerUser) {
        return new tl_1.Api.InputUser({
            userId: entity.userId,
            accessHash: entity.accessHash,
        });
    }
    _raiseCastFail(entity, "InputUser");
}
exports.getInputUser = getInputUser;
/**
 Similar to :meth:`get_input_peer`, but for dialogs
 * @param dialog
 */
/*CONTEST
function getInputDialog(dialog) {
    try {
        if (dialog.SUBCLASS_OF_ID === 0xa21c9795) { // crc32(b'InputDialogPeer')
            return dialog
        }
        if (dialog.SUBCLASS_OF_ID === 0xc91c90b6) { // crc32(b'InputPeer')
            return new Api.InputDialogPeer({ peer: dialog })
        }
    } catch (e) {
        _raiseCastFail(dialog, 'InputDialogPeer')
    }

    try {
        return new Api.InputDialogPeer(getInputPeer(dialog))
        // eslint-disable-next-line no-empty
    } catch (e) {

    }
    _raiseCastFail(dialog, 'InputDialogPeer')
}
*/
/**
 *  Similar to :meth:`get_input_peer`, but for input messages.
 */
function getInputMessage(message) {
    if (typeof message === "number") {
        return new tl_1.Api.InputMessageID({ id: message });
    }
    if (message === undefined || message.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(message, "InputMessage");
    }
    if (message.SUBCLASS_OF_ID === 0x54b6bcc5) {
        // crc32(b'InputMessage')
        return message;
    }
    else if (message.SUBCLASS_OF_ID === 0x790009e3) {
        // crc32(b'Message'):
        return new tl_1.Api.InputMessageID({ id: message.id });
    }
    _raiseCastFail(message, "InputMessage");
}
exports.getInputMessage = getInputMessage;
/**
 *  Similar to :meth:`get_input_peer`, but for input messages.
 */
function getInputChatPhoto(photo) {
    if (photo === undefined || photo.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(photo, "InputChatPhoto");
    }
    if (photo.SUBCLASS_OF_ID === 0xd4eb2d74) {
        //crc32(b'InputChatPhoto')
        return photo;
    }
    else if (photo.SUBCLASS_OF_ID === 0xe7655f1f) {
        // crc32(b'InputFile'):
        return new tl_1.Api.InputChatUploadedPhoto({
            file: photo,
        });
    }
    photo = getInputPhoto(photo);
    if (photo instanceof tl_1.Api.InputPhoto) {
        return new tl_1.Api.InputChatPhoto({
            id: photo,
        });
    }
    else if (photo instanceof tl_1.Api.InputPhotoEmpty) {
        return new tl_1.Api.InputChatPhotoEmpty();
    }
    _raiseCastFail(photo, "InputChatPhoto");
}
exports.getInputChatPhoto = getInputChatPhoto;
/**
 * Adds the JPG header and footer to a stripped image.
 * Ported from https://github.com/telegramdesktop/tdesktop/blob/bec39d89e19670eb436dc794a8f20b657cb87c71/Telegram/SourceFiles/ui/image/image.cpp#L225

 * @param stripped{Buffer}
 * @returns {Buffer}
 */
function strippedPhotoToJpg(stripped) {
    // Note: Changes here should update _stripped_real_length
    if (stripped.length < 3 || stripped[0] !== 1) {
        return stripped;
    }
    const header = Buffer.from(JPEG_HEADER);
    header[164] = stripped[1];
    header[166] = stripped[2];
    return Buffer.concat([header, stripped.slice(3), JPEG_FOOTER]);
}
exports.strippedPhotoToJpg = strippedPhotoToJpg;
/*CONTEST
function getInputLocation(location) {
    try {
        if (!location.SUBCLASS_OF_ID) {
            throw new Error()
        }
        if (location.SUBCLASS_OF_ID === 0x1523d462) {
            return {
                dcId: null,
                inputLocation: location
            }
        }
    } catch (e) {
        _raiseCastFail(location, 'InputFileLocation')
    }
    if (location instanceof Api.Message) {
        location = location.media
    }

    if (location instanceof Api.MessageMediaDocument) {
        location = location.document
    } else if (location instanceof Api.MessageMediaPhoto) {
        location = location.photo
    }

    if (location instanceof Api.Document) {
        return {
            dcId: location.dcId,
            inputLocation: new Api.InputDocumentFileLocation({
                id: location.id,
                accessHash: location.accessHash,
                fileReference: location.fileReference,
                thumbSize: '', // Presumably to download one of its thumbnails
            }),
        }
    } else if (location instanceof Api.Photo) {
        return {
            dcId: location.dcId,
            inputLocation: new Api.InputPhotoFileLocation({
                id: location.id,
                accessHash: location.accessHash,
                fileReference: location.fileReference,
                thumbSize: location.sizes[location.sizes.length - 1].type,
            }),
        }
    }

    if (location instanceof Api.FileLocationToBeDeprecated) {
        throw new Error('Unavailable location cannot be used as input')
    }
    _raiseCastFail(location, 'InputFileLocation')
}
*/
/**
 *  Similar to :meth:`get_input_peer`, but for photos
 */
function getInputPhoto(photo) {
    if (photo.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(photo, "InputPhoto");
    }
    if (photo.SUBCLASS_OF_ID === 2221106144) {
        return photo;
    }
    if (photo instanceof tl_1.Api.Message) {
        photo = photo.media;
    }
    if (photo instanceof tl_1.Api.photos.Photo ||
        photo instanceof tl_1.Api.MessageMediaPhoto) {
        photo = photo.photo;
    }
    if (photo instanceof tl_1.Api.Photo) {
        return new tl_1.Api.InputPhoto({
            id: photo.id,
            accessHash: photo.accessHash,
            fileReference: photo.fileReference,
        });
    }
    if (photo instanceof tl_1.Api.PhotoEmpty) {
        return new tl_1.Api.InputPhotoEmpty();
    }
    if (photo instanceof tl_1.Api.messages.ChatFull) {
        photo = photo.fullChat;
    }
    if (photo instanceof tl_1.Api.ChannelFull) {
        return getInputPhoto(photo.chatPhoto);
    }
    else {
        if (photo instanceof tl_1.Api.UserFull) {
            return getInputPhoto(photo.profilePhoto);
        }
        else {
            if (photo instanceof tl_1.Api.Channel ||
                photo instanceof tl_1.Api.Chat ||
                photo instanceof tl_1.Api.User) {
                return getInputPhoto(photo.photo);
            }
        }
    }
    if (photo instanceof tl_1.Api.UserEmpty ||
        photo instanceof tl_1.Api.ChatEmpty ||
        photo instanceof tl_1.Api.ChatForbidden ||
        photo instanceof tl_1.Api.ChannelForbidden) {
        return new tl_1.Api.InputPhotoEmpty();
    }
    _raiseCastFail(photo, "InputPhoto");
}
exports.getInputPhoto = getInputPhoto;
/**
 *  Similar to :meth:`get_input_peer`, but for documents
 */
function getInputDocument(document) {
    if (document.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(document, "InputDocument");
    }
    if (document.SUBCLASS_OF_ID === 0xf33fdb68) {
        return document;
    }
    if (document instanceof tl_1.Api.Document) {
        return new tl_1.Api.InputDocument({
            id: document.id,
            accessHash: document.accessHash,
            fileReference: document.fileReference,
        });
    }
    if (document instanceof tl_1.Api.DocumentEmpty) {
        return new tl_1.Api.InputDocumentEmpty();
    }
    if (document instanceof tl_1.Api.MessageMediaDocument) {
        return getInputDocument(document.document);
    }
    if (document instanceof tl_1.Api.Message) {
        return getInputDocument(document.media);
    }
    _raiseCastFail(document, "InputDocument");
}
exports.getInputDocument = getInputDocument;
/**
 *  Returns `True` if the file has an audio mime type.
 */
function isAudio(file) {
    const ext = _getExtension(file);
    if (!ext) {
        const metadata = _getMetadata(file);
        return (metadata.get("mimeType") || "").startsWith("audio/");
    }
    else {
        file = "a" + ext;
        return (mime_types_1.default.lookup(file) || "").startsWith("audio/");
    }
}
exports.isAudio = isAudio;
/**
 *  Returns `True` if the file has an image mime type.
 */
function isImage(file) {
    const ext = _getExtension(file).toLowerCase();
    return (ext.endsWith(".png") || ext.endsWith(".jpg") || ext.endsWith(".jpeg"));
}
exports.isImage = isImage;
function getExtension(media) {
    // Photos are always compressed as .jpg by Telegram
    try {
        getInputPhoto(media);
        return ".jpg";
    }
    catch (e) { }
    if (media instanceof tl_1.Api.UserProfilePhoto ||
        media instanceof tl_1.Api.ChatPhoto) {
        return ".jpg";
    }
    if (media instanceof tl_1.Api.MessageMediaDocument) {
        media = media.document;
    }
    if (media instanceof tl_1.Api.Document ||
        media instanceof tl_1.Api.WebDocument ||
        media instanceof tl_1.Api.WebDocumentNoProxy) {
        if (media.mimeType === "application/octet-stream") {
            // Octet stream are just bytes, which have no default extension
            return "";
        }
        else {
            return mime_types_1.default.extension(media.mimeType) || "";
        }
    }
    return "";
}
exports.getExtension = getExtension;
/**
 * Gets the extension for the given file, which can be either a
 * str or an ``open()``'ed file (which has a ``.name`` attribute).
 */
function _getExtension(file) {
    var kind;
    if (typeof file === "string") {
        // thanks Stackoverflow
        return file.slice(((file.lastIndexOf(".") - 2) >>> 0) + 2);
    }
    else if ("name" in file) {
        return _getExtension(file.name);
    }
    else {
        return getExtension(file);
    }
}
function _getMetadata(file) {
    //TODO Return nothing for now until we find a better way
    return new Map();
}
function isVideo(file) {
    var _a;
    const ext = _getExtension(file);
    if (!ext) {
        const metadata = _getMetadata(file);
        if (metadata.has("mimeType")) {
            return ((_a = metadata.get("mimeType")) === null || _a === void 0 ? void 0 : _a.startsWith("video/")) || false;
        }
        else {
            return false;
        }
    }
    else {
        file = "a" + ext;
        return (mime_types_1.default.lookup(file) || "").startsWith("video/");
    }
}
/**
 Get a list of attributes for the given file and
 the mime type as a tuple ([attribute], mime_type).
 */
function getAttributes(file, { attributes = null, mimeType = undefined, forceDocument = false, voiceNote = false, videoNote = false, supportsStreaming = false, thumb = null, }) {
    var _a, _b, _c, _d;
    const name = typeof file == "string" ? file : file.name || "unnamed";
    if (mimeType === undefined) {
        mimeType = mime_types_1.default.lookup(name) || "application/octet-stream";
    }
    const attrObj = new Map();
    attrObj.set(tl_1.Api.DocumentAttributeFilename, new tl_1.Api.DocumentAttributeFilename({
        fileName: name.split(/[\\/]/).pop() || "",
    }));
    if (isAudio(file)) {
        const m = _getMetadata(file);
        attrObj.set(tl_1.Api.DocumentAttributeAudio, new tl_1.Api.DocumentAttributeAudio({
            voice: voiceNote,
            title: m.has("title") ? m.get("title") : undefined,
            performer: m.has("author") ? m.get("author") : undefined,
            duration: Number.parseInt((_a = m.get("duration")) !== null && _a !== void 0 ? _a : "0"),
        }));
    }
    if (!forceDocument && isVideo(file)) {
        let doc;
        if (thumb) {
            const t_m = _getMetadata(thumb);
            const width = Number.parseInt((t_m === null || t_m === void 0 ? void 0 : t_m.get("width")) || "1");
            const height = Number.parseInt((t_m === null || t_m === void 0 ? void 0 : t_m.get("height")) || "1");
            doc = new tl_1.Api.DocumentAttributeVideo({
                duration: 0,
                h: height,
                w: width,
                roundMessage: videoNote,
                supportsStreaming: supportsStreaming,
            });
        }
        else {
            const m = _getMetadata(file);
            doc = new tl_1.Api.DocumentAttributeVideo({
                roundMessage: videoNote,
                w: Number.parseInt((_b = m.get("width")) !== null && _b !== void 0 ? _b : "1"),
                h: Number.parseInt((_c = m.get("height")) !== null && _c !== void 0 ? _c : "1"),
                duration: Number.parseInt((_d = m.get("duration")) !== null && _d !== void 0 ? _d : "0"),
                supportsStreaming: supportsStreaming,
            });
        }
        attrObj.set(tl_1.Api.DocumentAttributeVideo, doc);
    }
    if (videoNote) {
        if (attrObj.has(tl_1.Api.DocumentAttributeAudio)) {
            attrObj.get(tl_1.Api.DocumentAttributeAudio).voice = true;
        }
        else {
            attrObj.set(tl_1.Api.DocumentAttributeAudio, new tl_1.Api.DocumentAttributeAudio({
                duration: 0,
                voice: true,
            }));
        }
    }
    /* Now override the attributes if any. As we have a dict of
    {cls: instance}, we can override any class with the list
     of attributes provided by the user easily.
    */
    if (attributes) {
        for (const a of attributes) {
            attrObj.set(a.constructor, a);
        }
    }
    return {
        attrs: Array.from(attrObj.values()),
        mimeType: mimeType,
    };
}
exports.getAttributes = getAttributes;
/**
 *  Similar to :meth:`get_input_peer`, but for geo points
 */
function getInputGeo(geo) {
    if (geo === undefined || geo.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(geo, "InputGeoPoint");
    }
    if (geo.SUBCLASS_OF_ID === 0x430d225) {
        // crc32(b'InputGeoPoint'):
        return geo;
    }
    if (geo instanceof tl_1.Api.GeoPoint) {
        return new tl_1.Api.InputGeoPoint({ lat: geo.lat, long: geo.long });
    }
    if (geo instanceof tl_1.Api.GeoPointEmpty) {
        return new tl_1.Api.InputGeoPointEmpty();
    }
    if (geo instanceof tl_1.Api.MessageMediaGeo) {
        return getInputGeo(geo.geo);
    }
    if (geo instanceof tl_1.Api.Message) {
        return getInputGeo(geo.media);
    }
    _raiseCastFail(geo, "InputGeoPoint");
}
exports.getInputGeo = getInputGeo;
/**
 *
 Similar to :meth:`get_input_peer`, but for media.

 If the media is :tl:`InputFile` and ``is_photo`` is known to be `True`,
 it will be treated as an :tl:`InputMediaUploadedPhoto`. Else, the rest
 of parameters will indicate how to treat it.
 * @param media
 * @param isPhoto - whether it's a photo or not
 * @param attributes
 * @param forceDocument
 * @param voiceNote
 * @param videoNote
 * @param supportsStreaming
 */
function getInputMedia(media, { isPhoto = false, attributes = undefined, forceDocument = false, voiceNote = false, videoNote = false, supportsStreaming = false, } = {}) {
    if (media.SUBCLASS_OF_ID === undefined) {
        _raiseCastFail(media, "InputMedia");
    }
    if (media.SUBCLASS_OF_ID === 0xfaf846f4) {
        // crc32(b'InputMedia')
        return media;
    }
    else {
        if (media.SUBCLASS_OF_ID === 2221106144) {
            // crc32(b'InputPhoto')
            return new tl_1.Api.InputMediaPhoto({ id: media });
        }
        else {
            if (media.SUBCLASS_OF_ID === 4081048424) {
                // crc32(b'InputDocument')
                return new tl_1.Api.InputMediaDocument({ id: media });
            }
        }
    }
    if (media instanceof tl_1.Api.MessageMediaPhoto) {
        return new tl_1.Api.InputMediaPhoto({
            id: getInputPhoto(media.photo),
            ttlSeconds: media.ttlSeconds,
        });
    }
    if (media instanceof tl_1.Api.Photo ||
        media instanceof tl_1.Api.photos.Photo ||
        media instanceof tl_1.Api.PhotoEmpty) {
        return new tl_1.Api.InputMediaPhoto({ id: getInputPhoto(media) });
    }
    if (media instanceof tl_1.Api.MessageMediaDocument) {
        return new tl_1.Api.InputMediaDocument({
            id: getInputDocument(media.document),
            ttlSeconds: media.ttlSeconds,
        });
    }
    if (media instanceof tl_1.Api.Document || media instanceof tl_1.Api.DocumentEmpty) {
        return new tl_1.Api.InputMediaDocument({ id: getInputDocument(media) });
    }
    if (media instanceof tl_1.Api.InputFile || media instanceof tl_1.Api.InputFileBig) {
        if (isPhoto) {
            return new tl_1.Api.InputMediaUploadedPhoto({ file: media });
        }
        else {
            const { attrs, mimeType } = getAttributes(media, {
                attributes: attributes,
                forceDocument: forceDocument,
                voiceNote: voiceNote,
                videoNote: videoNote,
                supportsStreaming: supportsStreaming,
            });
            return new tl_1.Api.InputMediaUploadedDocument({
                file: media,
                mimeType: mimeType,
                attributes: attrs,
                forceFile: forceDocument,
            });
        }
    }
    if (media instanceof tl_1.Api.MessageMediaGame) {
        return new tl_1.Api.InputMediaGame({
            id: new tl_1.Api.InputGameID({
                id: media.game.id,
                accessHash: media.game.accessHash,
            }),
        });
    }
    if (media instanceof tl_1.Api.MessageMediaContact) {
        return new tl_1.Api.InputMediaContact({
            phoneNumber: media.phoneNumber,
            firstName: media.firstName,
            lastName: media.lastName,
            vcard: "",
        });
    }
    if (media instanceof tl_1.Api.MessageMediaGeo) {
        return new tl_1.Api.InputMediaGeoPoint({ geoPoint: getInputGeo(media.geo) });
    }
    if (media instanceof tl_1.Api.MessageMediaVenue) {
        return new tl_1.Api.InputMediaVenue({
            geoPoint: getInputGeo(media.geo),
            title: media.title,
            address: media.address,
            provider: media.provider,
            venueId: media.venueId,
            venueType: "",
        });
    }
    if (media instanceof tl_1.Api.MessageMediaDice) {
        return new tl_1.Api.InputMediaDice({
            emoticon: media.emoticon,
        });
    }
    if (media instanceof tl_1.Api.MessageMediaEmpty ||
        media instanceof tl_1.Api.MessageMediaUnsupported ||
        media instanceof tl_1.Api.ChatPhotoEmpty ||
        media instanceof tl_1.Api.UserProfilePhotoEmpty ||
        media instanceof tl_1.Api.ChatPhoto ||
        media instanceof tl_1.Api.UserProfilePhoto) {
        return new tl_1.Api.InputMediaEmpty();
    }
    if (media instanceof tl_1.Api.Message) {
        return getInputMedia(media.media, { isPhoto: isPhoto });
    }
    if (media instanceof tl_1.Api.MessageMediaPoll) {
        let correctAnswers;
        if (media.poll.quiz) {
            if (!media.results.results) {
                throw new Error("Cannot cast unanswered quiz to any kind of InputMedia.");
            }
            correctAnswers = [];
            for (const r of media.results.results) {
                if (r.correct) {
                    correctAnswers.push(r.option);
                }
            }
        }
        else {
            correctAnswers = undefined;
        }
        return new tl_1.Api.InputMediaPoll({
            poll: media.poll,
            correctAnswers: correctAnswers,
            solution: media.results.solution,
            solutionEntities: media.results.solutionEntities,
        });
    }
    if (media instanceof tl_1.Api.Poll) {
        return new tl_1.Api.InputMediaPoll({
            poll: media,
        });
    }
    _raiseCastFail(media, "InputMedia");
}
exports.getInputMedia = getInputMedia;
/**
 * Gets the appropriated part size when uploading or downloading files,
 * given an initial file size.
 * @param fileSize
 * @returns {Number}
 */
function getAppropriatedPartSize(fileSize) {
    if (fileSize <= 104857600) {
        // 100MB
        return 128;
    }
    if (fileSize <= 786432000) {
        // 750MB
        return 256;
    }
    if (fileSize <= 2097152000) {
        // 2000MB
        return 512;
    }
    throw new Error("File size too large");
}
exports.getAppropriatedPartSize = getAppropriatedPartSize;
function getPeer(peer) {
    if (!peer) {
        _raiseCastFail(peer, "undefined");
    }
    if (typeof peer === "string") {
        _raiseCastFail(peer, "peer");
    }
    try {
        if (typeof peer === "number") {
            const res = resolveId(peer);
            if (res[1] === tl_1.Api.PeerChannel) {
                return new tl_1.Api.PeerChannel({ channelId: res[0] });
            }
            else if (res[1] === tl_1.Api.PeerChat) {
                return new tl_1.Api.PeerChat({ chatId: res[0] });
            }
            else {
                return new tl_1.Api.PeerUser({ userId: res[0] });
            }
        }
        if (peer.SUBCLASS_OF_ID === undefined) {
            throw new Error();
        }
        if (peer.SUBCLASS_OF_ID === 0x2d45687) {
            // crc32('Peer')
            return peer;
        }
        else if (peer instanceof tl_1.Api.contacts.ResolvedPeer ||
            peer instanceof tl_1.Api.InputNotifyPeer ||
            peer instanceof tl_1.Api.TopPeer ||
            peer instanceof tl_1.Api.Dialog ||
            peer instanceof tl_1.Api.DialogPeer) {
            return peer.peer;
        }
        else if (peer instanceof tl_1.Api.ChannelFull) {
            return new tl_1.Api.PeerChannel({ channelId: peer.id });
        }
        if (peer.SUBCLASS_OF_ID === 0x7d7c6f86 ||
            peer.SUBCLASS_OF_ID === 0xd9c7fc18) {
            // ChatParticipant, ChannelParticipant
            if ("userId" in peer) {
                return new tl_1.Api.PeerUser({ userId: peer.userId });
            }
        }
        peer = getInputPeer(peer, false, false);
        if (peer instanceof tl_1.Api.InputPeerUser) {
            return new tl_1.Api.PeerUser({ userId: peer.userId });
        }
        else if (peer instanceof tl_1.Api.InputPeerChat) {
            return new tl_1.Api.PeerChat({ chatId: peer.chatId });
        }
        else if (peer instanceof tl_1.Api.InputPeerChannel) {
            return new tl_1.Api.PeerChannel({ channelId: peer.channelId });
        }
    }
    catch (e) { }
    _raiseCastFail(peer, "peer");
}
exports.getPeer = getPeer;
function sanitizeParseMode(mode) {
    if (mode === "md" || mode === "markdown") {
        return markdown_1.MarkdownParser;
    }
    if (mode == "html") {
        return html_1.HTMLParser;
    }
    if (typeof mode == "object") {
        if ("parse" in mode && "unparse" in mode) {
            return mode;
        }
    }
    throw new Error(`Invalid parse mode type ${mode}`);
}
exports.sanitizeParseMode = sanitizeParseMode;
/**
 Convert the given peer into its marked ID by default.

 This "mark" comes from the "bot api" format, and with it the peer type
 can be identified back. User ID is left unmodified, chat ID is negated,
 and channel ID is prefixed with -100:

 * ``userId``
 * ``-chatId``
 * ``-100channel_id``

 The original ID and the peer type class can be returned with
 a call to :meth:`resolve_id(marked_id)`.
 * @param peer
 * @param addMark
 */
function getPeerId(peer, addMark = true) {
    // First we assert it's a Peer TLObject, or early return for integers
    if (typeof peer == "number") {
        return addMark ? peer : resolveId(peer)[0];
    }
    // Tell the user to use their client to resolve InputPeerSelf if we got one
    if (peer instanceof tl_1.Api.InputPeerSelf) {
        _raiseCastFail(peer, "int (you might want to use client.get_peer_id)");
    }
    try {
        peer = getPeer(peer);
    }
    catch (e) {
        _raiseCastFail(peer, "int");
    }
    if (peer instanceof tl_1.Api.PeerUser) {
        return peer.userId;
    }
    else if (peer instanceof tl_1.Api.PeerChat) {
        // Check in case the user mixed things up to avoid blowing up
        if (!(0 < peer.chatId && peer.chatId <= 0x7fffffff)) {
            peer.chatId = resolveId(peer.chatId)[0];
        }
        return addMark ? -peer.chatId : peer.chatId;
    }
    else if (typeof peer == "object" && "channelId" in peer) {
        // if (peer instanceof Api.PeerChannel)
        // Check in case the user mixed things up to avoid blowing up
        if (!(0 < peer.channelId && peer.channelId <= 0x7fffffff)) {
            peer.channelId = resolveId(peer.channelId)[0];
        }
        if (!addMark) {
            return peer.channelId;
        }
        // Concat -100 through math tricks, .to_supergroup() on
        // Madeline IDs will be strictly positive -> log works.
        return -(1000000000000 + peer.channelId);
    }
    _raiseCastFail(peer, "int");
}
exports.getPeerId = getPeerId;
/**
 * Given a marked ID, returns the original ID and its :tl:`Peer` type.
 * @param markedId
 */
function resolveId(markedId) {
    if (markedId >= 0) {
        return [markedId, tl_1.Api.PeerUser];
    }
    // There have been report of chat IDs being 10000xyz, which means their
    // marked version is -10000xyz, which in turn looks like a channel but
    // it becomes 00xyz (= xyz). Hence, we must assert that there are only
    // two zeroes.
    const m = markedId.toString().match(/-100([^0]\d*)/);
    if (m) {
        return [parseInt(m[1]), tl_1.Api.PeerChannel];
    }
    return [-markedId, tl_1.Api.PeerChat];
}
exports.resolveId = resolveId;
/**
 * returns an entity pair
 * @param entityId
 * @param entities
 * @param cache
 * @param getInputPeer
 * @returns {{inputEntity: *, entity: *}}
 * @private
 */
/*CONTEST

export function  _getEntityPair(entityId, entities, cache, getInputPeer = getInputPeer) {
    const entity = entities.get(entityId)
    let inputEntity = cache[entityId]
    if (inputEntity === undefined) {
        try {
            inputEntity = getInputPeer(inputEntity)
        } catch (e) {
            inputEntity = null
        }
    }
    return {
        entity,
        inputEntity
    }
}
*/
function getMessageId(message) {
    if (message === null || message === undefined) {
        return undefined;
    }
    if (typeof message == "number") {
        return message;
    }
    if (message.SUBCLASS_OF_ID === 0x790009e3) {
        // crc32(b'Message')
        return message.id;
    }
    throw new Error(`Invalid message type: ${message.constructor.name}`);
}
exports.getMessageId = getMessageId;
/**
 * Parses the given phone, or returns `undefined` if it's invalid.
 * @param phone
 */
function parsePhone(phone) {
    phone = phone.toString().replace(/[+()\s-]/gm, "");
    return !isNaN(parseInt(phone)) ? phone : undefined;
}
exports.parsePhone = parsePhone;
function resolveInviteLink(link) {
    throw new Error("not implemented");
}
exports.resolveInviteLink = resolveInviteLink;
/**
 Parses the given username or channel access hash, given
 a string, username or URL. Returns a tuple consisting of
 both the stripped, lowercase username and whether it is
 a joinchat/ hash (in which case is not lowercase'd).

 Returns ``(undefined, false)`` if the ``username`` or link is not valid.

 * @param username {string}
 */
function parseUsername(username) {
    username = username.trim();
    const m = username.match(USERNAME_RE) || username.match(TG_JOIN_RE);
    if (m) {
        username = username.replace(m[0], "");
        if (m[1]) {
            return {
                username: username,
                isInvite: true,
            };
        }
        else {
            username = rtrim(username, "/");
        }
    }
    if (username.match(VALID_USERNAME_RE)) {
        return {
            username: username.toLowerCase(),
            isInvite: false,
        };
    }
    else {
        return {
            username: undefined,
            isInvite: false,
        };
    }
}
exports.parseUsername = parseUsername;
function rtrim(s, mask) {
    while (~mask.indexOf(s[s.length - 1])) {
        s = s.slice(0, -1);
    }
    return s;
}
exports.rtrim = rtrim;
/**
 * Gets the display name for the given :tl:`User`,
 :tl:`Chat` or :tl:`Channel`. Returns an empty string otherwise
 * @param entity
 */
function getDisplayName(entity) {
    if (entity instanceof tl_1.Api.User) {
        if (entity.lastName && entity.firstName) {
            return `${entity.firstName} ${entity.lastName}`;
        }
        else if (entity.firstName) {
            return entity.firstName;
        }
        else if (entity.lastName) {
            return entity.lastName;
        }
        else {
            return "";
        }
    }
    else if (entity instanceof tl_1.Api.Chat || entity instanceof tl_1.Api.Channel) {
        return entity.title;
    }
    return "";
}
exports.getDisplayName = getDisplayName;
/**
 * check if a given item is an array like or not
 * @param item
 * @returns {boolean}
 */
/*CONTEST
Duplicate ?
export function  isListLike(item) {
    return (
        Array.isArray(item) ||
        (!!item &&
            typeof item === 'object' &&
            typeof (item.length) === 'number' &&
            (item.length === 0 ||
                (item.length > 0 &&
                    (item.length - 1) in item)
            )
        )
    )
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9ncmFtanMvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsNkJBQTJCO0FBQzNCLDhEQUFpQztBQUdqQyw0REFBOEI7QUFFOUIsb0RBQXVEO0FBR3ZEOzs7R0FHRztBQUNILFFBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBSSxHQUFRLEVBQUUsSUFBSSxHQUFHLEdBQUc7SUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRTtRQUN2QyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNoQztBQUNMLENBQUM7QUFKRCx3QkFJQztBQUdELDRDQUErQztBQUUvQyxNQUFNLFdBQVcsR0FBRyxJQUFJLE1BQU0sQ0FDMUIsaUNBQWlDO0lBQzdCLHFEQUFxRCxFQUN6RCxHQUFHLENBQ04sQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQzNCLGd1Q0FBZ3VDLEVBQ2h1QyxLQUFLLENBQ1IsQ0FBQztBQUNGLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRS9DLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBRWhFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxNQUFNLENBQ2hDLGdEQUFnRDtJQUM1QywwQ0FBMEMsRUFDOUMsR0FBRyxDQUNOLENBQUM7QUFFRixTQUFTLGNBQWMsQ0FBQyxNQUFrQixFQUFFLE1BQVc7SUFDbkQsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDO0lBQ3JCLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLFdBQVcsSUFBSSxNQUFNLEVBQUU7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