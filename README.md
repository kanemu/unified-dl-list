# unified-dl-list

A monorepo that provides **colon-based definition list support**
for the unified / remark / rehype ecosystem.

This project implements definition lists using the HTML elements
`<dl>`, `<dt>`, and `<dd>`, with a design that closely follows
CommonMark block parsing rules.

The implementation is split into **four focused packages**,
each responsible for a single layer of the unified pipeline.

## What is a definition list?

This project supports definition lists using a colon-based syntax:

```markdown
: term
    : description
````

which renders as:

```html
<dl>
  <dt>term</dt>
  <dd>description</dd>
</dl>
```

For the detailed definition list syntax,  
→ **[docs/syntax.md](docs/syntax.md)**.

## Packages

### [micromark-extension-dl-list](packages/micromark-extension-dl-list)

**micromark syntax & HTML extension**

* Tokenizes colon-based definition lists at the micromark level
* Renders `<dl>`, `<dt>`, `<dd>` in HTML output
* Performs strict lookahead to avoid interfering with CommonMark paragraphs

Use this package if you work directly with `micromark`.

### [mdast-util-dl-list](packages/mdast-util-dl-list)

**mdast utilities only**

* Converts micromark tokens into mdast nodes
* Defines node types for definition lists
* Supports mdast → Markdown serialization (to-markdown)

This package does not parse Markdown or render HTML.

### [hast-util-dl-list](packages/hast-util-dl-list)

**hast handlers only**

* Provides handlers for converting mdast definition list nodes to hast
* Intended for use with `remark-rehype`

This package does not parse Markdown or create mdast nodes.

### [remark-dl-list](packages/remark-dl-list)

**remark plugin (recommended entry point)**

* Registers micromark, mdast, and to-markdown extensions
* Enables definition lists with a single `.use()` call
* Designed for use with `remark-parse` and `remark-stringify`

Most users should start with this package.

## Which package should I use?

| Use case                             | Recommended package           |
| ------------------------------------ | ----------------------------- |
| Direct micromark usage               | `micromark-extension-dl-list` |
| mdast transformation / serialization | `mdast-util-dl-list`          |
| mdast → HTML (rehype)               | `hast-util-dl-list`           |
| remark / unified pipeline            | `remark-dl-list`              |

## Repository structure

```
packages/
  micromark-extension-dl-list/
  mdast-util-dl-list/
  hast-util-dl-list/
  remark-dl-list/
```

Each package contains its own README, LICENSE, and tests.

## Development

This repository uses **pnpm workspaces**.

### Install dependencies

```bash
pnpm install
```

### Build or test all packages

```bash
pnpm build
```

```bash
pnpm test
```

### Build or test individual packages

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
