# Definition List Syntax

> 📘 **日本語版はこちら** → [syntax-ja.md](./syntax-ja.md)

This document describes the colon-based definition list syntax
supported by the **unified-dl-list** packages.

## Basic syntax

A definition list consists of:

- One or more **terms**
- Followed by one or more **descriptions**

```md
: term
    : description
```

This is rendered as:

```html
<dl>
    <dt>term</dt>
    <dd>description</dd>
</dl>
```

## Multiple descriptions

A term may have multiple descriptions:

```md
: term
    : description 1
    : description 2
```

```html
<dl>
    <dt>term</dt>
    <dd>description 1</dd>
    <dd>description 2</dd>
</dl>
```

## Block content inside descriptions

Descriptions may contain block-level content such as paragraphs,
lists, or code blocks:

```md
: term
    : description paragraph
      - list item
      - list item
```

```html
<dl>
    <dt>term</dt>
    <dd>
        <p>description paragraph</p>
        <ul>
            <li>list item</li>
            <li>list item</li>
        </ul>
    </dd>
</dl>
```

## Separation from following blocks

A definition list is separated from the following block
by a single blank line:

```md
: term
    : description

Next paragraph.
```

```html
<dl>
    <dt>term</dt>
    <dd>description</dd>
</dl>
<p>Next paragraph.</p>
```

## Term continuation lines

A term may continue onto following lines when those lines are indented
and do not start with `:`.

```md
: long term line 1
  line 2
    : description
```

This is rendered as a single `<dt>` with a line break between lines.

```html
<dl>
    <dt>long term line 1
line 2</dt>
    <dd>description</dd>
</dl>
```

## Nested definition lists

Descriptions are parsed as full block-level Markdown, so
definition lists may appear inside descriptions:

```md
: outer term
    : : inner term
          : inner description
```

```html
<dl>
    <dt>outer term</dt>
    <dd>
        <dl>
            <dt>inner term</dt>
            <dd>inner description</dd>
        </dl>
    </dd>
</dl>
```

## Definition lists inside blockquotes

Definition lists may also appear inside blockquotes:

```md
> : term
>     : description
```

```html
<blockquote>
    <dl>
        <dt>term</dt>
        <dd>description</dd>
    </dl>
</blockquote>
```

They behave the same way as top-level definition lists,
including support for nested lists inside descriptions.

## Notes

* This syntax is inspired by common definition list conventions
  but is not part of the CommonMark specification.
* Behavior may differ from other Markdown implementations.
