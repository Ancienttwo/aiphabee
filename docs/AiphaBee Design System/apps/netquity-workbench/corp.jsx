/* ============================================================
   公司资料 · 股份权益记录 · 股份回购 · 同业比较
   （modern/company.html 四个分区移植；演示数据）
   ============================================================ */

/* ---------- 数据 ---------- */
const NQ_ENTITLEMENTS = [
  ['2026-08-14', '12/2026', '中期', 'D: HKD 0.880', '2026-09-04', '2026-09-18', '2026-09-03', true],
  ['2026-03-19', '12/2025', '末期', 'D: HKD 1.775', '2026-05-22', '2026-06-05', '2026-05-21', false],
  ['2025-08-14', '12/2025', '中期', 'D: HKD 0.860', '2025-09-16', '2025-09-19', '2025-09-15', false],
  ['2025-03-20', '12/2024', '末期', 'D: HKD 1.690', '2025-05-28', '2025-06-12', '2025-05-27', false],
  ['2024-08-15', '12/2024', '中期', 'D: HKD 0.860', '2024-09-16', '2024-09-26', '2024-09-13', false],
  ['2024-03-21', '12/2023', '末期', 'D: HKD 1.616', '2024-05-29', '2024-06-13', '2024-05-28', false],
  ['2023-08-03', '12/2023', '中期', 'D: HKD 0.760', '2023-09-05', '2023-09-14', '2023-09-04', false],
  ['2023-03-16', '12/2022', '末期', 'D: HKD 2.086', '2023-05-24', '2023-06-08', '2023-05-23', false],
  ['2022-08-04', '12/2022', '中期', 'D: HKD 0.840', '2022-09-06', '2022-09-16', '2022-09-05', false],
  ['2015-03-18', '—', '上市', 'L: 介绍上市（集团重组）', '—', '—', '—', false],
];

const NQ_BUYBACK_DAILY = [
  ['2026-06-20', '210,000', '41.60', '41.20'],
  ['2026-06-19', '480,000', '41.55', '41.05'],
  ['2026-06-18', '560,000', '41.40', '40.90'],
  ['2026-06-17', '—', '—', '—'],
  ['2026-06-16', '—', '—', '—'],
];
const NQ_BUYBACK_MONTHLY = [
  ['2026/06', '1,250,000', '41.60', '40.90'],
  ['2025/06', '3,400,000', '38.45', '37.60'],
  ['2025/03', '850,000', '36.90', '36.55'],
];

const NQ_INDUSTRY = [
  ['08095', '北大青鸟环宇', 0.780, -2.5, -20.4, -17.0, -36.6, -31.6],
  ['00267', '中信股份', 10.690, 0.8, -19.7, -10.3, -13.7, -11.4],
  ['00001', '长和', 65.000, -1.9, -7.1, 7.0, 20.4, 22.8],
  ['00659', '新创建服务', 7.700, -0.1, -5.9, -2.7, 2.9, 3.1],
  ['00025', '其士国际', 4.720, 7.3, 13.2, 13.2, 13.7, 13.7],
  ['00257', '中国光大环境', 4.660, 2.2, -8.8, -11.7, -3.7, -3.3],
  ['00656', '复星国际', 4.000, 0.5, 1.5, -6.8, -8.9, -8.7],
  ['00363', '上海实业控股', 12.330, 0.4, -14.9, -6.7, -10.1, -14.3],
  ['00019', '太古股份公司A', 81.100, -0.7, -3.3, -7.3, 27.3, 29.3],
  ['00087', '太古股份公司B', 12.500, 0.3, -5.7, -4.7, 7.1, 7.8],
  ['00882', '天津发展', 1.990, -4.8, -10.4, -17.8, -18.8, -17.8],
];

const NQ_CORP_INFO = [
  ['主要股东', '李嘉诚基金会 + 家族信托（合计 30.17%）'],
  ['公司秘书', '施熙德 Edith Shih'],
  ['主要往来银行', '香港上海汇丰银行 · 中国银行（香港）'],
  ['法律顾问', '胡关李罗律师行'],
  ['核数师', '罗兵咸永道 PricewaterhouseCoopers'],
  ['行业 [次行业]', '综合企业 [综合企业]'],
  ['注册成立地点', '开曼群岛'],
  ['主要营业地点', '香港中环皇后大道中 2 号长江集团中心 48 楼'],
  ['股份过户处', '香港中央证券登记有限公司 · Tel (852) 2862-8628'],
];

