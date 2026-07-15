/* ============================================================
   市场行情 view — 指数表现 · 环球股市 · 商品外汇 · 今日焦点
   （modern/markets.html + market-calendar.html 移植；演示数据）
   ============================================================ */

/* ---------- 数据 ---------- */
const NQ_HK_INDEXES = [
  ['恒生指数', 23055.03, 0.76, -11.46, -8.2, -12.5, -4.8, '28,056.10', '22,518.00'],
  ['恒生工商业', 11494.04, 1.06, -14.14, -11.0, -19.8, -14.1, '16,080.32', '11,079.58'],
  ['恒生金融', 49789.77, 0.26, -6.56, -3.2, -0.4, 12.7, '54,727.04', '43,205.68'],
  ['恒生地产', 18534.80, 1.41, -12.50, -5.7, 3.5, 3.9, '23,267.95', '17,418.59'],
  ['恒生公用事业', 35961.28, -0.56, -7.63, -10.5, -6.1, -0.5, '41,657.84', '35,365.68'],
  ['恒生综合指数', 3443.20, 0.43, -11.49, -9.0, -14.1, -4.5, '4,296.72', '3,363.30'],
  ['恒生综合大型股', 2119.04, 0.80, -11.61, -8.6, -14.4, -4.7, '2,644.67', '2,064.29'],
  ['恒生综合中型股', 4506.83, -1.06, -9.38, -7.6, -11.3, -0.5, '5,563.36', '4,416.73'],
  ['恒生综合小型股', 1297.47, -1.21, -15.90, -21.2, -18.4, -14.0, '1,788.28', '1,295.39'],
  ['国企指数 HSCEI', 7612.48, 0.72, -13.13, -10.0, -17.0, -12.7, '9,770.21', '7,404.47'],
  ['红筹指数 HSCCI', 3735.60, 1.80, -16.40, -10.4, -8.5, -8.7, '4,669.16', '3,652.68'],
  ['恒生科技指数', 4454.28, -0.40, -14.33, -4.8, -22.4, -15.5, '6,715.46', '4,229.94'],
  ['恒生香港 35', 2982.19, 0.16, -6.57, -3.2, 2.5, 13.2, '3,349.99', '2,599.64'],
  ['恒生 REIT 指数', 2845.74, 0.80, -9.59, -5.0, -9.4, -8.1, '3,416.13', '2,796.06'],
];

const NQ_HERO_INDEXES = [
  ['恒生指数', '23,055.03', 0.76],
  ['国企指数', '7,612.48', 0.72],
  ['恒生科技', '4,454.28', -0.40],
  ['恒生香港 35', '2,982.19', 0.16],
];

const NQ_WORLD_INDEXES = [
  ['纽约', '道琼斯', '52,900.07', 594.83, 1.14],
  ['纽约', '纳斯达克', '25,832.67', -207.36, -0.80],
  ['伦敦', '富时 100', '10,652.87', 174.53, 1.67],
  ['东京', '日经 225', '68,733.15', -1741.81, -2.47],
  ['香港', '恒生指数', '23,055.03', 174.01, 0.76],
  ['香港', '国企指数', '7,612.48', 54.18, 0.72],
  ['香港', '红筹指数', '3,735.60', 66.18, 1.80],
];

const NQ_COMMODITIES = [
  ['纽约期糖 #11', '18.73', 0.08, 0.43],
  ['纽约期铜', '3.4225', -0.0155, -0.45],
  ['纽约黄金', '1,672.40', -4.20, -0.25],
  ['纽约白银', '19.135', -0.480, -2.45],
  ['纽约天然气', '6.610', 0.047, 0.72],
  ['纽约原油', '88.66', -2.24, -2.46],
];
const NQ_FX = [
  ['USD/JPY', '161.08', '161.02', '161.45'],
  ['USD/CAD', '1.4192', '1.4181', '1.4190'],
  ['USD/HKD', '7.8441', '7.8428', '7.8430'],
  ['GBP/USD', '1.3357', '1.3374', '1.3339'],
  ['AUD/USD', '0.6909', '0.6934', '0.6915'],
  ['EUR/USD', '1.1420', '1.1444', '1.1422'],
];

/* 今日焦点：[名称, 今日有更新, 跳转 view 或 null] */
const NQ_FOCUS = [
  ['环球金融市场', true, null], ['环球股市', false, null], ['新股上市', true, null], ['首次公开招股', false, null],
  ['权益披露', true, 'market'], ['证券回购', true, 'stock:events'], ['沽空', true, null], ['重大交易', true, null],
  ['成交分析', true, null], ['衍生工具摘要', true, 'stock:warrants'], ['牛熊证摘要', false, 'stock:warrants'], ['认股证筛选', true, null],
  ['成分股表现', false, null], ['三十大股份', false, null], ['业绩预告', true, null], ['集资活动', true, 'stock:events'],
  ['股本变动', false, null], ['交易提示', true, null], ['股份权益', false, 'stock:events'], ['公司变更', false, null],
];

