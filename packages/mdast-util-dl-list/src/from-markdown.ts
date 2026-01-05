import { fromMarkdown, type CompileContext, type Extension, type Token } from "mdast-util-from-markdown";
import { dlList } from "micromark-extension-dl-list";
import type {
    DlListFromMarkdownOptions,
    DefinitionDescription,
    DefinitionItem,
    DefinitionList,
    DefinitionTerm
} from "./types.js";

/**
 * Tab width used for column calculation (match html.js).
 * CommonMark/micromark treat a tab stop as 4 columns in indentation contexts.
 */
const TAB_SIZE = 4;

/**
 * mdast extension for parsing definition lists.
 *
 * Converts micromark `dlList` tokens into mdast nodes:
 *
 * - definitionList
 *   - definitionItem
 *     - definitionTerm
 *     - definitionDescription
 */
export function dlListFromMarkdown(options: DlListFromMarkdownOptions = {}): Extension {
    const maxDepth = options.maxDepth ?? 8;

    return {
        enter: {
            dlList(this: CompileContext, token: Token) {
                const node: DefinitionList = { type: "definitionList", children: [] };
                this.enter(node as any, token);
            },

            dlItem(this: CompileContext, token: Token) {
                const node: DefinitionItem = { type: "definitionItem", children: [] };
                this.enter(node as any, token);
            },

            dlTerm(this: CompileContext, token: Token) {
                const node: DefinitionTerm = { type: "definitionTerm", children: [] };
                (node as any)._dlRaw = "";
                this.enter(node as any, token);
            },

            dlDesc(this: CompileContext, token: Token) {
                const node: DefinitionDescription = { type: "definitionDescription", children: [] };
                (node as any)._dlRaw = "";
                this.enter(node as any, token);
            },

            // newline inside dt/dd (continuation)
            dlHardBreak(this: CompileContext) {
                const n = peekTop(this);
                if (n && (n.type === "definitionTerm" || n.type === "definitionDescription")) {
                    (n as any)._dlRaw = ((n as any)._dlRaw ?? "") + "\n";
                }
            }
        },

        exit: {
            dlTermText(this: CompileContext, token: Token) {
                const n = peekTop(this);
                if (n?.type !== "definitionTerm") return;
                (n as any)._dlRaw = ((n as any)._dlRaw ?? "") + this.sliceSerialize(token);
            },

            dlDescText(this: CompileContext, token: Token) {
                const n = peekTop(this);
                if (n?.type !== "definitionDescription") return;
                (n as any)._dlRaw = ((n as any)._dlRaw ?? "") + this.sliceSerialize(token);
            },

            dlDescContainer(this: CompileContext, token: Token) {
                if (maxDepth <= 0) return;

                const n = peekTop(this);
                if (n?.type !== "definitionDescription") return;

                // flush inline text before inserting blocks
                flushInlineIntoDescription(n);

                let raw = this.sliceSerialize(token);
                const indentCols = (token as any)._dlIndent ?? 0;

                // mirror html.js order: deindent -> normalize
                raw = deindentByColumns(raw, indentCols);
                raw = normalizeFlatListIndentInDd(raw);

                const root = fromMarkdown(raw, {
                    extensions: [dlList()],
                    mdastExtensions: [dlListFromMarkdown({ maxDepth: maxDepth - 1 })]
                });

                n.children.push(...(root.children as any[]));
            },

            dlTerm(this: CompileContext, token: Token) {
                const term = peekTop(this) as any;
                if (term?.type === "definitionTerm") {
                    const raw = String(term._dlRaw ?? "");
                    term.children = parseInlineToPhrasing(raw);
                    delete term._dlRaw;
                }
                this.exit(token);
            },

            dlDesc(this: CompileContext, token: Token) {
                const desc = peekTop(this) as any;
                if (desc?.type === "definitionDescription") {
                    flushInlineIntoDescription(desc);
                    delete desc._dlRaw;
                }
                this.exit(token);
            },

            dlItem(this: CompileContext, token: Token) {
                this.exit(token);
            },

            dlList(this: CompileContext, token: Token) {
                this.exit(token);
            }
        }
    };
}

function peekTop(ctx: CompileContext): any | undefined {
    const stack = (ctx as any).stack as any[] | undefined;
    if (!stack || stack.length === 0) return;
    return stack[stack.length - 1];
}

function parseInlineToPhrasing(raw: string): any[] {
    const t = raw.trimEnd();
    if (!t) return [];
    const tree = fromMarkdown(t);
    const first = tree.children && tree.children[0];
    if (first && first.type === "paragraph") return first.children || [];
    return tree.children || [];
}

function flushInlineIntoDescription(desc: any) {
    const raw = String(desc._dlRaw ?? "").replace(/\r\n/g, "\n");
    const phrasing = parseInlineToPhrasing(raw);
    if (phrasing.length === 0) return;

    // IMPORTANT:
    // Match html.js output: dd inline content is NOT wrapped in <p>.
    // Store phrasing nodes directly under definitionDescription.
    desc.children.push(...phrasing);

    desc._dlRaw = "";
}

/**
 * Deindent each line by given “column” count.
 * Mirrors html.js deindentByColumns (tab stop = 4, cannot split a tab).
 */
function deindentByColumns(raw: string, cols: number): string {
    if (!cols) return raw;

    const text = raw.replace(/\r\n?/g, "\n");
    const lines = text.split("\n");

    return lines
        .map((line) => {
            let col = 0;
            let i = 0;

            while (i < line.length && col < cols) {
                const ch = line.charCodeAt(i);

                // space
                if (ch === 0x20) {
                    col += 1;
                    i += 1;
                    continue;
                }

                // tab (tab stop = 4). Cannot split a tab.
                if (ch === 0x09) {
                    const r = col % TAB_SIZE;
                    const step = r === 0 ? TAB_SIZE : TAB_SIZE - r;
                    if (col + step > cols) break;
                    col += step;
                    i += 1;
                    continue;
                }

                break;
            }

            return line.slice(i);
        })
        .join("\n");
}

function isListMarkerLine(line: string): boolean {
    // Match html.js list marker detection:
    // - "-", "*"
    // - "1." (and other digits)
    return /^([-*]|\d+\.)\s/.test(line);
}

/**
 * Normalize indentation inside dd so that "flat lists" don't accidentally become nested.
 * Mirrors html.js strategy:
 * If the container starts with a list marker at column 0,
 * outdent subsequent list-marker lines that start with exactly 2 spaces.
 */
function normalizeFlatListIndentInDd(s: string): string {
    const text = s.replace(/\r\n?/g, "\n");
    const lines = text.split("\n");

    // Find first non-empty line
    let firstIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== "") {
            firstIdx = i;
            break;
        }
    }
    if (firstIdx === -1) return s;

    const first = lines[firstIdx];
    if (!isListMarkerLine(first)) return s;

    for (let i = firstIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("  ") && isListMarkerLine(line.slice(2))) {
            lines[i] = line.slice(2);
        }
    }

    return lines.join("\n");
}
