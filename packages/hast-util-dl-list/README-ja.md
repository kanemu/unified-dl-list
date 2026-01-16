# hast-util-dl-list

mdast の定義リスト（definition list）ノードを
`<dl>`, `<dt>`, `<dd>` 要素としてレンダリングするための
**HAST ハンドラ** を提供します。

このパッケージは `remark-rehype` と組み合わせて使うことを想定しています。

定義リストの詳細な構文については、
→ **[docs/syntax-ja.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

## インストール

```bash
npm install hast-util-dl-list
```

または pnpm を使用する場合:

```bash
pnpm add hast-util-dl-list
```

## 使い方

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

## このパッケージがすること

* mdast の定義リストノード用の HAST ハンドラを提供します
* 定義リストを `<dl>`, `<dt>`, `<dd>` に変換します
* `data.hProperties` や `data.hName` を保持します

## このパッケージがしないこと

* Markdown のパースは行いません
* Markdown のシリアライズは行いません
* remark や rehype のプラグインを自動的にインストールしません

## 関連パッケージ

このパッケージは **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** モノレポの一部です。

* [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
* [`micromark-extension-dl-list`](https://www.npmjs.com/package/micromark-extension-dl-list)
* [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list)

## ライセンス

MIT
