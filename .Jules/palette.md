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

## 2026-07-31 - Safe State Transitions & Keyboard Shortcut Safety in Developer Previews
**Learning:** Reusing alert/feedback classes like `.success` on small inline controls (like Copy buttons) can introduce heavy layout jank due to clashing box model definitions (e.g., margins/padding/display rules). Additionally, keyboard shortcuts (such as Ctrl+Enter) that trigger core operations must respect the button/form's validation-driven disabled states, preventing accidental empty submissions or premature UI state overrides.
**Action:** For lightweight feedback transitions, apply targeted inline styling properties or separate scoped helper classes instead of global block-level alert style definitions, and explicitly assert button/input availability in all global shortcut listeners.

## 2026-08-05 - Descriptive Accessible Form Validation on Disabled Controls
**Learning:** Leaving submit buttons disabled without explaining why is highly frustrating and inaccessible, particularly for screen reader users who cannot visually determine what inputs are missing or invalid. Dynamically updating the `title` and `aria-label` attributes on a disabled submit button to describe missing validation fields, and shifting to shortcut indicators when active, provides a delightful and highly accessible form feedback loop.
**Action:** When a button is disabled due to multi-input validation constraints, dynamically set state-specific `title` and `aria-label` attributes detailing exactly which inputs are missing, and update them to present key shortcut hints when active.
