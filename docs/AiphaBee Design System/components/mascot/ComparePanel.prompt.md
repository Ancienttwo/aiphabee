The head-to-head "PK" view — the compare worker-bee presides over a honeycomb header while two candidates are weighed metric-by-metric. Winning cells highlight honey-green; the bee delivers the verdict in the navy footer. Hero-scale mascot, one per screen.

```jsx
<ComparePanel
  basePath="assets/mascot"
  title="工蜂帮你称一称"
  subtitle="两家在招港股放上蜂室天平。"
  left={{ name: '蜂巢智能', ticker: '02468.HK', color: 'var(--green-500)' }}
  right={{ name: '某某科技', ticker: '08321.HK', color: 'var(--red-500)' }}
  metrics={[
    { label: '情绪信号', left: <Badge tone="bullish" dot>牛市</Badge>, right: <Badge tone="bearish" dot>熊市</Badge>, winner: 'left' },
    { label: '超额认购', left: '128×', right: '6×', winner: 'left' },
    { label: '风险评级', left: '中', right: '高' },
  ]}
  verdict={<>工蜂结论：<b>蜂巢智能</b> 更甜 — 情绪转牛、认购领先。</>}
/>
```

Props: `left`/`right` ({name, ticker, color}), `metrics` ([{label, left, right, winner}]), `verdict`, `eyebrow`, `title`, `subtitle`, `mascotSize`, `pose`/`basePath`/`src`. Values may be nodes (drop a Badge in). `winner:'left'|'right'` tints the cell green. Point `basePath` at your copied `assets/mascot/` folder.
