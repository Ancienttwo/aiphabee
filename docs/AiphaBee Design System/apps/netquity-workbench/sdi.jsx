/* ============================================================
   (c) SDI 权益披露 — 个股面板 + 全市场披露流
   ============================================================ */

const NQ_SDI_TONE = { increase: 'bullish', decrease: 'bearish', passive: 'neutral' };

function NqSdiDelta({ before, after }) {
  const up = after > before;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
      <NqMono size="var(--text-xs)" weight={600} color="var(--text-subtle)">{before.toFixed(2)}%</NqMono>
      <NqIcon name="arrow-right" size={11} color="var(--text-subtle)" />
      <NqMono weight={700} color={up ? 'var(--green-600)' : 'var(--red-600)'}>{after.toFixed(2)}%</NqMono>
    </span>
  );
}

/* ---------- 个股 SDI 面板（工作台 tab） ---------- */
function NqSdiStockPanel() {
  useNqLucide();
  const g = useNqGate('sdi_stock');
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && (
        <NqLockedPanel gateKey="sdi_stock" preview={'近 90 日 ' + NQ_SDI_STOCK.length + ' 宗大股东及内幕人士披露已就绪：申报人、好仓/淡仓、界线穿越与披露表格逐宗可溯。'} />
      )}
      <NqModule icon="file-search" title="大股东与内幕人士披露" en="SDI · Substantial shareholders & insiders">
        {g.state === 'available' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {NQ_SDI_STOCK.map(r => {
              const held = r.id === 's2';
              return (
                <div key={r.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <NqMono size="var(--text-xs)" weight={600} color="var(--text-subtle)">{r.date}</NqMono>
                    <NqBadge tone={NQ_SDI_TONE[r.kind]} variant="soft" size="sm" dot dotShape="hex">{r.kindZh}</NqBadge>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{r.holderZh}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {held ? <NqHoldValue reason="披露原文与股本变动表交叉核对未通过，数值复核中"><NqSdiDelta before={r.before} after={r.after} /></NqHoldValue> : <NqSdiDelta before={r.before} after={r.after} />}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{r.position} · 变动 <NqMono size="var(--text-2xs)" weight={600} color="var(--text-muted)">{r.shares}</NqMono> 股 · 表格 {r.form}</span>
                    {r.crossing && <NqBadge tone="warning" variant="soft" size="sm" icon={<NqIcon name="flag" size={11} />}>{r.crossing}</NqBadge>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <NqSdiGhostRows n={4} />
        )}
      </NqModule>

      <NqBeeRead
        gateKey="sdi_stock"
        methodology="m-nq-sdi-1"
        findings={[
          '近 90 日 4 宗披露呈两条线索：控股家族信托一侧连续上行（29.98% → 30.17%，其中一次为回购注销带来的被动越线），机构一侧分化（贝莱德跌破 5% 界线、摩根大通增至 6.11%）。',
          '6/24 被动越线的「变动原因」为供应商推断字段。',
        ]}
        limitation="SDI 存在法定 3 个营业日申报时滞；未申报的 5% 以下变动不可见。"
      />

      <NqRationale>
        <strong>(c-1) 个股 SDI。</strong>披露是「事件」不是「行情」：每宗一张纪录卡，左侧日期+性质+申报人，右侧 before→after 的界线运动（涨绿跌红仅用于持股比例方向，非任何多空判断）。界线穿越（上穿 30%/下穿 5%）用旗标徽章单独点名，这是 SDI 的核心信息。evidence-first 体现在每宗记录的独立标注上——同屏可见 s2 那宗因字段为推断结果单独标注，且质量保留演示也挂在该宗上（fail closed：扣留数值、给出原因，绝不显示可疑数字）。
      </NqRationale>
    </div>
  );
}

/* 锁定态骨架行：只示意结构，不合成任何数值 */
function NqSdiGhostRows({ n = 4 }) {
  return (
    <div style={{ display: 'grid', gap: 10 }} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ width: 64, height: 10, borderRadius: 4, background: 'var(--surface-track)' }}></span>
          <span style={{ width: 120 + (i % 3) * 40, height: 10, borderRadius: 4, background: 'var(--surface-track)' }}></span>
          <span style={{ marginLeft: 'auto', width: 90, height: 10, borderRadius: 4, background: 'var(--surface-track)' }}></span>
        </div>
      ))}
      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', textAlign: 'center' }}>结构示意 · 锁定状态下不展示任何数值</div>
    </div>
  );
}

