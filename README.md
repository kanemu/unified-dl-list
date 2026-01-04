# micromark-extension-dl-list

A micromark extension that adds support for definition lists (`dl`, `dt`, `dd`) using a colon-based syntax.

This extension is designed to behave as closely as possible to CommonMark list rules, including indentation handling, blank-line boundaries, and safe coexistence with other block constructs such as headings, lists, and block quotes.

It consists of:
- a **syntax extension** (`dlList`) for tokenizing definition lists
- an **HTML extension** (`dlListHtml`) for rendering HTML output

## Features

- Colon-based definition list syntax
- Up to 3 columns of indentation allowed before `:` (same rule as CommonMark lists)
- Multiple terms and descriptions in a single list
- Continuation lines appended to the previous `dt` / `dd`
- Nested lists (`ul`, `ol`) inside `dd`
- Nested definition lists inside `dd`
- Inline Markdown support inside `dt` and `dd`
  - links
  - emphasis / strong
  - inline code
- Safe interaction with CommonMark blocks

## Syntax

### Basic definition list

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

### Multiple description

```markdown
: term
    : description 1
    : description 2
```

### Terms only

If no indented `:` lines follow, all items are treated as terms:

```markdown
: term1
: term2
: term3
```

### Continuation lines

Indented lines without `:` are appended to the previous term or description:

```markdown
: term line 1
  term line 2
    : description line 1
      description line 2
```

### Nested lists inside descriptions

```markdown
: fruits
    : - apple
      - grape
      - orange
```

### Nested definition lists

```markdown
: fruits
    : : apple
          : Orin
          : Fuji
          : Jonagold
    : grape
    : orange
```

## Inline Markdown

Inline constructs are fully supported inside `dt` and `dd`:

```markdown
: [Apple](https://example.com)
    : Red *fruit*
```

## Installation

```bash
npm install micromark-extension-dl-list
```

## Usage

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

## Design Notes

* This extension never consumes indentation unless a definition list is confirmed via lookahead.
* Blank lines that terminate a definition list are not consumed, ensuring correct block boundaries.
* The tokenizer is suitable for reuse in mdast or remark-based pipelines.

## Limitations

- Definition lists inside block quotes (`>`) are **not supported**.
- A line starting with `:` inside a block quote is treated as normal text.
- This limitation is intentional to keep the tokenizer simple and to avoid interfering with CommonMark block quote parsing.

---

© 2026 Yohei Kanamura. Released under the MIT License.
