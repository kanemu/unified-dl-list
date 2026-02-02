import { markdownLineEnding } from 'micromark-util-character'
import { codes } from 'micromark-util-symbol'
import { MAX_PREFIX_COLS } from './constants.js'
import {
    isEof,
    isIndent,
    consumeSafe,
    advanceColumn,
    consumeLineEndingSafe
} from './util.js'
import {
    checkPrefixFactory,
    checkAfterEolContinueFactory,
    checkDlStartFactory
} from './lookahead.js'

/**
 * Tokenize a dl-list at flow level.
 *
 * @internal
 * @this {import('micromark-util-types').TokenizeContext}
 * @param {import('micromark-util-types').Effects} effects
 * @param {import('micromark-util-types').State} ok
 * @param {import('micromark-util-types').State} nok
 * @returns {import('micromark-util-types').State}
 */
export function tokenizeDlList(effects, ok, nok) {
    /** @type {number} */
    let baseIndent = 0

    /** @type {number} */
    let ddIndent = 4

    /** @type {'term'|'desc'|null} */
    let lastField = null

    /** @type {boolean} */
    let listOpen = false
    /** @type {boolean} */
    let itemOpen = false
    /** @type {boolean} */
    let termOpen = false
    /** @type {boolean} */
    let descOpen = false
    /** @type {boolean} */
    let termTextOpen = false

    /** @type {boolean} */
    let ddMarkerHadSpace = false

    const closeTermTextIfOpen = () => {
        if (termTextOpen) {
            effects.exit('dlTermText')
            termTextOpen = false
        }
    }

    const closeTermIfOpen = () => {
        closeTermTextIfOpen()
        if (termOpen) {
            effects.exit('dlTerm')
            termOpen = false
        }
    }

    const closeDescIfOpen = () => {
        if (descOpen) {
            effects.exit('dlDesc')
            descOpen = false
        }
    }

    const closeFieldIfOpen = () => {
        closeDescIfOpen()
        closeTermIfOpen()
        lastField = null
    }

    const closeItemIfOpen = () => {
        closeFieldIfOpen()
        if (itemOpen) {
            effects.exit('dlItem')
            itemOpen = false
        }
    }

    const closeAll = () => {
        closeItemIfOpen()
        if (listOpen) {
            effects.exit('dlList')
            listOpen = false
        }
    }

    const start = (code) => {
        baseIndent = 0
        ddIndent = 4
        lastField = null
        listOpen = false
        itemOpen = false
        termOpen = false
        descOpen = false
        termTextOpen = false
        return prefix(code, 0)
    }

    const prefix = (code, col) => {
        if (isEof(code)) return nok(code)

        if (code === codes.colon) {
            if (col > 3) return nok(code)

            return effects.check(
                checkDlStartFactory(col, col + 4),
                onOk,
                nok
            )(code)

            function onOk() {
                baseIndent = col
                ddIndent = baseIndent + 4
                effects.enter('dlList')
                listOpen = true
                return termMarker(code)
            }
        }

        if (isIndent(code) && col < MAX_PREFIX_COLS) {
            return effects.check(checkPrefixFactory(), onOk, nok)(code)
            function onOk() {
                return prefixConsume(code, 0)
            }
        }

        return nok(code)
    }

    const prefixConsume = (code, col) => {
        if (isEof(code)) return nok(code)

        if (code === codes.colon) {
            if (col > 3) return nok(code)

            return effects.check(
                checkDlStartFactory(col, col + 4),
                onOk,
                nok
            )(code)

            function onOk() {
                baseIndent = col
                ddIndent = baseIndent + 4
                effects.enter('dlList')
                listOpen = true
                return termMarker(code)
            }
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

    const afterMarkerToTerm = (code) => {
        if (isEof(code) || markdownLineEnding(code)) return afterEol(code)

        if (isIndent(code)) {
            effects.enter('dlMarkerSpace')
            consumeSafe(effects, code)
            effects.exit('dlMarkerSpace')
            return termTextStart
        }

        return termTextStart(code)
    }

    const termTextStart = (code) => {
        effects.enter('dlTermText')
        termTextOpen = true
        return termText(code)
    }

    const termText = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            effects.exit('dlTermText')
            termTextOpen = false
            return afterEol(code)
        }
        consumeSafe(effects, code)
        return termText
    }

    const afterEol = (code) => {
        if (isEof(code)) {
            closeAll()
            return ok(code)
        }
        if (!markdownLineEnding(code)) return nok(code)

        // Decide whether to continue *before* claiming the line ending.
        // If we stop here, leave the line ending to the parent tokenizer.
        return effects.check(
            checkAfterEolContinueFactory(),
            onContinue,
            onStop
        )(code)

        function onContinue() {
            consumeLineEndingSafe(effects, code)
            return lineStart
        }

        function onStop() {
            closeAll()
            return ok(code)
        }
    }

    const lineStart = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            closeAll()
            return ok(code)
        }

        if (code === codes.colon) {
            closeFieldIfOpen()
            return termMarker(code)
        }

        if (isIndent(code)) return scanIndent(code, 0)

        closeAll()
        return ok(code)
    }

    const scanIndent = (code, col) => {
        if (isEof(code)) {
            closeAll()
            return ok(code)
        }

        if (isIndent(code) && col < 512) {
            effects.enter('dlIndent')
            consumeSafe(effects, code)
            effects.exit('dlIndent')

            const nextCol = advanceColumn(col, code)
            return (c) => scanIndent(c, nextCol)
        }

        if (col >= ddIndent && code === codes.colon) {
            closeTermIfOpen()
            return descMarker(code)
        }

        if (col === baseIndent && code === codes.colon) {
            closeFieldIfOpen()
            return termMarker(code)
        }

        if (col > baseIndent) {
            if (!termOpen && !descOpen) {
                closeAll()
                return ok(code)
            }
            return continuationLine(code)
        }

        closeAll()
        return ok(code)
    }

    const descMarker = (code) => {
        if (isEof(code) || code !== codes.colon) return nok(code)

        closeDescIfOpen()
        ddMarkerHadSpace = false

        effects.enter('dlDesc')
        descOpen = true
        lastField = 'desc'

        consumeSafe(effects, code) // ':'
        return afterMarkerToDesc
    }

    const afterMarkerToDesc = (code) => {
        if (isEof(code)) return afterEol(code)

        // IMPORTANT:
        // Even if the dd marker line ends immediately, open a container so
        // subsequent indented lines become part of this dd.
        // (This removes the need for dlDescText.)
        if (markdownLineEnding(code)) {
            const t = effects.enter('dlDescContainer')
            // @ts-ignore
            t._dlIndent = ddIndent
            return descContainerContent(code)
        }

        // dd マーカー直後のスペースはコンテナに入れない（見た目調整用）
        if (isIndent(code)) {
            ddMarkerHadSpace = true
            effects.enter('dlMarkerSpace')
            consumeSafe(effects, code)
            effects.exit('dlMarkerSpace')
            return afterMarkerToDesc
        }

        const t = effects.enter('dlDescContainer')
        // html.js が参照する deindent 量（columns）
        // @ts-ignore
        t._dlIndent = ddIndent

        return descContainerContent(code)
    }

    const descContainerContent = (code) => {
        if (isEof(code)) {
            effects.exit('dlDescContainer')
            closeAll()
            return ok(code)
        }

        if (markdownLineEnding(code)) {
            return effects.check(
                checkAfterEolContinueFactory(),
                onContinue,
                onStop
            )(code)

            function onContinue() {
                consumeLineEndingSafe(effects, code)
                return descContainerLineStart
            }

            function onStop() {
                effects.exit('dlDescContainer')
                closeAll()
                return ok(code)
            }
        }

        consumeSafe(effects, code)
        return descContainerContent
    }

    const descContainerLineStart = (code) => {
        if (isEof(code)) {
            effects.exit('dlDescContainer')
            closeAll()
            return ok(code)
        }

        if (markdownLineEnding(code)) {
            // 空行はコンテナに含める（段落分離に必要）
            consumeLineEndingSafe(effects, code)
            return descContainerLineStart
        }

        // 次行が ":" で始まる (= 次の term / 同階層) 場合、dd コンテナを閉じて tokenizer 側で処理
        if (code === codes.colon) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return lineStart(code)
        }

        if (isIndent(code)) return descContainerScanIndent(code, 0)

        // インデント無しは dl-list 終了
        effects.exit('dlDescContainer')
        closeAll()
        return ok(code)
    }

    const descContainerScanIndent = (code, col) => {
        if (isEof(code)) {
            effects.exit('dlDescContainer')
            closeAll()
            return ok(code)
        }

        if (isIndent(code) && col < 512) {
            // コンテナなので indent もそのまま入れる
            consumeSafe(effects, code)
            const nextCol = advanceColumn(col, code)
            return (c) => descContainerScanIndent(c, nextCol)
        }

        if (col === baseIndent && code === codes.colon) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return termMarker(code)
        }

        // 深いインデントの ":" は dd 本文（入れ子 dl 等）の可能性があるので閉じない
        if (col === ddIndent && code === codes.colon) {
            effects.exit('dlDescContainer')
            closeDescIfOpen()
            return descMarker(code)
        }

        // それ以外は dd 本文継続（この行の残りを食う）
        return descContainerContent(code)
    }

    const continuationLine = (code) => {
        effects.enter('dlHardBreak')
        effects.exit('dlHardBreak')

        if (lastField === 'term' && termOpen) {
            effects.enter('dlTermText')
            termTextOpen = true
            return contTextAsTerm(code)
        }

        if (lastField === 'desc' && descOpen) {
            // Fallback safety:
            // If we ever reach here with an open dd but no container,
            // treat continuation as dd container content (no dlDescText).
            const t = effects.enter('dlDescContainer')
            // @ts-ignore
            t._dlIndent = ddIndent
            return descContainerContent(code)
        }

        closeAll()
        return ok(code)
    }

    const contTextAsTerm = (code) => {
        if (isEof(code) || markdownLineEnding(code)) {
            effects.exit('dlTermText')
            termTextOpen = false
            return afterEol(code)
        }
        consumeSafe(effects, code)
        return contTextAsTerm
    }

    return start
}
