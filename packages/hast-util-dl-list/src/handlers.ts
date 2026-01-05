import type { ElementContent } from "hast";
import { h } from "hastscript";
import type { Handler } from "mdast-util-to-hast";
import type { DlListHandlerOptions } from "./types.js";

function isElement(node: unknown): node is { type: "element"; tagName: string; children?: unknown } {
    return !!node && typeof node === "object" && (node as any).type === "element";
}

/**
 * If the content is wrapped in a single <p>, unwrap it.
 *
 * mdast-util-to-hast often emits:
 *   <dt><p>…</p></dt>
 *   <dd><p>…</p></dd>
 * for terms/descriptions that are a single mdast paragraph.
 */
function unwrapSingleParagraph(children: ElementContent[]): ElementContent[] {
    if (children.length !== 1) return children;
    const only = children[0];
    if (!isElement(only) || (only as any).tagName !== "p") return children;
    return ((only as any).children ?? []) as ElementContent[];
}

/**
 * Handlers for mdast-util-to-hast.
 *
 * - definitionList -> <dl>
 * - definitionTerm -> <dt>
 * - definitionDescription -> <dd>
 *
 * `definitionItem` is treated as a transparent wrapper by default.
 */
export function dlListHandlers(options: DlListHandlerOptions = {}): Record<string, Handler> {
    const unwrapItem = options.unwrapItem ?? true;

    const handlers: Record<string, Handler> = {
        definitionList(state, node) {
            const children = state.all(node) as unknown as ElementContent[];
            const el = h("dl", children) as any;
            // Apply node.data.hProperties / hName / hChildren etc.
            state.applyData(node, el);
            return el;
        },

        definitionItem(state, node) {
            const children = state.all(node) as unknown as ElementContent[];

            // If you unwrap the item, there is no single element to applyData onto.
            // So data on definitionItem cannot be reflected in HTML in this mode.
            if (unwrapItem) return children as any;

            // Wrapper element when not unwrapping
            const el = h("div", children) as any;
            state.applyData(node, el);
            return el;
        },

        definitionTerm(state, node) {
            const children = unwrapSingleParagraph(state.all(node) as unknown as ElementContent[]);
            const el = h("dt", children) as any;
            state.applyData(node, el);
            return el;
        },

        definitionDescription(state, node) {
            const children = unwrapSingleParagraph(state.all(node) as unknown as ElementContent[]);
            const el = h("dd", children) as any;
            state.applyData(node, el);
            return el;
        }
    };

    return handlers;
}
