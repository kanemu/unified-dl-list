import { markdownLineEnding } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'

/**
 * Tab width used for column calculation.
 * CommonMark / micromark treat a tab stop as 4 columns in indentation contexts.
 * @type {number}
 */
const TAB_SIZE = 4

/**
 * Maximum columns allowed before `:` to start a dl-list construct.
 * Mirrors CommonMark list rule: up to 3 columns of indentation are allowed.
 * @type {number}
 */
const MAX_PREFIX_COLS = 4 // 0-3 columns allowed

/**
 * Micromark extension for definition lists.
 *
 * Syntax (flow):
 * - A line whose first non-indentation character within 0–3 columns is `:` starts a dl-list.
 * - The first `:` line is a term (`dt`).
 * - Subsequent lines indented by 4+ columns and starting with `:` are descriptions (`dd`).
 * - Continuation lines (indented, without `:`) are appended to the last opened dt/dd.
 *
 * Notes:
 * - This tokenizer is designed to be reusable for mdast conversion.
 * - We MUST NOT consume indentation for non-dl-list lines (when triggered from space/tab),
 *   because that would corrupt subsequent CommonMark parsing (e.g. ATX headings).
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
            // Can be triggered from space/tab, but prefix() will "check" first and
            // only consume indentation when a dl-list is confirmed.
            [codes.space]: construct,
            [codes.ht]: construct
        }
    }
}

/**
 * Tokenize a dl-list at flow level.
 *
 * The tokenizer is invoked when micromark sees:
 * - a `:` at the start of a line (best case), or
 * - a space/tab at the start of a line (we then *peek* for `:` within 0–3 columns).
 *
 * Token tree (high-level):
 * - dlList
 *   - dlItem*
 *     - dlTerm
 *       - dlTermText (inline text)
 *       - dlHardBreak (for continuation newlines)
 *     - dlDesc?
 *       - dlDescText (inline text)
 *       - dlDescContainer (raw block for nested parsing: ul/ol/dl)
 *
 * @this {import('micromark-util-types').TokenizeContext}
 * @param {import('micromark-util-types').Effects} effects
 * @param {import('micromark-util-types').State} ok
 * @param {import('micromark-util-types').State} nok
 * @returns {import('micromark-util-types').State}
 */
