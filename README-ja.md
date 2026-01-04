# micromark-extension-dl-list

コロン（`:`）を使った構文で、説明リスト（`dl`, `dt`, `dd`）を追加する micromark 拡張です。

この拡張は、インデントの扱いや空行の境界などにおいて、可能な限り CommonMark のリスト規則に近い挙動をするよう設計されています。
見出し、リスト、引用などの他のブロック構文とも安全に共存できます。

本パッケージは以下の2つで構成されています。

- 説明リストをトークナイズする **構文拡張**（`dlList`）
- HTML を出力する **HTML 拡張**（`dlListHtml`）

## 特徴

- コロンを用いた説明リスト構文
- `:` の前に最大 3 カラムまでのインデントを許容（CommonMark のリストと同じ規則）
- 1つのリスト内に複数の用語（dt）と説明（dd）を記述可能
- インデントされた継続行を、直前の dt / dd に連結
- `dd` 内での入れ子リスト（`ul`, `ol`）をサポート
- `dd` 内での入れ子説明リストをサポート
- `dt` / `dd` 内でのインライン Markdown をサポート
  - リンク
  - 強調（em / strong）
  - インラインコード
- CommonMark のブロック構文と安全に共存

## 構文

### 基本的な説明リスト

```markdown
: term1
    : description1
: term2
    : description2
````

```html
<dl>
  <dt>term1</dt>
  <dd>description1</dd>
  <dt>term2</dt>
  <dd>description2</dd>
</dl>
```

### 複数の説明

```markdown
: term
    : description 1
    : description 2
```

### 用語のみのリスト

インデントされた `:` 行が続かない場合、すべて dt（用語）として扱われます。

```markdown
: term1
: term2
: term3
```

### 継続行

`:` を含まないインデント行は、直前の用語または説明に連結されます。

```markdown
: term line 1
  term line 2
    : description line 1
      description line 2
```

### 説明内の入れ子リスト

```markdown
: fruits
    : - apple
      - grape
      - orange
```

### 入れ子説明リスト

```markdown
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
```

## インライン Markdown

`dt` および `dd` の中では、インライン Markdown 構文がそのまま使用できます。

```markdown
: [Apple](https://example.com)
    : Red *fruit*
```

## インストール

```bash
npm install micromark-extension-dl-list
```

## 使用方法

```js
import { micromark } from 'micromark'
import { dlList, dlListHtml } from 'micromark-extension-dl-list'

const md = `\
: Apple
    : Red *fruit*
`

const html = micromark(md, {
  extensions: [dlList()],
  htmlExtensions: [dlListHtml()]
})

console.log(html)
```

## 設計上の注意

* 説明リストであることが先読みで確定するまで、インデントを消費しません。
* 説明リストを終了させる空行は消費せず、CommonMark 側にブロック境界として渡します。
* tokenizer は mdast や remark ベースのパイプラインでも再利用できる設計です。

## 制限事項

* 引用（`>`）の中に書かれた説明リストは **サポートされていません**。
* blockquote 内で `:` から始まる行は、通常のテキストとして扱われます。
* これは tokenizer を単純に保ち、CommonMark の blockquote 構文と干渉しないための意図的な制限です。

---

© 2026 Yohei Kanamura. Released under the MIT License.
