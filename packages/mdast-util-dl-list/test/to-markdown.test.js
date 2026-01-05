import test from 'node:test'
import assert from 'node:assert/strict'
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';

import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown, dlListToMarkdown } from '../dist/index.js'

function processor(md) {
    const tree = fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    });
    const out = toMarkdown(tree, {
        extensions: [dlListToMarkdown()]
    });
    return out;
}

function stableStringify(md) {
    // stringify → parse → stringify を2回やって固定点になるか確認
    const a = processor(md)
    const b = processor(a)
    const c = processor(b)
    return { a, b, c }
}

test('dl: basic dt/dd (no blank lines inserted)', async (t) => {

    const input = `\
: term1
    : description1-1
    : description1-2
: term2
    : description2-1
    : description2-2
`;

    const { a, b, c } = stableStringify(input)

    await t.test('Stable after second use (b===c)', async () => {
        assert.equal(b, c)
    })

    await t.test('Expected form (empty lines are not inserted automatically)', async () => {
        assert.equal(
            b,
            `\
: term1
    : description1-1
    : description1-2
: term2
    : description2-1
    : description2-2
`
        )
    })
})

test('dl: only dt (no desc)', async (t) => {
    const input = `\
: term1
: term2
: term3
`;

    const { b, c } = stableStringify(input)
    await t.test('Stable after second use (b===c)', async () => {
        assert.equal(b, c)
    })

    await t.test('only by dt', async () => {
        assert.equal(
            b,
            `\
: term1
: term2
: term3
`
        )
    })
})

test('dl: colon in same line is preserved (12:30)', async (t) => {
    const input = `\
: 12:30
    : lunch and break
`;

    const { b, c } = stableStringify(input)
    assert.equal(b, c)

    assert.equal(
        b,
        `\
: 12:30
    : lunch and break
`
    )
})

test('dl: dt/dd continuation lines (no ":" line) are preserved as content lines', async (t) => {

    const input = `\
: term1 line1
  term1 line2
    : description1 line1
      description1 line2
`;

    const { b, c } = stableStringify(input)
    assert.equal(b, c)

    // dt 継続は 2スペ / dd 継続は 6スペ になる（あなたの仕様）
    assert.equal(
        b,
        `\
: term1 line1
  term1 line2
    : description1 line1
      description1 line2
`
    )
})

test('dl: dd can contain list', async (t) => {
    const input = `\
: fruits
    : * apple
      * grape
      * orange
`;

    const { b, c } = stableStringify(input)
    assert.equal(b, c)

    // remark-stringify の list 出力が dd の継続行に入ること
    assert.match(b, /^: fruits\n    : \* apple\n      \* grape\n      \* orange\n$/)
})

test('dl: nested dl inside dd', async () => {

    const input = `\
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
`;

    const { b, c } = stableStringify(input)
    assert.equal(b, c)

    // “nested dl の出力が dd の中でインデントされている”ことだけ見る（細部は stringify に依存しやすい）
    assert.match(b, /^: fruits\n    : : apple\n/)
    assert.match(b, /\n          : Orin\n/)
    assert.match(b, /\n    : grape\n/)
    assert.match(b, /\n    : orange\n$/)
})

test("NOT a dl when next line is non-blank and does not start with ':', space, or tab", () => {
    const input = `\
: this should NOT become a definition list
Still the same paragraph.
`;

    const { b, c } = stableStringify(input)
    assert.equal(b, c)
    assert.match(b, /^: this should NOT become a definition list\nStill the same paragraph.\n$/)
});