/* ---------- 全市场披露流（独立视图） ---------- */
function NqSdiMarketView({ openStock }) {
  useNqLucide();
  const g = useNqGate('sdi_market');
  const [filter, setFilter] = React.useState('all');
  const rows = NQ_SDI_MARKET.filter(r => filter === 'all' ? true : filter === 'crossing' ? !!r.crossing : r.kind === filter);
  const chips = [['all', '全部'], ['increase', '增持'], ['decrease', '减持'], ['crossing', '界线穿越']];

  return (
    <main style={{ ...NQ_SHELL, padding: '32px 24px 72px', maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>全市场权益披露</h1>
        <NqBadge tone="navy" variant="soft" size="sm">SDI · Market-wide</NqBadge>
      </div>
      <p style={{ margin: '8px 0 20px', fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        全港股大股东及内幕人士披露的逐日汇总流，T+1 反映。
      </p>

      {g.state !== 'available' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <NqLockedPanel gateKey="sdi_market" preview="今日 6 宗全市场披露已就绪（覆盖 00700、00005、09988 等）；含界线穿越 2 宗。市场级汇总属 Enterprise 数据域。" />
          <NqModule icon="rss" title="今日披露流" en="Today's feed" pad>
            <NqSdiGhostRows n={5} />
          </NqModule>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '4px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                border: '1px solid ' + (filter === k ? 'var(--honey-500)' : 'var(--border-subtle)'),
                background: filter === k ? 'var(--honey-500)' : 'var(--surface-card)',
                fontSize: 'var(--text-xs)', fontWeight: 700, color: filter === k ? 'var(--text-on-honey)' : 'var(--text-muted)',
              }}>{label}</button>
            ))}
          </div>

          <NqModule icon="rss" title={'披露流 · ' + rows.length + ' 宗'} en="Disclosure feed" pad={false}>
            <div>
              {rows.map((r, i) => (
                <button key={r.id} onClick={() => { if (r.symbol === '00001.HK') openStock('sdi'); }}
                  title={r.symbol === '00001.HK' ? '打开长和工作台 · 权益披露' : '演示仅实装 00001'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '13px 20px',
                    background: 'none', border: 'none', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                    cursor: r.symbol === '00001.HK' ? 'pointer' : 'default',
                  }}>
                  <NqMono size="var(--text-xs)" weight={600} color="var(--text-subtle)" style={{ flexShrink: 0 }}>{r.date.slice(5)}</NqMono>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 150, flexShrink: 0 }}>
                    <NqMono size="var(--text-xs)" weight={700}>{r.symbol.slice(0, 5)}</NqMono>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{r.nameZh}</span>
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.holderZh}</span>
                  <NqBadge tone={NQ_SDI_TONE[r.kind]} variant="soft" size="sm">{r.kindZh}</NqBadge>
                  {r.crossing && <NqBadge tone="warning" variant="soft" size="sm" icon={<NqIcon name="flag" size={11} />}>越线</NqBadge>}
                  <NqSdiDelta before={r.before} after={r.after} />
                </button>
              ))}
            </div>
          </NqModule>

          <NqBeeRead
            gateKey="sdi_market"
            methodology="m-nq-sdi-2"
            findings={[
              '今日 6 宗披露中 2 宗为界线穿越：平安资管上穿汇丰 8%，贝莱德因长江基建回购被动上穿 5%。',
              '科技板块两宗均为长期股东减持（Prosus 于腾讯、软银于阿里），性质为既有减持计划的延续申报。',
            ]}
            limitation="仅覆盖已申报披露；汇总不代表市场整体资金方向。"
            pose="thinking"
          />

          <NqRationale>
            <strong>(c-2) 全市场披露流。</strong>市场级视图的默认单位是「宗」，一行一宗、时间倒序，行内信息严格限定五件事：日期、标的、申报人、性质、界线运动——其余细节留给个股面板（点长和行即深链到其 SDI tab）。过滤 chips 用「性质 + 越线」而非多空语言。锁定态展示骨架行 + 已就绪宗数（聚合计数属可披露的元数据），既诚实又给出升级价值感。
          </NqRationale>
        </div>
      )}
    </main>
  );
}

Object.assign(window, { NqSdiStockPanel, NqSdiMarketView, NqSdiGhostRows, NqSdiDelta });
