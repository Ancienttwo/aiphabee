Diligent loading state — the bee forages while a honey bar fills the comb. Replaces the generic spinner.

```jsx
<ForageLoader label="工蜂正在采集市场情绪…" />            {/* compact navy pill */}
<ForageLoader variant="block" label="正在采集招股资料…" /> {/* centered panel */}
```

Props: `label`, `variant` (`pill`/`block`), `basePath`, `src`. Needs `tokens/effects.css` (ships via styles.css) for the honey-fill + buzz keyframes.
