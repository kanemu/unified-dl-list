import test from "node:test";
import assert from "node:assert/strict";

import { fromMarkdown } from "mdast-util-from-markdown";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import { dlList } from '../../micromark-extension-dl-list/src/syntax.js'
import { dlListFromMarkdown } from '../../mdast-util-dl-list/dist/index.js'
import { dlListHandlers } from "../dist/index.js";

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
