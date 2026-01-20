import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { toMarkdown } from 'mdast-util-to-markdown'
import { dlListToMarkdown } from '../dist/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function readJson(relPath) {
    const p = join(__dirname, 'resources', relPath)
    const txt = await readFile(p, 'utf8')
    return JSON.parse(txt)
}

//---
test('to-markdown: basic dt + dd', async () => {
    const md = `\
: term
    : desc
`;

    const tree = await readJson('basic_dt_dd.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: multiple dd for one term', async () => {
    const md = `\
: term
    : desc1
    : desc2
`;

    const tree = await readJson('multiple_dd_for_one_term.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: consecutive dt before a dd', async () => {
    const md = `\
: term1
: term2
    : desc
`;

    const tree = await readJson('consecutive_dt_before_a_dd.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd indented with a tab (tab == ddIndent)', async () => {
    const md = `\
: term1
    : desc
`;

    const tree = await readJson('dd_indented_with_a_tab.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: multiple items (dt resets item)', async () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;

    const tree = await readJson('multiple_items.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dt continuation line (indented, non-colon)', async () => {
    const md = `\
: term line 1
  term line 2
    : desc
`;

    const tree = await readJson('dt_continuation_line.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd marker with no content uses container (no dlDescText)', async () => {
    const md = `\
: term
    : desc
`;

    const tree = await readJson('dd_marker_with_no_content_uses_container.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd markers only, no text', async () => {
    const md = `\
: term
    :
`;

    const tree = await readJson('dd_markers_only_no_text.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd container captures indented continuation lines', async () => {
    const md = `\
: term
    : first line
      second line
`;

    const tree = await readJson('dd_container_captures_indented_continuation_lines.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd container stops before next term', async () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;

    const tree = await readJson('dd_container_stops_before_next_term.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd can nest dl (": : apple" etc)', async () => {
    const md = `\
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
`;

    const tree = await readJson('dd_can_nest_dl.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd can nest dl (more complex structure)', async () => {
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

    const tree = await readJson('more_complex_structure.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: blank line ends to-markdown; following paragraph remains', async () => {
    const md = `\
: term
    : desc

After paragraph.
`;

    const tree = await readJson('following_paragraph_remains.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: does not start when ":" is indented 4+ columns', async () => {
    const md = `\
\`\`\`
: not a dl
\`\`\`
`;

    const tree = await readJson('indented_4_plus_columns.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test("to-markdown in blockquate", async () => {
    const md = `\
> : term1
>     : description1
> : term2
>     : description2
`;

    const tree = await readJson('in_blockquate.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})

test('to-markdown: dd can nest ul', async () => {
    const md = `\
: fruits
    : * apple
      * grape
      * orange
`;

    const tree = await readJson('dd_can_nest_ul.json')
    const result = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    })
    assert.equal(md, result)
})