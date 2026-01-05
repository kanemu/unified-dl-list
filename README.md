# unified-dl-list

Definition list (DL) support for the unified ecosystem.

This monorepo contains packages that enable parsing and rendering of definition lists
(e.g. `dt` / `dd` style structures) across micromark, mdast, and hast.

## Packages

- [`micromark-extension-dl-list`](./packages/micromark-extension-dl-list/)
  - Micromark extension (tokenizer) for definition lists.
- [`mdast-util-dl-list`](./packages/mdast-util-dl-list/)
  - MDAST utilities (fromMarkdown extension) for definition lists.
- [`hast-util-dl-list`](./packages/hast-util-dl-list/)
  - HAST utilities (mdast-util-to-hast handlers) for definition lists.

## Install

Install the specific package(s) you need:

- `micromark-extension-dl-list`
- `mdast-util-dl-list`
- `hast-util-dl-list`

## Development

This repository uses pnpm workspaces.

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
````

## License

MIT
