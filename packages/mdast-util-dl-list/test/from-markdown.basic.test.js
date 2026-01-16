import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown } from '../dist/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parse(md) {
    return fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    })
}

/**
 * Normalize positions so snapshots don't fail due to offset/line/column diffs.
 * If you want positions, remove this and store them in snapshot JSON instead.
 */
function stripPositions(node) {
    if (!node || typeof node !== 'object') return node

    if (Array.isArray(node)) return node.map(stripPositions)

    const out = {}
    for (const [k, v] of Object.entries(node)) {
        if (k === 'position') continue
        out[k] = stripPositions(v)
    }
    return out
}

async function readJson(relPath) {
    const p = join(__dirname, 'resources', relPath)
    const txt = await readFile(p, 'utf8')
    return JSON.parse(txt)
}

//---
test('from-markdown: basic dt + dd', async () => {
    const md = `\
: term
    : desc
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('basic_dt_dd.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: multiple dd for one term', async () => {
    const md = `\
: term
    : desc1
    : desc2
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('multiple_dd_for_one_term.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: multiple items (dt resets item)', async () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('multiple_items.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dt continuation line (indented, non-colon)', async () => {
    const md = `\
: term line 1
  term line 2
    : desc
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dt_continuation_line.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd marker with no content uses container (no dlDescText)', async () => {
    const md = `\
: term
    :
    desc
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_marker_with_no_content_uses_container.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd markers only, no text', async () => {
    const md = `\
: term
    :
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_markers_only_no_text.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd container captures indented continuation lines', async () => {
    const md = `\
: term
    : first line
    second line
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_container_captures_indented_continuation_lines.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd container stops before next term', async () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_container_stops_before_next_term.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd can nest dl (": : apple" etc)', async () => {
    const md = `\
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_can_nest_dl.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd can nest dl (":: apple" etc)', async () => {
    const md = `\
: fruits
    :: apple
         : Orin
         : Fuji
         : Jonagold
    : grape
    : orange
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('dd_can_nest_dl.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: dd can nest dl (more complex structure)', async () => {
    const md = `\
: Apple
    : : Orin
          : The name comes from “king of apples”
      : Fuji
          : The apple variety that originated in Japan
            and is the most produced around the world.
      : Jonagold
          : A popular variety created in America
            by crossing Golden Delicious and Jonathan.
    : There are many other varieties as well.
: Grapes
    : purple, clustered fruit
: Melon
    : covered in a green, hard skin
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('more_complex_structure.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: blank line ends from-markdown; following paragraph remains', async () => {
    const md = `\
: term
    : desc

After paragraph.
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('following_paragraph_remains.json')

    assert.deepEqual(actual, expected)
})

test('from-markdown: does not start when ":" is indented 4+ columns', async () => {
    const md = `\
    : not a dl
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('indented_4_plus_columns.json')

    assert.deepEqual(actual, expected)
})

test("from-markdown in blockquate", async () => {
    const md = `\
> : term1
>     : description1
> : term2
>     : description2
`;

    const actual = stripPositions(parse(md))
    const expected = await readJson('in_blockquate.json')

    assert.deepEqual(actual, expected)
})
