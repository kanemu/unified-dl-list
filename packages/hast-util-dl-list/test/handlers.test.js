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

//---
test('basic dt/dd', () => {
    const md = [
        ': term1',
        '    : description1-1',
        '    : description1-2',
        ': term2',
        '    : description2-1',
        '    : description2-2',
        ''
    ].join('\n')

    assert.equal(
        render(md),
        '<dl><dt>term1</dt><dd>description1-1</dd><dd>description1-2</dd><dt>term2</dt><dd>description2-1</dd><dd>description2-2</dd></dl>'
    )
})

test('all dt when no indented dd', () => {
    const md = [
        ': term1',
        ': term2',
        ': term3',
        ''
    ].join('\n')

    assert.equal(
        render(md),
        '<dl><dt>term1</dt><dt>term2</dt><dt>term3</dt></dl>'
    )
})

test('colon in same line is preserved', () => {
    const md = [
        ': 12:30',
        '    : lunch and break',
        ''
    ].join('\n')

    assert.equal(
        render(md),
        '<dl><dt>12:30</dt><dd>lunch and break</dd></dl>'
    )
})

test('continuation lines belong to dt/dd with newline preserved', () => {
    const md = [
        ': term1 line1',
        '  term1 line2',
        '    : description1 line1',
        '      description1 line2',
        ''
    ].join('\n')

    assert.equal(
        render(md),
        '<dl><dt>term1 line1\nterm1 line2</dt><dd>description1 line1\ndescription1 line2</dd></dl>'
    )
})

test('dd can nest ul', () => {
    const md = [
        ': fruits',
        '    : - apple',
        '      - grape',
        '      - orange',
        ''
    ].join('\n')

    // dd コンテナは再パースで <ul> が生成される
    assert.equal(
        render(md),
        '<dl><dt>fruits</dt><dd><ul>\n<li>apple</li>\n<li>grape</li>\n<li>orange</li>\n</ul></dd></dl>'
    )
})

test('dd can nest ol (ordered list)', () => {
    const md = [
        ': fruits',
        '    : 1. apple',
        '      2. grape',
        '      3. orange',
        ''
    ].join('\n')

    // dd コンテナは再パースで <ol> が生成される
    assert.equal(
        render(md),
        '<dl><dt>fruits</dt><dd><ol>\n<li>apple</li>\n<li>grape</li>\n<li>orange</li>\n</ol></dd></dl>'
    )
})

test('dd can nest dl (": : apple" etc)', () => {
    const md = [
        ': fruits',
        '    : : apple',
        '          : Orin',
        '          : Fuji',
        '          : Jonagold',
        '    : grape',
        '    : orange',
        ''
    ].join('\n')

    // dd1 が container になり、先頭 ':' によりネスト dlList が走る
    assert.equal(
        render(md),
        '<dl><dt>fruits</dt><dd><dl><dt>apple</dt><dd>Orin</dd><dd>Fuji</dd><dd>Jonagold</dd></dl></dd><dd>grape</dd><dd>orange</dd></dl>'
    )
})

test('tab before ":" counts as columns (tab stop)', () => {
    // \t は col0->4 なので “0-3 columns” を超える → dlList としては開始しない
    // → Indented Code Block 扱い（micromark default）
    const md = ['\t: term1', ''].join('\n')
    const html = render(md)

    // dlList になっていないことだけ確認（出力は micromark の <pre><code>）
    assert.ok(html.includes('<pre><code>') && html.includes(': term1'))
})

test('dd container deindents only ddIndent and preserves extra indent (nested list)', () => {
    const md = [
        ': fruits',
        '    : - apple',
        '      - grape',
        '      - orange',
        ''
    ].join('\n')

    assert.equal(
        render(md),
        '<dl><dt>fruits</dt><dd><ul>\n<li>apple</li>\n<li>grape</li>\n<li>orange</li>\n</ul></dd></dl>'
    )
})

test('DL list: does not leak "#" and keeps next ATX heading as <h2> after a blank line', () => {
    const md = `\
## 定義リスト

: [りんご](https://example.com/apple)
    : 赤くてまるい *果物*
: [ぶどう](https://example.com/grape)
    : 紫で房状の **果物**
: [めろん](https://example.com/melon)
    : 緑で固い皮に包まれている

## 3. リンクと画像
[CommonMark 公式](https://commonmark.org)
`

    const html = render(md)

    // No stray '#" emitted between blocks
    assert.ok(
        !html.includes('</dl>#'),
        `should not contain "</dl>#", got:\n${html}`
    )

    // The next heading must remain <h2> (not <h1>)
    assert.ok(
        html.includes('<h2>3. リンクと画像</h2>'),
        `expected next heading to be <h2>, got:\n${html}`
    )

    // And the heading should not be split into a literal "#" + "<h1>..."
    assert.ok(
        !html.includes('\n#\n<h1>'),
        `should not contain split heading artifacts, got:\n${html}`
    )
})

