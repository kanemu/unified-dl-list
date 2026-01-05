import type { Extension, HtmlExtension } from "micromark-util-types";

export function dlList(): Extension;

export type DlListHtmlOptions = {
    maxDepth?: number;
};

export function dlListHtml(options?: DlListHtmlOptions): HtmlExtension;
