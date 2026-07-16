/* ============================================================
   (a) 证券主数据搜索 — 今日唯一已授权的数据切片
   含消歧、退市证券的优雅呈现、AI 解析说明
   ============================================================ */

function NqSearchView({ go, openStock }) {
  const [query, setQuery] = React.useState('');
  const [submitted, setSubmitted] = React.useState(null);
  useNqLucide();

  const run = (q) => { const t = (q ?? query).trim(); if (!t) return; setQuery(t); setSubmitted(t); };
  const results = submitted ? (NQ_SEARCH_FIXTURES[submitted] || []) : null;

  return (
    <main style={{ ...NQ_SHELL, padding: '40px 24px 72px', maxWidth: 880 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>证券搜索</h1>
      </div>
      <p style={{ margin: '8px 0 20px', fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        以代码、中文名或英文名解析港股证券（含退市证券表），随后进入 AI 阅读版或终端模式。
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') run(); }}
          placeholder="如：长和 · 00001 · CK Hutchison…"
          aria-label="搜索证券"
          style={{ flex: 1, minWidth: 240, height: 48, padding: '0 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
        />
        <NqButton size="lg" onClick={() => run()} icon={<NqIcon name="search" size={17} />}>搜索</NqButton>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>试试：</span>
        {['长和', '和记'].map(q => (
          <button key={q} onClick={() => run(q)} style={{ padding: '3px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-body)', whiteSpace: 'nowrap' }}>{q}</button>
        ))}
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginLeft: 'auto' }}>「和记」含退市样例</span>
      </div>

      {results && results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <NqEyebrow>「{submitted}」· {results.length} 个候选 · 需人工消歧</NqEyebrow>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {results.map(c => <NqSearchRow key={c.symbol + c.matched} c={c} openStock={openStock} />)}
          </div>
          <div style={{ marginTop: 14 }}>
            <NqBeeRead
              methodology="m-nq-resolve-1"
              findings={[
                submitted === '和记'
                  ? '「和记」命中 3 条记录：其中 00013 和记黄埔已于 2015-06-03 退市（重组合并），其历史档案仍可追溯；现存主体为 00001 长和。'
                  : '「长和」精确命中 00001；01113 长实集团与 01038 长江基建为同系公司，按名称近似列出供确认。',
                '解析依据：代码精确匹配 > 中文简称 > 英文名；不做模糊语义猜测。',
              ]}
              limitation="候选排序仅基于名称匹配规则，不代表任何相关性或重要性判断。"
              pose="forage"
            />
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div style={{ marginTop: 32 }}>
          <NqModule icon="search-x" title={'「' + submitted + '」未匹配到证券'} en="No match">
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              演示数据仅收录「长和」「和记」两组查询。真实实现按 security_master 全量解析，无结果时明确返回空，不猜测代码。
            </p>
          </NqModule>
        </div>
      )}

      {!submitted && (
        <div style={{ marginTop: 40, textAlign: 'center', padding: '32px 20px', borderRadius: 'var(--radius-lg)', backgroundImage: 'var(--pattern-honeycomb)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
          <img src={NQ_MASCOT + '/forage.png'} alt="" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>输入名称或代码，研究蜂开始采集</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>解析成功后进入个股工作台：董事高管、权益披露、股权结构、事件与财务。</div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <NqRationale>
          <strong>(a) 搜索与消歧。</strong>唯一「今天就真实可用」的切片，因此不设任何锁态，与其余锁定域形成诚实对照。退市证券不是错误态：灰化行 + 「已退市」徽章 + 退市日期与原因，仍可进入有限档案视图，满足数据集内 delisted 表的呈现要求。消歧列表配 AI 阅读解释匹配规则（代码 > 中文简称 > 英文名），把 terminal 式的原始候选表变成可理解的解释，但候选行本身仍保留人工点选。
        </NqRationale>
      </div>
    </main>
  );
}

function NqSearchRow({ c, openStock }) {
  const delisted = c.status === 'delisted';
  const isTarget = c.symbol === '00001.HK';
  return (
    <button
      onClick={() => { if (isTarget) openStock(); }}
      title={isTarget ? '进入个股工作台' : delisted ? '退市证券 · 档案视图（演示未实装）' : '演示仅实装 00001'}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
        padding: '14px 18px', borderRadius: 'var(--radius-lg)', cursor: isTarget ? 'pointer' : 'default',
        border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)',
        opacity: delisted ? 0.72 : 1,
      }}
    >
      <span style={{ width: 42, height: 42, clipPath: 'var(--clip-hex)', flexShrink: 0, background: delisted ? 'var(--surface-muted)' : 'var(--surface-honey)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <NqMono size="var(--text-2xs)" color={delisted ? 'var(--text-subtle)' : 'var(--accent-strong)'}>{c.symbol.slice(0, 5)}</NqMono>
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{c.nameZh}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>{c.nameEn}</span>
          {delisted
            ? <NqBadge tone="neutral" variant="soft" size="sm" icon={<NqIcon name="archive" size={11} />}>已退市 {c.delistedAt}</NqBadge>
            : <NqBadge tone="bullish" variant="soft" size="sm">上市</NqBadge>}
        </span>
        <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 3 }}>
          {c.industry} · 上市 {c.listedAt}{delisted && <> · {c.delistReason}</>} · 匹配于 <strong>{c.matched}</strong>
        </span>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {delisted && <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>档案视图 · 有限字段</span>}
        {isTarget && <NqIcon name="arrow-right" size={16} color="var(--text-muted)" />}
      </span>
    </button>
  );
}

Object.assign(window, { NqSearchView });
