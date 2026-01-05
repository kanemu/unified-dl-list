import test from 'node:test'
import assert from 'node:assert/strict'
import { micromark } from 'micromark'

import { dlList } from '../src/syntax.js'
import { dlListHtml } from '../src/html.js'

function render(md) {
    return micromark(md, {
        extensions: [dlList()],
        htmlExtensions: [dlListHtml()]
    })
}

function equalOutput(result, expected) {
    const trimHtml = (html) => {
        return html.replace(/^\s*\</, '<')
            .replace(/\>\s*\</g, '><')
            .replace(/\>\s*$/, '>');
    }
    assert.equal(trimHtml(result), trimHtml(expected));
}

//---
test('basic dt/dd', () => {
    const md = `\
: term1
    : description1-1
    : description1-2
: term2
    : description2-1
    : description2-2
`;
    const html = `\
<dl>
  <dt>term1</dt>
  <dd>description1-1</dd>
  <dd>description1-2</dd>
  <dt>term2</dt>
  <dd>description2-1</dd>
  <dd>description2-2</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('all dt when no indented dd', () => {
    const md = `\
: term1
: term2
: term3
`;
    const html = `\
<dl>
  <dt>term1</dt>
  <dt>term2</dt>
  <dt>term3</dt>
</dl>
`;

    equalOutput(render(md), html);
})

test('colon in same line is preserved', () => {
    const md = `\
: 12:30
    : lunch and break
`;
    const html = `\
<dl>
  <dt>12:30</dt>
  <dd>lunch and break</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('continuation lines belong to dt/dd with newline preserved', () => {
    const md = `\
: term1 line1
  term1 line2
    : description1 line1
      description1 line2
`;
    const html = `\
<dl>
  <dt>term1 line1
term1 line2</dt>
  <dd>description1 line1
description1 line2</dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('dd can nest ul', () => {
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

test('dd can nest ol (ordered list)', () => {
    const md = `\
: fruits
    : 1. apple
      2. grape
      3. orange
`;
    const html = `\
<dl>
  <dt>fruits</dt>
  <dd>
    <ol>
      <li>apple</li>
      <li>grape</li>
      <li>orange</li>
    </ol>
  </dd>
</dl>
`;

    equalOutput(render(md), html);
})

test('dd can nest dl (": : apple" etc)', () => {
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

test('In blockquate', () => {
    const md = `\
# dl-list

> ## dl-list in blockquate
> : term1
>     : description1
> : term2
>     : description2

under paragraph
`;
    const html = `\
<h1>dl-list</h1>
<blockquote>
    <h2>dl-list in blockquate</h2>
    <dl>
        <dt>term1</dt>
        <dd>description1</dd>
        <dt>term2</dt>
        <dd>description2</dd>
    </dl>
</blockquote>
<p>under paragraph</p>
`;

    equalOutput(render(md), html);
})

test('tab before ":" counts as columns (tab stop)', () => {
    // \t は col0->4 なので “0-3 columns” を超える → dlList としては開始しない
    // → Indented Code Block 扱い（micromark default）
    const md = ['\t: term1', ''].join('\n')
    const output = render(md)

    // dlList になっていないことだけ確認（出力は micromark の <pre><code>）
    assert.ok(output.includes('<pre><code>') && output.includes(': term1'))
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
    const html = `\
<h2>定義リスト</h2>
<dl>
    <dt><a href="https://example.com/apple">りんご</a></dt>
    <dd>赤くてまるい <em>果物</em></dd>
    <dt><a href="https://example.com/grape">ぶどう</a></dt>
    <dd>紫で房状の <strong>果物</strong></dd>
    <dt><a href="https://example.com/melon">めろん</a></dt>
    <dd>緑で固い皮に包まれている</dd>
</dl>
<h2>3. リンクと画像</h2>
<p><a href="https://commonmark.org">CommonMark 公式</a></p>
`;

    equalOutput(render(md), html);
})

test('DL list: inline constructs work inside dt/dd (link/em/strong)', () => {
    const md = `\
## 定義リスト

: [りんご](https://example.com/apple)
    : 赤くてまるい *果物*
: [ぶどう](https://example.com/grape)
    : 紫で房状の **果物**
`;
    const html = `\
<h2>定義リスト</h2>
<dl>
    <dt><a href="https://example.com/apple">りんご</a></dt>
    <dd>赤くてまるい <em>果物</em></dd>
    <dt><a href="https://example.com/grape">ぶどう</a></dt>
    <dd>紫で房状の <strong>果物</strong>
    </dd>
</dl>
`;

    equalOutput(render(md), html);
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

    const html = `\
<h1>CommonMark + DL-List サンプル</h1>
<h2>1. テキスト装飾</h2>
<p><em>斜体</em> または <em>斜体</em><br />
<strong>太字</strong> または <strong>太字</strong><br />
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
<p><a href="https://commonmark.org">CommonMark 公式</a><br />
<img src="https://commonmark.org/help/images/favicon.png" alt="Logo" /></p>
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
<pre><code class="language-javascript">const message = &quot;Hello World&quot;;
console.log(message);
</code></pre>
<h2>6. 水平線</h2>
<hr />
<h2>7. エスケープ</h2>
<p>* アスタリスクをそのまま表示する。</p>
`;

    equalOutput(render(md), html);
})
