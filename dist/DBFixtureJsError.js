"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBFixtureJsError = void 0;
class DBFixtureJsError extends Error {
    cause;
    constructor(msg, cause) {
        super(msg);
        this.name = new.target.name;
        this.cause = cause;
    }
}
exports.DBFixtureJsError = DBFixtureJsError;
