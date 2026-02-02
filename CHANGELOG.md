# Changelog

All notable changes to this project will be documented in this file.

This project uses a **single, fixed version** across all packages in the monorepo.

---

## 0.1.4 - 2026-02-02

**⚠️ Breaking changes**

- Removed support for the `::` shorthand inside definition descriptions (`dd`) for starting nested definition lists, **to avoid conflicts with other Markdown syntaxes**.
- Nested definition lists must now be written using the standard syntax with `:` followed by whitespace.
- `::` without whitespace is no longer treated as a definition list marker and is parsed as plain text.

## 0.1.3 - 2026-01-26

### remark-dl-list

- Added a default export for the remark plugin (the existing named export remains supported).

## 0.1.2 - 2026-01-20

- Add `syntax.d.ts` and `html.d.ts` to `micromark-extension-dl-list`.
- Fix an incorrect import path for `micromark-extension-dl-list`.
- Re-export `dlList` from `micromark-extension-dl-list` in `mdast-util-dl-list`.
- Improve interoperability with other micromark/remark plugins:
  - Allow `mdast-util-dl-list` to inherit external `extensions` and `mdastExtensions`
    (e.g. GFM strikethrough) when re-parsing `dt` / `dd` contents.
  - Update `remark-dl-list` to automatically pass already-registered remark extensions
    to the internal re-parser.
- Docs: improve README examples and usage notes, including plugin ordering.
- Tests: add missing test cases and coverage for external plugin integration.

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
