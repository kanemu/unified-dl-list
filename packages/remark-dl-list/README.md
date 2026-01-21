# remark-dl-list

A **remark plugin** that enables colon-based definition lists
using `<dl>`, `<dt>`, and `<dd>` syntax.

This plugin adds support for definition lists to remark and allows
round-trip serialization back to markdown.

Syntax:

```md
: term
    : description
    : another description
```

is converted to:

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
  <dd>another description</dd>
</dl>
```

For the detailed definition list syntax,
→ **[docs/syntax.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax.md)**.

## Installation

```bash
npm install remark-dl-list
```

or with pnpm:

```bash
pnpm add remark-dl-list
```

## Usage

### Basic usage (Markdown ⇄ Markdown)

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkDlList from 'remark-dl-list'

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

Output:

```md
: term1
    : description1
    : description2

Still the same paragraph.
```

### HTML output

This plugin **does not install `remark-rehype` automatically**.

To generate HTML, combine it with `remark-rehype`
and `hast-util-dl-list`:

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkDlList from 'remark-dl-list'
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

### Using `remark-dl-list` with GFM (strikethrough)

When you use `remark-dl-list` together with other remark plugins (such as GFM),
**register those plugins before `remark-dl-list`** so that definition list
contents (`dt` / `dd`) can inherit their syntax during re-parsing.

#### Markdown → HTML example (with strikethrough)

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

import remarkDlList from 'remark-dl-list'
import { dlListHandlers } from 'hast-util-dl-list'

const processor = unified()
    .use(remarkParse)

    // Register other plugins FIRST (e.g. GFM)
    .use(remarkGfm)

    // Then register remark-dl-list
    .use(remarkDlList)

    // Convert mdast → hast
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

const html = processor.processSync(md).toString()
console.log(html)
```

Output:

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

#### Important notes

* `remark-dl-list` **re-parses the contents of `dt` and `dd` internally**.
* Therefore, any syntax extensions you want to use inside definition lists
  (such as GFM strikethrough) **must already be registered** when
  `remark-dl-list` runs.
* Always place `remark-dl-list` **after** plugins like `remark-gfm`.

> ✔ Correct order
> `remark-parse → remark-gfm → remark-dl-list → remark-rehype`

## What this plugin does

* Adds colon-based definition list syntax to remark
* Parses definition lists into mdast nodes
* Supports multiple `<dd>` entries per `<dt>`
* Supports block content inside `<dd>`
* Supports round-trip serialization back to markdown

## What this plugin does NOT do

* Does **not** install `remark-rehype`
* Does **not** generate HTML by itself
* Does **not** change normal markdown behavior when no dl syntax is present

## Related packages

This package is part of the **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** monorepo:

- [`micromark-extension-dl-list`](https://www.npmjs.com/package/micromark-extension-dl-list) – micromark syntax extension
- [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list) – mdast parsing and serialization
- [`hast-util-dl-list`](https://www.npmjs.com/package/hast-util-dl-list) – HTML handlers for remark-rehype

### Related projects

- [`markdown-it-dl-list`](https://www.npmjs.com/package/markdown-it-dl-list)
  A markdown-it plugin that provides the same colon-based definition list syntax.

## License

MIT
