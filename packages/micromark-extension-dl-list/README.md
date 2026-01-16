# micromark-extension-dl-list

A **micromark extension** that adds colon-based definition list syntax.

This package provides **syntax only** and is intended to be used with
remark or other unified pipelines.

For the detailed definition list syntax,  
→ **[docs/syntax.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax.md)**.

## Installation

```bash
npm install micromark-extension-dl-list
````

or with pnpm:

```bash
pnpm add micromark-extension-dl-list
```

## Usage

### With micromark (HTML output)

This package can be used directly with `micromark`
to parse colon-based definition lists and generate
`<dl>`, `<dt>`, and `<dd>` elements.

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

Output:

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
  <dd>another description</dd>
</dl>
```

## What this package does

* Adds colon-based definition list syntax to micromark
* Emits tokens for `<dl>`, `<dt>`, and `<dd>`

## What this package does NOT do

- Does not generate mdast nodes
- Does not provide a remark plugin

## Related packages

This package is part of the **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** monorepo:

- [`remark-dl-list`](https://www.npmjs.com/package/remark-dl-list)
- [`mdast-util-dl-list`](https://www.npmjs.com/package/mdast-util-dl-list)
- [`hast-util-dl-list`](https://www.npmjs.com/package/hast-util-dl-list)

## License

MIT
