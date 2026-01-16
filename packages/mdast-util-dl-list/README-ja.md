# mdast-util-dl-list

**mdast** における定義リスト（definition list）を
パースおよびシリアライズするためのユーティリティです。

このパッケージは、コロン記法による定義リスト構文を
mdast ノードに変換し、Markdown へのラウンドトリップ（再シリアライズ）をサポートします。

定義リストの詳細な構文については、
→ **[docs/syntax-ja.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

## インストール

```bash
npm install mdast-util-dl-list
```

または pnpm を使用する場合:

```bash
pnpm add mdast-util-dl-list
```

## 使い方

### パース（Markdown → mdast）

```js
import { fromMarkdown } from 'mdast-util-from-markdown'
import { dlListFromMarkdown } from 'mdast-util-dl-list'
import { dlList } from 'micromark-extension-dl-list'

const tree = fromMarkdown(': term\n    : description\n', {
    extensions: [dlList()],
    mdastExtensions: [dlListFromMarkdown()]
})
console.log(tree);
```

### シリアライズ（mdast → Markdown）

```js
import { toMarkdown } from 'mdast-util-to-markdown'
import { dlListToMarkdown } from 'mdast-util-dl-list'

// const tree = <your mdast tree>
const markdown = toMarkdown(tree, {
  extensions: [dlListToMarkdown()]
})
console.log(markdown);
```

## このパッケージがすること

* 定義リスト用の mdast ノード型を定義します
* micromark のトークンを mdast ノードに変換します
* 1つの `<dt>` に対して複数の `<dd>` をサポートします
* Markdown へのラウンドトリップ（再シリアライズ）をサポートします

## このパッケージがしないこと

* 生の Markdown を単独でパースしません
* HTML を生成しません
* remark プラグインをインストールしません

## 関連パッケージ

このパッケージは **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** モノレポの一部です。

* [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
* [`micromark-extension-dl-list`](https://www.npmjs.com/package/micromark-extension-dl-list)
* [`hast-util-dl-list`](https://www.npmjs.com/package/hast-util-dl-list)

## ライセンス

MIT
