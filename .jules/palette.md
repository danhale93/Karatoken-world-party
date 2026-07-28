## 2025-07-24 - Semantic Label Associations and Keyboard Shortcut Visualizations
**Learning:** In multi-section forms, missing `for` associations on `<label>` elements make screen-readers less effective and reduce click target sizes. Additionally, background keyboard shortcuts implemented in JS should always be visually advertised on the primary buttons using `<kbd>` tags to bridge the gap between keyboard navigators and mouse users.
**Action:** Always verify all `<label>` tags have explicit `for` bindings matching the control IDs, and display a subtle inline keyboard badge like `<kbd class="kbd-badge">` next to the button text when background listeners exist.

## 2025-07-27 - Utilizing Pre-defined Button Loading States and ARIA Attributes
**Learning:** Found pre-defined CSS loading state classes (`.button-loading`) that were left unused on core asynchronous buttons. Applying `.button-loading` combined with standard accessibility roles (`aria-busy="true"` and `disabled`) on active health checks, callback triggers, and heavy backend jobs (e.g., genre swap) is a highly repeatable and cohesive UX/a11y improvement for this design system.
**Action:** When working with async actions, always search for existing `.button-loading` class rules in styles and map them cleanly to button triggers along with `aria-busy` and disabling state management.

## 2025-07-28 - Keyboard Submission Patterns and Consistent Loading Feedback
**Learning:** Forcing users to switch from keyboard to mouse solely to submit a form or trigger a search violates standard web expectations and keyboard accessibility. Additionally, asynchronous operations should consistently leverage pre-defined loading UI styles (such as '.button-loading') along with 'aria-busy' attributes to keep screen readers and visual users informed of background tasks.
**Action:** Always attach keypress listeners for 'Enter' on form inputs to auto-trigger the associated submission handlers, and use uniform button-loading classes paired with aria-busy attributes across all async buttons.
