"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParticipants = exports.iterParticipants = exports._ParticipantsIter = void 0;
const Helpers_1 = require("../Helpers");
const requestIter_1 = require("../requestIter");
const __1 = require("../");
const tl_1 = require("../tl");
const big_integer_1 = __importDefault(require("big-integer"));
const util_1 = require("util");
const _MAX_PARTICIPANTS_CHUNK_SIZE = 200;
const _MAX_ADMIN_LOG_CHUNK_SIZE = 100;
const _MAX_PROFILE_PHOTO_CHUNK_SIZE = 100;
class _ChatAction {
    constructor(client, chat, action, params = {
        delay: 4,
        autoCancel: true,
    }) {
        this._client = client;
        this._chat = chat;
        this._action = action;
        this._delay = params.delay;
        this.autoCancel = params.autoCancel;
        this._request = undefined;
        this._task = null;
        this._running = false;
    }
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    async start() {
        this._request = new tl_1.Api.messages.SetTyping({
            peer: this._chat,
            action: this._action,
        });
        this._running = true;
        this._update();
    }
    async stop() {
        this._running = false;
        if (this.autoCancel) {
            await this._client.invoke(new tl_1.Api.messages.SetTyping({
                peer: this._chat,
                action: new tl_1.Api.SendMessageCancelAction(),
            }));
        }
    }
    async _update() {
        while (this._running) {
            if (this._request != undefined) {
                await this._client.invoke(this._request);
            }
            await Helpers_1.sleep(this._delay * 1000);
        }
    }
    progress(current, total) {
        if ("progress" in this._action) {
            this._action.progress = 100 * Math.round(current / total);
        }
    }
}
_ChatAction._str_mapping = {
    typing: new tl_1.Api.SendMessageTypingAction(),
    contact: new tl_1.Api.SendMessageChooseContactAction(),
    game: new tl_1.Api.SendMessageGamePlayAction(),
    location: new tl_1.Api.SendMessageGeoLocationAction(),
    "record-audio": new tl_1.Api.SendMessageRecordAudioAction(),
    "record-voice": new tl_1.Api.SendMessageRecordAudioAction(),
    "record-round": new tl_1.Api.SendMessageRecordRoundAction(),
    "record-video": new tl_1.Api.SendMessageRecordVideoAction(),
    audio: new tl_1.Api.SendMessageUploadAudioAction({ progress: 1 }),
    voice: new tl_1.Api.SendMessageUploadAudioAction({ progress: 1 }),
    song: new tl_1.Api.SendMessageUploadAudioAction({ progress: 1 }),
    round: new tl_1.Api.SendMessageUploadRoundAction({ progress: 1 }),
    video: new tl_1.Api.SendMessageUploadVideoAction({ progress: 1 }),
    photo: new tl_1.Api.SendMessageUploadPhotoAction({ progress: 1 }),
    document: new tl_1.Api.SendMessageUploadDocumentAction({ progress: 1 }),
    file: new tl_1.Api.SendMessageUploadDocumentAction({ progress: 1 }),
    cancel: new tl_1.Api.SendMessageCancelAction(),
};
class _ParticipantsIter extends requestIter_1.RequestIter {
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    async _init({ entity, filter, search, showTotal, }) {
        var _a, _b;
        if (filter && filter.constructor === Function) {
            if ([
                tl_1.Api.ChannelParticipantsBanned,
                tl_1.Api.ChannelParticipantsKicked,
                tl_1.Api.ChannelParticipantsSearch,
                tl_1.Api.ChannelParticipantsContacts,
            ].includes(filter)) {
                filter = new filter({
                    q: "",
                });
            }
            else {
                filter = new filter();
            }
        }
        entity = await this.client.getInputEntity(entity);
        const ty = __1.helpers._entityType(entity);
        if (search && (filter || ty != __1.helpers._EntityType.CHANNEL)) {
            // We need to 'search' ourselves unless we have a PeerChannel
            search = search.toLowerCase();
            this.filterEntity = (entity) => {
                return (__1.utils
                    .getDisplayName(entity)
                    .toLowerCase()
                    .includes(search) ||
                    ("username" in entity ? entity.username || "" : "")
                        .toLowerCase()
                        .includes(search));
            };
        }
        else {
            this.filterEntity = (entity) => true;
        }
        // Only used for channels, but we should always set the attribute
        this.requests = [];
        if (ty == __1.helpers._EntityType.CHANNEL) {
            if (showTotal) {
                const channel = await this.client.invoke(new tl_1.Api.channels.GetFullChannel({
                    channel: entity,
                }));
                if (!(channel.fullChat instanceof tl_1.Api.ChatFull)) {
                    this.total = channel.fullChat.participantsCount;
                }
            }
            if (this.total && this.total <= 0) {
                return false;
            }
            this.requests.push(new tl_1.Api.channels.GetParticipants({
                channel: entity,
                filter: filter ||
                    new tl_1.Api.ChannelParticipantsSearch({
                        q: search || "",
                    }),
                offset: 0,
                limit: _MAX_PARTICIPANTS_CHUNK_SIZE,
                hash: 0,
            }));
        }
        else if (ty == __1.helpers._EntityType.CHAT) {
            if (!("chatId" in entity)) {
                throw new Error("Found chat without id " + JSON.stringify(entity));
            }
            const full = await this.client.invoke(new tl_1.Api.messages.GetFullChat({
                chatId: entity.chatId,
            }));
            if (full.fullChat instanceof tl_1.Api.ChatFull) {
                if (!(full.fullChat.participants instanceof
                    tl_1.Api.ChatParticipantsForbidden)) {
                    this.total = full.fullChat.participants.participants.length;
                }
                else {
                    this.total = 0;
                    return false;
                }
                const users = new Map();
                for (const user of full.users) {
                    users.set(user.id, user);
                }
                for (const participant of full.fullChat.participants
                    .participants) {
                    const user = users.get(participant.userId);
                    if (!this.filterEntity(user)) {
                        continue;
                    }
                    user.participant = participant;
                    (_a = this.buffer) === null || _a === void 0 ? void 0 : _a.push(user);
                }
                return true;
            }
        }
        else {
            this.total = 1;
            if (this.limit != 0) {
                const user = await this.client.getEntity(entity);
                if (this.filterEntity(user)) {
                    // @ts-ignore
                    user.participant = null;
                    (_b = this.buffer) === null || _b === void 0 ? void 0 : _b.push(user);
                }
            }
            return true;
        }
    }
    async _loadNextChunk() {
        var _a, _b;
        if (!((_a = this.requests) === null || _a === void 0 ? void 0 : _a.length)) {
            return true;
        }
        this.requests[0].limit = Math.min(this.limit - this.requests[0].offset, _MAX_PARTICIPANTS_CHUNK_SIZE);
        if (this.requests[0].offset > this.limit) {
            return true;
        }
        const results = [];
        for (const request of this.requests) {
            results.push(await this.client.invoke(request));
        }
        for (let i = this.requests.length - 1; i >= 0; i--) {
            const participants = results[i];
            if (participants instanceof
                tl_1.Api.channels.ChannelParticipantsNotModified ||
                !participants.users.length) {
                this.requests.splice(i, 1);
                continue;
            }
            this.requests[i].offset += participants.participants.length;
            const users = new Map();
            for (const user of participants.users) {
                users.set(user.id, user);
            }
            for (const participant of participants.participants) {
                if (!("userId" in participant)) {
                    continue;
                }
                const user = users.get(participant.userId);
                if (this.filterEntity && !this.filterEntity(user)) {
                    continue;
                }
                user.participant = participant;
                (_b = this.buffer) === null || _b === void 0 ? void 0 : _b.push(user);
            }
        }
        return undefined;
    }
    [Symbol.asyncIterator]() {
        return super[Symbol.asyncIterator]();
    }
}
exports._ParticipantsIter = _ParticipantsIter;
class _AdminLogIter extends requestIter_1.RequestIter {
    [util_1.inspect.custom]() {
        return Helpers_1.betterConsoleLog(this);
    }
    async _init(entity, searchArgs, filterArgs) {
        let eventsFilter = undefined;
        if (filterArgs &&
            Object.values(filterArgs).find((element) => element === true)) {
            eventsFilter = new tl_1.Api.ChannelAdminLogEventsFilter(Object.assign({}, filterArgs));
        }
        this.entity = await this.client.getInputEntity(entity);
        const adminList = [];
        if (searchArgs && searchArgs.admins) {
            for (const admin of searchArgs.admins) {
                adminList.push(await this.client.getInputEntity(admin));
            }
        }
        this.request = new tl_1.Api.channels.GetAdminLog({
            channel: this.entity,
            q: (searchArgs === null || searchArgs === void 0 ? void 0 : searchArgs.search) || "",
            minId: searchArgs === null || searchArgs === void 0 ? void 0 : searchArgs.minId,
            maxId: searchArgs === null || searchArgs === void 0 ? void 0 : searchArgs.maxId,
            limit: 0,
            eventsFilter: eventsFilter,
            admins: adminList || undefined,
        });
    }
    async _loadNextChunk() {
        if (!this.request) {
            return true;
        }
        this.request.limit = Math.min(this.left, _MAX_ADMIN_LOG_CHUNK_SIZE);
        const r = await this.client.invoke(this.request);
        const entities = new Map();
        for (const entity of [...r.users, ...r.chats]) {
            entities.set(__1.utils.getPeerId(entity), entity);
        }
        const eventIds = [];
        for (const e of r.events) {
            eventIds.push(e.id);
        }
        this.request.maxId = Helpers_1.getMinBigInt([big_integer_1.default.zero, ...eventIds]);
        for (const ev of r.events) {
            if (ev.action instanceof tl_1.Api.ChannelAdminLogEventActionEditMessage) {
                // @ts-ignore
                // TODO ev.action.prevMessage._finishInit(this.client, entities, this.entity);
                // @ts-ignore
                // TODO ev.action.newMessage._finishInit(this.client, entities, this.entity);
            }
        }
    }
}
/** @hidden */
function iterParticipants(client, entity, { limit, search, filter, showTotal = true }) {
    return new _ParticipantsIter(client, limit !== null && limit !== void 0 ? limit : Number.MAX_SAFE_INTEGER, {}, {
        entity: entity,
        filter: filter,
        search: search,
        showTotal: showTotal,
    });
}
exports.iterParticipants = iterParticipants;
/** @hidden */
async function getParticipants(client, entity, params) {
    const it = client.iterParticipants(entity, params);
    return (await it.collect());
}
exports.getParticipants = getParticipants;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9ncmFtanMvY2xpZW50L2NoYXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLHdDQUE4RTtBQUM5RSxnREFBNkM7QUFDN0MsMkJBQXFDO0FBQ3JDLDhCQUE0QjtBQUM1Qiw4REFBaUQ7QUFDakQsK0JBQStCO0FBRS9CLE1BQU0sNEJBQTRCLEdBQUcsR0FBRyxDQUFDO0FBQ3pDLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLE1BQU0sNkJBQTZCLEdBQUcsR0FBRyxDQUFDO0FBTzFDLE1BQU0sV0FBVztJQXNDYixZQUNJLE1BQXNCLEVBQ3RCLElBQWdCLEVBQ2hCLE1BQWdELEVBQ2hELFNBQThCO1FBQzFCLEtBQUssRUFBRSxDQUFDO1FBQ1IsVUFBVSxFQUFFLElBQUk7S0FDbkI7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQzFCLENBQUM7SUFyQkQsQ0FBQyxjQUFPLENBQUMsTUFBTSxDQUFDO1FBQ1osT0FBTywwQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBcUJELEtBQUssQ0FBQyxLQUFLO1FBQ1AsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLFFBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO1lBQ3ZDLElBQUks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