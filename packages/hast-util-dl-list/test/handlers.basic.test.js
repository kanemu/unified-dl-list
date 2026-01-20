import test from "node:test";
import assert from "node:assert/strict";

import { fromMarkdown } from "mdast-util-from-markdown";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown } from '../../mdast-util-dl-list/dist/index.js'
import { dlListHandlers } from "../dist/index.js";

import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'

function render(md) {
    const mdast = fromMarkdown(md, {
        extensions: [dlList()],
        mdastExtensions: [dlListFromMarkdown()]
    });

    const hast = toHast(mdast, {
        handlers: {
            ...dlListHandlers()
        }
    });
    return toHtml(hast);
}

function equalOutput(result, expected) {
    const trimHtml = (html) => {
        return html.replace(/^\s*\</, '<')
            .replace(/\>\s*\</g, '><')
            .replace(/\>\s*$/, '>')
    }
    assert.equal(trimHtml(result), trimHtml(expected))
}

//---
test('handlers: basic dt + dd', () => {
    const md = `\
: term
    : desc
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: multiple dd for one term', () => {
    const md = `\
: term
    : desc1
    : desc2
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc1</dd>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: consecutive dt before a dd', () => {
    const md = `\
: term1
: term2
    : desc
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dt>term2</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: dd indented with a tab (tab == ddIndent)', () => {
    const md = `\
: term1
\t: desc
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: multiple items (dt resets item)', () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc1</dd>
    <dt>term2</dt>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: dt continuation line (indented, non-colon)', () => {
    const md = `\
: term line 1
  term line 2
    : desc
`;
    const html = `\
<dl>
    <dt>term line 1
term line 2</dt>
    <dd>desc</dd>
</dl>
`;
    // NOTE: continuation uses a literal newline (dlHardBreak) inside <dt>.
    equalOutput(render(md), html)
})

test('handlers: dd marker with no content uses container (no dlDescText)', () => {
    const md = `\
: term
    :
    desc
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: dd markers only, no text', () => {
    const md = `\
: term
    :
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd></dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: dd container captures indented continuation lines', () => {
    const md = `\
: term
    : first line
    second line
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>first line
second line</dd>
</dl>
`;
    // dd content is re-parsed; a single <p> is unwrapped, preserving the newline.
    equalOutput(render(md), html)
})

