# hast-util-dl-list

HAST handlers for rendering mdast definition list nodes
as `<dl>`, `<dt>`, and `<dd>` elements.

This package is designed to be used with `remark-rehype`.

For the detailed definition list syntax,  
→ **[docs/syntax.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax.md)**.

## Installation

```bash
npm install hast-util-dl-list
```

or with pnpm:

```bash
pnpm add hast-util-dl-list
```

## Usage

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

## What this package does

* Provides HAST handlers for mdast definition list nodes
* Converts definition lists into `<dl>`, `<dt>`, and `<dd>`
* Preserves `data.hProperties` and `data.hName`

## What this package does NOT do

* Does not parse markdown
* Does not serialize markdown
* Does not install remark or rehype plugins automatically

## Related packages

This package is part of the **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** monorepo:

- [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
- [`micromark-extension-dl-list`](https://www.npmjs.com/package/micromark-extension-dl-list)
- [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list)

## License

MIT
