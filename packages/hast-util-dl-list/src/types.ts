import type { Element, Text, Comment, Properties } from 'hast'
import type { State } from 'mdast-util-to-hast'
import type { Data } from 'mdast'
import type { Node, Parent } from 'unist'

export type HastState = State

/**
 * hast child nodes produced by mdast-util-to-hast.
 *
 * Equivalent to hast.Content, but spelled out to avoid deprecated alias.
 */
export type HastChild =
    | Element
    | Text
    | Comment

export type HastElement = Element

export type MdastNode = Node &
    Partial<Parent> & {
        data?: (Data & {
            hName?: string
            hProperties?: Properties
            hChildren?: unknown[]
            [key: string]: unknown
        }) | null
    }
