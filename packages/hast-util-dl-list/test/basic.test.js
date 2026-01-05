import test from "node:test";
import assert from "node:assert/strict";

import { fromMarkdown } from "mdast-util-from-markdown";
import { toHast } from "mdast-util-to-hast";
import { dlList } from "micromark-extension-dl-list";
import { dlListFromMarkdown } from "mdast-util-dl-list";
import { dlListHandlers } from "../lib/index.js";

test("converts definitionList mdast nodes to <dl>/<dt>/<dd>", () => {
    const md = [
        ": Apple",
        "    : Red fruit",
        ""
    ].join("\n");

    const mdast = fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    });

    const hast = toHast(mdast, {
        handlers: {
            ...dlListHandlers()
        }
    });

    // root -> dl
    assert.equal(hast.type, "root");
    assert.equal(hast.children[0].type, "element");
    assert.equal(hast.children[0].tagName, "dl");

    const dl = hast.children[0];
    // inside: dt, dd
    const dt = dl.children[0];
    const dd = dl.children[1];

    assert.equal(dt.tagName, "dt");
    assert.equal(dd.tagName, "dd");
});
