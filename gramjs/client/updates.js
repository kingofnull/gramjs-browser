"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._updateLoop = exports._dispatchUpdate = exports._processUpdate = exports._handleUpdate = exports.catchUp = exports.listEventHandlers = exports.removeEventHandler = exports.addEventHandler = exports.on = void 0;
const tl_1 = require("../tl");
const big_integer_1 = __importDefault(require("big-integer"));
const network_1 = require("../network");
const index_1 = require("../index");
const Helpers_1 = require("../Helpers");
const PING_INTERVAL = 9000; // 9 sec
const PING_TIMEOUT = 10000; // 10 sec
const PING_FAIL_ATTEMPTS = 3;
const PING_FAIL_INTERVAL = 100; // ms
const PING_DISCONNECT_DELAY = 60000; // 1 min
/** @hidden */
function on(client, event) {
    return (f) => {
        client.addEventHandler(f, event);
        return f;
    };
}
exports.on = on;
/** @hidden */
function addEventHandler(client, callback, event) {
    if (event == undefined) {
        // recursive imports :(
        const raw = require("../events/Raw").Raw;
        event = new raw({});
    }
    event.client = client;
    client._eventBuilders.push([event, callback]);
}
exports.addEventHandler = addEventHandler;
/** @hidden */
function removeEventHandler(client, callback, event) {
    client._eventBuilders = client._eventBuilders.filter(function (item) {
        return item[0] !== event && item[1] !== callback;
    });
}
exports.removeEventHandler = removeEventHandler;
/** @hidden */
function listEventHandlers(client) {
    return client._eventBuilders;
}
exports.listEventHandlers = listEventHandlers;
/** @hidden */
function catchUp() {
    // TODO
}
exports.catchUp = catchUp;
/** @hidden */
function _handleUpdate(client, update) {
    if (typeof update === "number") {
        if ([-1, 0, 1].includes(update)) {
            _dispatchUpdate(client, {
                update: new network_1.UpdateConnectionState(update),
            });
            return;
        }
    }
    //this.session.processEntities(update)
    client._entityCache.add(update);
    client.session.processEntities(update);
    if (update instanceof tl_1.Api.Updates ||
        update instanceof tl_1.Api.UpdatesCombined) {
        // TODO deal with entities
        const entities = new Map();
        for (const x of [...update.users, ...update.chats]) {
            entities.set(index_1.utils.getPeerId(x), x);
        }
        for (const u of update.updates) {
            _processUpdate(client, u, update.updates, entities);
        }
    }
    else if (update instanceof tl_1.Api.UpdateShort) {
        _processUpdate(client, update.update, null);
    }
    else {
        _processUpdate(client, update, null);
    }
}
exports._handleUpdate = _handleUpdate;
/** @hidden */
function _processUpdate(client, update, others, entities) {
    update._entities = entities || new Map();
    const args = {
        update: update,
        others: others,
    };
    _dispatchUpdate(client, args);
}
exports._processUpdate = _processUpdate;
/** @hidden */
async function _dispatchUpdate(client, args) {
    for (const [builder, callback] of client._eventBuilders) {
        if (!builder.resolved) {
            await builder.resolve(client);
        }
        let event = args.update;
        if (event) {
            if (!client._selfInputPeer) {
                try {
                    await client.getMe(true);
                }
                catch (e) {
                    // we don't care about this.
                }
            }
            if (!(event instanceof network_1.UpdateConnectionState)) {
                // TODO fix me
            }
            // TODO fix others not being passed
            event = builder.build(event, undefined, callback);
            if (event) {
                if ("_eventName" in event) {
                    event._setClient(client);
                    event.originalUpdate = args.update;
                    event._entities = args.update._entities;
                }
                const filter = await builder.filter(event);
                if (!filter) {
                    continue;
                }
                try {
                    await callback(event);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    }
}
exports._dispatchUpdate = _dispatchUpdate;
/** @hidden */
async function _updateLoop(client) {
    while (!client._destroyed) {
        await Helpers_1.sleep(PING_INTERVAL);
        if (client._reconnecting) {
            continue;
        }
        try {
            await attempts(() => {
                return timeout(client._sender.send(new tl_1.Api.PingDelayDisconnect({
                    pingId: big_integer_1.default(Helpers_1.getRandomInt(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)),
                    disconnectDelay: PING_DISCONNECT_DELAY,
                })), PING_TIMEOUT);
            }, PING_FAIL_ATTEMPTS, PING_FAIL_INTERVAL);
        }
        catch (err) {
            // eslint-disable-next-line no-console
            client._log.error(err);
            if (client._reconnecting) {
                continue;
            }
            await client.disconnect();
            await client.connect();
        }
        // We need to send some content-related request at least hourly
        // for Telegram to keep delivering updates, otherwise they will
        // just stop even if we're connected. Do so every 30 minutes.
        // TODO Call getDifference instead since it's more relevant
        if (new Date().getTime() - (client._lastRequest || 0) >
            30 * 60 * 1000) {
            try {
                await client.invoke(new tl_1.Api.updates.GetState());
            }
            catch (e) {
                // we don't care about errors here
            }
        }
    }
    await client.disconnect();
}
exports._updateLoop = _updateLoop;
/** @hidden */
async function attempts(cb, times, pause) {
    for (let i = 0; i < times; i++) {
        try {
            // We need to `return await` here so it can be caught locally
            return await cb();
        }
        catch (err) {
            if (i === times - 1) {
                throw err;
            }
            await Helpers_1.sleep(pause);
        }
    }
    return undefined;
}
/** @hidden */
function timeout(promise, ms) {
    return Promise.race([
        promise,
        Helpers_1.sleep(ms).then(() => Promise.reject(new Error("TIMEOUT"))),
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2dyYW1qcy9jbGllbnQvdXBkYXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw4QkFBNEI7QUFFNUIsOERBQWlDO0FBQ2pDLHdDQUFtRDtBQUVuRCxvQ0FBaUM7QUFDakMsd0NBQWlEO0FBRWpELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLFFBQVE7QUFDcEMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLENBQUMsU0FBUztBQUNyQyxNQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUs7QUFDckMsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsQ0FBQyxRQUFRO0FBRTdDLGNBQWM7QUFDZCxTQUFnQixFQUFFLENBQUMsTUFBc0IsRUFBRSxLQUFvQjtJQUMzRCxPQUFPLENBQUMsQ0FBeUIsRUFBRSxFQUFFO1FBQ2pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUxELGdCQUtDO0FBRUQsY0FBYztBQUNkLFNBQWdCLGVBQWUsQ0FDM0IsTUFBc0IsRUFDdEIsUUFBMEIsRUFDMUIsS0FBb0I7SUFFcEIsSUFBSSxLQUFLLElBQUksU0FBUyxFQUFFO1FBQ3BCLHVCQUF1QjtRQUN2QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3pDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQVEsQ0FBQztLQUM5QjtJQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFD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