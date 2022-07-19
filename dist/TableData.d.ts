import { DBColumnType } from './DBColumnType';
export declare type RowData = Array<string | number | Date | null>;
export declare type ColumnTypes = Array<{
    columnName: string;
    columnType: DBColumnType;
}>;
export declare class TableData {
    readonly schemaName: string | null;
    readonly name: string;
    data: RowData[];
    columnTypes: ColumnTypes;
    readonly emptyStr: string;
    get tableName(): string;
    constructor(init: {
        schemaName?: string;
        name: string;
        data?: RowData[];
        columnTypes: ColumnTypes;
        emptyStr: string;
    });
    createInsertSql(): string;
}
