/**
 * Tab width used for column calculation.
 * CommonMark / micromark treat a tab stop as 4 columns in indentation contexts.
 *
 * @type {number}
 */
export const TAB_SIZE = 4

/**
 * Upper bound (exclusive) of indentation columns allowed before `:` to start a dl-list construct.
 *
 * - CommonMark list rule allows up to 3 columns of indentation (0–3).
 * - We keep it as an exclusive upper bound so callers can write `col < MAX_PREFIX_COLS`.
 *
 * @type {number}
 */
export const MAX_PREFIX_COLS = 4
