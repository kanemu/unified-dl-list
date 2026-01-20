# remark-dl-list

`<dl>`, `<dt>`, `<dd>` を使った
**コロン記法の定義リスト**をサポートする **remark プラグイン**です。

このプラグインは remark に定義リストのサポートを追加し、
Markdown へのラウンドトリップ（再シリアライズ）を可能にします。

定義リストの詳細な構文については、
→ **[docs/syntax-ja.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

## インストール

```bash
npm install remark-dl-list
```

または pnpm を使用する場合:

```bash
pnpm add remark-dl-list
```

## 使い方

### 基本的な使い方（Markdown ⇄ Markdown）

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { remarkDlList } from 'remark-dl-list'

const md = `
: term1
    : description1
    : description2

Still the same paragraph.
`

const file = await unified()
    .use(remarkParse)
    .use(remarkDlList)
    .use(remarkStringify)
    .process(md)

console.log(String(file))
```

出力:

```md
: term1
    : description1
    : description2

Still the same paragraph.
```

### HTML 出力

このプラグインは **`remark-rehype` を自動ではインストールしません**。

HTML を生成するには、`remark-rehype` と
`hast-util-dl-list` を組み合わせて使用してください。

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkDlList } from 'remark-dl-list'
import { dlListHandlers } from 'hast-util-dl-list'

const html = await unified()
    .use(remarkParse)
    .use(remarkDlList)
    .use(remarkRehype, {
        handlers: dlListHandlers()
    })
    .use(rehypeStringify)
    .process(`
: term
    : description
  `)

console.log(String(html))
```

### `remark-dl-list` を GFM（取り消し線）と併用する

`remark-dl-list` を他の remark プラグイン（例: GFM）と一緒に使う場合は、
**それらのプラグインを `remark-dl-list` より前に登録してください**。

これは、`remark-dl-list` が **`dt` / `dd` の中身を内部で再パースする**ためです。

#### Markdown → HTML の例（取り消し線あり）

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

import { remarkDlList } from 'remark-dl-list'
import { dlListHandlers } from 'hast-util-dl-list'

const processor = unified()
    .use(remarkParse)

    // 他のプラグイン（GFM など）を先に登録
    .use(remarkGfm)

    // その後で remark-dl-list を登録
    .use(remarkDlList)

    // mdast → hast
    .use(remarkRehype, {
        handlers: {
            ...dlListHandlers(),
        },
    })
    .use(rehypeStringify)

const md = `\
: fruits
    : **apple**
      _grape_
      ~~orange~~
`

const file = processor.processSync(md)
const html = toHtml(file.result)

console.log(html)
```

出力:

```html
<dl>
  <dt>fruits</dt>
  <dd>
    <strong>apple</strong>
    <em>grape</em>
    <del>orange</del>
  </dd>
</dl>
```

## このプラグインがすること

* remark にコロン記法の定義リスト構文を追加します
* 定義リストを mdast ノードとしてパースします
* 1つの `<dt>` に対して複数の `<dd>` をサポートします
* `<dd>` の中でブロック要素をサポートします
* Markdown へのラウンドトリップ（再シリアライズ）をサポートします

## このプラグインがしないこと

* `remark-rehype` を自動的にインストールしません
* 単体で HTML を生成しません
* 定義リスト構文が存在しない場合の通常の Markdown の挙動は変更しません

## 構文

```md
: term
    : description
    : another description
```

は次のように変換されます。

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
  <dd>another description</dd>
</dl>
```

## 関連パッケージ

このパッケージは **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** モノレポの一部です。

* [`micromark-extension-dl-list`](https://www.npmjs.com/package/micromark-extension-dl-list) – micromark 用の構文拡張
* [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list) – mdast のパースとシリアライズ
* [`hast-util-dl-list`](https://www.npmjs.com/package/hast-util-dl-list) – remark-rehype 用の HTML ハンドラ

### 関連プロジェクト

- [`markdown-it-dl-list`](https://www.npmjs.com/package/markdown-it-dl-list)
  同じコロン記法の説明リスト構文を提供する markdown-it 用プラグインです。

## ライセンス

MIT
