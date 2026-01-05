import { h } from 'hastscript'
import type { Handlers } from 'mdast-util-to-hast'
import type { HastState, MdastNode, HastElement } from './types'

/**
 * Create a <dl> element from a definitionList mdast node.
 */
function createDl(state: HastState, node: MdastNode): HastElement {
    const children = state.all(node as any) as any[]
    const dl = h('dl', children) as HastElement
    state.applyData(node as any, dl)
    return dl
}

/**
 * definitionItem itself does not map to an HTML element.
 * It expands to dt + dd elements.
 */
function createDlItem(state: HastState, node: MdastNode): HastElement[] {
    return state.all(node as any) as HastElement[]
}

/**
 * Create a <dt> element.
 */
function createDt(state: HastState, node: MdastNode): HastElement {
    const children = state.all(node as any) as any[]
    const dt = h('dt', children) as HastElement
    state.applyData(node as any, dt)
    return dt
}

/**
 * Create a <dd> element.
 *
 * mdast-util-dl-list may unwrap a single paragraph into phrasing children:
 * - phrasing-only children -> <dd>desc</dd>
 * - block children (paragraph/list/...) -> <dd><p>...</p>...</dd>
 */
function createDd(state: HastState, node: MdastNode): HastElement {
    const children = state.all(node as any) as any[]
    const dd = h('dd', children) as HastElement
    state.applyData(node as any, dd)
    return dd
}

/**
 * Handlers for mdast definition list nodes.
 *
 * These handlers are meant to be passed to `mdast-util-to-hast` / `remark-rehype`.
 */
export function dlListHandlers(): Handlers {
    return {
        definitionList(state: HastState, node: MdastNode) {
            return createDl(state, node)
        },

        definitionItem(state: HastState, node: MdastNode) {
            return createDlItem(state, node)
        },

        definitionTerm(state: HastState, node: MdastNode) {
            return createDt(state, node)
        },

        definitionDescription(state: HastState, node: MdastNode) {
            return createDd(state, node)
        }
    } as unknown as Handlers
}
