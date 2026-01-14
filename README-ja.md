# unified-dl-list

unified / remark / rehype エコシステム向けに
**コロン記法による定義リスト**を提供するモノレポです。

このプロジェクトは、HTML の `<dl>`, `<dt>`, `<dd>` 要素を用いた定義リストを実装しており、
CommonMark のブロック解析ルールにできるだけ近い設計で動作します。

実装は unified パイプラインの各レイヤーに対応した
**4つの専用パッケージ**に分割されています。

## 定義リストとは？

このプロジェクトでは、次のようなコロン記法による定義リストをサポートします。

```markdown
: term
    : description
```

これは次のようにレンダリングされます。

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
</dl>
```

定義リスト構文の詳細については、
→ **[docs/syntax-ja.md](docs/syntax-ja.md)** を参照してください。

## パッケージ

### [micromark-extension-dl-list](packages/micromark-extension-dl-list)

**micromark 用の構文および HTML 拡張**

* micromark レベルでコロン記法の定義リストをトークン化します
* HTML 出力として `<dl>`, `<dt>`, `<dd>` を生成します
* CommonMark の段落解析と干渉しないよう厳密な先読みを行います

`micromark` を直接使用する場合はこのパッケージを利用してください。

### [mdast-util-dl-list](packages/mdast-util-dl-list)

**mdast ユーティリティ**

* micromark のトークンを mdast ノードに変換します
* 定義リスト用のノード型を定義します
* mdast → Markdown のシリアライズ（to-markdown）をサポートします

このパッケージ単体では Markdown のパースや HTML の生成は行いません。

### [hast-util-dl-list](packages/hast-util-dl-list)

**hast 用ハンドラ**

* mdast の定義リストノードを hast に変換するハンドラを提供します
* `remark-rehype` と組み合わせて使用します

このパッケージ単体では Markdown のパースや mdast の生成は行いません。

### [remark-dl-list](packages/remark-dl-list)

**remark プラグイン（推奨のエントリーポイント）**

* micromark、mdast、to-markdown の拡張をまとめて登録します
* `.use()` を1回呼ぶだけで定義リストを有効化できます
* `remark-parse` と `remark-stringify` での利用を想定しています

多くのユーザーはこのパッケージから使い始めるのがおすすめです。

## どのパッケージを使えばよいか？

| 用途                              | 推奨パッケージ                |
| --------------------------------- | ----------------------------- |
| micromark を直接使う              | `micromark-extension-dl-list` |
| mdast の変換やシリアライズ        | `mdast-util-dl-list`          |
| mdast → HTML（rehype）           | `hast-util-dl-list`           |
| remark / unified パイプライン全体 | `remark-dl-list`              |

## リポジトリ構成

```
packages/
  micromark-extension-dl-list/
  mdast-util-dl-list/
  hast-util-dl-list/
  remark-dl-list/
```

各パッケージには、それぞれ README、LICENSE、テストが含まれています。

## 開発方法

このリポジトリは **pnpm workspaces** を使用しています。

### 依存関係のインストール

```bash
pnpm install
```

### 全パッケージのビルドまたはテスト

```bash
pnpm build
```

```bash
pnpm test
```

### 個別パッケージのビルドまたはテスト

```bash
pnpm --filter mdast-util-dl-list build
pnpm --filter hast-util-dl-list build
pnpm --filter remark-dl-list build
```

```bash
pnpm --filter micromark-extension-dl-list test
pnpm --filter mdast-util-dl-list test
pnpm --filter hast-util-dl-list test
pnpm --filter remark-dl-list test
```

---

© 2026 Yohei Kanamura Released under the MIT License.