function tokenizeDlList(effects, ok, nok) {
    /** @type {import('micromark-util-types').TokenizeContext} */
    // @ts-ignore - micromark provides tokenize context as `this`
    const self = this // now().column を参照するため

    /**
     * Base indent (columns) of the dl-list marker `:` line.
     * Allowed range is 0–3 columns.
     * @type {number}
     */
    let baseIndent = 0

    /**
     * Indent (columns) for description markers.
     * Computed as baseIndent + 4.
     * @type {number}
     */
    let ddIndent = 4

    /**
     * Which field is currently active (for continuation lines).
     * @type {'term'|'desc'|null}
     */
    let lastField = null

    /** @type {boolean} */
    let itemOpen = false
    /** @type {boolean} */
    let termOpen = false
    /** @type {boolean} */
    let descOpen = false

    /**
     * Close an open dt.
     * @returns {void}
     */
    const closeTermIfOpen = () => {
        if (!termOpen) return
        effects.exit('dlTerm')
        termOpen = false
    }

    /**
     * Close an open dd.
     * @returns {void}
     */
    const closeDescIfOpen = () => {
        if (!descOpen) return
        effects.exit('dlDesc')
        descOpen = false
    }

    /**
     * Close the active dt/dd (if any).
     * @returns {void}
     */
    const closeFieldIfOpen = () => {
        closeDescIfOpen()
        closeTermIfOpen()
        lastField = null
    }

    /**
     * Close the active dlItem (and any dt/dd inside).
     * @returns {void}
     */
    const closeItemIfOpen = () => {
        closeFieldIfOpen()
        if (!itemOpen) return
        effects.exit('dlItem')
        itemOpen = false
    }

    /**
     * Construct used to check (peek) whether a dd container is about to end.
     *
     * We treat a container boundary when the next line begins with:
     * - `:` at EXACT ddIndent (new dd) OR
     * - `:` at EXACT baseIndent (new dt)
     *
     * This check must NOT advance the real parser position.
     *
     * @returns {import('micromark-util-types').Construct}
     */
    function checkContainerBoundaryFactory() {
        return {
            tokenize(effects2, ok2, nok2) {
                let col = 0
                return start2

                /** @type {import('micromark-util-types').State} */
                function start2(code) {
                    if (isEof(code)) return nok2(code)

                    if (isIndent(code)) {
                        col = advanceColumn(col, code)
                        consumeSafe(effects2, code)
                        return start2
                    }

                    if (code === codes.colon) {
                        // dd boundary: EXACT ddIndent
                        if (col === ddIndent) return ok2(code)
                        // term boundary: EXACT baseIndent
                        if (col === baseIndent) return ok2(code)
                    }

                    return nok2(code)
                }
            }
        }
    }

    /**
     * Construct used to check (peek) whether current line is a dl-list starter.
     *
     * Requirement:
     * - Find `:` within 0–3 columns after optional indentation.
     *
     * IMPORTANT:
     * - When dl-list is NOT confirmed, we must not consume indentation in the real tokenizer,
     *   otherwise CommonMark parsing can break (e.g., ATX headings can leak `#`).
     *
     * @returns {import('micromark-util-types').Construct}
     */
    function checkPrefixFactory() {
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
                        consumeSafe(effects2, code) // check内なのでOK
                        if (col > MAX_PREFIX_COLS) return nok2(code)
                        return start2
                    }

                    return nok2(code)
                }
            }
        }
    }

    /**
     * Reset state and begin parsing.
     * @type {import('micromark-util-types').State}
     */
    const start = (code) => {
        baseIndent = 0
        ddIndent = 4
        lastField = null
        itemOpen = false
        termOpen = false
        descOpen = false
        return prefix(code, 0)
    }

    /**
     * Prefix handler.
     *
     * Cases:
     * - If we start on `:`, it's a candidate dl-list marker.
     * - If we start on space/tab, we *peek* for `:` within 0–3 columns.
     *   - If confirmed, we consume indentation and continue.
     *   - If not, we return nok WITHOUT consuming anything.
     *
     * @param {number|null} code
     * @param {number} col
     * @returns {import('micromark-util-types').State | void}
     */
    const prefix = (code, col) => {
        if (isEof(code)) return nok(code)

        // ':' から直接呼ばれた（micromark が先に 0〜3 列インデントを処理した）ケース
        if (code === codes.colon) {
            let indentCols = col

            if (indentCols === 0 && self && typeof self.now === 'function') {
                const pos = self.now()
                if (pos && typeof pos.column === 'number') {
                    // column は 1-origin とみなし、':' 自身の位置を引く
                    indentCols = pos.column - 1
                }
            }

            // 0〜3列以外は dl-list にしない（ul/ol と同じ）
            if (indentCols > 3) return nok(code)

            baseIndent = indentCols
            ddIndent = baseIndent + 4
            effects.enter('dlList')
            return termMarker(code)
        }

        // space/tab から起動した場合：先読みで ':' がある時だけ dl-list として確定
        if (isIndent(code) && col < MAX_PREFIX_COLS) {
            return effects.check(
                checkPrefixFactory(),
                // ok: dl-list 確定 → この後で初めて consume する
                (c) => prefixConsume(c, 0),
                // nok: dl-list ではない → 1文字も consume せず譲る
                nok
            )(code)
        }

        return nok(code)
    }

    /**
     * Consume indentation (0–3 columns) after confirming dl-list via checkPrefixFactory().
     * @type {import('micromark-util-types').State}
     */
    const prefixConsume = (code, col) => {
        if (isEof(code)) return nok(code)

        if (code === codes.colon) {
            // col が正確な baseIndent（0〜3）
            baseIndent = col
            ddIndent = baseIndent + 4
            effects.enter('dlList')
            return termMarker(code)
        }

        if (isIndent(code) && col < MAX_PREFIX_COLS) {
            effects.enter('dlIndent')
            consumeSafe(effects, code)
            effects.exit('dlIndent')

            const nextCol = advanceColumn(col, code)
            if (nextCol > MAX_PREFIX_COLS) return nok(code)

            return (c) => prefixConsume(c, nextCol)
        }

        return nok(code)
    }

    // ---------------- dt ----------------

    /**
     * Parse a dt marker line: `: ...`
     * @type {import('micromark-util-types').State}
     */
    const termMarker = (code) => {
        if (isEof(code) || code !== codes.colon) return nok(code)

        closeItemIfOpen()

        effects.enter('dlItem')
        itemOpen = true

        effects.enter('dlTerm')
        termOpen = true
        lastField = 'term'

        consumeSafe(effects, code) // ':'
        return afterMarkerToTerm
    }

    /**
     * After `:` marker on dt line, optionally consume a single space/tab as marker-space.
     * @type {import('micromark-util-types').State}
     */
    const afterMarkerToTerm = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            return afterEol(code)
        }

        if (isIndent(code)) {
            effects.enter('dlMarkerSpace')
            consumeSafe(effects, code)
            effects.exit('dlMarkerSpace')
            return termTextStart
        }

        return termTextStart(code)
    }

    /**
     * Enter dt text token.
     * @type {import('micromark-util-types').State}
     */
    const termTextStart = (code) => {
        effects.enter('dlTermText')
        return termText(code)
    }

    /**
     * Consume dt text until EOL/EOF.
     * @type {import('micromark-util-types').State}
     */
    const termText = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            effects.exit('dlTermText')
            // dlTerm は閉じない（継続行を dt に入れるため）
            return afterEol(code)
        }
        consumeSafe(effects, code)
        return termText
    }

    // ---------------- eol / next line ----------------

    /**
     * Consume an EOL that belongs to the dl-list (i.e., between dl-list lines).
     * IMPORTANT: If we end the dl-list because of a BLANK LINE, we must NOT consume
     * that blank-line EOL in lineStart(). (See lineStart for the rule.)
     *
     * @type {import('micromark-util-types').State}
     */
    const afterEol = (code) => {
        if (isEof(code)) return closeAll(code)
        if (!markdownLineEnding(code)) return nok(code)

        consumeLineEndingSafe(effects, code)
        return lineStart
    }

    /**
     * Handle the beginning of a new line within dl-list.
     *
     * NOTE: When we encounter a blank line (lineStart sees line ending immediately),
     * we close WITHOUT consuming that line ending, so that CommonMark can see the
     * blank-line boundary (prevents heading leakage like `</dl>#`).
     *
     * @type {import('micromark-util-types').State}
     */
    const lineStart = (code) => {
        if (isEof(code)) return closeAll(code)

        // Blank line -> close WITHOUT consuming the EOL.
        if (markdownLineEnding(code)) {
            return closeAll
        }

        if (code === codes.colon) {
            closeFieldIfOpen()
            return termMarker(code)
        }

        if (isIndent(code)) {
            return scanIndent(code, 0)
        }

        return closeAll(code)
    }

    /**
     * Scan indentation of the current line and decide whether it is:
     * - dd marker line
     * - new dt marker line
     * - continuation line (append to previous dt/dd)
     * - end of dl-list
     *
     * @param {number|null} code
     * @param {number} col
     * @returns {import('micromark-util-types').State | void}
     */
    const scanIndent = (code, col) => {
        if (isEof(code)) return closeAll(code)

        if (isIndent(code) && col < 512) {
            effects.enter('dlIndent')
            consumeSafe(effects, code)
            effects.exit('dlIndent')

            const nextCol = advanceColumn(col, code)
            return (c) => scanIndent(c, nextCol)
        }

        // dd 行
        if (col >= ddIndent && code === codes.colon) {
            closeTermIfOpen()
            return descMarker(code)
        }

        // indent == baseIndent の ':' は次の term
        if (col === baseIndent && code === codes.colon) {
            closeFieldIfOpen()
            return termMarker(code)
        }

        // 継続行
        if (col > baseIndent) {
            if (!termOpen && !descOpen) return closeAll(code)
            return continuationLine(code)
        }

        return closeAll(code)
    }

    // ---------------- dd ----------------

    /**
     * Parse a dd marker line: indentation >= ddIndent, then `: ...`
     * @type {import('micromark-util-types').State}
     */
    const descMarker = (code) => {
        if (isEof(code) || code !== codes.colon) return nok(code)

        closeDescIfOpen()

        effects.enter('dlDesc')
        descOpen = true
        lastField = 'desc'

        consumeSafe(effects, code) // ':'
        return afterMarkerToDesc
    }

    /**
     * After `:` marker on dd line, optionally consume a single space/tab as marker-space.
     * @type {import('micromark-util-types').State}
     */
    const afterMarkerToDesc = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            return afterEol(code)
        }

        if (isIndent(code)) {
            effects.enter('dlMarkerSpace')
            consumeSafe(effects, code)
            effects.exit('dlMarkerSpace')
            return descDecideContainer
        }

        return descDecideContainer(code)
    }

    /**
     * Decide whether the dd content is:
     * - "container" (nested lists/dl) when starts with '-', '*', ':', or digit
     * - plain dd text otherwise
     *
     * @type {import('micromark-util-types').State}
     */
    const descDecideContainer = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            return afterEol(code)
        }

        const isListLike =
            code === codes.dash ||
            code === codes.asterisk ||
            code === codes.colon ||
            isDigit(code)

        if (isListLike) {
            const tok = effects.enter('dlDescContainer')
            // Used by html extension to deindent the raw container text to column 0.
            tok._dlIndent = ddIndent
            return descContainerLine(code)
        }

        effects.enter('dlDescText')
        return descText(code)
    }

    /**
     * Consume dd text until EOL/EOF.
     * @type {import('micromark-util-types').State}
     */
    const descText = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            effects.exit('dlDescText')
            return afterEol(code)
        }
        consumeSafe(effects, code)
        return descText
    }

    // ---------------- dd container ----------------

    /**
     * Consume raw container content until boundary check says it's over.
     * @type {import('micromark-util-types').State}
     */
    const descContainerLine = (code) => {
        if (isEof(code)) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return afterEol(code)
        }

        if (markdownLineEnding(code)) {
            consumeLineEndingSafe(effects, code)
            return descContainerLineStart
        }

        consumeSafe(effects, code)
        return descContainerLine
    }

    /**
     * Start of a new line within dlDescContainer:
     * - If boundary (new dd/new dt) -> stop container
     * - Else continue consuming container
     *
     * NOTE: We do NOT consume the blank-line EOL here; we pass it to closeAll(code).
     *
     * @type {import('micromark-util-types').State}
     */
    const descContainerLineStart = (code) => {
        if (isEof(code)) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return closeAll(code)
        }

        if (markdownLineEnding(code)) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return closeAll(code)
        }

        const boundaryCheck = checkContainerBoundaryFactory()
        return effects.check(boundaryCheck, onBoundary, onContinue)(code)

        /** @type {import('micromark-util-types').State} */
        function onBoundary(c) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return lineStart(c)
        }

        /** @type {import('micromark-util-types').State} */
        function onContinue(c) {
            return descContainerLine(c)
        }
    }

    // ---------------- continuation line ----------------

    /**
     * Continuation line (indented, without `:`) is appended to the current dt/dd.
     * We preserve the newline by emitting a dlHardBreak token.
     *
     * @type {import('micromark-util-types').State}
     */
    const continuationLine = (code) => {
        effects.enter('dlHardBreak')
        effects.exit('dlHardBreak')

        if (lastField === 'term' && termOpen) {
            effects.enter('dlTermText')
            return contTextAs('term', code)
        }

        if (lastField === 'desc' && descOpen) {
            effects.enter('dlDescText')
            return contTextAs('desc', code)
        }

        return closeAll(code)
    }

    /**
     * Consume continuation line text until EOL/EOF and attach to term/desc text token.
     *
     * @param {'term'|'desc'} kind
     * @param {number|null} code
     * @returns {import('micromark-util-types').State}
     */
    const contTextAs = (kind, code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            if (kind === 'term') effects.exit('dlTermText')
            else effects.exit('dlDescText')
            return afterEol(code)
        }
        consumeSafe(effects, code)
        return (c) => contTextAs(kind, c)
    }

    // ---------------- close ----------------

    /**
     * Close dlList and return control to micromark.
     * @type {import('micromark-util-types').State}
     */
    const closeAll = (code) => {
        closeItemIfOpen()
        effects.exit('dlList')
        return ok(code)
    }

    return start
}

