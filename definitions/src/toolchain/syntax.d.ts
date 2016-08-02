/**
 * Syntax Utilities
 *
 * @maintainer Evan Sebastian
 */
/**
 * Constants to indicate that feature is banned
 */
export declare const BANNED: number;
/**
 * Check whether a syntax tag can be used in week.
 * @param syntax the syntax tag
 * @param week the week
 * @return 'yes', 'no', or 'banned'
 */
export declare function canUse(syntax: string, week?: number): ('yes' | 'no' | 'banned');
/**
 * Return the minimum week for a syntax to be available.
 * @param syntax the syntax tag
 * @return a week number, or BANNED if the syntax is banned.
 */
export declare function whenCanUse(syntax: string): number;
export declare const BANNED_OPERATORS: {
    '&': boolean;
    '|': boolean;
    '>>': boolean;
    '<<': boolean;
    '^': boolean;
    '~': boolean;
};