/* ---------- 股份权益记录（挂公司事件 tab） ---------- */
function NqEntitlementsModule() {
  const g = useNqGate('events');
  return (
    <NqModule icon="scroll-text" title="股份权益记录" en="Entitlements history" pad={false}>
      {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={4} /></div> : (
        <div className="ab-table-scroll">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
            <thead>
              <tr>
                {['公布', '年结', '期间', '详情', '记录日期', '派发', '除净日'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 3 ? 'left' : i > 3 ? 'right' : 'left', padding: '10px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NQ_ENTITLEMENTS.map((r, ri) => (
                <tr key={r[0] + r[2]} style={{ background: r[7] ? 'var(--honey-50)' : ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                  <td style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}><NqMono weight={600}>{r[0]}</NqMono></td>
                  <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}><NqMono weight={600} color="var(--text-muted)">{r[1]}</NqMono></td>
                  <td style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', color: 'var(--text-body)', whiteSpace: 'nowrap' }}>{r[2]}{r[7] && <NqBadge tone="info" variant="outline" size="sm" style={{ marginLeft: 6 }}>未除净</NqBadge>}</td>
                  <td style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{r[3]}</td>
                  {[4, 5, 6].map(i => <td key={i} style={{ padding: '8px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}><NqMono weight={600} color="var(--text-muted)">{r[i]}</NqMono></td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
            D 现金股息 · SD 特别现金股息 · B 红股 · R 供股 · S 股份拆细 · O 公开发售 · L 上市沿革 · 蜜色行 = 已公告未除净
          </div>
        </div>
      )}
    </NqModule>
  );
}

/* ---------- 股份回购（每日 + 每月，挂公司事件 tab） ---------- */
function NqBuybackModule() {
  const g = useNqGate('events');
  const tbl = (title, sub, head, rows) => (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 0 8px' }}>
        <NqEyebrow>{title}</NqEyebrow>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{sub}</span>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '7px 10px', fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r[0]} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}><NqMono weight={600}>{r[0]}</NqMono></td>
              {[1, 2, 3].map(i => <td key={i} style={{ padding: '7px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>{r[i] === '—' ? <span style={{ color: 'var(--text-subtle)' }}>—</span> : <NqMono weight={600}>{r[i]}</NqMono>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <NqModule icon="rotate-ccw" title="股份回购" en="Share buyback">
      {g.state !== 'available' ? <NqSdiGhostRows n={3} /> : (
        <div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {tbl('每日记录', '最近 5 个交易日', ['日期', '数量 (股)', '最高价', '最低价'], NQ_BUYBACK_DAILY)}
            {tbl('每月汇总', '最近 3 条记录', ['月份', '总数量 (股)', '最高价', '最低价'], NQ_BUYBACK_MONTHLY)}
          </div>
          <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>无回购的交易日以「—」如实留空；月度为日度记录的算术汇总（m-nq-bb-1）。</div>
        </div>
      )}
    </NqModule>
  );
}

/* ---------- 同业比较（新 tab） ---------- */
function NqIndustryView() {
  useNqLucide();
  const g = useNqGate('price');
  const ud = useNqUpDown();
  const pc = v => (
    <td style={{ padding: '8px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
      <NqMono weight={700} color={v > 0 ? ud.up : v < 0 ? ud.down : 'var(--text-muted)'}>{v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v).toFixed(1)}%</NqMono>
    </td>
  );
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && <NqLockedPanel gateKey="price" preview={'综合企业行业 ' + NQ_INDUSTRY.length + ' 家同业的区间收益比较已就绪。'} />}
      <NqModule icon="columns-3" title="同业比较" en="Industry comparison · 综合企业" pad={false}>
        {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={5} /></div> : (
          <div className="ab-table-scroll">
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
              <thead>
                <tr>
                  {['代号', '公司名称', '最新', '1 日', '1 月', '3 月', '6 月', '年初至今'].map((h, i) => (
                    <th key={h} style={{ textAlign: i < 2 ? 'left' : 'right', padding: '10px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NQ_INDUSTRY.map((r, ri) => {
                  const focal = r[0] === '00001';
                  return (
                    <tr key={r[0]} style={{ background: focal ? 'var(--honey-50)' : ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                      <td style={{ padding: '8px 20px' }}><NqMono weight={700} color="var(--accent-strong)">{r[0]}</NqMono></td>
                      <td style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', fontWeight: focal ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{r[1]}{focal && <NqBadge tone="honey" variant="soft" size="sm" style={{ marginLeft: 8 }}>当前证券</NqBadge>}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right' }}><NqMono weight={600}>{r[2].toFixed(3)}</NqMono></td>
                      {pc(r[3])}{pc(r[4])}{pc(r[5])}{pc(r[6])}{pc(r[7])}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
              区间收益 = 收盘价变动（不含股息）· 蜜色行 = 当前证券 · 行业分类为供应商口径 · 演示数据
            </div>
          </div>
        )}
      </NqModule>

      <NqBeeRead
        gateKey="price"
        methodology="m-nq-ind-2"
        findings={[
          '长和年初至今 +22.8%，在 11 家综合企业同业中列第 2（仅次于太古 A +29.3%），显著跑赢行业中位（约 −8.7%）。',
          '近 1 月 −7.1% 为板块内偏弱一侧——强于中信（−19.7%）但弱于其士（+13.2%），短期与长期表现分化。',
        ]}
        limitation="收益比较不含股息再投资；行业成分为供应商口径，与恒生行业分类或有出入。"
        pose="thinking"
      />

      <NqRationale>
        <strong>同业比较。</strong>modern 终端的 industry comparison 移植：一行一家同业，五个区间收益列全部按用户涨跌惯例着色，当前证券以蜜色行 + 徽章锚定（不用黄色荧光，改用品牌蜜色的克制版本）。AI 阅读给出的是排名事实与分位，不做任何优劣判断。
      </NqRationale>
    </div>
  );
}

/* ---------- 公司资料卡（挂董事高管 tab） ---------- */
function NqCorpInfoCard() {
  return (
    <NqModule icon="landmark" title="公司资料" en="Corporate information">
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 18px' }}>
        {NQ_CORP_INFO.map(([k, v], i) => (
          <React.Fragment key={k}>
            <dt style={{ padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>{k}</dt>
            <dd style={{ margin: 0, padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)', fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.55 }}>{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </NqModule>
  );
}

Object.assign(window, {
  NQ_ENTITLEMENTS, NQ_BUYBACK_DAILY, NQ_BUYBACK_MONTHLY,
  NQ_INDUSTRY, NQ_CORP_INFO,
  NqEntitlementsModule, NqBuybackModule, NqIndustryView, NqCorpInfoCard,
});
