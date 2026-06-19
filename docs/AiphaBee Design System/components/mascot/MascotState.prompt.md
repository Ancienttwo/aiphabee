Full mascot illustration for empty / success / error / onboarding states — centered pose + title + description + optional action, over a faint honeycomb backdrop.

```jsx
<MascotState pose="empty" title="还没有关注的标的"
  description="让工蜂帮你盯紧港美股新机会。">
  <Button>添加到关注巢</Button>
</MascotState>
<MascotState pose="success" title="已加入关注巢！" comb={false} />
```

Props: `pose` (empty/success/risk/thinking/greeting/…), `basePath`, `src`, `title`, `description`, `size`, `comb`, `children`.
