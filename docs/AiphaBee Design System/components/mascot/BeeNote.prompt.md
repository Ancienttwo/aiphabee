The worker-bee insight block — the mascot (in a honeycomb hexagon) delivers an AI finding in a diligent voice. Replaces the generic "AI" circle.

```jsx
<BeeNote pose="insight" basePath="assets/mascot" title="工蜂洞察 · 已为您勤劳搜罗">
  科技板块情绪转牛，<b>蜂巢智能 128× 超额认购</b>领跑。要我钉进关注巢吗？
</BeeNote>
<BeeNote tone="navy" pose="risk" title="风险提示">行业产能过剩、已破发，建议规避。</BeeNote>
```

Props: `pose` (insight/thinking/success/risk/…), `basePath`, `src`, `title`, `tone` (`honey`/`navy`), `mascotSize`, `action`, `children`. Pass `basePath` pointing at your copied `assets/mascot/` folder.
