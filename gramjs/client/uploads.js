"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFile = exports._fileToMedia = exports.uploadFile = exports.CustomFile = void 0;
const tl_1 = require("../tl");
const Helpers_1 = require("../Helpers");
const Utils_1 = require("../Utils");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const index_1 = require("../index");
const messageParse_1 = require("./messageParse");
/**
 * A custom file class that mimics the browser's File class.<br/>
 * You should use this whenever you want to upload a file.
 */
class CustomFile {
    constructor(name, size, path, buffer) {
        this.name = name;
        this.size = size;
        this.path = path;
        this.buffer = buffer;
    }
}
exports.CustomFile = CustomFile;
const KB_TO_BYTES = 1024;
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT = 15 * 1000;
const DISCONNECT_SLEEP = 1000;
/** @hidden */
async function uploadFile(client, fileParams) {
    const { file, onProgress } = fileParams;
    let { workers } = fileParams;
    const { name, size } = file;
    const fileId = Helpers_1.readBigIntFromBuffer(Helpers_1.generateRandomBytes(8), true, true);
    const isLarge = size > LARGE_FILE_THRESHOLD;
    const partSize = Utils_1.getAppropriatedPartSize(size) * KB_TO_BYTES;
    const partCount = Math.floor((size + partSize - 1) / partSize);
    const buffer = Buffer.from(await fileToBuffer(file));
    // Make sure a new sender can be created before starting upload
    await client.getSender(client.session.dcId);
    if (!workers || !size) {
        workers = 1;
    }
    if (workers >= partCount) {
        workers = partCount;
    }
    let progress = 0;
    if (onProgress) {
        onProgress(progress);
    }
    for (let i = 0; i < partCount; i += workers) {
        const sendingParts = [];
        let end = i + workers;
        if (end > partCount) {
            end = partCount;
        }
        for (let j = i; j < end; j++) {
            const bytes = buffer.slice(j * partSize, (j + 1) * partSize);
            // eslint-disable-next-line no-loop-func
            sendingParts.push((async (jMemo, bytesMemo) => {
                while (true) {
                    let sender;
                    try {
                        // We always upload from the DC we are in
                        sender = await client.getSender(client.session.dcId);
                        await sender.send(isLarge
                            ? new tl_1.Api.upload.SaveBigFilePart({
                                fileId,
                                filePart: jMemo,
                                fileTotalParts: partCount,
                                bytes: bytesMemo,
                            })
                            : new tl_1.Api.upload.SaveFilePart({
                                fileId,
                                filePart: jMemo,
                                bytes: bytesMemo,
                            }));
                    }
                    catch (err) {
                        if (sender && !sender.isConnected()) {
                            await Helpers_1.sleep(DISCONNECT_SLEEP);
                            continue;
                        }
                        else if (err instanceof index_1.errors.FloodWaitError) {
                            await Helpers_1.sleep(err.seconds * 1000);
                            continue;
                        }
                        throw err;
                    }
                    if (onProgress) {
                        if (onProgress.isCanceled) {
                            throw new Error("USER_CANCELED");
                        }
                        progress += 1 / partCount;
                        onProgress(progress);
                    }
                    break;
                }
            })(j, bytes));
        }
        await Promise.all(sendingParts);
    }
    return isLarge
        ? new tl_1.Api.InputFileBig({
            id: fileId,
            parts: partCount,
            name,
        })
        : new tl_1.Api.InputFile({
            id: fileId,
            parts: partCount,
            name,
            md5Checksum: "", // This is not a "flag", so not sure if we can make it optional.
        });
}
exports.uploadFile = uploadFile;
/** @hidden */
async function _fileToMedia(client, { file, forceDocument, fileSize, progressCallback, attributes, thumb, voiceNote = false, videoNote = false, supportsStreaming = false, mimeType, asImage, workers = 1, }) {
    if (!file) {
        return { fileHandle: undefined, media: undefined, image: undefined };
    }
    const isImage = index_1.utils.isImage(file);
    if (asImage == undefined) {
        asImage = isImage && !forceDocument;
    }
    if (typeof file == "object" &&
        !Buffer.isBuffer(file) &&
        !(file instanceof tl_1.Api.InputFile) &&
        !(file instanceof tl_1.Api.InputFileBig) &&
        !("read" in file)) {
        try {
            return {
                fileHandle: undefined,
                media: index_1.utils.getInputMedia(file, {
                    isPhoto: asImage,
                    attributes: attributes,
                    forceDocument: forceDocument,
                    voiceNote: voiceNote,
                    videoNote: videoNote,
                    supportsStreaming: supportsStreaming,
                }),
                image: asImage,
            };
        }
        catch (e) {
            return {
                fileHandle: undefined,
                media: undefined,
                image: isImage,
            };
        }
    }
    let media;
    let fileHandle;
    let createdFile;
    if (file instanceof tl_1.Api.InputFile || file instanceof tl_1.Api.InputFileBig) {
        fileHandle = file;
    }
    else if (typeof file == "string" &&
        (file.startsWith("https://") || file.startsWith("http://"))) {
        if (asImage) {
            media = new tl_1.Api.InputMediaPhotoExternal({ url: file });
        }
        else {
            media = new tl_1.Api.InputMediaDocumentExternal({ url: file });
        }
    }
    else if (!(typeof file == "string") || (await fs_1.promises.lstat(file)).isFile()) {
        if (typeof file == "string") {
            createdFile = new CustomFile(path_1.default.basename(file), (await fs_1.promises.stat(file)).size, file);
        }
        else if (typeof File !== "undefined" && file instanceof File) {
            createdFile = file;
        }
        else {
            let name;
            if ("name" in file) {
                // @ts-ignore
                name = file.name;
            }
            else {
                name = "unnamed";
            }
            if (file instanceof Buffer) {
                createdFile = new CustomFile(name, file.length, "", file);
            }
        }
        if (!createdFile) {
            throw new Error(`Could not create file from ${JSON.stringify(file)}`);
        }
        fileHandle = await uploadFile(client, {
            file: createdFile,
            onProgress: progressCallback,
            workers: workers,
        });
    }
    else {
        throw new Error(`"Not a valid path nor a url ${file}`);
    }
    if (media != undefined) {
    }
    else if (fileHandle == undefined) {
        throw new Error(`Failed to convert ${file} to media. Not an existing file or an HTTP URL`);
    }
    else if (asImage) {
        media = new tl_1.Api.InputMediaUploadedPhoto({
            file: fileHandle,
        });
    }
    else {
        // @ts-ignore
        let res = index_1.utils.getAttributes(file, {
            mimeType: mimeType,
            attributes: attributes,
            forceDocument: forceDocument && !isImage,
            voiceNote: voiceNote,
            videoNote: videoNote,
            supportsStreaming: supportsStreaming,
            thumb: thumb,
        });
        attributes = res.attrs;
        mimeType = res.mimeType;
        let uploadedThumb;
        if (!thumb) {
            uploadedThumb = undefined;
        }
        else {
            // todo refactor
            if (typeof thumb == "string") {
                uploadedThumb = new CustomFile(path_1.default.basename(thumb), (await fs_1.promises.stat(thumb)).size, thumb);
            }
            else if (typeof File !== "undefined" && thumb instanceof File) {
                uploadedThumb = thumb;
            }
            else {
                let name;
                if ("name" in thumb) {
                    name = thumb.name;
                }
                else {
                    name = "unnamed";
                }
                if (thumb instanceof Buffer) {
                    uploadedThumb = new CustomFile(name, thumb.length, "", thumb);
                }
            }
            if (!uploadedThumb) {
                throw new Error(`Could not create file from ${file}`);
            }
            uploadedThumb = await uploadFile(client, {
                file: uploadedThumb,
                workers: 1,
            });
        }
        media = new tl_1.Api.InputMediaUploadedDocument({
            file: fileHandle,
            mimeType: mimeType,
            attributes: attributes,
            thumb: uploadedThumb,
            forceFile: forceDocument && !isImage,
        });
    }
    return {
        fileHandle: fileHandle,
        media: media,
        image: asImage,
    };
}
exports._fileToMedia = _fileToMedia;
/** @hidden */
async function sendFile(client, entity, { file, caption, forceDocument = false, fileSize, clearDraft = false, progressCallback, replyTo, attributes, thumb, parseMode, formattingEntities, voiceNote = false, videoNote = false, buttons, silent, supportsStreaming = false, scheduleDate, workers = 1, }) {
    if (!file) {
        throw new Error("You need to specify a file");
    }
    if (!caption) {
        caption = "";
    }
    entity = await client.getInputEntity(entity);
    replyTo = index_1.utils.getMessageId(replyTo);
    // TODO support albums in the future
    let msgEntities;
    if (formattingEntities != undefined) {
        msgEntities = formattingEntities;
    }
    else {
        [caption, msgEntities] = await messageParse_1._parseMessageText(client, caption, parseMode);
    }
    const { fileHandle, media, image } = await _fileToMedia(client, {
        file: file,
        forceDocument: forceDocument,
        fileSize: fileSize,
        progressCallback: progressCallback,
        attributes: attributes,
        thumb: thumb,
        voiceNote: voiceNote,
        videoNote: videoNote,
        supportsStreaming: supportsStreaming,
        workers: workers,
    });
    if (media == undefined) {
        throw new Error(`Cannot use ${file} as file.`);
    }
    const markup = client.buildReplyMarkup(buttons);
    const request = new tl_1.Api.messages.SendMedia({
        peer: entity,
        media: media,
        replyToMsgId: replyTo,
        message: caption,
        entities: msgEntities,
        replyMarkup: markup,
        silent: silent,
        scheduleDate: scheduleDate,
        clearDraft: clearDraft,
    });
    const result = await client.invoke(request);
    return client._getResponseMessage(request, result, entity);
}
exports.sendFile = sendFile;
function fileToBuffer(file) {
    if (typeof File !== "undefined" && file instanceof File) {
        return new Response(file).arrayBuffer();
    }
    else if (file instanceof CustomFile) {
        if (file.buffer != undefined) {
            return file.buffer;
        }
        else {
            return fs_1.promises.readFile(file.path);
        }
    }
    else {
        throw new Error("Could not create buffer from file " + file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2Fkcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2dyYW1qcy9jbGllbnQvdXBsb2Fkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4QkFBNEI7QUFHNUIsd0NBQThFO0FBQzlFLG9DQUFtRDtBQUVuRCxnREFBd0I7QUFDeEIsMkJBQW9DO0FBQ3BDLG9DQUF5QztBQUN6QyxpREFBbUQ7QUF1Qm5EOzs7R0FHRztBQUNILE1BQWEsVUFBVTtJQVluQixZQUFZLElBQVksRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUFFLE1BQWU7UUFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztDQUNKO0FBbEJELGdDQWtCQztBQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQztBQUN6QixNQUFNLG9CQUFvQixHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQzlDLE1BQU0sY0FBYyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDakMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFFOUIsY0FBYztBQUNQLEtBQUssVUFBVSxVQUFVLENBQzVCLE1BQXNCLEVBQ3RCLFVBQTRCO0lBRTVCLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsVUFBVSxDQUFDO0lBQ3hDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxVQUFVLENBQUM7SUFFN0IsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDNUIsTUFBTSxNQUFNLEdBQUcsOEJBQW9CLENBQUMsNkJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFD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