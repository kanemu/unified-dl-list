import test from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

import { remarkDlList } from '../dist/index.js'

/**
 * NOTE:
 * - remark-dl-list is a wiring plugin (micromark + from-markdown + to-markdown).
 * - It does not install remark-rehype handlers.
 */

test('remark-dl-list: parses colon-based dl into mdast definitionList', () => {
    const md = [
        ': term1',
        '    : description1-1',
        '    : description1-2',
        ': term2',
        '    : description2-1',
        '    : description2-2',
        '',
        'Still the same paragraph.',
        ''
    ].join('\n')

    const tree = unified().use(remarkParse).use(remarkDlList).parse(md)

    // Find first definitionList node
    const defList = tree.children.find((n) => n.type === 'definitionList')
    assert.ok(defList, 'definitionList should exist')

    assert.equal(defList.type, 'definitionList')
    assert.ok(Array.isArray(defList.children))
    assert.equal(defList.children.length, 2, 'should have 2 definitionItem children')

    const item1 = defList.children[0]
    assert.equal(item1.type, 'definitionItem')

    const dt1 = item1.children.find((n) => n.type === 'definitionTerm')
    assert.ok(dt1, 'definitionTerm should exist in first item')

    const dd1 = item1.children.filter((n) => n.type === 'definitionDescription')
    assert.equal(dd1.length, 2, 'first item should have 2 definitionDescription children')
})

test('remark-dl-list: round-trip stringify does not insert extra blank lines', async () => {
    const md = [
        ': term1',
        '    : description1-1',
        '    : description1-2',
        ': term2',
        '    : description2-1',
        '    : description2-2',
        '',
        'Still the same paragraph.',
        ''
    ].join('\n')

    const file = await unified()
        .use(remarkParse)
        .use(remarkDlList)
        .use(remarkStringify, { bullet: '-', fences: true })
        .process(md)

    const out = String(file)

    console.log(JSON.stringify(out.split(/\n/)));

    const expected = [
        ': term1',
        '    : description1-1',
        '    : description1-2',
        ': term2',
        '    : description2-1',
        '    : description2-2',
        '',
        'Still the same paragraph.',
        ''
    ].join('\n')

    assert.equal(out, expected)
})

test('remark-dl-list: does not affect normal markdown when no dl syntax is present', async () => {
    const md = [
        'This is a paragraph.',
        '',
        '* list',
        '  * nested',
        ''
    ].join('\n')

    const file = await unified()
        .use(remarkParse)
        .use(remarkDlList)
        .use(remarkStringify)
        .process(md)

    assert.equal(String(file), md)
})
