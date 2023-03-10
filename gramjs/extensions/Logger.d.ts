export declare class Logger {
    static levels: string[];
    private readonly isBrowser;
    private colors;
    private messageFormat;
    constructor(level?: string);
    /**
     *
     * @param level {string}
     * @returns {boolean}
     */
    canSend(level: string): boolean;
    /**
     * @param message {string}
     */
    warn(message: string): void;
    /**
     * @param message {string}
     */
    info(message: string): void;
    /**
     * @param message {string}
     */
    debug(message: string): void;
    /**
     * @param message {string}
     */
    error(message: string): void;
    format(message: string, level: string): string;
    static setLevel(level: string): void;
    /**
     * @param level {string}
     * @param message {string}
     * @param color {string}
     */
    _log(level: string, message: string, color: string): void;
}
