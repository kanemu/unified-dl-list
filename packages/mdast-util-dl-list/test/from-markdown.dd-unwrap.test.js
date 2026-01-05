import test from 'node:test'
import assert from 'node:assert/strict'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown } from '../dist/index.js'

function parse(md) {
    return fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    })
}

function getFirstDl(tree) {
    const dl = tree.children?.find((n) => n.type === 'definitionList')
    assert.ok(dl, 'definitionList not found')
    return dl
}

//---
test('definitionDescription: unwrap single paragraph into phrasing children', async (t) => {
    const md = `\
: term
    : desc
`;

    const tree = parse(md)
    const dl = getFirstDl(tree)
    const item = dl.children[0]
    const dt = item.children[0]
    const dd = item.children[1]

    await t.test("dt.type is 'definitionDescription'", async () => {
        assert.equal(dt.type, 'definitionTerm')
    })
    await t.test("dd.type is 'definitionDescription'", async () => {
        assert.equal(dd.type, 'definitionDescription')
    })

    // unwrap: dd.children should be phrasing nodes (no paragraph wrapper)
    await t.test("dd.children is Array", async () => {
        assert.ok(Array.isArray(dd.children))
    })
    await t.test("dd.children[0].type is not 'paragraph'", async () => {
        assert.notEqual(dd.children[0]?.type, 'paragraph')
    })

    // Typical result: a single text node
    await t.test("dd.children.length is 1", async () => {
        assert.equal(dd.children.length, 1)
    })
    await t.test("dd.children[0].type is 'text'", async () => {
        assert.equal(dd.children.length, 1)
    })
    await t.test("dd.children[0].type is 'text'", async () => {
        assert.equal(dd.children[0].type, 'text')
    })
    await t.test("dd.children[0].value is 'desc'", async () => {
        assert.equal(dd.children[0].value, 'desc')
    })
})


test('definitionDescription: keep multiple block children (no unwrap)', async (t) => {
    const md = `\
: term
    : para1
      
      para2
`;

    const tree = parse(md)

    const dl = getFirstDl(tree)
    const item = dl.children[0]
    const dd = item.children[1]

    await t.test("dd.type is 'definitionDescription'", async () => {
        assert.equal(dd.type, 'definitionDescription')
    })
    await t.test("dd.children is Array", async () => {
        assert.ok(Array.isArray(dd.children))
    })

    // multiple blocks -> not unwrapped into phrasing only
    // Expect paragraphs as block nodes in dd.children
    await t.test("dd.children.length >= 2", async () => {
        assert.ok(dd.children.length >= 2)
    })
    await t.test("dd.children[0].type is 'paragraph'", async () => {
        assert.equal(dd.children[0].type, 'paragraph')
    })
    await t.test("dd.children[1].type is 'paragraph'", async () => {
        assert.equal(dd.children[1].type, 'paragraph')
    })

    // sanity-check text content
    await t.test("dd.children[0].children[0].type is 'text'", async () => {
        assert.equal(dd.children[0].children[0].type, 'text')
    })
    await t.test("dd.children[0].children[0].value is 'para1'", async () => {
        assert.equal(dd.children[0].children[0].value, 'para1')
    })
    await t.test("dd.children[1].children[0].type is 'text'", async () => {
        assert.equal(dd.children[1].children[0].type, 'text')
    })
    await t.test("dd.children[1].children[0].value is 'para2'", async () => {
        assert.equal(dd.children[1].children[0].value.trim(), 'para2')
    })
})

test('definitionDescription: unwrap when dd content is inline markdown', async (t) => {
    const md = `\
: term
    : [link](http://example.com) **bold**
`;

    const tree = parse(md)
    const dl = getFirstDl(tree)
    const item = dl.children[0]
    const dd = item.children[1]

    await t.test("dd.type is 'definitionDescription'", async () => {
        assert.equal(dd.type, 'definitionDescription')
    })
    await t.test("dd.children is Array", async () => {
        assert.ok(Array.isArray(dd.children))
    })

    // unwrap: no paragraph wrapper
    await t.test("dd.children[0].type is not 'paragraph'", async () => {
        assert.notEqual(dd.children[0]?.type, 'paragraph')
    })

    // Expected phrasing nodes: link + text/strong
    await t.test("dd.children sone 'link'", async () => {
        assert.ok(dd.children.some((n) => n.type === 'link'))
    })
    await t.test("dd.children sone 'strong'", async () => {
        assert.ok(dd.children.some((n) => n.type === 'strong'))
    })
})
