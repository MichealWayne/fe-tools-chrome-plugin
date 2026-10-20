# Shared controls

Button and tag appearance is defined in `controls.less`. It is loaded globally by
`design-system.less`; feature components do not need another import.

| Class                              | Use                                                          |
| ---------------------------------- | ------------------------------------------------------------ |
| `tool-button`                      | Secondary action, 34px minimum height                        |
| `tool-button tool-button--primary` | Main action                                                  |
| `tool-button tool-button--small`   | Compact action, 28px minimum height                          |
| `tool-button tool-button--text`    | Panel header action such as copy or clear                    |
| `tool-tag`                         | Static label, 22px minimum height                            |
| `tool-chip`                        | Clickable filter or shortcut, 28px minimum height            |
| `tool-input` / `u-input`           | Standard input using shared border, radius and focus styling |
| `m-s_input`                        | Search input, 38px minimum height                            |

Tags and chips support `tool-tag--primary`, `tool-tag--success`,
`tool-tag--warning`, and `tool-tag--danger`. The default tone is neutral.
Use native `disabled` on buttons. Keep keyboard focus outlines visible.
Static labels use at least 12px text. Clickable controls use a minimum target
height of 28px; static tags can remain 22px high.

```html
<button type="button" class="tool-button tool-button--primary">Convert</button>
<button type="button" class="tool-button tool-button--text" disabled>Copy</button>
<span class="tool-tag tool-tag--warning">Stale</span>
<button type="button" class="tool-chip tool-tag--primary">curl</button>
```

Existing `u-btn` and `u-btn_il` classes share the secondary button style;
`s-color="blue"` selects the primary style for these legacy classes.
Use `tool-button` classes for new controls. Feature CSS should keep layout rules
such as alignment, flex growth, and minimum width. Set shared height and radius
through the `--control-*` tokens instead of overriding individual modules.

Navigation tabs, upload drop zones, and result cards retain their own layouts.
They should not use action-button classes unless they represent an action.

## Popup and standalone pages

The popup dimensions come from `--popup-width` (500px) and `--popup-height`
(450px) in `tokens.less`. Embedded workspaces size themselves against their
parent instead of the browser viewport. The popup's `.m-ctn--scrollable` owns
module scrolling; workspace panels remain in document flow. On the home page,
the search result list owns its scrolling. Image previews and code editors may
scroll within their own content areas.

Standalone workspaces can set `--workspace-max-width` and `--workspace-gutter`
without changing popup dimensions. PostMan is a standalone page. Media queries
for its desktop layout should not be treated as popup rules.

Use global surface, foreground, border, font and radius tokens for module UI.
Private `--date-*`, `--svg-*` and `--json-*` variables are aliases of those tokens.
The JSON renderer uses separate `--color-code-*` tokens to preserve syntax
highlighting. Reduced motion and scrollbars are configured globally.

## Copy feedback

Use `CopyButton` from `@/components/Experience` for clipboard actions. Pass the
exact string through `value` and a localized action through `label`; use
`accessibleLabel` to distinguish repeated controls when needed. Shared button
modifier classes are supported on the component.

The component uses `useCopy` to show a local, accessible success or failure for
1.5 seconds without inserting a banner. It reserves label width, disables empty
or pending actions, resets when its value changes, and clears timers on unmount.
A stale asynchronous completion cannot mark a different value as copied. Use
`useCopy` directly only when a specialized control cannot use `CopyButton`.

Embedded workspaces use `compact` with the `leading` slot for the return action.
The single-row header sticks while the outer popup scrolls. Its description stays
available to assistive technology and in the heading tooltip. Keep validation
beside the affected field; copying should not insert a separate feedback banner.

Both popup home and tool views reserve the same scrollbar gutter. Use
`focus-inset` on containers that clip their children to keep keyboard focus
outlines inside their bounds.

PostMan fills the standalone viewport minus its outer margins on desktop, with
scrollable request and response panes. At widths up to 920px or heights up to
520px it stacks panels in page flow, using document scrolling. Response fullscreen
uses `inset: 0` rather than viewport width. Popup editor and preview heights use
bounded viewport calculations; preserve readable minimums and vertical resizing
where supported rather than forcing all tool content into one screen.
