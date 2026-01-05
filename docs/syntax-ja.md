# 定義リスト構文（Definition List Syntax）

このドキュメントは、 **unified-dl-list** パッケージ群がサポートする
コロン記法による定義リスト構文を説明します。

## 基本構文

定義リストは次の要素から構成されます。

* 1つ以上の **用語（term）**
* それに続く 1つ以上の **説明（description）**

```md
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

## 複数の説明

1つの用語に対して、複数の説明を持つことができます。

```md
: term
    : description 1
    : description 2
```

```html
<dl>
    <dt>term</dt>
    <dd>description 1</dd>
    <dd>description 2</dd>
</dl>
```

## 説明内のブロック要素

説明（`dd`）の中には、段落・リスト・コードブロックなどの
**ブロックレベルのMarkdown**を含めることができます。

```md
: term
    : description paragraph
      - list item
      - list item
```

```html
<dl>
    <dt>term</dt>
    <dd>
        <p>description paragraph</p>
        <ul>
            <li>list item</li>
            <li>list item</li>
        </ul>
    </dd>
</dl>
```

## 後続ブロックとの分離

定義リストの後に空行を1行入れることで、
次のブロックと区切られます。

```md
: term
    : description

Next paragraph.
```

```html
<dl>
    <dt>term</dt>
    <dd>description</dd>
</dl>
<p>Next paragraph.</p>
```

## 用語の継続行

用語（`dt`）は、インデントされた次の行に続けて記述できます。
ただし、その行は `:` で始まってはいけません。

```md
: long term line 1
  line 2
    : description
```

これは改行を含む単一の `<dt>` として扱われます。

```html
<dl>
    <dt>long term line 1
line 2</dt>
    <dd>description</dd>
</dl>
```

## ネストされた定義リスト

説明はブロックレベルのMarkdownとして再解析されるため、
説明の中にさらに定義リストを書くことができます。

```md
: outer term
    : : inner term
          : inner description
```

```html
<dl>
    <dt>outer term</dt>
    <dd>
        <dl>
            <dt>inner term</dt>
            <dd>inner description</dd>
        </dl>
    </dd>
</dl>
```

## 引用（blockquote）内の定義リスト

定義リストは blockquote の中にも記述できます。

```md
> : term
>     : description
```

```html
<blockquote>
    <dl>
        <dt>term</dt>
        <dd>description</dd>
    </dl>
</blockquote>
```

トップレベルの定義リストと同じように振る舞い、
説明の中にネストされた定義リストを含めることもできます。

## 注意事項

* この構文は一般的な定義リストの慣習を参考にしていますが、
  **CommonMark の標準仕様には含まれていません**。
* 挙動は他のMarkdown実装と異なる場合があります。