/* ---------- 市场行情 view ---------- */
function NqMarketQuotesView({ go, openStock }) {
  useNqLucide();
  const g = useNqGate('price');
  const ud = useNqUpDown();
  const [sort, setSort] = React.useState({ col: null, dir: -1 });

  const pcCell = (v, key) => (
    <td key={key} style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
      <NqMono weight={700} color={v > 0 ? ud.up : v < 0 ? ud.down : 'var(--text-muted)'}>{v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v).toFixed(2)}%</NqMono>
    </td>
  );
  const cols = ['指数名称', '最新', '1 日 %', '1 月 %', '3 月 %', '6 月 %', '52 周 %', '52 周高', '52 周低'];
  const rows = React.useMemo(() => {
    if (sort.col == null) return NQ_HK_INDEXES;
    const num = v => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
    return [...NQ_HK_INDEXES].sort((a, b) => (sort.col === 0 ? a[0].localeCompare(b[0]) : num(a[sort.col]) - num(b[sort.col])) * sort.dir);
  }, [sort]);

  return (
    <main style={{ ...NQ_SHELL, padding: '32px 24px 72px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>市场行情</h1>
        <NqBadge tone="navy" variant="soft" size="sm">指数 · 环球 · 商品外汇 · 今日焦点</NqBadge>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>2026-07-11 · 日终数据</span>
      </div>

      {/* 指数英雄卡 */}
      <div className="ab-grid-4" style={{ gap: 12, margin: '20px 0 16px' }}>
        {NQ_HERO_INDEXES.map(([name, val, chg]) => (
          <div key={name} style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xs)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: chg >= 0 ? ud.up : ud.down }}></span>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{name}</div>
            <NqMono size="var(--text-xl)" weight={700} style={{ display: 'block', marginTop: 4 }}>{val}</NqMono>
            <NqMono size="var(--text-xs)" weight={700} color={chg >= 0 ? ud.up : ud.down}>{chg >= 0 ? '+' : '−'}{Math.abs(chg).toFixed(2)}%</NqMono>
          </div>
        ))}
      </div>

      {g.state !== 'available' && <NqLockedPanel gateKey="price" preview="14 项港股指数区间表现、7 个环球市场收盘、商品债券与三地外汇已就绪。" style={{ marginBottom: 16 }} />}

      <div style={{ display: 'grid', gap: 16 }}>
        {/* 港股指数表现（可排序） */}
        <NqModule icon="bar-chart-horizontal" title="港股指数表现" en="HK index performance" pad={false}>
          {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={5} /></div> : (
            <div className="ab-table-scroll">
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 860 }}>
                <thead>
                  <tr>
                    {cols.map((h, i) => {
                      const sorted = sort.col === i;
                      return (
                        <th key={h} onClick={() => setSort(s => ({ col: i, dir: s.col === i ? -s.dir : (i === 0 ? 1 : -1) }))} style={{ cursor: 'pointer', userSelect: 'none', textAlign: i === 0 ? 'left' : 'right', padding: '10px ' + (i === 0 ? '20px' : '12px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: sorted ? 'var(--text-primary)' : 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>
                          {h}<span style={{ marginLeft: 4, opacity: sorted ? 1 : 0.45, color: sorted ? 'var(--accent-strong)' : undefined, fontSize: 9 }}>{sorted ? (sort.dir > 0 ? '▲' : '▼') : '↕'}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={r[0]} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                      <td style={{ padding: '8px 20px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{r[0]}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}><NqMono weight={600}>{r[1].toLocaleString(undefined, { minimumFractionDigits: 2 })}</NqMono></td>
                      {pcCell(r[2], 'a')}{pcCell(r[3], 'b')}{pcCell(r[4], 'c')}{pcCell(r[5], 'd')}{pcCell(r[6], 'e')}
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}><NqMono weight={600} color="var(--text-muted)">{r[7]}</NqMono></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}><NqMono weight={600} color="var(--text-muted)">{r[8]}</NqMono></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NqModule>

        {/* 环球股市 */}
        <NqModule icon="globe-2" title="环球股市" en="World markets · T-1 收盘">
          {g.state !== 'available' ? <NqSdiGhostRows n={3} /> : (
            <div className="ab-grid-4" style={{ gap: 10 }}>
              {NQ_WORLD_INDEXES.map(([ex, name, val, pts, pct]) => (
                <div key={ex + name} style={{ padding: '11px 13px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pts >= 0 ? ud.up : ud.down }}></span>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600 }}>{ex}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 6px' }}>{name}</div>
                  <NqMono size="var(--text-base)" weight={700} style={{ display: 'block' }}>{val}</NqMono>
                  <NqMono size="var(--text-2xs)" weight={700} color={pts >= 0 ? ud.up : ud.down}>{pts >= 0 ? '+' : '−'}{Math.abs(pts).toLocaleString()} · {pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(2)}%</NqMono>
                </div>
              ))}
            </div>
          )}
        </NqModule>

        {/* 商品 + 外汇 */}
        <div className="ab-grid-2" style={{ gap: 16, alignItems: 'start' }}>
          <NqModule icon="package" title="商品及债券" en="Commodities & bonds" pad={false}>
            {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={3} /></div> : (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>{['项目', '结算价', '变动', '变动 %'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '9px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {NQ_COMMODITIES.map(([item, settle, chg, pct], ri) => (
                    <tr key={item} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                      <td style={{ padding: '8px 20px', fontSize: 'var(--text-sm)', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>{item}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}><NqMono weight={600}>{settle}</NqMono></td>
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}><NqMono weight={700} color={chg >= 0 ? ud.up : ud.down}>{chg >= 0 ? '+' : '−'}{Math.abs(chg)}</NqMono></td>
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}><NqMono weight={700} color={pct >= 0 ? ud.up : ud.down}>{pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(2)}%</NqMono></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </NqModule>

          <NqModule icon="banknote" title="外汇及金属" en="Forex · HK / 伦敦 / 纽约" pad={false}>
            {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={3} /></div> : (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>{['货币对', '香港', '伦敦', '纽约'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '9px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {NQ_FX.map(([pair, hk, ldn, ny], ri) => (
                    <tr key={pair} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                      <td style={{ padding: '8px 20px' }}><NqMono weight={700}>{pair}</NqMono></td>
                      {[hk, ldn, ny].map((v, i) => <td key={i} style={{ padding: '8px 14px', textAlign: 'right' }}><NqMono weight={600} color="var(--text-muted)">{v}</NqMono></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </NqModule>
        </div>

        {/* 今日焦点 */}
        <NqModule icon="list-checks" title="今日焦点" en={NQ_FOCUS.length + ' 个分类 · 绿点 = 今日有更新'}>
          <div className="ab-grid-4" style={{ gap: 10 }}>
            {NQ_FOCUS.map(([name, hot, target]) => {
              const clickable = !!target;
              const onClick = () => {
                if (!target) return;
                if (target === 'market') go('market');
                else if (target.startsWith('stock:')) openStock(target.split(':')[1]);
              };
              return (
                <button key={name} onClick={onClick} title={clickable ? '打开对应数据面' : '演示未实装'} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', cursor: clickable ? 'pointer' : 'default',
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-body)', textAlign: 'left',
                }}>
                  <span style={{ width: 10, height: 10, clipPath: 'var(--clip-hex)', flexShrink: 0, background: hot ? 'var(--honey-500)' : 'var(--surface-track)' }}></span>
                  <span style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  {hot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)', flexShrink: 0 }} title="今日有更新"></span>}
                  {clickable && <NqIcon name="arrow-right" size={12} color="var(--text-subtle)" />}
                </button>
              );
            })}
          </div>
        </NqModule>

        <NqBeeRead
          gateKey="price"
          methodology="m-nq-mkt-1"
          findings={[
            '港股全线中的分化：金融分类指数 52 周 +12.7% 一枝独秀，科技指数 −15.5% 垫底；恒指本身 −4.8% 居中。',
            '隔夜环球（T-1）：美股道指 +1.14% 与日经 −2.47% 方向相反；美元兑日元升至 161 上方，与日股回调同向。',
            '今日焦点 20 个分类中 12 个有更新，权益披露、证券回购、衍生工具摘要可直接跳转对应数据面。',
          ]}
          limitation="环球指数为 T-1 收盘，与港股非同一时间截面；商品外汇为结算/收市中间价。"
          pose="forage"
        />

        <NqRationale>
          <strong>市场行情。</strong>markets.html 的指数表现（含点击排序表头，红▲蓝▼改为品牌蜜色）与 market-calendar.html 的环球卡/商品外汇/今日焦点合并为一个市场级视图：个股工作台之外的「今天市场发生了什么」。今日焦点是 ISM 的分类导航遗产——保留其完整分类清单作为数据域地图，可跳转项直接深链到本原型已实装的数据面，其余如实标注未实装。环球指数标注 T-1 截面这一口径事实。
        </NqRationale>
      </div>
    </main>
  );
}

Object.assign(window, {
  NQ_HK_INDEXES, NQ_HERO_INDEXES, NQ_WORLD_INDEXES,
  NQ_COMMODITIES, NQ_FX, NQ_FOCUS, NqMarketQuotesView,
});
