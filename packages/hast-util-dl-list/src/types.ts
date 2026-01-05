import type { Element, Properties } from 'hast'
import type { State } from 'mdast-util-to-hast'
import type { Data } from 'mdast'

/**
 * Context object passed to each handler.
 * This is the same `state` object provided by mdast-util-to-hast.
 */
export type HastState = State

/**
 * Minimal shape of mdast nodes this package cares about.
 *
 * - `data.hName`, `data.hProperties`, `data.hChildren` are respected by `state.applyData`.
 * - Keep loose: mdast is extensible and downstream plugins may attach fields.
 */
export interface MdastNode {
    type: string
    children?: MdastNode[]
    data?: Data & {
        hName?: string
        hProperties?: Properties
        hChildren?: MdastNode[]
        [key: string]: unknown
    }
}

/**
 * Resulting hast Element produced by handlers.
 */
export type HastElement = Element
