import { DBFixtureConnOption } from './DBFixtureConnOption';
import { DBFixtureOption } from './DBFixtureOption';
export declare class DBFixtureJs {
    private readonly dbConnOpt;
    private readonly options;
    private data?;
    constructor(connOpts: DBFixtureConnOption, options: DBFixtureOption);
    load(filepath: string): Promise<void>;
    private connect;
    private disconnect;
    createSqlFrom(filepath: string): Promise<string[]>;
    private truncateTbl;
    private executeSql;
    cleanUp(): Promise<void>;
}
