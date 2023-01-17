"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadProfilePhoto = exports._downloadPhoto = exports._downloadCachedPhotoSize = exports._downloadWebDocument = exports._downloadContact = exports._downloadDocument = exports.downloadMedia = exports.downloadFile = void 0;
const tl_1 = require("../tl");
const Utils_1 = require("../Utils");
const Helpers_1 = require("../Helpers");
const __1 = require("../");
// All types
const sizeTypes = ["w", "y", "d", "x", "c", "m", "b", "a", "s"];
// Chunk sizes for `upload.getFile` must be multiple of the smallest size
const MIN_CHUNK_SIZE = 4096;
const DEFAULT_CHUNK_SIZE = 64; // kb
const ONE_MB = 1024 * 1024;
const REQUEST_TIMEOUT = 15000;
const DISCONNECT_SLEEP = 1000;
/** @hidden */
async function downloadFile(client, inputLocation, fileParams) {
    let { partSizeKb, end } = fileParams;
    const { fileSize, workers = 1 } = fileParams;
    const { dcId, progressCallback, start = 0 } = fileParams;
    if (end && fileSize) {
        end = end < fileSize ? end : fileSize - 1;
    }
    if(!end){
        end = fileSize
    }
    if (!partSizeKb) {
        partSizeKb = fileSize
            ? Utils_1.getAppropriatedPartSize(fileSize)
            : DEFAULT_CHUNK_SIZE;
    }
    const partSize = partSizeKb * 1024;
    const partsCount = end ? Math.ceil((end - start) / partSize) : 1;
    if (partSize % MIN_CHUNK_SIZE !== 0) {
        throw new Error(`The part size must be evenly divisible by ${MIN_CHUNK_SIZE}`);
    }
    client._log.info(`Downloading file in chunks of ${partSize} bytes`);
    const foreman = new Foreman(workers);
    const promises = [];
    let offset = start;
    // Used for files with unknown size and for manual cancellations
    let hasEnded = false;
    let progress = 0;
    if (progressCallback) {
        progressCallback(progress);
    }
    // Preload sender
    await client.getSender(dcId);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let limit = partSize;
        let isPrecise = false;
        if (Math.floor(offset / ONE_MB) !==
            Math.floor((offset + limit - 1) / ONE_MB)) {
            limit = ONE_MB - (offset % ONE_MB);
            isPrecise = true;
        }
        await foreman.requestWorker();
        if (hasEnded) {
            foreman.releaseWorker();
            break;
        }
        // eslint-disable-next-line no-loop-func
        promises.push((async (offsetMemo) => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                let sender;
                try {
                    sender = await client.getSender(dcId);
                    const result = await sender.send(new tl_1.Api.upload.GetFile({
                        location: inputLocation,
                        offset: offsetMemo,
                        limit,
                        precise: isPrecise || undefined,
                    }));
                    if (progressCallback) {
                        if (progressCallback.isCanceled) {
                            throw new Error("USER_CANCELED");
                        }
                        progress += 1 / partsCount;
                        progressCallback(progress);
                    }
                    if (!end && result.bytes.length < limit) {
                        hasEnded = true;
                    }
                    foreman.releaseWorker();
                    return result.bytes;
                }
                catch (err) {
                    if (sender && !sender.isConnected()) {
                        await Helpers_1.sleep(DISCONNECT_SLEEP);
                        continue;
                    }
                    else if (err instanceof __1.errors.FloodWaitError) {
                        await Helpers_1.sleep(err.seconds * 1000);
                        continue;
                    }
                    foreman.releaseWorker();
                    hasEnded = true;
                    throw err;
                }
            }
        })(offset));
        offset += limit;
        if (end && offset > end) {
            break;
        }
    }
    const results = await Promise.all(promises);
    const buffers = results.filter(Boolean);
    const totalLength = end ? end + 1 - start : undefined;
    return Buffer.concat(buffers, totalLength);
}
exports.downloadFile = downloadFile;
class Foreman {
    constructor(maxWorkers) {
        this.maxWorkers = maxWorkers;
        this.activeWorkers = 0;
    }
    requestWorker() {
        this.activeWorkers++;
        if (this.activeWorkers > this.maxWorkers) {
            this.deferred = createDeferred();
            return this.deferred.promise;
        }
        return Promise.resolve();
    }
    releaseWorker() {
        this.activeWorkers--;
        if (this.deferred && this.activeWorkers <= this.maxWorkers) {
            this.deferred.resolve();
        }
    }
}
function createDeferred() {
    let resolve;
    const promise = new Promise((_resolve) => {
        resolve = _resolve;
    });
    return {
        promise,
        resolve: resolve,
    };
}
/** @hidden */
async function downloadMedia(client, messageOrMedia, downloadParams) {
    let date;
    let media;
    if (messageOrMedia instanceof tl_1.Api.Message) {
        media = messageOrMedia.media;
    }
    else {
        media = messageOrMedia;
    }
    if (typeof media == "string") {
        throw new Error("not implemented");
    }
    if (media instanceof tl_1.Api.MessageMediaWebPage) {
        if (media.webpage instanceof tl_1.Api.WebPage) {
            media = media.webpage.document || media.webpage.photo;
        }
    }
    if (media instanceof tl_1.Api.MessageMediaPhoto || media instanceof tl_1.Api.Photo) {
        return _downloadPhoto(client, media, downloadParams);
    }
    else if (media instanceof tl_1.Api.MessageMediaDocument ||
        media instanceof tl_1.Api.Document) {
        return _downloadDocument(client, media, downloadParams);
    }
    else if (media instanceof tl_1.Api.MessageMediaContact) {
        return _downloadContact(client, media, downloadParams);
    }
    else if (media instanceof tl_1.Api.WebDocument ||
        media instanceof tl_1.Api.WebDocumentNoProxy) {
        return _downloadWebDocument(client, media, downloadParams);
    }
    else {
        return Buffer.alloc(0);
    }
}
exports.downloadMedia = downloadMedia;
/** @hidden */
async function _downloadDocument(client, doc, args) {
    if (doc instanceof tl_1.Api.MessageMediaDocument) {
        if (!doc.document) {
            return Buffer.alloc(0);
        }
        doc = doc.document;
    }
    if (!(doc instanceof tl_1.Api.Document)) {
        return Buffer.alloc(0);
    }
    let size = undefined;
    if (args.sizeType) {
        size = doc.thumbs ? pickFileSize(doc.thumbs, args.sizeType) : undefined;
        if (!size && doc.mimeType.startsWith("video/")) {
            return Buffer.alloc(0);
        }
        if (size &&
            (size instanceof tl_1.Api.PhotoCachedSize ||
                size instanceof tl_1.Api.PhotoStrippedSize)) {
            return _downloadCachedPhotoSize(size);
        }
    }
    return client.downloadFile(new tl_1.Api.InputDocumentFileLocation({
        id: doc.id,
        accessHash: doc.accessHash,
        fileReference: doc.fileReference,
        thumbSize: size ? size.type : "",
    }), {
        fileSize: size && !(size instanceof tl_1.Api.PhotoSizeEmpty)
            ? size instanceof tl_1.Api.PhotoSizeProgressive
                ? Math.max(...size.sizes)
                : size.size
            : doc.size,
        progressCallback: args.progressCallback,
        start: args.start,
        end: args.end,
        dcId: doc.dcId,
        workers: args.workers,
    });
}
exports._downloadDocument = _downloadDocument;
/** @hidden */
async function _downloadContact(client, media, args) {
    throw new Error("not implemented");
}
exports._downloadContact = _downloadContact;
/** @hidden */
async function _downloadWebDocument(client, media, args) {
    throw new Error("not implemented");
}
exports._downloadWebDocument = _downloadWebDocument;
function pickFileSize(sizes, sizeType) {
    if (!sizeType || !sizes || !sizes.length) {
        return undefined;
    }
    const indexOfSize = sizeTypes.indexOf(sizeType);
    let size;
    for (let i = indexOfSize; i < sizeTypes.length; i++) {
        size = sizes.find((s) => s.type === sizeTypes[i]);
        if (size && !(size instanceof tl_1.Api.PhotoPathSize)) {
            return size;
        }
    }
    return undefined;
}
/** @hidden */
function _downloadCachedPhotoSize(size) {
    // No need to download anything, simply write the bytes
    let data;
    if (size instanceof tl_1.Api.PhotoStrippedSize) {
        data = Utils_1.strippedPhotoToJpg(size.bytes);
    }
    else {
        data = size.bytes;
    }
    return data;
}
exports._downloadCachedPhotoSize = _downloadCachedPhotoSize;
/** @hidden */
async function _downloadPhoto(client, photo, args) {
    if (photo instanceof tl_1.Api.MessageMediaPhoto) {
        if (photo.photo instanceof tl_1.Api.PhotoEmpty || !photo.photo) {
            return Buffer.alloc(0);
        }
        photo = photo.photo;
    }
    if (!(photo instanceof tl_1.Api.Photo)) {
        return Buffer.alloc(0);
    }
    const size = pickFileSize(photo.sizes, args.sizeType || sizeTypes[0]);
    if (!size || size instanceof tl_1.Api.PhotoSizeEmpty) {
        return Buffer.alloc(0);
    }
    if (size instanceof tl_1.Api.PhotoCachedSize ||
        size instanceof tl_1.Api.PhotoStrippedSize) {
        return _downloadCachedPhotoSize(size);
    }
    return client.downloadFile(new tl_1.Api.InputPhotoFileLocation({
        id: photo.id,
        accessHash: photo.accessHash,
        fileReference: photo.fileReference,
        thumbSize: size.type,
    }), {
        dcId: photo.dcId,
        fileSize: size instanceof tl_1.Api.PhotoSizeProgressive
            ? Math.max(...size.sizes)
            : size.size,
        progressCallback: args.progressCallback,
    });
}
exports._downloadPhoto = _downloadPhoto;
/** @hidden */
async function downloadProfilePhoto(client, entity, fileParams) {
    let photo;
    if (typeof entity == "object" && "photo" in entity) {
        photo = entity.photo;
    }
    else {
        entity = await client.getEntity(entity);
        if ("photo" in entity) {
            photo = entity.photo;
        }
        else {
            throw new Error(`Could not get photo from ${entity ? entity.className : undefined}`);
        }
    }
    let dcId;
    let loc;
    if (photo instanceof tl_1.Api.UserProfilePhoto ||
        photo instanceof tl_1.Api.ChatPhoto) {
        dcId = photo.dcId;
        loc = new tl_1.Api.InputPeerPhotoFileLocation({
            peer: __1.utils.getInputPeer(entity),
            photoId: photo.photoId,
            big: fileParams.isBig,
        });
    }
    else {
        return Buffer.alloc(0);
    }
    return client.downloadFile(loc, {
        dcId,
        workers: 1,
    });
}
exports.downloadProfilePhoto = downloadProfilePhoto;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2NsaWVudC9kb3dubG9hZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOEJBQTRCO0FBRTVCLG9DQUF1RTtBQUN2RSx3Q0FBbUM7QUFFbkMsMkJBQW9DO0FBcURwQyxZQUFZO0FBQ1osTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBRWhFLHlFQUF5RTtBQUN6RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDNUIsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLO0FBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFDM0IsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzlCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBRTlCLGNBQWM7QUFDUCxLQUFLLFVBQVUsWUFBWSxDQUM5QixNQUFzQixFQUN0QixhQUF3QyxFQUN4QyxVQUE4QjtJQUU5QixJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLFVBQVUsQ0FBQztJQUNyQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7SUFDN0MsTUFBTSxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDO0lBQ3pELElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRTtRQUNqQixHQUFHLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0tBQzdDO0lBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRTtR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