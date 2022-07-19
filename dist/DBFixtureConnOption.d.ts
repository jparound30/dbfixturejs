export interface DBFixtureConnOption {
    host: string;
    user: string;
    password: string;
    database?: string;
    charset?: string;
    debug?: boolean;
    timezone?: string;
}
