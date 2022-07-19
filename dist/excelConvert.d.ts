import mysql2 from 'mysql2/promise';
import { DBFixtureOption } from './DBFixtureOption';
import { TableData } from './TableData';
export declare function excel2TableData(excelFilePath: string, dbConn: mysql2.Connection, options: Required<DBFixtureOption>): Promise<TableData[]>;
