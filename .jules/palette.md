## 2025-07-24 - Semantic Label Associations and Keyboard Shortcut Visualizations
**Learning:** In multi-section forms, missing `for` associations on `<label>` elements make screen-readers less effective and reduce click target sizes. Additionally, background keyboard shortcuts implemented in JS should always be visually advertised on the primary buttons using `<kbd>` tags to bridge the gap between keyboard navigators and mouse users.
**Action:** Always verify all `<label>` tags have explicit `for` bindings matching the control IDs, and display a subtle inline keyboard badge like `<kbd class="kbd-badge">` next to the button text when background listeners exist.

## 2025-07-25 - Accessible Interactive Search Results Cards
**Learning:** Dynamic list elements such as search result items (e.g., video cards) generated purely in JS are often inaccessible to assistive technologies and keyboard navigators if they lack interactive semantics. Declaring `tabindex="0"`, `role="button"`, and explicit `aria-label` screen reader descriptors enables smooth tab-traversal and semantic actionability, and hiding decorative sub-images (`aria-hidden="true"`) keeps voice announcements clean.
**Action:** Always ensure dynamic cards or list items have accessible roles, tab indices, keyboard listeners (`Enter`/`Space`), and screen-reader descriptors when they can be clicked or selected.
