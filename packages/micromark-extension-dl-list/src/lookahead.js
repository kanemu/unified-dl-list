import { markdownLineEnding } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import { MAX_PREFIX_COLS } from './constants.js'
import { isEof, isIndent, consumeSafe, advanceColumn } from './util.js'

/**
 * Lookahead tokenizers used by dl-list to confirm start / continuation without consuming input.
 *
 * These are separated from tokenize.js to keep the main tokenizer readable.
 */

/**
 * Check whether the current line can start dl-list after optional indentation (<= 3 cols).
 * Succeeds when it can reach ':' before exceeding MAX_PREFIX_COLS.
 */
export function checkPrefixFactory() {
    return {
        tokenize(effects2, ok2, nok2) {
            let col = 0
            return start2

            /** @type {import('micromark-util-types').State} */
            function start2(code) {
                if (isEof(code)) return nok2(code)
                if (code === codes.colon) return ok2(code)

                if (isIndent(code) && col < MAX_PREFIX_COLS) {
                    col = advanceColumn(col, code)
                    consumeSafe(effects2, code)
                    if (col > MAX_PREFIX_COLS) return nok2(code)
                    return start2
                }

                return nok2(code)
            }
        }
    }
}

/**
 * Check whether the dl-list should continue after a line ending.
 *
 * - ok when next line begins with ':' or indentation
 * - stop on blank line (do not consume blank-line EOL in the main tokenizer)
 */
export function checkAfterEolContinueFactory() {
    return {
        tokenize(effects2, ok2, nok2) {
            let opened = false
            return start2

            function start2(code) {
                if (isEof(code)) return ok2(code)
                if (!markdownLineEnding(code)) return nok2(code)

                effects2.enter('dlCheck')
                opened = true

                // consume the line ending so we can inspect the next line head
                effects2.consume(code)
                return head
            }

            function head(code) {
                if (isEof(code)) return endOk(code)
                if (markdownLineEnding(code)) return endNok(code) // blank line -> stop
                if (code === codes.colon) return endOk(code)
                if (isIndent(code)) return endOk(code)
                return endNok(code)
            }

            function endOk(code) {
                if (opened) {
                    effects2.exit('dlCheck')
                    opened = false
                }
                return ok2(code)
            }

            function endNok(code) {
                if (opened) {
                    effects2.exit('dlCheck')
                    opened = false
                }
                return nok2(code)
            }
        }
    }
}

/**
 * Check whether a ':' at baseIndent can start a dl-list.
 *
 * Requires:
 * - the ':' line itself exists
 * - next line is EOF or blank, OR
 * - next line begins with ':' at baseIndent or ddIndent, OR
 * - next line is indented beyond baseIndent (continuation for dt)
 */
export function checkDlStartFactory(baseIndentArg, ddIndentArg) {
    return {
        tokenize(effects2, ok2, nok2) {
            let col = 0
            let opened = false
            return start2

            function start2(code) {
                if (isEof(code)) return nok2(code)
                if (code !== codes.colon) return nok2(code)

                effects2.enter('dlCheck')
                opened = true

                effects2.consume(code) // ':'
                return restOfLine
            }

            function restOfLine(code) {
                if (isEof(code)) return endOk(code)

                if (markdownLineEnding(code)) {
                    effects2.consume(code) // consume EOL to inspect next line head
                    col = 0
                    return nextLineHead
                }

                effects2.consume(code)
                return restOfLine
            }

            function nextLineHead(code) {
                if (isEof(code)) return endOk(code)              // allow EOF
                if (markdownLineEnding(code)) return endOk(code) // allow blank line

                if (isIndent(code) && col < 512) {
                    col = advanceColumn(col, code)
                    effects2.consume(code)
                    return nextLineHead
                }

                // next line must start a field: ":" at baseIndent or ddIndent
                if (code === codes.colon && (col === baseIndentArg || col === ddIndentArg)) {
                    return endOk(code)
                }

                // allow an indented, non-blank continuation line for the term
                if (col > baseIndentArg) return endOk(code)

                return endNok(code)
            }

            function endOk(code) {
                if (opened) {
                    effects2.exit('dlCheck')
                    opened = false
                }
                return ok2(code)
            }

            function endNok(code) {
                if (opened) {
                    effects2.exit('dlCheck')
                    opened = false
                }
                return nok2(code)
            }
        }
    }
}
