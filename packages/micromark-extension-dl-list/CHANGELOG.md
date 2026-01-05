# Changelog

All notable changes to this project will be documented in this file.

This project follows Semantic Versioning (https://semver.org/)
and the principles of Keep a Changelog (https://keepachangelog.com/).

## [Unreleased]

### Changed
- (reserved for future changes)

### Fixed
- (reserved for future fixes)

---

## 0.1.0 - 2026-01-03

Initial release.

### Added

- Colon-based definition list syntax (`dl`, `dt`, `dd`) for micromark.
- Support for up to 3 columns of indentation before `:` (CommonMark-compatible list rule).
- Multiple terms and descriptions within a single definition list.
- Continuation lines appended to the previous `dt` or `dd`.
- Nested unordered and ordered lists (`ul`, `ol`) inside `dd`.
- Nested definition lists inside `dd`.
- Inline Markdown support inside `dt` and `dd`:
  - links
  - emphasis (`em`)
  - strong emphasis (`strong`)
  - inline code
- HTML output via `dlListHtml` extension.
- ES module–only distribution.

### Fixed

- Prevented indentation from being consumed unless a definition list is confirmed.
- Fixed block boundary handling so blank lines correctly terminate a definition list.
- Fixed heading leakage issues (e.g. stray `#` after closing `</dl>`).
- Ensured correct interaction with CommonMark block constructs such as headings and lists.
- Prevented `dd` content from being incorrectly parsed as code blocks (`<pre><code>`).

### Known limitations

- Definition lists inside block quotes (`>`) are not supported.
- A line starting with `:` inside a block quote is treated as normal text.

---

© 2026 Yohei Kanamura. Released under the MIT License.