test('DL list: inline constructs work inside dt/dd (link/em/strong)', () => {
    const md = `\
## 定義リスト

: [りんご](https://example.com/apple)
    : 赤くてまるい *果物*
: [ぶどう](https://example.com/grape)
    : 紫で房状の **果物**
`

    const html = render(md)

    assert.ok(html.includes('<dt><a href="https://example.com/apple">りんご</a></dt>'), html)
    assert.ok(html.includes('<dd>赤くてまるい <em>果物</em></dd>'), html)
    assert.ok(html.includes('<dt><a href="https://example.com/grape">ぶどう</a></dt>'), html)
    assert.ok(html.includes('<dd>紫で房状の <strong>果物</strong></dd>'), html)
})

test('full markdown example (lang ja)', () => {

    const md = `\
# CommonMark + DL-List サンプル

## 1. テキスト装飾
*斜体* または _斜体_  
**太字** または __太字__  
***太字かつ斜体***

## 2. リスト
* 箇条書き
    * ネスト（半角スペース4つ）
* 項目

1. 番号付き
2. 項目

## 定義リスト

: [りんご](https://ja.wikipedia.org/wiki/%E3%83%AA%E3%83%B3%E3%82%B4)
    : 赤くてまるい *果物*
: [ぶどう](https://ja.wikipedia.org/wiki/%E3%83%96%E3%83%89%E3%82%A6)
    : 紫で房状の **果物**
: [めろん](https://ja.wikipedia.org/wiki/%E3%83%A1%E3%83%AD%E3%83%B3)
    : 緑で固い皮に包まれている

## 3. リンクと画像
[CommonMark 公式](https://commonmark.org)  
![Logo](https://commonmark.org/help/images/favicon.png)

## 4. 引用
> 引用文です。
>> ネストした引用です。

## 5. コード
インラインで \`code\` を書く。

ブロックでの記述：
\`\`\`javascript
const message = "Hello World";
console.log(message);
\`\`\`

## 6. 水平線
---

## 7. エスケープ
\\* アスタリスクをそのまま表示する。
`;

    const output = `\
<h1>CommonMark + DL-List サンプル</h1>
<h2>1. テキスト装飾</h2>
<p><em>斜体</em> または <em>斜体</em><br>
<strong>太字</strong> または <strong>太字</strong><br>
<em><strong>太字かつ斜体</strong></em></p>
<h2>2. リスト</h2>
<ul>
<li>箇条書き
<ul>
<li>ネスト（半角スペース4つ）</li>
</ul>
</li>
<li>項目</li>
</ul>
<ol>
<li>番号付き</li>
<li>項目</li>
</ol>
<h2>定義リスト</h2>
<dl><dt><a href="https://ja.wikipedia.org/wiki/%E3%83%AA%E3%83%B3%E3%82%B4">りんご</a></dt><dd>赤くてまるい <em>果物</em></dd><dt><a href="https://ja.wikipedia.org/wiki/%E3%83%96%E3%83%89%E3%82%A6">ぶどう</a></dt><dd>紫で房状の <strong>果物</strong></dd><dt><a href="https://ja.wikipedia.org/wiki/%E3%83%A1%E3%83%AD%E3%83%B3">めろん</a></dt><dd>緑で固い皮に包まれている</dd></dl>
<h2>3. リンクと画像</h2>
<p><a href="https://commonmark.org">CommonMark 公式</a><br>
<img src="https://commonmark.org/help/images/favicon.png" alt="Logo"></p>
<h2>4. 引用</h2>
<blockquote>
<p>引用文です。</p>
<blockquote>
<p>ネストした引用です。</p>
</blockquote>
</blockquote>
<h2>5. コード</h2>
<p>インラインで <code>code</code> を書く。</p>
<p>ブロックでの記述：</p>
<pre><code class="language-javascript">const message = "Hello World";
console.log(message);
</code></pre>
<h2>6. 水平線</h2>
<hr>
<h2>7. エスケープ</h2>
<p>* アスタリスクをそのまま表示する。</p>`;

    assert.equal(
        render(md),
        output
    )
})
