# Palette's Journal - Karatoken World Party

## 2026-07-23 - Focused Focus-Visible & Semantic Linkages
**Learning:** Overwriting default focus indicators with `outline: none;` or `box-shadow` without a proper keyboard-only `:focus-visible` fallback completely breaks keyboard and screen reader accessibility, rendering pages unusable for assistive technologies. Pairing elements cleanly via semantic `<label for="...">` attributes immediately improves the accessibility tree.
**Action:** Always verify all `<label>` tags have appropriate matching `for` associations, and establish robust high-contrast `:focus-visible` outlines whenever touching an interactive component's design.

## 2026-07-26 - Bootstrap Tab Concurrency & Aria Description of Dynamically Generated Inputs
**Learning:** Initializing multiple tab panes with the `show active` class simultaneously on load causes them to render concurrently, resulting in overlapping elements, layout clashing, and broken accessibility trees. Dynamically generated search inputs must possess explicit `aria-label` attributes to remain legible to assistive technologies.
**Action:** Always confirm only the default tab pane contains the active classes on render, and enforce explicit `aria-label` or `id`-label pairing on all dynamically instantiated interactive controls.
