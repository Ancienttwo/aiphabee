/* ============================================================
   (g) 状态规范：四态语法 · 混合状态样本 · 移动端
   本页样本为静态规范，不随全局方案切换（右侧工作台才随方案变化）
   ============================================================ */

function NqSpecimensView() {
  useNqLucide();
  return (
    <main style={{ ...NQ_SHELL, padding: '32px 24px 72px' }}>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>状态规范</h1>
      <p style={{ margin: '8px 0 24px', fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 720 }}>
        一套贯穿所有 Netquity 数据面的视觉语法：字段级四态、移动端变体。本页样本为固定演示，不受全局方案切换影响。
      </p>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* ---- (g) 四态语法 ---- */}
        <NqModule icon="shield" title="字段级四态语法" en="Field-state grammar">
          <div className="ab-grid-4" style={{ gap: 12 }}>
            {[
              { name: '可用 available', code: 'ok', desc: '正常渲染。', el: <NqMono size="var(--text-lg)">42.15</NqMono>, note: '数值直显' },
              { name: '锁定 locked', code: 'ENTITLEMENT_REQUIRED', desc: '字段已就绪，等待方案授权；蜜色虚线 = 可解锁。点按即为升级入口。', el: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 'var(--radius-pill)', border: '1px dashed var(--honey-600)', background: 'var(--honey-50)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent-strong)', whiteSpace: 'nowrap' }}><NqIcon name="lock" size={11} /> Premium 解锁</span>, note: '可交互 · 蜜色' },
              { name: '拒绝 denied', code: 'DATA_NOT_LICENSED', desc: '分发权限未获批；灰色实心、不可交互，不提供绕过路径。', el: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}><NqIcon name="ban" size={11} /> 未获授权</span>, note: '不可交互 · 灰' },
              { name: '质量保留 hold', code: 'DATA_QUALITY_HOLD', desc: '数值扣留 + 保留原因；绝不展示可疑数字或合成占位。', el: <NqHoldPill reason="供应商复核中" />, note: '数值扣留 · 橙' },
            ].map(s => (
              <div key={s.code} style={{ padding: '14px 14px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>{s.el}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{s.name}</div>
                <NqMono size="var(--text-2xs)" weight={600} color="var(--text-subtle)">{s.code}</NqMono>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 6 }}>{s.desc}</div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>{s.note}</div>
              </div>
            ))}
          </div>
        </NqModule>

        {/* ---- (g) 混合状态面板样本 ---- */}
        <NqModule icon="layout-panel-top" title="混合状态面板 · 样本" en="Mixed-state panel specimen">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>行情快照</span>
            <NqBadge tone="info" variant="soft" size="sm">收盘价 · 非实时</NqBadge>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>展示口径：不复权 unadjusted</span>
          </div>
          <div className="ab-grid-2" style={{ gap: 10 }}>
            {[
              ['最新收盘 (HKD)', <NqMono size="var(--text-xl)" key="a">42.15</NqMono>, '可用'],
              ['20 日均量', <span key="b" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 'var(--radius-pill)', border: '1px dashed var(--honey-600)', background: 'var(--honey-50)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent-strong)', whiteSpace: 'nowrap' }}><NqIcon name="lock" size={11} /> Premium 解锁</span>, '锁定'],
              ['借货沽空余额', <NqDeniedPill key="c" label="沽空数据" />, '拒绝'],
              ['调整后名义价', <NqHoldPill key="d" reason="公司行动调整系数复核中" />, '质量保留'],
            ].map(([k, v, tag], i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 6 }}>{k}</div>
                {v}
                <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 9, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)' }}>{tag}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.55 }}>
            同一面板内四态共存仍保持网格完整：锁定/拒绝/保留占据与数值相同的格位，页面结构不塌陷、不隐藏字段。
          </div>
        </NqModule>

        {/* ---- 移动端变体 ---- */}
        <NqModule icon="smartphone" title="移动端变体 · 董事高管" en="Mobile variant" pad>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0 }}>
              <IOSDevice title="">
                <NqMobileDirectors />
              </IOSDevice>
            </div>
            <div style={{ flex: 1, minWidth: 260, display: 'grid', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.7 }}>
                桌面双栏在移动端折叠为单列：AI 阅读置顶（先给结论），名录卡片改为紧凑行（56px 触达高度），锁定面板保持完整宽度。
              </p>
              <NqRationale>
                <strong>移动端。</strong>移动场景的阅读顺序与桌面相反：先 AI 阅读、后原始名录——通勤场景中「读结论」远多于「查表」。所有触达目标 ≥ 44px；四态 pill 的尺寸与桌面一致，保证同一语法跨端可识别。
              </NqRationale>
            </div>
          </div>
        </NqModule>
      </div>
    </main>
  );
}

/* 移动端董事视图（390 宽内容） */
function NqMobileDirectors() {
  return (
    <div style={{ background: 'var(--surface-page)', minHeight: 620, fontFamily: 'var(--font-sans)' }}>
      <div style={{ padding: '10px 16px 12px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NqIcon name="arrow-left" size={17} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>长和</span>
          <NqMono size="var(--text-xs)" weight={600} color="var(--text-subtle)">00001.HK</NqMono>
          <span style={{ marginLeft: 'auto' }}><NqBadge tone="bullish" variant="soft" size="sm">上市</NqBadge></span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
          {['董事高管', '权益披露', '股权结构', '事件', '财务'].map((t, i) => (
            <span key={t} style={{ padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 700, whiteSpace: 'nowrap', background: i === 0 ? 'var(--honey-500)' : 'var(--surface-muted)', color: i === 0 ? 'var(--text-on-honey)' : 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: 14, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, padding: '12px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--violet-50)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ width: 34, height: 34, clipPath: 'var(--clip-hex)', background: 'var(--surface-card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={NQ_MASCOT + '/insight.png'} alt="" style={{ width: 27, height: 27, objectFit: 'contain' }} />
          </span>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontWeight: 700, color: 'var(--violet-600)' }}>AI 阅读 · aiphabee_research</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', lineHeight: 1.6, marginTop: 3 }}>6 位董事中 4 位为执行董事，3 位同时任职长实系 3 家上市公司，同系交叉任职密度显著偏高。</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>不构成任何买卖建议</div>
          </div>
        </div>
        {NQ_DIRECTORS.slice(0, 3).map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 11, minHeight: 56, padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ width: 38, height: 38, clipPath: 'var(--clip-hex)', flexShrink: 0, background: d.type === 'exec' ? 'var(--ink-800)' : 'var(--surface-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: d.type === 'exec' ? 'var(--honey-500)' : 'var(--text-muted)' }}>{d.nameEn.split(' ')[0].slice(0, 2).toUpperCase()}</span>
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{d.nameZh}</span>
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.role}</span>
            </span>
            <NqIcon name="chevron-right" size={15} color="var(--text-subtle)" />
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--honey-600)', background: 'var(--surface-honey)' }}>
          <NqIcon name="lock" size={14} color="var(--accent-strong)" />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)', flex: 1, lineHeight: 1.5 }}>履历 · 任期 · 交叉任职需 Premium 授权</span>
          <span style={{ padding: '5px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--honey-500)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--text-on-honey)', whiteSpace: 'nowrap' }}>解锁</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NqSpecimensView, NqMobileDirectors });
