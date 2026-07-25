# Palette's Journal - Karatoken World Party

## 2026-07-23 - Focused Focus-Visible & Semantic Linkages
**Learning:** Overwriting default focus indicators with `outline: none;` or `box-shadow` without a proper keyboard-only `:focus-visible` fallback completely breaks keyboard and screen reader accessibility, rendering pages unusable for assistive technologies. Pairing elements cleanly via semantic `<label for="...">` attributes immediately improves the accessibility tree.
**Action:** Always verify all `<label>` tags have appropriate matching `for` associations, and establish robust high-contrast `:focus-visible` outlines whenever touching an interactive component's design.

## 2026-07-24 - Accessible Interactive Search Results Cards
**Learning:** Dynamic list elements such as search result items (e.g., video cards) generated purely in JS are often inaccessible to assistive technologies and keyboard navigators if they lack interactive semantics. Declaring `tabindex="0"`, `role="button"`, and explicit `aria-label` screen reader descriptors enables smooth tab-traversal and semantic actionability, and hiding decorative sub-images (`aria-hidden="true"`) keeps voice announcements clean.
**Action:** Always ensure dynamic cards or list items have accessible roles, tab indices, keyboard listeners (`Enter`/`Space`), and screen-reader descriptors when they can be clicked or selected.
