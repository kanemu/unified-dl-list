import type { Content, PhrasingContent, Parent } from "mdast";

export type DlListFromMarkdownOptions = {
    /**
     * Maximum nesting depth when re-parsing nested definition lists inside dd.
     * Mirrors the recursion guard used by the HTML extension.
     *
     * Default: 8
     */
    maxDepth?: number;
};

export type DefinitionList = Parent & {
    type: "definitionList";
    children: DefinitionItem[];
};

export type DefinitionItem = Parent & {
    type: "definitionItem";
    children: Array<DefinitionTerm | DefinitionDescription>;
};

export type DefinitionTerm = Parent & {
    type: "definitionTerm";
    children: PhrasingContent[];
};

export type DefinitionDescription = Parent & {
    type: "definitionDescription";
    /**
     * dd can contain phrasing (paragraph children) and/or block content
     * (lists, nested definition lists, paragraphs, etc.)
     */
    children: Content[];
};
