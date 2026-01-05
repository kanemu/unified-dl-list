import type {
    DefinitionList,
    DefinitionItem,
    DefinitionTerm,
    DefinitionDescription
} from './types'

declare module 'mdast' {
    /**
     * Allow definition lists at root / flow level.
     * (Useful for to-markdown join logic and for downstream typing.)
     */
    interface RootContentMap {
        definitionList: DefinitionList
    }

    interface FlowContentMap {
        definitionList: DefinitionList
    }

    /**
     * Allow these nodes as generic parent children.
     * (They are not intended to appear at root level directly, but this keeps typing flexible.)
     */
    interface ParentContentMap {
        definitionItem: DefinitionItem
        definitionTerm: DefinitionTerm
        definitionDescription: DefinitionDescription
    }
}
