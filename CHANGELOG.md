# Changelog

All notable changes to this project will be documented in this file.

This project uses a **single, fixed version** across all packages in the monorepo.

---

## 0.1.1 - 2026-01-14

- Fixed nested definition lists when using the `::` shorthand.
- Fixed an issue where `:` was not reproduced in toMarkdown when the dd text was empty.

## 0.1.0 - 2026-01-13

Initial release.

### Added
- Colon-based definition list support using `<dl>`, `<dt>`, and `<dd>`
- micromark extension with safe paragraph lookahead
- mdast utilities for definition list nodes and to-markdown
- hast handlers for remark-rehype
- remark plugin as the recommended entry point

### Notes
- Definition lists are supported inside block quotes, including nested definition lists.
