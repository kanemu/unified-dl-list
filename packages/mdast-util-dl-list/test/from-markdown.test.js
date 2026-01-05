import test from "node:test";
import assert from "node:assert/strict";

import { fromMarkdown } from "mdast-util-from-markdown";
import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown } from '../dist/index.js'

test("parses a basic definition list into mdast nodes", async (t) => {
    const md = [
        ": Apple",
        "    : Red *fruit*",
        ""
    ].join("\n");

    const tree = fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    });

    // root -> definitionList
    await t.test("root", async (t) => {
        assert.equal(tree.type, "root");
        assert.equal(tree.children.length, 1);
    })

    const list = tree.children[0];
    await t.test("definitionList", async (t) => {
        assert.equal(list.type, "definitionList");
        assert.equal(list.children.length, 1);
    })

    const item = list.children[0];
    await t.test("definitionItem", async (t) => {
        assert.equal(item.type, "definitionItem");
        assert.equal(item.children.length, 2);
    })

    const term = item.children[0];
    await t.test("definitionTerm", async (t) => {
        assert.equal(term.type, "definitionTerm");
        assert.equal(term.children.length, 1);
        assert.equal(term.children[0].type, "text");
        assert.equal(term.children[0].value, "Apple");
    })

    const desc = item.children[1];
    await t.test("definitionDescription", async (t) => {
        assert.equal(desc.type, "definitionDescription");
        assert.equal(desc.children.length, 2);
    })

    const p = desc.children[0];
    await t.test("definitionDescription", async (t) => {
        assert.equal(desc.children[0].type, "text");
        assert.equal(desc.children[0].value, "Red ");
    })

    const p0 = desc.children[0];
    await t.test("description text 0", async (t) => {
        assert.equal(p0.type, "text");
        assert.equal(p0.value, "Red ");
    })

    const p1 = desc.children[1];
    await t.test("description text 1", async (t) => {
        assert.equal(p1.type, "emphasis");
        assert.equal(p1.children[0].type, "text");
        assert.equal(p1.children[0].value, "fruit");
    })
});
