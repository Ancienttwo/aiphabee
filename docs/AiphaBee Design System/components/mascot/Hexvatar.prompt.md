Signature honeycomb-hexagon container for avatars and icon chips — replaces generic rounded-square icon blocks.

```jsx
<Hexvatar imgSrc="assets/mascot/avatar.png" size={64} variant="soft" />
<Hexvatar icon={<TrendingUp size={20} />} tone="green" variant="fill" size={44} />
```

Props: `imgSrc`/`alt` or `icon` or `children`, `size`, `tone` (honey/navy/green/violet/red/neutral), `variant` (`soft`/`fill`/`outline`), `clip` (clip a photo to the hex). Transparent mascot PNGs sit on top un-clipped; set `clip` for photos.
