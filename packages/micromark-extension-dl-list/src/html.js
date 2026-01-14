import { micromark } from 'micromark'
import { dlList } from './syntax.js'

/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

/**
 * @typedef {object} DlListHtmlOptions
 * @property {number} [maxDepth] Maximum recursion depth for nested dl parsing inside dd containers.
 */

function deindentByColumns(raw, cols) {
    if (!cols) return raw

    const text = raw.replace(/\r\n?/g, '\n')
    const lines = text.split('\n')

    return lines
        .map((line) => {
            let col = 0
            let i = 0

            while (i < line.length && col < cols) {
                const ch = line.charCodeAt(i)

                if (ch === 0x20) {
                    col += 1
                    i += 1
                    continue
                }

                if (ch === 0x09) {
                    const r = col % 4
                    const step = r === 0 ? 4 : 4 - r
                    if (col + step > cols) break
                    col += step
                    i += 1
                    continue
                }

                break
            }

            return line.slice(i)
        })
        .join('\n')
}

function isListMarkerLine(line) {
    return /^([-*]|\d+\.)\s/.test(line)
}

function normalizeFlatListIndentInDd(raw) {
    const text = raw.replace(/\r\n?/g, '\n')
    const lines = text.split('\n')

    let firstIdx = -1
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
            firstIdx = i
            break
        }
    }
    if (firstIdx === -1) return raw

    const first = lines[firstIdx]
    if (!isListMarkerLine(first)) return raw

    for (let i = firstIdx + 1; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('  ') && isListMarkerLine(line.slice(2))) {
            lines[i] = line.slice(2)
        }
    }

    return lines.join('\n')
}

function normalizeNestedDlIndentInDd(raw) {
    const text = raw.replace(/\r\n?/g, '\n')
    const lines = text.split('\n')

    let firstIdx = -1
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
            firstIdx = i
            break
        }
    }
    if (firstIdx === -1) return raw
    if (!lines[firstIdx].startsWith(':')) return raw

    for (let i = firstIdx + 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.startsWith('  ')) continue

        let n = 0
        while (n < line.length && line.charCodeAt(n) === 0x20) n++

        if (n >= 2 && line.charCodeAt(n) === 0x3a && (n - 2) % 4 === 0) {
            lines[i] = line.slice(2)
        }
    }

    return lines.join('\n')
}

function renderInlineMarkdown(raw) {
    let html = micromark(raw)
    const m = html.match(/^<p>([\s\S]*)<\/p>\n?$/)
    if (m) return m[1]
    return html
}

/**
 * HTML extension for dl-list tokens.
 *
 * - `dlTermText` is rendered as inline markdown.
 * - `dlDescContainer` is deindented and re-parsed as block markdown (with nested dl support).
 *
 * @param {DlListHtmlOptions=} options
 * @returns {HtmlExtension}
 */
export function dlListHtml(options = {}) {
    const maxDepth = options.maxDepth ?? 8

    /** @type {HtmlExtension} */
    return {
        enter: {
            dlList() {
                this.tag('<dl>')
            },

            dlItem() { },

            dlTerm() {
                this.tag('<dt>')
            },
            dlDesc() {
                this.tag('<dd>')
            },

            dlIndent() { },
            dlMarkerSpace() { },
            dlLineEnding() { },

            dlHardBreak() {
                this.raw('\n')
            },

            dlTermText() { },

            dlDescContainer() { }
        },

        exit: {
            dlList() {
                this.tag('</dl>')
            },

            dlItem() { },

            dlTerm() {
                this.tag('</dt>')
            },
            dlDesc() {
                this.tag('</dd>')
            },

            dlTermText(token) {
                const raw = this.sliceSerialize(token)
                this.raw(renderInlineMarkdown(raw))
            },

            dlIndent() { },
            dlMarkerSpace() { },
            dlLineEnding() { },

            dlDescContainer(token) {
                let raw = this.sliceSerialize(token)
                // For `::` shorthand, tokenizer sets `_dlFirstLineOffset = 1`
                // to compensate the extra ':' column so nested dl aligns.
                raw = deindentByColumns(
                    raw,
                    (token._dlIndent || 0) + (token._dlFirstLineOffset || 0)
                )
                raw = normalizeFlatListIndentInDd(raw)
                raw = normalizeNestedDlIndentInDd(raw)

                if (maxDepth <= 0) {
                    this.raw(micromark(raw))
                    return
                }

                const html = micromark(raw, {
                    extensions: [dlList()],
                    htmlExtensions: [dlListHtml({ maxDepth: maxDepth - 1 })]
                })

                const trimmed = html.replace(/^\s+|\s+$/g, '')
                const m = trimmed.match(/^<p>([\s\S]*)<\/p>$/)
                if (m) {
                    this.raw(m[1])
                    return
                }

                this.raw(html)
            }
        }
    }
}
