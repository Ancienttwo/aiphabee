/* ============================================================
   (b) 董事与高管 — 旗舰新数据面
   名录随 security_master 开放；履历/交叉任职为 Premium；薪酬未获授权
   ============================================================ */

function NqDirectorsView() {
  useNqLucide();
  const bio = useNqGate('dir_bio');
  const execs = NQ_DIRECTORS.filter(d => d.type === 'exec');
  const ineds = NQ_DIRECTORS.filter(d => d.type === 'ined');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {bio.state !== 'available' && (
        <NqLockedPanel gateKey="dir_bio" preview={'名录（姓名 · 职务）随证券主数据开放；' + NQ_DIRECTORS.length + ' 位董事的完整履历、任期、委员会与跨上市公司任职需要授权解锁。'} />
      )}

      <div className="ab-split" style={{ gap: 16, alignItems: 'start' }}>
        {/* 左：董事名录卡片 */}
        <div style={{ display: 'grid', gap: 12 }}>
          <NqEyebrow>执行董事 · {execs.length}</NqEyebrow>
          {execs.map(d => <NqDirectorCard key={d.id} d={d} />)}
          <NqEyebrow style={{ marginTop: 6 }}>独立非执行董事 · {ineds.length}</NqEyebrow>
          {ineds.map(d => <NqDirectorCard key={d.id} d={d} />)}
        </div>

        {/* 右：治理概览 + AI 阅读 */}
        <div style={{ display: 'grid', gap: 16 }}>
          <NqModule icon="users" title="董事会构成" en="Board composition">
            <div className="ab-grid-3" style={{ gap: 10 }}>
              {[['董事会规模', NQ_DIRECTORS.length + ' 人', null], ['独董占比', <NqGateValue gateKey="dir_bio" key="a"><NqMono>33%</NqMono></NqGateValue>, null], ['平均年资', <NqGateValue gateKey="dir_bio" key="b"><NqMono>9.6 年</NqMono></NqGateValue>, null]].map(([k, v], i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '9px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)' }}>董事薪酬明细</span>
              <NqDeniedPill label="董事薪酬" />
            </div>
          </NqModule>

          <NqModule icon="git-fork" title="跨上市公司任职" en="Cross-directorships" pad>
            <NqGateValueBlock gateKey="dir_cross">
              <div style={{ display: 'grid', gap: 10 }}>
                {NQ_DIRECTORS.filter(d => d.cross.length > 0).map(d => (
                  <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', minWidth: 58 }}>{d.nameZh}</span>
                    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {d.cross.map(c => (
                        <span key={c.symbol} title={c.name + ' · ' + c.role} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', fontSize: 'var(--text-2xs)', color: 'var(--text-body)' }}>
                          <NqMono size="var(--text-2xs)" weight={600} color="var(--text-muted)">{c.symbol.slice(0, 5)}</NqMono>
                          {c.name} · {c.role}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </NqGateValueBlock>
          </NqModule>

          <NqBeeRead
            gateKey="dir_bio"
            methodology="m-nq-gov-1"
            findings={[
              '6 位董事中 4 位为执行董事，且 3 位同时在长实、长江基建、电能实业任要职——同系交叉任职密度显著高于恒指成分股中位。',
              '审核委员会主席史美伦具监管背景（前港交所主席），2021 年加入，为董事会最近一次独董更替。',
              '执行董事平均年资超过 10 年，管理层连续性强；相应的关键人依赖亦更集中。',
            ]}
            limitation="交叉任职仅覆盖港交所上市主体，非上市及海外任职不在数据集内。"
          />

          <NqRationale>
            <strong>(b) 董事与高管——旗舰面。</strong>rights-first：名录（姓名+职务）作为 security_master 的附属索引在 Free 层可见，让锁定态下屏幕仍有真实骨架；履历、任期、委员会、交叉任职按 nq_biography 授权逐字段解锁，薪酬始终显示「未获授权」灰态——三种态在同屏共存即是「诚实的中间态」。evidence-first：每段 AI 阅读都注明 aiphabee_research 方法号与局限。AI-native：右栏研究蜂把 173 表中最大的数据域读成三条治理观察（发现+证据+局限，无任何建议），左栏保留逐人卡片供手动翻阅——正是「AI 辅助的易读版 + 愿意手动的仍可手动」。
          </NqRationale>
        </div>
      </div>
    </div>
  );
}

/* 区块级门控（locked 时显示行内锁，占位不合成） */
function NqGateValueBlock({ gateKey, children }) {
  const g = useNqGate(gateKey);
  if (g.state === 'available') return <>{children}</>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>{g.group.label}字段已就绪</span>
      {g.state === 'denied' ? <NqDeniedPill /> : <NqLockPill gateKey={gateKey} inline />}
    </div>
  );
}

function NqDirectorCard({ d }) {
  const [open, setOpen] = React.useState(false);
  const bio = useNqGate('dir_bio');
  const initials = d.nameEn.split(' ')[0].slice(0, 2).toUpperCase();
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 46, height: 46, clipPath: 'var(--clip-hex)', flexShrink: 0, background: d.type === 'exec' ? 'var(--ink-800)' : 'var(--surface-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: d.type === 'exec' ? 'var(--honey-500)' : 'var(--text-muted)' }}>{initials}</span>
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{d.nameZh}</span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{d.nameEn}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{d.role}</span>
            {bio.state === 'available'
              ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>任职自 <NqMono size="var(--text-2xs)" weight={600} color="var(--text-muted)">{d.since}</NqMono> · {d.age} 岁</span>
              : <NqLockPill gateKey="dir_bio" inline />}
          </span>
        </span>
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-standard)', flexShrink: 0 }}>
          <NqIcon name="chevron-down" size={16} color="var(--text-subtle)" />
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ paddingTop: 12, display: 'grid', gap: 10 }}>
            {bio.state === 'available' ? (
              <>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.65 }}>{d.bioShort} {d.bioFull}</p>
                {d.committees.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <NqEyebrow>委员会</NqEyebrow>
                    {d.committees.map(c => <NqBadge key={c} tone="navy" variant="soft" size="sm">{c}</NqBadge>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <NqEyebrow>跨上市公司任职</NqEyebrow>
                  <NqGateValue gateKey="dir_cross">
                    {d.cross.length === 0 ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>无</span> : d.cross.map(c => (
                      <NqBadge key={c.symbol} tone="honey" variant="soft" size="sm">{c.name} · {c.role}</NqBadge>
                    ))}
                  </NqGateValue>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>履历 · 任期 · 委员会 · 交叉任职</span>
                <NqLockPill gateKey="dir_bio" inline />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>薪酬明细</span>
              <NqDeniedPill label="董事薪酬" inline />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { NqDirectorsView, NqGateValueBlock });
