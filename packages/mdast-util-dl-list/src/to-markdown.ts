import type { Handle, Join, Unsafe, Info, State } from 'mdast-util-to-markdown'
import type {
    DefinitionList,
    DefinitionItem,
    DefinitionTerm,
    DefinitionDescription
} from './types'

type AnyNode = any

function getState(state: State | undefined, self: any): State {
    return (state ?? self) as State
}

/**
 * to-markdown extension for serializing definition list nodes back to colon-based syntax.
 *
 * This serializer is intentionally strict about *not inserting extra blank lines*
 * inside dl/dt/dd blocks. (Tests rely on this behavior.)
 */
export function dlListToMarkdown(): {
    unsafe: Unsafe[]
    join: Join[]
    handlers: Record<string, Handle>
} {
    const unsafe: Unsafe[] = [
        {
            character: ':',
            atBreak: true,
            // Keep the original constraints to avoid accidental triggering.
            before: '(^|[\\n\\r]) {0,3}$',
            after: '([\\t ]|$)'
        }
    ]

    const join: Join = (left, right, parent) => {
        const type = (parent as any)?.type
        // Prevent the compiler from inserting blank lines between dt/dd inside an item.
        if (type === 'definitionList' || type === 'definitionItem') return 0
        return undefined as any
    }

    const handlers: Record<string, Handle> = {
        definitionList,
        definitionItem,
        definitionTerm,
        definitionDescription
    }

    return { unsafe, join: [join], handlers }

    function definitionList(
        this: State,
        node: DefinitionList,
        parent: AnyNode | undefined,
        state: State | undefined,
        info: Info
    ): string {
        const s = getState(state, this)

        let out = ''
        for (const child of node.children || []) {
            out += s.handle(child as any, node as any, s, info)
        }

        // collapse excessive blank lines *inside* dl
        out = out.replace(/\n{3,}/g, '\n\n')

        // IMPORTANT:
        // Do NOT force a trailing newline here.
        // Let remark-stringify handle block separation.
        out = out.replace(/\n+$/, '')

        return out
    }

    function definitionItem(
        this: State,
        node: DefinitionItem,
        parent: AnyNode | undefined,
        state: State | undefined,
        info: Info
    ): string {
        const s = getState(state, this)

        let out = ''
        for (const child of node.children || []) {
            out += s.handle(child as any, node as any, s, info)
        }

        // 保険：空行が3つ以上連続しないようにする
        out = out.replace(/\n{3,}/g, '\n\n')

        return out
    }

    function definitionTerm(
        this: State,
        node: DefinitionTerm,
        parent: AnyNode | undefined,
        state: State | undefined,
        info: Info
    ): string {
        const s = getState(state, this)

        // NOTE: mdast-util-to-markdown v2 の State#containerPhrasing は (node, info) の形
        const value = (s as any).containerPhrasing(node as any, info).replace(/\s+$/, '')

        // 先頭行は ": "、継続は "  "
        const out = s.indentLines(value, (line: string, i: number) =>
            i === 0 ? `: ${line}` : `  ${line}`
        )

        return out.replace(/\n+$/, '') + '\n'
    }

    function definitionDescription(
        this: State,
        node: DefinitionDescription,
        parent: AnyNode | undefined,
        state: State | undefined,
        info: Info
    ): string {
        const s = getState(state, this)

        // dd は phrasing + flow が混在するので、子を順に handle して連結する。
        // unwrap 済み（children が phrasing 直下）の場合もこのままで問題ない。
        let value = ''
        for (const child of node.children || []) {
            value += s.handle(child as any, node as any, s, info)
        }

        // dd 内で空行が多すぎるケースを抑制（dl 内での見通し用・安全）
        value = value.replace(/\n{3,}/g, '\n\n')

        // 末尾の余計な空白/改行はここで落としてからインデントする
        value = value.replace(/\s+$/, '')

        // 先頭行は "    : "、継続は "      "
        // ただし “空行” はスペースを入れずに完全な空行のままにする
        // （スペースのみの行を量産すると diff が汚れやすい）
        const out = s.indentLines(value, (line: string, i: number) => {
            if (line === '') return ''
            return i === 0 ? `    : ${line}` : `      ${line}`
        })

        return out.replace(/\n+$/, '') + '\n'
    }
}
