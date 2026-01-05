import { codes } from 'micromark-util-symbol'
import { tokenizeDlList } from './tokenize.js'

/**
 * Micromark extension for colon-based definition lists.
 *
 * Syntax (flow):
 * - A line whose first non-indentation character within 0–3 columns is `:` starts a dl-list.
 * - The first `:` line is a term (`dt`).
 * - Subsequent lines indented by 4+ columns and starting with `:` are descriptions (`dd`).
 * - Continuation lines (indented, without `:`) are appended to the last opened dt/dd.
 *
 * Design constraints:
 * - Do not consume indentation unless dl-list is confirmed by lookahead.
 * - Do not consume blank-line EOL that terminates the list.
 *
 * @returns {import('micromark-util-types').Extension}
 */
export function dlList() {
    /** @type {import('micromark-util-types').Construct} */
    const construct = { name: 'dlList', tokenize: tokenizeDlList, concrete: true }

    /** @type {import('micromark-util-types').Extension} */
    return {
        flow: {
            [codes.colon]: construct,
            [codes.space]: construct,
            [codes.ht]: construct
        }
    }
}
