The signature 0–100 signal gauge for market sentiment & analysis scores — big number + coloured fill track.

```jsx
<ScoreMeter label="情绪指数 Sentiment" value={72} tone="bullish"
            labels={["极度悲观", "中性", "极度乐观"]} />
```

Props: `value`, `max` (default 100), `label`, `tone` (`bullish`/`cautious`/`neutral`/`bearish`/`honey`/`ai`), `labels` (end captions), `showValue`.
