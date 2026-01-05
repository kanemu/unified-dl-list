export type DlListHandlerOptions = {
    /**
     * If true, drop definitionItem wrappers when converting to hast.
     * (Most mdast-to-hast pipelines don't need a wrapper element.)
     *
     * Default: true
     */
    unwrapItem?: boolean;
};
