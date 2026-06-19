Dashboard quick-stat tile — big tabular number, caption, tinted icon chip, optional delta.

```jsx
<StatCard label="Active IPOs" value="12" tone="honey" icon={<Calendar size={20} />} />
<StatCard label="Avg. first-day pop" value="+18.6%" tone="green"
          delta="3.2% vs last month" deltaDirection="up" icon={<TrendingUp size={20} />} />
```

Props: `label`, `value`, `icon`, `tone` (`honey`/`navy`/`green`/`violet`/`blue`/`red`), `delta`, `deltaDirection`.
