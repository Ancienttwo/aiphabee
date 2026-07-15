/* ============================================================
   (e) 公司事件时间线 — 派息 · 回购 · 集资 · 上市沿革
   ============================================================ */

const NQ_EVENT_META = {
  dividend: { icon: 'coins', label: '派息', tone: 'honey' },
  buyback: { icon: 'rotate-ccw', label: '回购', tone: 'bullish' },
  raise: { icon: 'banknote', label: '集资', tone: 'info' },
  listing: { icon: 'flag', label: '上市', tone: 'navy' },
};

function NqEventsView() {
  useNqLucide();
  const g = useNqGate('events');
  const [filter, setFilter] = React.useState('all');
  const rows = NQ_EVENTS.filter(e => filter === 'all' || e.type === filter);
  const years = [...new Set(rows.map(e => e.date.slice(0, 4)))];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && (
        <NqLockedPanel gateKey="events" preview={'派息史、回购纪录、集资事件共 ' + NQ_EVENTS.length + ' 项已就绪，含除净/派付日历关联。'} />
      )}

      <div className="ab-split" style={{ gap: 16, alignItems: 'start' }}>
        <NqModule icon="calendar-days" title="公司事件时间线" en="Corporate events"
          right={g.state === 'available' && (
            <>
              <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                {[['all', '全部'], ['dividend', '派息'], ['buyback', '回购'], ['raise', '集资']].map(([k, label]) => (
                  <button key={k} onClick={() => setFilter(k)} style={{
                    padding: '3px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                    border: '1px solid ' + (filter === k ? 'var(--honey-500)' : 'var(--border-subtle)'),
                    background: filter === k ? 'var(--honey-500)' : 'var(--surface-card)',
                    fontSize: 'var(--text-2xs)', fontWeight: 700, color: filter === k ? 'var(--text-on-honey)' : 'var(--text-muted)',
                  }}>{label}</button>
                ))}
              </span>
            </>
          )}>
          {g.state !== 'available' ? <NqSdiGhostRows n={4} /> : (
            <div style={{ display: 'grid', gap: 0 }}>
              {years.map(year => (
                <div key={year}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <NqMono size="var(--text-xs)" weight={700} color="var(--text-subtle)">{year}</NqMono>
                    <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></span>
                  </div>
                  {rows.filter(e => e.date.startsWith(year)).map(e => {
                    const m = NQ_EVENT_META[e.type];
                    return (
                      <div key={e.id} style={{ display: 'flex', gap: 14, padding: '10px 0 14px', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ width: 30, height: 30, clipPath: 'var(--clip-hex)', background: 'var(--surface-honey)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <NqIcon name={m.icon} size={14} color="var(--accent-strong)" />
                          </span>
                          <span style={{ width: 1.5, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }}></span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <NqMono size="var(--text-xs)" weight={600} color="var(--text-subtle)">{e.date}</NqMono>
                            <NqBadge tone={m.tone} variant="soft" size="sm">{m.label}</NqBadge>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{e.title}</span>
                            {e.status === '已公告' && <NqBadge tone="info" variant="outline" size="sm">已公告 · 未除净</NqBadge>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{e.detail}</span>
                            {e.amount && <NqMono size="var(--text-xs)" style={{ marginLeft: 'auto' }}>{e.amount}</NqMono>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </NqModule>

        <div style={{ display: 'grid', gap: 16 }}>
          <NqModule icon="hand-coins" title="股东回报摘要" en="Shareholder returns">
            <div className="ab-grid-2" style={{ gap: 10 }}>
              {[
                ['近 12 个月每股股息', <NqGateValue gateKey="events" key="1"><NqMono>HKD 2.655</NqMono></NqGateValue>],
                ['近 12 个月回购金额', <NqGateValue gateKey="events" key="2"><NqMono>HKD 181.0mn</NqMono></NqGateValue>],
                ['连续派息年数', <NqGateValue gateKey="events" key="3"><NqMono>11 年</NqMono></NqGateValue>],
                ['下一除净日', <NqGateValue gateKey="events" key="4"><NqMono>2026-09-03</NqMono></NqGateValue>],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 'var(--text-base)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
              摘要为披露事件的算术汇总（方法 m-nq-evt-sum-1），非任何收益率预测。
            </div>
          </NqModule>

          <NqBeeRead
            gateKey="events"
            methodology="m-nq-evt-1"
            findings={[
              '派息节奏稳定：中期 + 末期双次派付已连续 11 年，2026 中期每股 0.880 港元已公告、尚未除净。',
              '回购集中在 2025-06 与 2026-06 两个窗口，合计 465 万股且均已注销——与库存股余额的差异来自最近一批未注销部分。',
              '2026-03 美元票据属再融资性质，发行当月无到期错配事件。',
            ]}
            limitation="事件均来自已刊发公告；「已公告未除净」事项存在后续修订可能。"
            pose="success"
          />

          <NqRationale>
            <strong>(e) 事件时间线。</strong>四类事件（派息/回购/集资/上市沿革）统一到一条按年分组的时间线上，蜂巢节点 + 类型徽章做扫读锚点，金额右对齐等宽。区分「已确认」与「已公告 · 未除净」两种事实状态——未来事件是公告事实，不是预测。右栏摘要卡的每个聚合数都注明派生方法号，回应「财务事实要么有直接证据、要么是可复算的确定性计算」的规范。
          </NqRationale>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NqEventsView });
