import type { Extension, HtmlExtension } from "micromark-util-types";

export type DlListHtmlOptions = {
    maxDepth?: number;
};

export function dlListHtml(options?: DlListHtmlOptions): HtmlExtension;
