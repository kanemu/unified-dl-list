import { micromark } from 'micromark'
import { dlList } from './syntax.js'

/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

/**
 * Deindent each line by given “column” count.
 * - Handles spaces and tabs (tab stop = 4 columns).
 * - Does NOT remove newlines.
 * - If a tab would cross the target boundary, it is kept (cannot be split).
 *
 * @param {string} raw
 * @param {number} cols
 * @returns {string}
 */
function deindentByColumns(raw, cols) {
    if (!cols) return raw

    // Normalize CRLF/CR to LF so “line” means a single '\n' separator
    const text = raw.replace(/\r\n?/g, '\n')
    const lines = text.split('\n')

    return lines
        .map((line) => {
            let col = 0
            let i = 0

            while (i < line.length && col < cols) {
                const ch = line.charCodeAt(i)

                // space
                if (ch === 0x20) {
                    col += 1
                    i += 1
                    continue
                }

                // tab (tab stop = 4)
                if (ch === 0x09) {
                    const r = col % 4
                    const step = r === 0 ? 4 : 4 - r

                    // cannot split a tab; if it would cross the boundary, keep it
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

/**
 * Detect list marker at start (after trimming):
 * - "-", "*"
 * - "1." (and other digits)
 *
 * @param {string} line
 * @returns {boolean}
 */
function isListMarkerLine(line) {
    return /^([-*]|\d+\.)\s/.test(line)
}

/**
 * For dd containers that start with a list marker, additional outdent is needed.
 *
 * Example (after deindentByColumns):
 * - apple
 *   - grape
 *   - orange
 *
 * The continuation lines often keep +2 spaces because original dd marker had ": " (2 cols).
 * We normalize those continuation list marker lines by removing exactly 2 leading spaces
 * when they would otherwise become a nested list unintentionally.
 *
 * @param {string} raw
 * @returns {string}
 */
function normalizeFlatListIndentInDd(raw) {
    const text = raw.replace(/\r\n?/g, '\n')
    const lines = text.split('\n')

    // Find first non-empty line
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

    // If the container starts with a list marker at column 0,
    // outdent *subsequent* list-marker lines that start with exactly 2 spaces.
    for (let i = firstIdx + 1; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('  ') && isListMarkerLine(line.slice(2))) {
            lines[i] = line.slice(2)
        }
    }

    return lines.join('\n')
}

/**
 * Render *inline* markdown to HTML (no surrounding <p>).
 * We parse as a tiny document and strip a single wrapping paragraph if present.
 *
 * @param {string} raw
 * @returns {string}
 */
function renderInlineMarkdown(raw) {
    // micromark will encode unsafe HTML by default, and will parse links/em/strong etc.
    let html = micromark(raw)

    // Common case: micromark wraps inline content in <p>...</p>\n
    // Strip exactly one wrapping paragraph.
    const m = html.match(/^<p>([\s\S]*)<\/p>\n?$/)
    if (m) return m[1]

    // If micromark did not wrap (rare), just return as-is.
    return html
}

/**
 * HTML extension for dl-list tokens.
 *
 * @param {{ maxDepth?: number }=} options
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

            // structural tokens
            dlIndent() { },
            dlMarkerSpace() { },
            dlLineEnding() { },

            // continuation newline inside dt/dd
            dlHardBreak() {
                // keep newline as-is (do not remove)
                this.raw('\n')
            },

            // text tokens: handled on exit
            dlTermText() { },
            dlDescText() { },

            // raw container content for nested parsing
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

            // ★変更点：dt/dd の中身は “インラインとして再パース” して出力
            // これで link/em/strong 等が有効になる
            dlTermText(token) {
                const raw = this.sliceSerialize(token)
                this.raw(renderInlineMarkdown(raw))
            },
            dlDescText(token) {
                const raw = this.sliceSerialize(token)
                this.raw(renderInlineMarkdown(raw))
            },

            dlIndent() { },
            dlMarkerSpace() { },
            dlLineEnding() { },

            dlDescContainer(token) {
                // token._dlIndent is set by syntax tokenizer (ddIndent in columns).
                // Deindent container text so nested Markdown starts at column 0.
                let raw = this.sliceSerialize(token)
                raw = deindentByColumns(raw, token._dlIndent || 0)

                // dd 内で list が意図せずネストしないように正規化
                raw = normalizeFlatListIndentInDd(raw)

                if (maxDepth <= 0) {
                    // fall back to plain text (encoded by micromark if we parse)
                    this.raw(micromark(raw))
                    return
                }

                // Re-parse the container Markdown with dlList enabled so nested dl works.
                const html = micromark(raw, {
                    extensions: [dlList()],
                    htmlExtensions: [dlListHtml({ maxDepth: maxDepth - 1 })]
                })

                // container は block として出力（<ul>/<dl> などがそのまま入る）
                this.raw(html)
            }
        }
    }
}
