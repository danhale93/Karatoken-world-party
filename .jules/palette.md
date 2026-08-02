# Palette's Journal - Karatoken World Party

## 2026-07-23 - Focused Focus-Visible & Semantic Linkages
**Learning:** Overwriting default focus indicators with `outline: none;` or `box-shadow` without a proper keyboard-only `:focus-visible` fallback completely breaks keyboard and screen reader accessibility, rendering pages unusable for assistive technologies. Pairing elements cleanly via semantic `<label for="...">` attributes immediately improves the accessibility tree.
**Action:** Always verify all `<label>` tags have appropriate matching `for` associations, and establish robust high-contrast `:focus-visible` outlines whenever touching an interactive component's design.

## 2026-07-26 - Bootstrap Tab Concurrency & Aria Description of Dynamically Generated Inputs
**Learning:** Initializing multiple tab panes with the `show active` class simultaneously on load causes them to render concurrently, resulting in overlapping elements, layout clashing, and broken accessibility trees. Dynamically generated search inputs must possess explicit `aria-label` attributes to remain legible to assistive technologies.
**Action:** Always confirm only the default tab pane contains the active classes on render, and enforce explicit `aria-label` or `id`-label pairing on all dynamically instantiated interactive controls.

## 2026-07-29 - Keyboard Event Listeners for Input Submission
**Learning:** Utilizing the deprecated `'keypress'` event listener in form search fields restricts proper keyboard submission in modern web browsers and lacks full accessibility support. Transitioning to `'keydown'` listeners ensures cross-browser accessibility and seamless execution of form actions when pressing the 'Enter' key.
**Action:** Always prefer the modern, standardized `'keydown'` event over the deprecated `'keypress'` event when binding 'Enter' key listeners to form inputs.

## 2026-07-30 - Interactive Copy to Clipboard Micro-UX in Developer Previews
**Learning:** In developer-facing preview tools, manually selecting and copying raw text outputs (like LRC lyrics) is repetitive, frustrating, and prone to selection errors. Introducing an accessible, key-navigable `<button>` with a copy icon, proper ARIA labels, and a temporary "Copied!" text/visual transition (e.g., success state feedback) significantly reduces interaction friction.
**Action:** When displaying raw generated code, lyrics, or logs, always provide an inline Copy button with ARIA attributes and a 2-second temporary success text feedback loop.

## 2026-08-02 - Headless Permission Assertions & Aria Announcement for State Changes
**Learning:** Modern Clipboard APIs (`navigator.clipboard.writeText`) are sandboxed and blocked by default in headless Chromium-based environments (like Playwright runners), resulting in silent failures during test/verification cycles. Furthermore, when copy buttons change their text label dynamically, screen readers fail to notice the update unless the button possesses an explicit `aria-live="polite"` attribute and its `aria-label` is dynamically updated.
**Action:** Always grant explicit `"clipboard-write"` permissions to browser contexts during visual/automated end-to-end tests, and always bind `aria-live="polite"` on state-shifting copy-to-clipboard buttons.
