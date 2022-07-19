export declare class DBFixtureJsError extends Error {
    readonly cause?: Error;
    constructor(msg?: string, cause?: Error);
}
