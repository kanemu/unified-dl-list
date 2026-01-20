import { dlList } from "micromark-extension-dl-list";
import { dlListFromMarkdown, dlListToMarkdown } from "mdast-util-dl-list";

import type { Processor } from "unified";
import type { Extension as MicromarkExtension } from "micromark-util-types";
import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";
import type { Options as ToMarkdownOptions } from "mdast-util-to-markdown";

type ToMarkdownExtension =
    NonNullable<ToMarkdownOptions["extensions"]>[number];

/**
 * remark plugin that enables colon-based definition lists using `<dl>`, `<dt>`, and `<dd>`.
 *
 * This plugin wires:
 * - micromark extension (syntax)
 * - mdast from-markdown extension (AST generation)
 * - mdast to-markdown extension (serialization)
 *
 * What this plugin intentionally does NOT do:
 * - It does NOT install `remark-rehype`.
 * - It does NOT register hast handlers automatically.
 *
 * If you need HTML output, combine this plugin with:
 * - `remark-rehype`
 * - `hast-util-dl-list`
 *
 * Example:
 *
 * ```ts
 * unified()
 *   .use(remarkParse)
 *   .use(remarkDlList)
 *   .use(remarkRehype, { handlers: dlListHandlers() })
 * ```
 */
export function remarkDlList(this: Processor): void {
    const data = this.data() as Record<string, unknown>;

    const micromarkExtensions =
        (data.micromarkExtensions as MicromarkExtension[] | undefined) ??
        ((data.micromarkExtensions = []) as MicromarkExtension[]);

    const fromMarkdownExtensions =
        (data.fromMarkdownExtensions as FromMarkdownExtension[] | undefined) ??
        ((data.fromMarkdownExtensions = []) as FromMarkdownExtension[]);

    const toMarkdownExtensions =
        (data.toMarkdownExtensions as ToMarkdownExtension[] | undefined) ??
        ((data.toMarkdownExtensions = []) as ToMarkdownExtension[]);

    // Capture “other” extensions that are already registered at this moment.
    // These will be inherited by dd/dt reparse inside mdast-util-dl-list.
    const inheritedMicromark = micromarkExtensions.slice();
    const inheritedFromMd = fromMarkdownExtensions.slice();

    // Register dl-list itself
    micromarkExtensions.push(dlList());

    // IMPORTANT: pass inherited extensions to dlListFromMarkdown so dd reparse can see them
    fromMarkdownExtensions.push(
        dlListFromMarkdown({
            extensions: inheritedMicromark as any,
            mdastExtensions: inheritedFromMd as any,
        })
    );

    toMarkdownExtensions.push(dlListToMarkdown());
}