test('handlers: dd container stops before next term', () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc1</dd>
    <dt>term2</dt>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: dd can nest dl (": : apple" etc)', () => {
    const md = `\
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <dl>
      <dt>apple</dt>
      <dd>Orin</dd>
      <dd>Fuji</dd>
      <dd>Jonagold</dd>
    </dl>
  </dd>
  <dd>grape</dd>
  <dd>orange</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('handlers: dd can nest dl (":: apple" etc)', () => {
    const md = `\
: fruits
    :: apple
         : Orin
         : Fuji
         : Jonagold
    : grape
    : orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <dl>
      <dt>apple</dt>
      <dd>Orin</dd>
      <dd>Fuji</dd>
      <dd>Jonagold</dd>
    </dl>
  </dd>
  <dd>grape</dd>
  <dd>orange</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('handlers: dd can nest dl (more complex structure)', () => {
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
    const html = `\
<dl>
    <dt>Apple</dt>
    <dd>
        <dl>
            <dt>Orin</dt>
            <dd>The name comes from “king of apples”</dd>
            <dt>Fuji</dt>
            <dd>The apple variety that originated in Japan
and is the most produced around the world.</dd>
            <dt>Jonagold</dt>
            <dd>A popular variety created in America
by crossing Golden Delicious and Jonathan.</dd>
        </dl>
    </dd>
    <dd>There are many other varieties as well.</dd>
    <dt>Grapes</dt>
    <dd>purple, clustered fruit</dd>
    <dt>Melon</dt>
    <dd>covered in a green, hard skin</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('handlers: blank line ends dl-list; following paragraph remains', () => {
    const md = `\
: term
    : desc

After paragraph.
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
<p>After paragraph.</p>
`;
    equalOutput(render(md), html)
})

test('handlers: does not start when ":" is indented 4+ columns', () => {
    const md = `\
    : not a dl
`;
    const html = `\
<pre><code>: not a dl
</code></pre>
`;
    // micromark will treat this as a code block (4 leading spaces).
    equalOutput(render(md), html)
})


test('handlers: dd container captures indented continuation lines', () => {
    const md = `\
: term
    : first line
    second line
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>first line
second line</dd>
</dl>
`;
    // dd content is re-parsed; a single <p> is unwrapped, preserving the newline.
    equalOutput(render(md), html)
})

test('handlers: dd container stops before next term', () => {
    const md = `\
: term1
    : desc1
: term2
    : desc2
`;
    const html = `\
<dl>
    <dt>term1</dt>
    <dd>desc1</dd>
    <dt>term2</dt>
    <dd>desc2</dd>
</dl>
`;
    equalOutput(render(md), html)
})

test('handlers: blank line ends dl-list; following paragraph remains', () => {
    const md = `\
: term
    : desc

After paragraph.
`;
    const html = `\
<dl>
    <dt>term</dt>
    <dd>desc</dd>
</dl>
<p>After paragraph.</p>
`;
    equalOutput(render(md), html)
})

test('handlers: does not start when ":" is indented 4+ columns', () => {
    const md = `\
    : not a dl
`;
    const html = `\
<pre><code>: not a dl
</code></pre>
`;
    // micromark will treat this as a code block (4 leading spaces).
    equalOutput(render(md), html)
})

test("handlers: in blockquate", () => {
    const md = `\
> : term1
>     : description1
> : term2
>     : description2
`;
    const html = `\
<blockquote>
    <dl>
        <dt>term1</dt>
        <dd>description1</dd>
        <dt>term2</dt>
        <dd>description2</dd>
    </dl>
</blockquote>
`;

    equalOutput(render(md), html);
})

test('handlers: dd can nest ul', () => {
    const md = `\
: fruits
    : - apple
      - grape
      - orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <ul>
      <li>apple</li>
      <li>grape</li>
      <li>orange</li>
    </ul>
  </dd>
</dl>
`;

    equalOutput(render(md), html);
})

test("handlers: with headings, paragraphs, and blockquotes", () => {
    const md = `\
# title

paragraph1
paragraph2

: term1
    : description1-1
      description1-2
: term2
    : description2-1
    : description2-2

> ## blockquates
> 
> : term1
>     : : inner term
>           : inner desc1
>           : inner desc2
> : term2
>     : description2-1
>     : description2-2

after paragraph
`;
    const html = `\
<h1>title</h1>
<p>paragraph1
paragraph2</p>
<dl>
    <dt>term1</dt>
    <dd>description1-1
description1-2</dd>
    <dt>term2</dt>
    <dd>description2-1</dd>
    <dd>description2-2</dd>
</dl>
<blockquote>
    <h2>blockquates</h2>
    <dl>
        <dt>term1</dt>
        <dd>
            <dl>
                <dt>inner term</dt>
                <dd>inner desc1</dd>
                <dd>inner desc2</dd>
            </dl>
        </dd>
        <dt>term2</dt>
        <dd>description2-1</dd>
        <dd>description2-2</dd>
    </dl>
</blockquote>
<p>after paragraph</p>
`;

    equalOutput(render(md), html);
})

test('handlers: dd reparsing without gfm (strikethrough stays as text)', () => {
    const md = `\
: fruits
    : **apple**
      _grape_
      ~~orange~~
`;
    const html = `\
<dl>
    <dt>fruits</dt>
    <dd><strong>apple</strong><em>grape</em>
~~orange~~</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('handlers: dd reparsing with gfm strikethrough (~~text~~ becomes delete)', () => {
    const md = `\
: fruits
    : **apple**
      _grape_
      ~~orange~~
`;
    const html = `\
<dl>
    <dt>fruits</dt>
    <dd><strong>apple</strong>
        <em>grape</em>
        <del>orange</del>
    </dd>
</dl>
`;

    // 1) dlListFromMarkdown に「再パース時にも使う拡張」を渡す
    const dlMdast = dlListFromMarkdown({
        extensions: [gfmStrikethrough()],
        mdastExtensions: [gfmStrikethroughFromMarkdown()],
    })

    const mdast = fromMarkdown(md, {
        // 2) 外側のパースにも当然必要
        extensions: [
            gfmStrikethrough(),
            dlList(),
        ],
        mdastExtensions: [
            gfmStrikethroughFromMarkdown(),
            dlMdast,
        ]
    });

    const hast = toHast(mdast, {
        handlers: { ...dlListHandlers() }
    });

    equalOutput(toHtml(hast), html);
})