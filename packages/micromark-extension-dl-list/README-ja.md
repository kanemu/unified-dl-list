# micromark-extension-dl-list

コロン記法による定義リスト構文を追加する **micromark 拡張**です。

このパッケージは **構文（syntax）のみ** を提供し、
remark やその他の unified パイプラインと組み合わせて使うことを想定しています。

定義リストの詳細な書式については、
→ **[docs/syntax-ja.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax-ja.md)** を参照してください。

## インストール

```bash
npm install micromark-extension-dl-list
```

または pnpm を使用する場合:

```bash
pnpm add micromark-extension-dl-list
```

## 使い方

### micromark と一緒に使う（HTML 出力）

このパッケージは `micromark` と直接組み合わせて使うことができ、
コロン記法による定義リストを `<dl>`, `<dt>`, `<dd>` に変換します。

```js
import { micromark } from 'micromark'
import { dlList, dlListHtml } from 'micromark-extension-dl-list'

const md = `
: term
    : description
    : another description
`

const html = micromark(md, {
  extensions: [dlList()],
  htmlExtensions: [dlListHtml()]
})

console.log(html)
```

出力例:

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
  <dd>another description</dd>
</dl>
```

## このパッケージがすること

* micromark にコロン記法の定義リスト構文を追加します
* `<dl>`, `<dt>`, `<dd>` に対応するトークンを生成します

## このパッケージがしないこと

* mdast ノードは生成しません
* remark プラグインは提供しません

> ※ 定義リストを mdast や hast として扱いたい場合は
> `remark-dl-list` や `mdast-util-dl-list` を使用してください。

## 関連パッケージ

このパッケージは **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** モノレポの一部です。

- [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
- [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list)
- [`hast-util-dl-list`](https://www.npmjs.com/package/hast-util-dl-list)

## ライセンス

MIT
