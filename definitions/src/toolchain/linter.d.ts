import { ISnapshotError, Snapshot$, Snapshot, ISink } from './common';
export declare const LINT_ERROR_HEADER: string;
export declare const MISSING_SEMICOLON_ID: string;
export declare const MISSING_SEMICOLON_MESSAGE: string;
/**
 * Lint the source code
 */
export declare function lint(code: string, snapshot?: Snapshot): ISnapshotError[];
export declare function createLinter(snapshot$: Snapshot$): ISink;
