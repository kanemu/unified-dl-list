# mdast-util-dl-list

Utilities for parsing and serializing definition lists
in **mdast**.

This package converts colon-based definition list syntax
into mdast nodes and supports round-trip markdown serialization.

For the detailed definition list syntax,  
→ **[docs/syntax.md](https://github.com/kanemu/unified-dl-list/blob/main/docs/syntax.md)**.

## Installation

```bash
npm install mdast-util-dl-list
```

or with pnpm:

```bash
pnpm add mdast-util-dl-list
```

## Usage

### Parsing (from markdown)

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

### Serializing (to markdown)

```js
import { toMarkdown } from 'mdast-util-to-markdown'
import { dlListToMarkdown } from 'mdast-util-dl-list'

// const tree = <your mdast tree>
const markdown = toMarkdown(tree, {
  extensions: [dlListToMarkdown()]
})
console.log(markdown);
```

## What this package does

* Defines mdast node types for definition lists
* Converts micromark tokens into mdast nodes
* Supports multiple `<dd>` entries per `<dt>`
* Supports round-trip serialization back to markdown

## What this package does NOT do

* Does not parse raw markdown by itself
* Does not generate HTML
* Does not install remark plugins

## Related packages

This package is part of the **[unified-dl-list](https://github.com/kanemu/unified-dl-list)** monorepo:

- [`remark-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/remark-dl-list)
- [`micromark-extension-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/micromark-extension-dl-list)
- [`hast-util-dl-list`](https://github.com/kanemu/unified-dl-list/tree/main/packages/hast-util-dl-list)

## License

MIT
