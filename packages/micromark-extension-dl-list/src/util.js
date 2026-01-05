import { markdownLineEnding } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import { TAB_SIZE } from './constants.js'

/**
 * @param {number|null} code
 * @returns {boolean}
 */
export function isEof(code) {
    return code === codes.eof
}

/**
 * True for indentation codes that micromark uses at line starts.
 *
 * @param {number|null} code
 * @returns {boolean}
 */
export function isIndent(code) {
    return (
        code === codes.space ||
        code === codes.ht ||
        code === codes.virtualSpace ||
        code === codes.horizontalTab
    )
}

/**
 * Consume a code only when it represents a number.
 * (micromark uses negative “virtual” codes too; those are still numbers and are valid to consume.)
 *
 * @param {import('micromark-util-types').Effects} effects
 * @param {number|null} code
 * @returns {void}
 */
export function consumeSafe(effects, code) {
    if (typeof code !== 'number') return
    effects.consume(code)
}

/**
 * Advance column count by one character, respecting TAB_SIZE.
 *
 * @param {number} col
 * @param {number|null} code
 * @returns {number}
 */
export function advanceColumn(col, code) {
    if (code === codes.ht || code === codes.horizontalTab) {
        const r = col % TAB_SIZE
        return col + (r === 0 ? TAB_SIZE : TAB_SIZE - r)
    }
    return col + 1
}

/**
 * Consume a line ending as a token (`dlLineEnding`) so downstream can reason about it.
 *
 * NOTE:
 * - Do not call this in the "blank line ends dl-list" path.
 *   In that case, the EOL must remain for CommonMark to see the blank-line boundary.
 *
 * @param {import('micromark-util-types').Effects} effects
 * @param {number|null} code
 * @returns {void}
 */
export function consumeLineEndingSafe(effects, code) {
    if (!markdownLineEnding(code)) return
    effects.enter('dlLineEnding')
    effects.consume(code)
    effects.exit('dlLineEnding')
}