// ---------- helpers ----------

/**
 * @param {number|null} code
 * @returns {boolean}
 */
function isEof(code) {
    return code === codes.eof
}

/**
 * True for indentation codes that micromark uses at line starts.
 * @param {number|null} code
 * @returns {boolean}
 */
function isIndent(code) {
    return (
        code === codes.space ||
        code === codes.ht ||
        code === codes.virtualSpace ||
        code === codes.horizontalTab
    )
}

/**
 * @param {number|null} code
 * @returns {boolean}
 */
function isDigit(code) {
    return typeof code === 'number' && code >= codes.digit0 && code <= codes.digit9
}

/**
 * Consume a code only when it represents a real character or micromark’s virtual spaces.
 * Avoid calling effects.consume(null/undefined).
 *
 * @param {import('micromark-util-types').Effects} effects
 * @param {number|null} code
 * @returns {void}
 */
function consumeSafe(effects, code) {
    if (typeof code !== 'number') return
    if (code >= 0 || code === codes.virtualSpace || code === codes.horizontalTab) {
        effects.consume(code)
    }
}

/**
 * Advance column count by one character, respecting TAB_SIZE.
 *
 * @param {number} col
 * @param {number|null} code
 * @returns {number}
 */
function advanceColumn(col, code) {
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
 * - Do not call this in the "blank line ends dl-list" path. In that case, the EOL must
 *   remain for CommonMark to see the blank-line boundary.
 *
 * @param {import('micromark-util-types').Effects} effects
 * @param {number|null} code
 * @returns {void}
 */
function consumeLineEndingSafe(effects, code) {
    if (!markdownLineEnding(code)) return
    effects.enter('dlLineEnding')
    effects.consume(code)
    effects.exit('dlLineEnding')
}
