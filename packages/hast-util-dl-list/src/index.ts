/**
 * hast handlers for rendering mdast definition lists (<dl>, <dt>, <dd>).
 *
 * This package provides **handlers only** and is intended to be used with
 * `remark-rehype` / `mdast-util-to-hast`.
 */
export { dlListHandlers } from './handlers'

export type { HastState, MdastNode, HastElement } from './types'
