import type { Data, PhrasingContent, RootContent } from 'mdast'
import type { Extension } from 'mdast-util-from-markdown'
import type { Position } from 'unist'

export type DlListFromMarkdownOptions = {
    /**
     * Maximum nesting depth when re-parsing nested definition lists inside dd.
     * This is a recursion guard to avoid infinite reparsing.
     *
     * Default: 8
     */
    maxDepth?: number

    /**
     * Extra micromark syntax extensions to apply when re-parsing dt/dd content.
     * Example: gfmStrikethrough()
     *
     * NOTE: dl-list itself will be appended internally.
     */
    extensions?: Extension[]

    /**
     * Extra mdast extensions to apply when re-parsing dt/dd content.
     * Example: gfmStrikethroughFromMarkdown()
     *
     * NOTE: dl-list mdast extension will be appended internally.
     */
    mdastExtensions?: Extension[]
}

/**
 * Minimal “Parent-like” shape for custom mdast nodes.
 *
 * We intentionally do NOT extend mdast.Parent because it fixes the element type
 * of `children` (often RootContent[] or similar), which conflicts with our custom
 * child unions.
 */
export interface DlParent {
    children: unknown[]
    data?: Data
    position?: Position
}

/**
 * `<dl>`
 */
export interface DefinitionList extends DlParent {
    type: 'definitionList'
    children: DefinitionItem[]
}

/**
 * A group of `<dt>` + `<dd>*` inside a `<dl>`.
 */
export interface DefinitionItem extends DlParent {
    type: 'definitionItem'
    children: Array<DefinitionTerm | DefinitionDescription>
}

/**
 * `<dt>` (inline only)
 */
export interface DefinitionTerm extends DlParent {
    type: 'definitionTerm'
    children: PhrasingContent[]
}

/**
 * `<dd>`
 *
 * NOTE:
 * - dd can contain inline phrasing nodes AND flow/root children
 *   when we re-parse container blocks inside dd.
 * - We intentionally store inline phrasing nodes directly under dd (no <p> wrapper),
 *   to match the HTML renderer behavior.
 */
export interface DefinitionDescription extends DlParent {
    type: 'definitionDescription'
    children: Array<PhrasingContent | RootContent>
}

export type DefinitionNode =
    | DefinitionList
    | DefinitionItem
    | DefinitionTerm
    | DefinitionDescription
