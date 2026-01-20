import { fromMarkdown, type CompileContext, type Extension, type Token } from 'mdast-util-from-markdown'
import { dlList } from 'micromark-extension-dl-list'
import type { DlListFromMarkdownOptions } from './types'
import type { RootContent, PhrasingContent } from 'mdast'

/**
 * mdast extension for dl-list.
 *
 * Current micromark token model (2026-01):
 * - dt inline text comes from `dlTermText` (plus `dlHardBreak` for continuation newline)
 * - dd content is stored in `dlDescContainer` (a flow chunk), which is re-parsed as Markdown
 * - dd does NOT use `dlDescText`
 *
 * Behavior alignment with micromark-extension-dl-list/html.js:
 * - dd container is deindented by `_dlIndent` columns
 * - normalize list-indent and nested-dl-indent inside dd container
 * - if container parses to a single paragraph, unwrap to phrasing directly under dd
 * - dd container is deindented by `_dlIndent` (+ `_dlFirstLineOffset` for `::` shorthand) columns
 */
export function dlListFromMarkdown(options: DlListFromMarkdownOptions = {}): Extension {
    const maxDepth = options.maxDepth ?? 8

    return {
        enter: {
            dlList(this: CompileContext, token: Token) {
                this.enter({ type: 'definitionList', children: [] } as any, token)
            },

            dlItem(this: CompileContext, token: Token) {
                this.enter({ type: 'definitionItem', children: [] } as any, token)
            },

            dlTerm(this: CompileContext, token: Token) {
                // We collect dt raw as text and parse once at exit (so micromark hard-breaks become '\n').
                this.enter({ type: 'definitionTerm', children: [], _dlRaw: '' } as any, token)
            },

            dlDesc(this: CompileContext, token: Token) {
                this.enter({ type: 'definitionDescription', children: [] } as any, token)
            },

            // continuation newline inside dt (tokenizer emits dlHardBreak)
            dlHardBreak(this: CompileContext) {
                const dt = peekTop(this)
                if (dt?.type === 'definitionTerm') {
                    dt._dlRaw += '\n'
                }
            }
        },

        exit: {
            // dt inline text (we keep it as raw; parse at dt exit)
            dlTermText(this: CompileContext, token: Token) {
                const dt = peekTop(this)
                if (dt?.type === 'definitionTerm') {
                    dt._dlRaw += this.sliceSerialize(token)
                }
            },

            // dd body (flow chunk) — main path in current tokenizer
            dlDescContainer(this: CompileContext, token: Token) {
                if (maxDepth <= 0) return

                const dd = peekTop(this)
                if (dd?.type !== 'definitionDescription') return

                let raw = this.sliceSerialize(token)
                const indentCols =
                    ((token as any)._dlIndent ?? 0) + ((token as any)._dlFirstLineOffset ?? 0)

                raw = deindentByColumns(raw, indentCols)
                raw = normalizeFlatListIndentInDd(raw)
                raw = normalizeNestedDlIndentInDd(raw)

                const tree = fromMarkdown(raw, {
                    extensions: [dlList()],
                    mdastExtensions: [dlListFromMarkdown({ maxDepth: maxDepth - 1 })]
                })

                const children = (tree.children ?? []) as RootContent[]

                // Align with HTML: unwrap single <p> into phrasing directly under dd.
                if (children.length === 1 && children[0]?.type === 'paragraph') {
                    dd.children.push(...(((children[0] as any).children ?? []) as PhrasingContent[]))
                } else {
                    dd.children.push(...children)
                }
            },

            dlTerm(this: CompileContext, token: Token) {
                const dt = peekTop(this)
                if (dt?.type === 'definitionTerm') {
                    const raw: string = String(dt._dlRaw ?? '').trimEnd()
                    dt.children = parseInlineToPhrasing(raw)
                    delete dt._dlRaw
                }
                this.exit(token)
            },

            dlDesc(this: CompileContext, token: Token) {
                // dd children are built by dlDescContainer; nothing to finalize here.
                this.exit(token)
            },

            dlItem(this: CompileContext, token: Token) {
                this.exit(token)
            },

            dlList(this: CompileContext, token: Token) {
                this.exit(token)
            }
        }
    }
}

function peekTop(ctx: CompileContext): any | undefined {
    const stack = (ctx as any).stack as any[] | undefined
    if (!stack || stack.length === 0) return
    return stack[stack.length - 1]
}

/**
 * Parse inline markdown into phrasing children.
 * We parse as a tiny document and unwrap a single paragraph if present.
 */
function parseInlineToPhrasing(raw: string): PhrasingContent[] {
    const t = raw.trimEnd()
    if (!t) return []
    const tree = fromMarkdown(t)
    const first = tree.children?.[0]
    if (first?.type === 'paragraph') return (first.children ?? []) as PhrasingContent[]
    return (tree.children ?? []) as any
}

// ---- dd container normalization (must match micromark-extension-dl-list/html.js) ----

const TAB_SIZE = 4

function deindentByColumns(raw: string, cols: number): string {
    if (!cols) return raw
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
                    const r = col % TAB_SIZE
                    const step = r === 0 ? TAB_SIZE : TAB_SIZE - r
                    // cannot split a tab; if it would cross boundary, keep it
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

function isListMarkerLine(line: string): boolean {
    return /^([-*]|\d+\.)\s/.test(line)
}

/**
 * If a dd container starts with a list marker at column 0,
 * outdent subsequent list-marker lines that start with exactly 2 spaces.
 */
function normalizeFlatListIndentInDd(raw: string): string {
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

/**
 * If a dd container starts with ":" at column 0,
 * normalize subsequent ":" lines that were indented by +2 spaces for visual alignment.
 * Remove exactly 2 leading spaces when it turns the indent into a multiple of 4.
 */
function normalizeNestedDlIndentInDd(raw: string): string {
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

        // count leading spaces
        let n = 0
        while (n < line.length && line.charCodeAt(n) === 0x20) n++

        // first non-space is ":" and (n-2) is multiple of 4 -> drop 2 spaces
        if (n >= 2 && line.charCodeAt(n) === 0x3a /* : */ && (n - 2) % 4 === 0) {
            lines[i] = line.slice(2)
        }
    }

    return lines.join('\n')
}
