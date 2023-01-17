"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromisedNetSockets = void 0;
const net_1 = require("net");
const socks_1 = require("socks");
const async_mutex_1 = require("async-mutex");
const mutex = new async_mutex_1.Mutex();
const closeError = new Error("NetSocket was closed");
class PromisedNetSockets {
    constructor(proxy) {
        this.client = undefined;
        this.closed = true;
        this.stream = Buffer.alloc(0);
        if (!(proxy === null || proxy === void 0 ? void 0 : proxy.MTProxy)) {
            // we only want to use this when it's not an MTProto proxy.
            if (proxy) {
                if (!proxy.ip || !proxy.port || !proxy.socksType) {
                    throw new Error(`Invalid sockets params. ${proxy.ip}, ${proxy.port}, ${proxy.socksType}`);
                }
            }
            this.proxy = proxy;
        }
    }
    async readExactly(number) {
        let readData = Buffer.alloc(0);
        while (true) {
            const thisTime = await this.read(number);
            readData = Buffer.concat([readData, thisTime]);
            number = number - thisTime.length;
            if (!number) {
                return readData;
            }
        }
    }
    async read(number) {
        if (this.closed) {
            throw closeError;
        }
        await this.canRead;
        if (this.closed) {
            throw closeError;
        }
        const toReturn = this.stream.slice(0, number);
        this.stream = this.stream.slice(number);
        if (this.stream.length === 0) {
            this.canRead = new Promise((resolve) => {
                this.resolveRead = resolve;
            });
        }
        return toReturn;
    }
    async readAll() {
        if (this.closed || !(await this.canRead)) {
            throw closeError;
        }
        const toReturn = this.stream;
        this.stream = Buffer.alloc(0);
        this.canRead = new Promise((resolve) => {
            this.resolveRead = resolve;
        });
        return toReturn;
    }
    /**
     * Creates a new connection
     * @param port
     * @param ip
     * @returns {Promise<void>}
     */
    async connect(port, ip) {
        this.stream = Buffer.alloc(0);
        let connected = false;
        if (this.proxy) {
            const info = await socks_1.SocksClient.createConnection({
                proxy: {
                    host: this.proxy.ip,
                    port: this.proxy.port,
                    type: this.proxy.socksType, // Proxy version (4 or 5)
                },
                command: "connect",
                timeout: (this.proxy.timeout || 5) * 1000,
                destination: {
                    host: ip,
                    port: port,
                },
            });
            this.client = info.socket;
            connected = true;
        }
        else {
            this.client = new net_1.Socket();
        }
        this.canRead = new Promise((resolve) => {
            this.resolveRead = resolve;
        });
        this.closed = false;
        return new Promise((resolve, reject) => {
            if (this.client) {
                if (connected) {
                    this.receive();
                    resolve(this);
                }
                else {
                    this.client.connect(port, ip, () => {
                        this.receive();
                        resolve(this);
                    });
                }
                this.client.on("error", reject);
                this.client.on("close", () => {
                    if (this.client && this.client.destroyed) {
                        if (this.resolveRead) {
                            this.resolveRead(false);
                        }
                        this.closed = true;
                    }
                });
            }
        });
    }
    write(data) {
        if (this.closed) {
            throw closeError;
        }
        if (this.client) {
            this.client.write(data);
        }
    }
    async close() {
        if (this.client) {
            await this.client.destroy();
            this.client.unref();
        }
        this.closed = true;
    }
    async receive() {
        if (this.client) {
            this.client.on("data", async (message) => {
                const release = await mutex.acquire();
                try {
                    let data;
                    //CONTEST BROWSER
                    this.stream = Buffer.concat([this.stream, message]);
                    if (this.resolveRead) {
                        this.resolveRead(true);
                    }
                }
                finally {
                    release();
                }
            });
        }
    }
}
exports.PromisedNetSockets = PromisedNetSockets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvbWlzZWROZXRTb2NrZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZ3JhbWpzL2V4dGVuc2lvbnMvUHJvbWlzZWROZXRTb2NrZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUM3QixpQ0FBb0M7QUFFcEMsNkNBQW9DO0FBR3BDLE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQUssRUFBRSxDQUFDO0FBRTFCLE1BQU0sVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFFckQsTUFBYSxrQkFBa0I7SUFRM0IsWUFBWSxLQUFzQjtRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLENBQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLE9BQU8sQ0FBQSxFQUFFO1lBQ2pCLDJEQUEyRDtZQUMzRCxJQUFJLEtBQUssRUFBRTtnQkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFO29CQUM5QyxNQUFNLElBQUksS0FBSyxDQUNYLDJCQUEyQixLQUFLLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUMzRSxDQUFDO2lCQUNMO2FBQ0o7WUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUN0QjtJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWM7UUFDNUIsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixPQUFPLElB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