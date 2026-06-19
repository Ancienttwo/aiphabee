Labelled text field with a honey focus ring, optional icon/prefix/suffix adornments and an error state.

```jsx
<Input label="Offer price" prefix="HKD" suffix="/share" placeholder="0.00" />
<Input label="Ticker" icon={<Search size={16} />} error="Not found" />
```

Props: `label`, `icon`, `prefix`, `suffix`, `helper`, `error`, `size` (`sm`/`md`/`lg`). Passes through native input attributes.
