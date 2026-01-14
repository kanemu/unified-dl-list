# remark-dl-list

`<dl>`, `<dt>`, `<dd>` を使った
**コロン記法の定義リスト**をサポートする **remark プラグイン**です。

このプラグインは remark に定義リストのサポートを追加し、
Markdown へのラウンドトリップ（再シリアライズ）を可能にします。

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

## HTML 出力

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

定義リストの詳細な構文については、
→ **[docs/syntax-ja.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

## 関連パッケージ

このパッケージは **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** モノレポの一部です。

* [`micromark-extension-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/micromark-extension-dl-list) – micromark 用の構文拡張
* [`mdast-util-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/mdast-util-dl-list) – mdast のパースとシリアライズ
* [`hast-util-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/hast-util-dl-list) – remark-rehype 用の HTML ハンドラ

## ライセンス

MIT
