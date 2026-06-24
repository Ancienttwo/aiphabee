/* @ds-bundle: {"format":3,"namespace":"AiphaBeeDesignSystem_599c13","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardDescription","sourcePath":"components/core/Card.jsx"},{"name":"CardContent","sourcePath":"components/core/Card.jsx"},{"name":"CardFooter","sourcePath":"components/core/Card.jsx"},{"name":"RatingStars","sourcePath":"components/data/RatingStars.jsx"},{"name":"ScoreMeter","sourcePath":"components/data/ScoreMeter.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"BeeNote","sourcePath":"components/mascot/BeeNote.jsx"},{"name":"ComparePanel","sourcePath":"components/mascot/ComparePanel.jsx"},{"name":"ForageLoader","sourcePath":"components/mascot/ForageLoader.jsx"},{"name":"Hexvatar","sourcePath":"components/mascot/Hexvatar.jsx"},{"name":"MascotState","sourcePath":"components/mascot/MascotState.jsx"}],"sourceHashes":{"apps/ipo-workbench/calendar.jsx":"ff458acab2f5","apps/ipo-workbench/compare.jsx":"8dde720135c3","apps/ipo-workbench/data.jsx":"be281fbb2109","apps/ipo-workbench/detail-parts.jsx":"716ecd9d54bd","apps/ipo-workbench/detail.jsx":"5b4d56af8e99","apps/ipo-workbench/pipeline.jsx":"ca9a7d3d29d5","apps/ipo-workbench/shell.jsx":"5db579e060fe","components/core/Badge.jsx":"e2d7c31531c7","components/core/Button.jsx":"b23df844a0cd","components/core/Card.jsx":"01bb4c714f80","components/data/RatingStars.jsx":"9783276d967f","components/data/ScoreMeter.jsx":"7644e4bc13d8","components/data/StatCard.jsx":"2a44304f05ab","components/forms/Input.jsx":"6304b90ddc18","components/mascot/BeeNote.jsx":"ccc8a18b04f5","components/mascot/ComparePanel.jsx":"0257df0e1c1f","components/mascot/ForageLoader.jsx":"0fdd97a6c9bb","components/mascot/Hexvatar.jsx":"0203298c76ee","components/mascot/MascotState.jsx":"92735921fe51","ui_kits/ipo-agent/app.jsx":"07071f63968e","ui_kits/ipo-agent/home.jsx":"0150a9e07dd3","ui_kits/ipo-agent/research.jsx":"ddce36ee3ffe"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AiphaBeeDesignSystem_599c13 = window.AiphaBeeDesignSystem_599c13 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// apps/ipo-workbench/calendar.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — IPO 日历 /calendar
   跨所有活跃 IPO 的招股时间表里程碑（event-timeline）按日 agenda
   ============================================================ */
const _CalDS = window.AiphaBeeDesignSystem_599c13;
const {
  Badge: CalBadge
} = _CalDS;
const EVENT_CFG = {
  open: {
    label: '公开发售开始',
    en: 'Offer Opens',
    icon: 'play',
    tone: 'honey'
  },
  close: {
    label: '公开发售截止',
    en: 'Offer Closes',
    icon: 'flag',
    tone: 'honey'
  },
  price: {
    label: '定价',
    en: 'Pricing',
    icon: 'tag',
    tone: 'info'
  },
  allot: {
    label: '公布分配',
    en: 'Allotment',
    icon: 'check-check',
    tone: 'bullish'
  },
  grey: {
    label: '暗盘交易',
    en: 'Grey Market',
    icon: 'activity',
    tone: 'info'
  },
  list: {
    label: '上市',
    en: 'Listing',
    icon: 'rocket',
    tone: 'bullish'
  },
  file: {
    label: '递交申请',
    en: 'Filing',
    icon: 'file-text',
    tone: 'neutral'
  },
  hearing: {
    label: '通过聆讯',
    en: 'Hearing',
    icon: 'gavel',
    tone: 'neutral'
  },
  roadshow: {
    label: '路演',
    en: 'Roadshow',
    icon: 'presentation',
    tone: 'neutral'
  },
  ref: {
    label: '参考价',
    en: 'Ref Price',
    icon: 'tag',
    tone: 'info'
  },
  withdraw: {
    label: '撤回上市',
    en: 'Withdrawn',
    icon: 'x-circle',
    tone: 'bearish'
  }
};
const TONE_COLOR = {
  honey: 'var(--honey-600)',
  info: 'var(--blue-500)',
  bullish: 'var(--green-600)',
  bearish: 'var(--red-500)',
  neutral: 'var(--neutral-500)'
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* parse "Jun 18 09:00" → { key:'Jun 18', sort: 618, day:'18', mon:'Jun', time:'09:00' } */
function parseAt(at) {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/.exec(at);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1]);
  return {
    key: `${m[1]} ${m[2]}`,
    sort: (mi + 1) * 100 + parseInt(m[2]),
    day: m[2],
    mon: m[1],
    time: m[3] || null
  };
}
function CalendarView({
  openIpo,
  go
}) {
  useLucide();
  const [filter, setFilter] = React.useState('all');

  // collect dated events
  const all = [];
  IPOS.forEach(ipo => (ipo.timetable || []).forEach(e => {
    const d = parseAt(e.at);
    if (d) all.push({
      ipo,
      e,
      d
    });
  }));
  const shown = all.filter(x => filter === 'all' || x.e.type === filter);
  // group by date key
  const groups = {};
  shown.forEach(x => {
    (groups[x.d.key] ||= {
      sort: x.d.sort,
      items: []
    }).items.push(x);
  });
  const orderedKeys = Object.keys(groups).sort((a, b) => groups[a].sort - groups[b].sort);
  const types = ['all', ...Array.from(new Set(all.map(x => x.e.type)))];
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '32px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "\u62DB\u80A1\u65F6\u95F4\u8868 \xB7 IPO Calendar"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '0 0 8px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 800,
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO \u65E5\u5386"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 22px',
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)'
    }
  }, "\u8DE8\u5168\u90E8\u6D3B\u8DC3 IPO \u7684\u5173\u952E\u91CC\u7A0B\u7891\uFF1A\u62DB\u80A1\u3001\u5B9A\u4EF7\u3001\u5206\u914D\u3001\u6697\u76D8\u3001\u4E0A\u5E02\u3001\u64A4\u56DE\u3002\u6570\u636E\u6E90 ", /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-xs)",
    color: "var(--text-body)"
  }, "ipo_timetable_event"), "\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 26
    }
  }, types.map(ty => {
    const on = filter === ty;
    const cfg = ty === 'all' ? null : EVENT_CFG[ty];
    return /*#__PURE__*/React.createElement("button", {
      key: ty,
      onClick: () => setFilter(ty),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 13px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        border: '1px solid ' + (on ? 'var(--honey-500)' : 'var(--border-default)'),
        background: on ? 'var(--honey-500)' : 'var(--surface-card)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: on ? 'var(--ink-800)' : 'var(--text-body)'
      }
    }, cfg && /*#__PURE__*/React.createElement(Icon, {
      name: cfg.icon,
      size: 13,
      color: on ? 'var(--ink-800)' : TONE_COLOR[cfg.tone]
    }), ty === 'all' ? '全部里程碑' : cfg.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, orderedKeys.map(key => {
    const g = groups[key];
    const [mon, day] = key.split(' ');
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      style: {
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: 18,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: 80,
        textAlign: 'center',
        padding: '12px 0',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-2xs)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-caps)',
        color: 'var(--honey-700)',
        fontWeight: 700
      }
    }, mon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 800,
        color: 'var(--ink-800)',
        lineHeight: 1.1
      }
    }, day), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-2xs)',
        color: 'var(--text-subtle)'
      }
    }, g.items.length, " \u4E8B\u4EF6")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, g.items.sort((a, b) => (a.d.time || '').localeCompare(b.d.time || '')).map((x, i) => {
      const cfg = EVENT_CFG[x.e.type];
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => openIpo(x.ipo),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          padding: '14px 18px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '3px solid ' + TONE_COLOR[cfg.tone],
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-muted)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: cfg.icon,
        size: 17,
        color: TONE_COLOR[cfg.tone]
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0,
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: 'var(--text-primary)'
        }
      }, cfg.label), /*#__PURE__*/React.createElement(Eyebrow, null, cfg.en), x.e.active && /*#__PURE__*/React.createElement(CalBadge, {
        tone: "honey",
        size: "sm"
      }, "\u8FDB\u884C\u4E2D")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          marginTop: 2
        }
      }, x.ipo.name, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-subtle)'
        }
      }, x.ipo.cn), " \xB7 ", /*#__PURE__*/React.createElement(Mono, {
        size: "var(--text-xs)",
        color: "var(--text-body)"
      }, x.ipo.ticker))), x.d.time && /*#__PURE__*/React.createElement(Mono, {
        size: "var(--text-sm)",
        color: "var(--text-body)"
      }, x.d.time), /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-right",
        size: 16,
        style: {
          color: 'var(--text-subtle)'
        }
      }));
    })));
  })));
}
Object.assign(window, {
  CalendarView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/calendar.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/compare.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — Compare 横向比较 (2–5 个 IPO)
   ============================================================ */
const _CDS = window.AiphaBeeDesignSystem_599c13;
const {
  Badge: CBadge,
  Button: CBtn,
  ComparePanel: CComparePanel
} = _CDS;
const COMPARE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-5)'];

/* metric definitions: value extractor + which direction wins */
const METRICS = [{
  label: '综合评分 Score',
  get: i => i.score,
  fmt: v => v,
  best: 'max',
  mono: true
}, {
  label: '置信度 Confidence',
  get: i => i.confidence,
  fmt: v => v + '%',
  best: 'max',
  mono: true
}, {
  label: '公开认购 Subscription',
  get: i => i.live.subPublic,
  fmt: v => v == null ? '—' : v + '×',
  best: 'max',
  mono: true
}, {
  label: '招股价 Offer',
  get: i => i.terms.finalPrice || i.terms.priceHigh,
  fmt: (v, i) => offerText(i.terms),
  best: null,
  mono: true
}, {
  label: '入场费 Entry Fee',
  get: i => i.terms.entryFee,
  fmt: v => v ? 'HK$' + v.toLocaleString() : '—',
  best: 'min',
  mono: true
}, {
  label: '集资额 Raise',
  get: i => parseFloat(i.terms.raiseHKD) || null,
  fmt: (v, i) => i.terms.raiseHKD,
  best: 'max',
  mono: true
}, {
  label: '市值 Market Cap',
  get: i => parseFloat(i.terms.mcapHKD) || null,
  fmt: (v, i) => i.terms.mcapHKD,
  best: null,
  mono: true
}, {
  label: '市盈率 P/E',
  get: i => parseFloat(i.terms.pe) || null,
  fmt: (v, i) => i.terms.pe,
  best: 'min',
  mono: true
}, {
  label: '基石数量 Cornerstones',
  get: i => (i.cornerstones || []).length,
  fmt: v => v + ' 名',
  best: 'max',
  mono: true
}, {
  label: '基石合计占比 CS %',
  get: i => (i.cornerstones || []).reduce((s, c) => s + (c.pct || 0), 0),
  fmt: v => v ? v.toFixed(1) + '%' : '—',
  best: 'max',
  mono: true
}, {
  label: '一手中签率 One-lot',
  get: i => i.live.oneLotRate,
  fmt: v => v == null ? '待公布' : v + '%',
  best: null,
  mono: true
}, {
  label: '上市板 Board',
  get: i => i.board,
  fmt: (v, i) => i.board,
  best: null,
  mono: false
}, {
  label: '行业 Sector',
  get: i => i.sector,
  fmt: (v, i) => SECTOR_LABEL[i.sector],
  best: null,
  mono: false
}, {
  label: '上市方式 Type',
  get: i => i.listingType,
  fmt: (v, i) => LISTING_TYPE[i.listingType].split(' ')[0],
  best: null,
  mono: false
}, {
  label: '回拨 Clawback',
  get: i => i.clawback ? 1 : 0,
  fmt: (v, i) => i.clawback ? '标准回拨' : '无 / NA',
  best: null,
  mono: false
}, {
  label: '市场情绪 Sentiment',
  get: i => i.sentiment,
  fmt: (v, i) => i,
  best: null,
  sentiment: true
}, {
  label: '研究信号 Signal',
  get: i => i.recommendation,
  fmt: (v, i) => i,
  best: null,
  rec: true
}];
function bestIndex(metric, ipos) {
  if (!metric.best) return -1;
  const vals = ipos.map(i => metric.get(i));
  let bi = -1,
    bv = metric.best === 'max' ? -Infinity : Infinity;
  vals.forEach((v, idx) => {
    if (v == null || isNaN(v)) return;
    if (metric.best === 'max' ? v > bv : v < bv) {
      bv = v;
      bi = idx;
    }
  });
  return bi;
}
function CompareView({
  compareIds,
  setCompareIds,
  toggleCompare,
  openIpo,
  go
}) {
  useLucide();
  const selected = compareIds.map(id => IPO_BY[id]).filter(Boolean);
  const cols = selected.length;
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '32px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('pipeline'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " \u8FD4\u56DE Pipeline"), /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "\u6A2A\u5411\u6BD4\u8F83 \xB7 Head-to-head"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '0 0 8px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 800,
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO \u6A2A\u5411\u6BD4\u8F83"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 22px',
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)'
    }
  }, "\u9009\u62E9 2\u20135 \u4E2A\u6807\u7684\uFF0C\u9010\u6307\u6807\u5BF9\u6BD4\uFF1B\u83B7\u80DC\u5355\u5143\u683C\u9AD8\u4EAE\uFF0C\u5DE5\u8702\u7ED9\u51FA\u63CF\u8FF0\u6027\u88C1\u51B3\uFF08\u975E\u6295\u8D44\u5EFA\u8BAE\uFF09\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, IPOS.map(i => {
    const on = compareIds.includes(i.id);
    const full = !on && cols >= 5;
    return /*#__PURE__*/React.createElement("button", {
      key: i.id,
      disabled: full,
      onClick: () => toggleCompare(i.id),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 13px',
        borderRadius: 'var(--radius-pill)',
        cursor: full ? 'not-allowed' : 'pointer',
        border: '1px solid ' + (on ? 'var(--violet-500)' : 'var(--border-default)'),
        background: on ? 'var(--violet-50)' : 'var(--surface-card)',
        opacity: full ? 0.45 : 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: on ? 'var(--violet-600)' : 'var(--text-body)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: on ? 'check' : 'plus',
      size: 14
    }), i.name, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        color: 'var(--text-subtle)'
      }
    }, i.ticker));
  })), cols < 2 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "git-compare",
    size: 30,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 0',
      fontSize: 'var(--text-sm)'
    }
  }, "\u8BF7\u81F3\u5C11\u9009\u62E9 2 \u4E2A\u6807\u7684\u8FDB\u884C\u6BD4\u8F83\u3002")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      background: 'var(--surface-card)',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 120 + cols * 180
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'left',
      padding: '16px 18px',
      position: 'sticky',
      left: 0,
      background: 'var(--surface-card)',
      minWidth: 150
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u6307\u6807 Metric")), selected.map((i, idx) => /*#__PURE__*/React.createElement("th", {
    key: i.id,
    style: {
      padding: '16px 18px',
      textAlign: 'left',
      borderLeft: '1px solid var(--border-subtle)',
      minWidth: 170
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      background: COMPARE_COLORS[idx],
      clipPath: 'var(--clip-hex)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => openIpo(i),
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, i.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleCompare(i.id),
    style: {
      marginLeft: 'auto',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-subtle)',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, i.ticker, " \xB7 ", i.cn))))), /*#__PURE__*/React.createElement("tbody", null, METRICS.map((m, ri) => {
    const bi = bestIndex(m, selected);
    return /*#__PURE__*/React.createElement("tr", {
      key: ri,
      style: {
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 18px',
        position: 'sticky',
        left: 0,
        background: 'var(--surface-card)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        fontWeight: 500
      }
    }, m.label), selected.map((i, idx) => {
      const win = idx === bi;
      let content;
      if (m.sentiment) content = /*#__PURE__*/React.createElement(CBadge, {
        tone: SENTIMENT_TONE[i.sentiment],
        size: "sm",
        dot: true
      }, SENTIMENT_LABEL[i.sentiment].split(' ')[0]);else if (m.rec) content = /*#__PURE__*/React.createElement(CBadge, {
        tone: REC_CFG[i.recommendation].tone,
        variant: "solid",
        size: "sm"
      }, REC_CFG[i.recommendation].label.split(' ')[0]);else content = /*#__PURE__*/React.createElement(Mono, {
        size: "var(--text-sm)",
        color: win ? 'var(--green-700)' : 'var(--text-primary)'
      }, m.fmt(m.get(i), i));
      return /*#__PURE__*/React.createElement("td", {
        key: i.id,
        style: {
          padding: '12px 18px',
          borderLeft: '1px solid var(--border-subtle)',
          background: win ? 'var(--green-50)' : 'transparent'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 7
        }
      }, content, win && /*#__PURE__*/React.createElement(Icon, {
        name: "crown",
        size: 13,
        color: "var(--green-600)"
      })));
    }));
  })))), cols >= 2 && (() => {
    const [a, b] = selected;
    const mk = [{
      label: '综合评分 Score',
      left: `${a.score}`,
      right: `${b.score}`,
      winner: a.score === b.score ? null : a.score > b.score ? 'left' : 'right'
    }, {
      label: '公开认购 Sub',
      left: a.live.subPublic != null ? a.live.subPublic + '×' : '—',
      right: b.live.subPublic != null ? b.live.subPublic + '×' : '—',
      winner: (a.live.subPublic ?? -1) === (b.live.subPublic ?? -1) ? null : (a.live.subPublic ?? -1) > (b.live.subPublic ?? -1) ? 'left' : 'right'
    }, {
      label: '估值 P/E',
      left: a.terms.pe,
      right: b.terms.pe,
      winner: null
    }, {
      label: '基石 Cornerstones',
      left: (a.cornerstones || []).length + ' 名',
      right: (b.cornerstones || []).length + ' 名',
      winner: (a.cornerstones || []).length === (b.cornerstones || []).length ? null : (a.cornerstones || []).length > (b.cornerstones || []).length ? 'left' : 'right'
    }, {
      label: 'AI 建议 Rec',
      left: REC_CFG[a.recommendation].label.split(' ')[0],
      right: REC_CFG[b.recommendation].label.split(' ')[0],
      winner: null
    }];
    const winner = a.score >= b.score ? a : b;
    return /*#__PURE__*/React.createElement(CComparePanel, {
      basePath: MASCOT_BP,
      eyebrow: "\u5DE5\u8702\u88C1\u51B3 \xB7 Bee Verdict",
      title: "\u5934\u5BF9\u5934 PK",
      subtitle: cols > 2 ? `先比较前两名（共选 ${cols} 个）` : '逐指标权衡',
      left: {
        name: a.name,
        ticker: a.ticker,
        color: COMPARE_COLORS[0]
      },
      right: {
        name: b.name,
        ticker: b.ticker,
        color: COMPARE_COLORS[1]
      },
      metrics: mk,
      verdict: `从研究评分与需求强度看，${winner.name}（${winner.ticker}）的综合信号更强（评分 ${winner.score} · 信号 ${REC_CFG[winner.recommendation].label.split(' ')[0]}）。以上为描述性研究信号，非投资建议；请结合各自风险摘要与数据版本独立判断。`
    });
  })()));
}
Object.assign(window, {
  CompareView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/compare.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/data.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — mock dataset
   Canonical IPO schema per PRD: event · terms · timetable ·
   pools · clawback · allotment · cornerstones · lockup ·
   profile · evidence(data version). Illustrative mock only.
   ============================================================ */

const ASSETS = '../../assets';
const MASCOT_BP = ASSETS + '/mascot';
const LOGO = ASSETS + '/aiphabee-mascot.png';

/* ---------- label maps ---------- */
const SECTOR_LABEL = {
  tech: '科技 Technology',
  health: '生物医药 Healthcare',
  fintech: '金融科技 Fintech',
  industrial: '工业 Industrials',
  energy: '能源 Energy',
  consumer: '消费 Consumer',
  property: '房地产 Property'
};

/* IPO lifecycle stages (the pipeline lanes) */
const STAGES = [{
  key: 'processing',
  label: '处理中',
  en: 'In Processing',
  tone: 'neutral',
  icon: 'file-clock'
}, {
  key: 'subscribing',
  label: '招股中',
  en: 'Subscribing',
  tone: 'honey',
  icon: 'flame'
}, {
  key: 'grey',
  label: '暗盘 / 上市',
  en: 'Grey · Listed',
  tone: 'info',
  icon: 'activity'
}, {
  key: 'allotted',
  label: '已公布分配',
  en: 'Allotted',
  tone: 'bullish',
  icon: 'check-check'
}, {
  key: 'withdrawn',
  label: '撤回 / 失效',
  en: 'Withdrawn',
  tone: 'bearish',
  icon: 'x-circle'
}];
const STAGE_BY = Object.fromEntries(STAGES.map(s => [s.key, s]));
const LISTING_TYPE = {
  normal: 'Normal 普通',
  '18a': '18A 未盈利生物科技',
  '18c': '18C 特专科技',
  intro: 'By Introduction 介绍上市'
};
const SENTIMENT_TONE = {
  bullish: 'bullish',
  cautious: 'warning',
  neutral: 'neutral',
  bearish: 'bearish'
};
const SENTIMENT_LABEL = {
  bullish: '牛市 Bullish',
  cautious: '谨慎乐观 Cautious',
  neutral: '中性 Neutral',
  bearish: '熊市 Bearish'
};
/* AiphaBee 研究信号（描述性，非投资建议 / Gate-0 research signal, not advice） */
const REC_CFG = {
  strong_buy: {
    tone: 'bullish',
    label: '需求强劲 Strong Demand'
  },
  buy: {
    tone: 'bullish',
    label: '需求稳健 Solid Demand'
  },
  hold: {
    tone: 'neutral',
    label: '需求中性 Neutral'
  },
  avoid: {
    tone: 'bearish',
    label: '需求疲弱 Weak Demand'
  },
  na: {
    tone: 'neutral',
    label: '数据不足 Insufficient'
  }
};

/* demand-level color from oversubscription multiple */
function demandTone(x) {
  if (x == null) return 'var(--neutral-400)';
  if (x >= 100) return 'var(--demand-extreme)';
  if (x >= 50) return 'var(--demand-very-hot)';
  if (x >= 10) return 'var(--green-600)';
  if (x >= 5) return 'var(--blue-500)';
  return 'var(--neutral-500)';
}

/* ============================================================
   IPO records
   ============================================================ */
const IPOS = [/* ---- 1. SUBSCRIBING — hot tech, live sub multiple ---- */
{
  id: 'honeycomb',
  name: 'Honeycomb Intelligence',
  cn: '蜂巢智能',
  ticker: '2769.HK',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'tech',
  listingType: 'normal',
  stage: 'subscribing',
  sentiment: 'bullish',
  score: 78,
  confidence: 86,
  recommendation: 'buy',
  tierLabel: '中盘股 Mid-cap',
  desc: 'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。基石阵容强劲，公开发售火爆超额认购。',
  terms: {
    priceLow: 22.40,
    priceHigh: 24.80,
    finalPrice: null,
    ccy: 'HKD',
    entryFee: 5009.0,
    lotSize: 200,
    sharesOffered: '1.70 亿股',
    greenshoe: '15%',
    publicPct: 10,
    intlPct: 90,
    raiseHKD: '4.2B',
    mcapHKD: '38.6B',
    nta: 'HK$6.85',
    pe: '32.4×',
    pb: '5.1×'
  },
  subPeriod: {
    start: 'Jun 18',
    end: 'Jun 23 12:00'
  },
  listingDate: 'Jun 26, 2026',
  pricingDate: 'Jun 23, 2026',
  live: {
    subPublic: 128.4,
    subIntl: 6.2,
    marginDays: '5.5 日',
    greyChg: null,
    validApps: null,
    oneLotRate: null,
    headHammer: null,
    clawbackApplied: null
  },
  timetable: [{
    type: 'open',
    title: '公开发售开始 Offer Opens',
    at: 'Jun 18 09:00',
    done: true
  }, {
    type: 'close',
    title: '公开发售截止 Offer Closes',
    at: 'Jun 23 12:00',
    done: false,
    active: true
  }, {
    type: 'price',
    title: '定价日 Pricing',
    at: 'Jun 23',
    done: false
  }, {
    type: 'allot',
    title: '公布分配结果 Allotment',
    at: 'Jun 25',
    done: false
  }, {
    type: 'grey',
    title: '暗盘交易 Grey Market',
    at: 'Jun 25 16:15',
    done: false
  }, {
    type: 'list',
    title: '上市日 Listing',
    at: 'Jun 26 09:30',
    done: false
  }],
  pools: [{
    name: 'Pool A',
    desc: '≤ HK$5M 申请',
    lots: '7,500 手',
    apps: null
  }, {
    name: 'Pool B',
    desc: '> HK$5M 申请',
    lots: '7,500 手',
    apps: null
  }],
  clawback: [{
    trigger: '≥ 15× 且 < 50×',
    publicPct: '30%'
  }, {
    trigger: '≥ 50× 且 < 100×',
    publicPct: '40%'
  }, {
    trigger: '≥ 100×',
    publicPct: '50%',
    active: true
  }],
  applicationTiers: [{
    lots: 1,
    shares: 200,
    amount: 5009,
    hot: true
  }, {
    lots: 5,
    shares: 1000,
    amount: 25045
  }, {
    lots: 10,
    shares: 2000,
    amount: 50090
  }, {
    lots: 50,
    shares: 10000,
    amount: 250450
  }, {
    lots: 100,
    shares: 20000,
    amount: 500900
  }],
  allotment: null,
  cornerstones: [{
    name: 'Hillhouse 高瓴',
    amount: 'HKD 600M',
    pct: 14.3,
    lockup: '6 个月'
  }, {
    name: 'GIC Singapore',
    amount: 'HKD 420M',
    pct: 10.0,
    lockup: '6 个月'
  }, {
    name: 'Tencent 腾讯',
    amount: 'HKD 380M',
    pct: 9.0,
    lockup: '6 个月'
  }],
  lockup: [{
    type: '控股股东 Controlling',
    endDate: 'Dec 26, 2026',
    pct: '52.4%',
    shares: '8.9 亿股'
  }, {
    type: '基石投资者 Cornerstone',
    endDate: 'Dec 26, 2026',
    pct: '33.3%',
    shares: '0.57 亿股'
  }],
  sponsors: [{
    name: 'Morgan Stanley',
    role: '联席保荐人 Sponsor',
    rating: 5
  }, {
    name: 'CICC 中金公司',
    role: '联席保荐人 Sponsor',
    rating: 4.5
  }, {
    name: 'Goldman Sachs',
    role: '账簿管理人 Bookrunner',
    rating: 4
  }],
  aiNote: '科技板块情绪向好叠加优质基石阵容，公开发售 128× 超额认购触发 50% 回拨上限。定价或落于区间上沿；以历史样本看，此类高倍超购标的的一手中签率通常偏低。',
  riskSummary: [{
    level: 'mid',
    text: '估值偏高：PE 32×，高于同业中位 24×。'
  }, {
    level: 'low',
    text: '基石锁定 6 个月，上市初期抛压可控。'
  }, {
    level: 'mid',
    text: '业务高度依赖头部机构客户，集中度风险。'
  }],
  profile: {
    overview: '蜂巢智能是面向资产管理机构的 AI 投研基础设施服务商，提供多模型估值引擎、尽职调查自动化与组合风险监控。截至最近财年，付费机构客户 240 家，净收入留存率 128%。',
    useOfProceeds: [{
      pct: 45,
      label: '研发与模型训练 R&D'
    }, {
      pct: 25,
      label: '海外市场拓展 Expansion'
    }, {
      pct: 20,
      label: '数据采购与合规 Data & Compliance'
    }, {
      pct: 10,
      label: '一般营运资金 Working Capital'
    }],
    risks: ['核心客户集中度较高，前五大客户贡献约 41% 收入。', 'AI 监管政策与数据合规要求趋严，或增加运营成本。', '估值对增长预期敏感，不达预期可能引发回调。'],
    advantages: ['多模型估值引擎具备技术壁垒，迁移成本高。', '净收入留存率 128%，客户黏性与扩张能力强。', '基石阵容覆盖一线机构，背书效应显著。'],
    company: [{
      k: '成立年份',
      v: '2018'
    }, {
      k: '总部',
      v: '香港 · 新加坡'
    }, {
      k: '员工人数',
      v: '约 680 人'
    }, {
      k: '最近财年净收入',
      v: 'HK$1.92B'
    }, {
      k: '净收入留存率',
      v: '128%'
    }]
  },
  evidence: {
    asOf: 'Jun 23, 2026 11:40 HKT',
    dataVersion: 'v2026.06.23-3',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 招股章程 · 联交所披露易'
  }
}, /* ---- 2. ALLOTTED — win rate + clawback published ---- */
{
  id: 'lotus',
  name: 'Lotus Digital Pay',
  cn: '莲花数科',
  ticker: '2611.HK',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'fintech',
  listingType: 'normal',
  stage: 'allotted',
  sentiment: 'bullish',
  score: 71,
  confidence: 79,
  recommendation: 'buy',
  tierLabel: '大盘股 Large-cap',
  desc: '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。分配结果已公布，一手中签率中等。',
  terms: {
    priceLow: 16.80,
    priceHigh: 18.20,
    finalPrice: 18.20,
    ccy: 'HKD',
    entryFee: 3676.0,
    lotSize: 200,
    sharesOffered: '3.74 亿股',
    greenshoe: '15%',
    publicPct: 12,
    intlPct: 88,
    raiseHKD: '6.8B',
    mcapHKD: '92.1B',
    nta: 'HK$9.20',
    pe: '27.6×',
    pb: '3.4×'
  },
  subPeriod: {
    start: 'Jun 12',
    end: 'Jun 17'
  },
  listingDate: 'Jun 23, 2026',
  pricingDate: 'Jun 17, 2026',
  live: {
    subPublic: 64.2,
    subIntl: 4.1,
    marginDays: null,
    greyChg: 12.4,
    validApps: '186,420 户',
    oneLotRate: 32,
    headHammer: '6,000 手',
    clawbackApplied: '40%'
  },
  timetable: [{
    type: 'open',
    title: '公开发售开始 Offer Opens',
    at: 'Jun 12 09:00',
    done: true
  }, {
    type: 'close',
    title: '公开发售截止 Offer Closes',
    at: 'Jun 17 12:00',
    done: true
  }, {
    type: 'price',
    title: '定价 HK$18.20 上沿定价',
    at: 'Jun 17',
    done: true
  }, {
    type: 'allot',
    title: '公布分配结果 Allotment',
    at: 'Jun 20',
    done: true,
    active: true
  }, {
    type: 'grey',
    title: '暗盘 +12.4% Grey',
    at: 'Jun 20 16:15',
    done: true
  }, {
    type: 'list',
    title: '上市日 Listing',
    at: 'Jun 23 09:30',
    done: false
  }],
  pools: [{
    name: 'Pool A',
    desc: '≤ HK$5M 申请',
    lots: '11,220 手',
    apps: '171,300 户'
  }, {
    name: 'Pool B',
    desc: '> HK$5M 申请',
    lots: '11,220 手',
    apps: '15,120 户'
  }],
  clawback: [{
    trigger: '≥ 15× 且 < 50×',
    publicPct: '30%'
  }, {
    trigger: '≥ 50× 且 < 100×',
    publicPct: '40%',
    active: true
  }, {
    trigger: '≥ 100×',
    publicPct: '50%'
  }],
  applicationTiers: [{
    lots: 1,
    shares: 200,
    amount: 3676,
    rate: '32%'
  }, {
    lots: 5,
    shares: 1000,
    amount: 18380,
    rate: '58%'
  }, {
    lots: 10,
    shares: 2000,
    amount: 36760,
    rate: '85%'
  }, {
    lots: 20,
    shares: 4000,
    amount: 73520,
    rate: '100%（稳中一手）'
  }],
  allotment: {
    oneLotRate: 32,
    validApps: '186,420 户',
    headHammer: '6,000 手',
    clawbackApplied: '40%',
    subPublic: 64.2,
    finalPrice: 18.20,
    result: [{
      lots: 1,
      applied: '171,300 户',
      rate: '32%'
    }, {
      lots: 5,
      applied: '9,640 户',
      rate: '58%'
    }, {
      lots: 10,
      applied: '3,210 户',
      rate: '85%'
    }, {
      lots: 20,
      applied: '2,270 户',
      rate: '100%'
    }]
  },
  cornerstones: [{
    name: 'Temasek 淡马锡',
    amount: 'HKD 800M',
    pct: 11.8,
    lockup: '6 个月'
  }, {
    name: 'BlackRock',
    amount: 'HKD 500M',
    pct: 7.4,
    lockup: '6 个月'
  }],
  lockup: [{
    type: '控股股东 Controlling',
    endDate: 'Dec 23, 2026',
    pct: '61.2%',
    shares: '22.9 亿股'
  }, {
    type: '基石投资者 Cornerstone',
    endDate: 'Dec 23, 2026',
    pct: '19.2%',
    shares: '0.72 亿股'
  }],
  sponsors: [{
    name: 'JPMorgan',
    role: '联席保荐人 Sponsor',
    rating: 4.5
  }, {
    name: 'UBS',
    role: '账簿管理人 Bookrunner',
    rating: 4
  }, {
    name: 'Huatai 华泰',
    role: '账簿管理人 Bookrunner',
    rating: 3.5
  }],
  aiNote: '上沿 HK$18.20 定价、暗盘 +12.4% 共同反映需求扎实。公开发售 64× 触发 40% 回拨，一手中签率 32% 处于中等区间。盈利稳健、自由现金流为正。',
  riskSummary: [{
    level: 'low',
    text: '盈利稳健，现金流为正。'
  }, {
    level: 'mid',
    text: '跨境支付监管多变，牌照风险需关注。'
  }, {
    level: 'low',
    text: '暗盘已正溢价，破发概率较低。'
  }],
  profile: {
    overview: '莲花数科运营东南亚领先的跨境支付与数字钱包网络，覆盖 6 国、月活用户 4,200 万。最近财年经调整净利润 HK$2.4B，同比增长 34%。',
    useOfProceeds: [{
      pct: 40,
      label: '区域扩张与牌照 Licensing'
    }, {
      pct: 30,
      label: '技术与风控 Tech & Risk'
    }, {
      pct: 20,
      label: '战略并购 M&A'
    }, {
      pct: 10,
      label: '营运资金 Working Capital'
    }],
    risks: ['多国支付牌照与外汇监管存在政策不确定性。', '行业竞争激烈，费率持续承压。', '汇率波动影响跨境结算收入。'],
    advantages: ['区域网络效应与牌照壁垒构筑护城河。', '盈利能力领先同业，自由现金流为正。', '淡马锡、贝莱德背书强化机构信心。'],
    company: [{
      k: '成立年份',
      v: '2014'
    }, {
      k: '总部',
      v: '新加坡'
    }, {
      k: '覆盖市场',
      v: '东南亚 6 国'
    }, {
      k: '月活用户',
      v: '4,200 万'
    }, {
      k: '经调整净利润',
      v: 'HK$2.4B'
    }]
  },
  evidence: {
    asOf: 'Jun 20, 2026 18:05 HKT',
    dataVersion: 'v2026.06.20-1',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 分配结果公告 · 联交所披露易'
  }
}, /* ---- 3. PROCESSING — 18A biotech, post-hearing ---- */
{
  id: 'pearl',
  name: 'Pearl River Biotech',
  cn: '珠江生物',
  ticker: '—',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'health',
  listingType: '18a',
  stage: 'processing',
  sentiment: 'cautious',
  score: 54,
  confidence: 61,
  recommendation: 'hold',
  tierLabel: '小盘股 Small-cap',
  desc: '创新药企，核心管线处于 II 期临床。已通过聆讯，尚未启动招股；未盈利，估值依赖里程碑预期。',
  terms: {
    priceLow: null,
    priceHigh: null,
    finalPrice: null,
    ccy: 'HKD',
    entryFee: null,
    lotSize: 500,
    sharesOffered: '约 1.2 亿股（指示）',
    greenshoe: '15%',
    publicPct: 10,
    intlPct: 90,
    raiseHKD: '~1.1B（指示）',
    mcapHKD: '~8.4B（指示）',
    nta: '待定 TBD',
    pe: 'N/A（未盈利）',
    pb: '待定 TBD'
  },
  subPeriod: {
    start: '待定',
    end: '待定'
  },
  listingDate: '待定 TBD',
  pricingDate: '待定',
  live: {
    subPublic: null,
    subIntl: null,
    marginDays: null,
    greyChg: null,
    validApps: null,
    oneLotRate: null,
    headHammer: null,
    clawbackApplied: null
  },
  timetable: [{
    type: 'file',
    title: '递交上市申请 A1 Filing',
    at: 'Apr 02',
    done: true
  }, {
    type: 'hearing',
    title: '通过上市聆讯 Hearing Passed',
    at: 'Jun 16',
    done: true,
    active: true
  }, {
    type: 'roadshow',
    title: '路演 / 预路演 Roadshow',
    at: '待定',
    done: false
  }, {
    type: 'open',
    title: '启动公开发售 Offer Opens',
    at: '待定',
    done: false
  }, {
    type: 'list',
    title: '预计上市 Listing',
    at: '待定',
    done: false
  }],
  pools: null,
  clawback: [{
    trigger: '≥ 15× 且 < 50×',
    publicPct: '30%'
  }, {
    trigger: '≥ 50× 且 < 100×',
    publicPct: '40%'
  }, {
    trigger: '≥ 100×',
    publicPct: '50%'
  }],
  applicationTiers: null,
  allotment: null,
  cornerstones: [{
    name: 'Qiming 启明创投',
    amount: 'HKD 220M（意向）',
    pct: 20.0,
    lockup: '6 个月'
  }],
  lockup: [{
    type: '控股股东 Controlling',
    endDate: '上市后 6 个月',
    pct: '— TBD',
    shares: '— TBD'
  }],
  sponsors: [{
    name: 'CICC 中金公司',
    role: '独家保荐人 Sole Sponsor',
    rating: 4
  }, {
    name: 'CMB Intl 招银国际',
    role: '账簿管理人 Bookrunner',
    rating: 3.5
  }],
  aiNote: '18A 未盈利生物科技，已通过聆讯但招股细节未定。核心管线 II 期数据为关键催化；招股条款、定价区间与基石阵容尚未公布，需求强度暂无法测算。',
  riskSummary: [{
    level: 'high',
    text: '核心管线处 II 期，临床失败风险显著。'
  }, {
    level: 'high',
    text: '未盈利，估值高度依赖里程碑预期。'
  }, {
    level: 'mid',
    text: '招股条款未定，定价区间存在不确定性。'
  }],
  profile: {
    overview: '珠江生物专注肿瘤免疫创新药研发，核心管线 PRB-201（PD-L1/VEGF 双抗）处于 II 期临床。公司尚无商业化产品，依据 18A 规则申请上市。',
    useOfProceeds: [{
      pct: 55,
      label: '核心管线临床 Clinical Trials'
    }, {
      pct: 25,
      label: '产能与 CMC'
    }, {
      pct: 12,
      label: '管线拓展 Pipeline'
    }, {
      pct: 8,
      label: '营运资金 Working Capital'
    }],
    risks: ['核心管线尚处 II 期，存在临床失败与延期风险。', '无收入与利润，持续依赖融资，存在摊薄风险。', '创新药竞争激烈，商业化前景不确定。'],
    advantages: ['双抗平台具差异化机制，潜在 first-in-class。', '核心团队具备跨国药企研发背景。', '已获启明创投意向基石支持。'],
    company: [{
      k: '成立年份',
      v: '2019'
    }, {
      k: '总部',
      v: '广州'
    }, {
      k: '核心管线',
      v: 'PRB-201（II 期）'
    }, {
      k: '上市规则',
      v: '主板 18A'
    }, {
      k: '商业化产品',
      v: '暂无'
    }]
  },
  evidence: {
    asOf: 'Jun 17, 2026 09:20 HKT',
    dataVersion: 'v2026.06.17-2',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 聆讯后资料集 PHIP · 联交所披露易'
  }
}, /* ---- 4. BY INTRODUCTION — no pool / no clawback ---- */
{
  id: 'meridian',
  name: 'Meridian Trust REIT',
  cn: '子午线房托',
  ticker: '0827.HK',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'property',
  listingType: 'intro',
  stage: 'grey',
  sentiment: 'neutral',
  score: 58,
  confidence: 68,
  recommendation: 'hold',
  tierLabel: '中盘股 Mid-cap',
  desc: '以介绍方式上市的区域商业地产信托，无公开发售、无回拨机制；上市初期流动性偏低。',
  terms: {
    priceLow: null,
    priceHigh: null,
    finalPrice: 22.00,
    ccy: 'HKD',
    entryFee: null,
    lotSize: 1000,
    sharesOffered: '不适用（介绍上市）',
    greenshoe: '—',
    publicPct: 0,
    intlPct: 0,
    raiseHKD: '不适用（无新股发行）',
    mcapHKD: '24.0B',
    nta: 'HK$25.60',
    pe: '—',
    pb: '0.86×'
  },
  subPeriod: {
    start: '不适用',
    end: '不适用'
  },
  listingDate: 'Jun 24, 2026',
  pricingDate: 'Jun 23, 2026（参考价）',
  live: {
    subPublic: null,
    subIntl: null,
    marginDays: null,
    greyChg: null,
    validApps: null,
    oneLotRate: null,
    headHammer: null,
    clawbackApplied: null
  },
  timetable: [{
    type: 'file',
    title: '递交介绍上市申请 Filing',
    at: 'May 05',
    done: true
  }, {
    type: 'hearing',
    title: '通过上市聆讯 Hearing',
    at: 'Jun 10',
    done: true
  }, {
    type: 'ref',
    title: '公布参考价 HK$22.00',
    at: 'Jun 23',
    done: true,
    active: true
  }, {
    type: 'list',
    title: '介绍方式上市 Listing',
    at: 'Jun 24 09:30',
    done: false
  }],
  pools: null,
  clawback: null,
  applicationTiers: null,
  allotment: null,
  cornerstones: [],
  lockup: [{
    type: '原股东 Existing Holders',
    endDate: '无统一锁定',
    pct: '—',
    shares: '—'
  }],
  sponsors: [{
    name: 'HSBC 汇丰',
    role: '上市顾问 Listing Agent',
    rating: 4
  }, {
    name: 'DBS 星展',
    role: '财务顾问 Adviser',
    rating: 3.5
  }],
  aiNote: '介绍方式上市不涉及新股发行与公开认购，无一手中签率概念。开盘价由市场撮合决定，初期流动性偏低、价格波动可能较大。当前交易于资产净值折让（P/NAV 0.86×）。',
  riskSummary: [{
    level: 'mid',
    text: '介绍上市无募资，初期流动性偏低。'
  }, {
    level: 'mid',
    text: '开盘价缺乏发售价锚定，波动可能较大。'
  }, {
    level: 'low',
    text: '交易于资产净值折让，估值具安全边际。'
  }],
  profile: {
    overview: '子午线房托持有粤港澳大湾区 9 处优质商业物业，出租率 94%，分派收益率约 6.2%。本次以介绍方式上市，不发行新单位、不募集资金。',
    useOfProceeds: [{
      pct: 100,
      label: '不适用 — 介绍上市无募资 N/A'
    }],
    risks: ['介绍上市无承销支持，初期成交清淡。', '商业地产受宏观与利率周期影响。', '物业估值下行将拖累 NAV 与分派。'],
    advantages: ['组合出租率高、现金流稳定。', '交易价低于资产净值，存在折让修复空间。', '分派收益率具吸引力。'],
    company: [{
      k: '成立年份',
      v: '2011'
    }, {
      k: '物业数量',
      v: '9 处'
    }, {
      k: '出租率',
      v: '94%'
    }, {
      k: '分派收益率',
      v: '约 6.2%'
    }, {
      k: '上市方式',
      v: '介绍上市 By Introduction'
    }]
  },
  evidence: {
    asOf: 'Jun 23, 2026 17:30 HKT',
    dataVersion: 'v2026.06.23-1',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 上市文件 · 联交所披露易'
  }
}, /* ---- 5. WITHDRAWN / FAILED ---- */
{
  id: 'greenfield',
  name: 'GreenField Energy',
  cn: '绿野能源',
  ticker: '—',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'energy',
  listingType: 'normal',
  stage: 'withdrawn',
  sentiment: 'bearish',
  score: 31,
  confidence: 64,
  recommendation: 'avoid',
  tierLabel: '小盘股 Small-cap',
  desc: '光伏组件制造商，因行业产能过剩、需求冷淡，公开发售认购不足，发行人决定撤回上市申请。',
  terms: {
    priceLow: 5.80,
    priceHigh: 6.20,
    finalPrice: null,
    ccy: 'HKD',
    entryFee: 3131.0,
    lotSize: 500,
    sharesOffered: '1.45 亿股（已撤回）',
    greenshoe: '—',
    publicPct: 10,
    intlPct: 90,
    raiseHKD: '~0.9B（已撤回）',
    mcapHKD: '~5.6B',
    nta: 'HK$4.10',
    pe: '亏损 Loss',
    pb: '1.5×'
  },
  subPeriod: {
    start: 'Jun 05',
    end: 'Jun 10（提前截止）'
  },
  listingDate: '已撤回 Withdrawn',
  pricingDate: '未定价 Not Priced',
  live: {
    subPublic: 0.4,
    subIntl: 0.3,
    marginDays: null,
    greyChg: null,
    validApps: null,
    oneLotRate: null,
    headHammer: null,
    clawbackApplied: null
  },
  timetable: [{
    type: 'open',
    title: '公开发售开始 Offer Opens',
    at: 'Jun 05 09:00',
    done: true
  }, {
    type: 'close',
    title: '公开发售截止 Offer Closes',
    at: 'Jun 10 12:00',
    done: true
  }, {
    type: 'withdraw',
    title: '撤回上市申请 Withdrawn',
    at: 'Jun 11',
    done: true,
    active: true,
    danger: true
  }],
  pools: [{
    name: 'Pool A',
    desc: '≤ HK$5M 申请',
    lots: '认购不足',
    apps: '认购不足'
  }, {
    name: 'Pool B',
    desc: '> HK$5M 申请',
    lots: '认购不足',
    apps: '认购不足'
  }],
  clawback: null,
  applicationTiers: null,
  allotment: null,
  cornerstones: [],
  lockup: [],
  sponsors: [{
    name: 'Guotai Junan 国泰君安',
    role: '独家保荐人 Sole Sponsor',
    rating: 2.5
  }],
  aiNote: '行业景气低迷、公开发售认购不足 1×，发行人于截止后撤回上市。多维研究信号全面偏弱，需求基础薄弱。',
  riskSummary: [{
    level: 'high',
    text: '公开发售认购不足，已撤回上市。'
  }, {
    level: 'high',
    text: '行业产能过剩、毛利持续承压、当前亏损。'
  }, {
    level: 'mid',
    text: '无基石支持，需求基础薄弱。'
  }],
  profile: {
    overview: '绿野能源为光伏组件制造商，受行业产能过剩与价格战影响，最近财年由盈转亏。公开发售反应冷淡，认购不足，发行人决定撤回本次上市。',
    useOfProceeds: [{
      pct: 100,
      label: '已撤回 — 募资计划终止 N/A'
    }],
    risks: ['行业产能严重过剩，组件价格持续下行。', '公司由盈转亏，现金流承压。', '上市撤回后再融资难度上升。'],
    advantages: ['具备一体化产能，成本端有一定弹性。', '若行业出清，存在周期反转期权价值。'],
    company: [{
      k: '成立年份',
      v: '2016'
    }, {
      k: '总部',
      v: '合肥'
    }, {
      k: '主营',
      v: '光伏组件制造'
    }, {
      k: '最近财年',
      v: '由盈转亏'
    }, {
      k: '上市状态',
      v: '已撤回 Withdrawn'
    }]
  },
  evidence: {
    asOf: 'Jun 11, 2026 10:00 HKT',
    dataVersion: 'v2026.06.11-1',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 撤回公告 · 联交所披露易'
  }
}, /* ---- 6. SUBSCRIBING — consumer, moderate demand ---- */
{
  id: 'apex',
  name: 'Apex Coffee Roasters',
  cn: '顶峰咖啡',
  ticker: '9699.HK',
  exchange: 'HKEX',
  board: '主板 Main',
  sector: 'consumer',
  listingType: 'normal',
  stage: 'subscribing',
  sentiment: 'neutral',
  score: 49,
  confidence: 55,
  recommendation: 'hold',
  tierLabel: '中盘股 Mid-cap',
  desc: '连锁精品咖啡运营商，门店扩张快但盈利尚浅；当前公开发售认购平淡。',
  terms: {
    priceLow: 12.60,
    priceHigh: 13.40,
    finalPrice: null,
    ccy: 'HKD',
    entryFee: 2707.0,
    lotSize: 200,
    sharesOffered: '1.80 亿股',
    greenshoe: '15%',
    publicPct: 10,
    intlPct: 90,
    raiseHKD: '2.4B',
    mcapHKD: '21.0B',
    nta: 'HK$5.30',
    pe: '41.2×',
    pb: '2.5×'
  },
  subPeriod: {
    start: 'Jun 19',
    end: 'Jun 24 12:00'
  },
  listingDate: 'Jun 30, 2026',
  pricingDate: 'Jun 24, 2026',
  live: {
    subPublic: 6.8,
    subIntl: 1.4,
    marginDays: '4 日',
    greyChg: null,
    validApps: null,
    oneLotRate: null,
    headHammer: null,
    clawbackApplied: null
  },
  timetable: [{
    type: 'open',
    title: '公开发售开始 Offer Opens',
    at: 'Jun 19 09:00',
    done: true
  }, {
    type: 'close',
    title: '公开发售截止 Offer Closes',
    at: 'Jun 24 12:00',
    done: false,
    active: true
  }, {
    type: 'price',
    title: '定价日 Pricing',
    at: 'Jun 24',
    done: false
  }, {
    type: 'allot',
    title: '公布分配结果 Allotment',
    at: 'Jun 29',
    done: false
  }, {
    type: 'list',
    title: '上市日 Listing',
    at: 'Jun 30 09:30',
    done: false
  }],
  pools: [{
    name: 'Pool A',
    desc: '≤ HK$5M 申请',
    lots: '4,500 手',
    apps: null
  }, {
    name: 'Pool B',
    desc: '> HK$5M 申请',
    lots: '4,500 手',
    apps: null
  }],
  clawback: [{
    trigger: '≥ 15× 且 < 50×',
    publicPct: '30%'
  }, {
    trigger: '≥ 50× 且 < 100×',
    publicPct: '40%'
  }, {
    trigger: '≥ 100×',
    publicPct: '50%'
  }],
  applicationTiers: [{
    lots: 1,
    shares: 200,
    amount: 2707,
    hot: true
  }, {
    lots: 5,
    shares: 1000,
    amount: 13535
  }, {
    lots: 10,
    shares: 2000,
    amount: 27070
  }, {
    lots: 50,
    shares: 10000,
    amount: 135350
  }],
  allotment: null,
  cornerstones: [{
    name: 'Hony Capital 弘毅',
    amount: 'HKD 180M',
    pct: 7.5,
    lockup: '6 个月'
  }],
  lockup: [{
    type: '控股股东 Controlling',
    endDate: 'Dec 30, 2026',
    pct: '58.0%',
    shares: '9.1 亿股'
  }],
  sponsors: [{
    name: 'Citi 花旗',
    role: '独家保荐人 Sole Sponsor',
    rating: 4
  }, {
    name: 'CCB Intl 建银国际',
    role: '账簿管理人 Bookrunner',
    rating: 3.5
  }],
  aiNote: '消费板块情绪平淡，公开发售 6.8× 认购偏冷且估值 PE 41× 偏高。基石支持有限，需求支撑较弱。',
  riskSummary: [{
    level: 'mid',
    text: '估值偏高：PE 41×，盈利尚浅。'
  }, {
    level: 'mid',
    text: '门店快速扩张，单店模型尚待验证。'
  }, {
    level: 'mid',
    text: '认购平淡，上市初期支撑有限。'
  }],
  profile: {
    overview: '顶峰咖啡运营 1,200 余家精品连锁门店，主打高性价比现磨咖啡。最近财年收入快速增长但净利率较薄，处于规模扩张期。',
    useOfProceeds: [{
      pct: 50,
      label: '门店扩张 Store Expansion'
    }, {
      pct: 25,
      label: '供应链与烘焙 Supply Chain'
    }, {
      pct: 15,
      label: '品牌与数字化 Brand & Digital'
    }, {
      pct: 10,
      label: '营运资金 Working Capital'
    }],
    risks: ['门店快速扩张，单店盈利模型尚待验证。', '咖啡赛道竞争激烈，价格战压制利润。', '原材料价格波动影响毛利。'],
    advantages: ['规模与供应链具备成本优势。', '高性价比定位契合大众消费。', '门店网络扩张迅速，品牌认知提升。'],
    company: [{
      k: '成立年份',
      v: '2017'
    }, {
      k: '门店数量',
      v: '1,200+ 家'
    }, {
      k: '总部',
      v: '上海'
    }, {
      k: '净利率',
      v: '约 6%'
    }, {
      k: '会员数',
      v: '3,100 万'
    }]
  },
  evidence: {
    asOf: 'Jun 23, 2026 11:40 HKT',
    dataVersion: 'v2026.06.23-3',
    methodology: 'm-ipo-1.4',
    source: 'HKEX 招股章程 · 联交所披露易'
  }
}];
const IPO_BY = Object.fromEntries(IPOS.map(i => [i.id, i]));
Object.assign(window, {
  ASSETS,
  MASCOT_BP,
  LOGO,
  SECTOR_LABEL,
  STAGES,
  STAGE_BY,
  LISTING_TYPE,
  SENTIMENT_TONE,
  SENTIMENT_LABEL,
  REC_CFG,
  demandTone,
  IPOS,
  IPO_BY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/data.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/detail-parts.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — Detail 左栏模块 + 底部 tabs
   ============================================================ */
const _MDS = window.AiphaBeeDesignSystem_599c13;
const {
  Badge: MBadge
} = _MDS;

/* ---------- Timetable (vertical timeline) ---------- */
function Timeline({
  events
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      paddingLeft: 4
    }
  }, events.map((e, i) => {
    const last = i === events.length - 1;
    const color = e.danger ? 'var(--red-500)' : e.done ? 'var(--green-500)' : e.active ? 'var(--honey-500)' : 'var(--neutral-300)';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '22px 1fr',
        gap: 14,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 16,
        height: 16,
        borderRadius: e.active ? 4 : '50%',
        flexShrink: 0,
        background: e.done || e.active || e.danger ? color : 'var(--surface-card)',
        border: '2px solid ' + color,
        marginTop: 2,
        boxShadow: e.active ? '0 0 0 4px rgba(251,203,10,0.25)' : 'none',
        transform: e.active ? 'rotate(45deg)' : 'none'
      }
    }), !last && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 2,
        flex: 1,
        minHeight: 26,
        background: e.done ? 'var(--green-500)' : 'var(--border-subtle)',
        marginTop: 2,
        marginBottom: 2
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingBottom: last ? 0 : 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        lineHeight: 1.35,
        fontWeight: e.active ? 700 : 600,
        color: e.danger ? 'var(--red-600)' : e.done || e.active ? 'var(--text-primary)' : 'var(--text-muted)'
      }
    }, e.title), e.active && /*#__PURE__*/React.createElement(MBadge, {
      tone: "honey",
      size: "sm"
    }, "\u8FDB\u884C\u4E2D Now")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: e.done || e.active ? 'var(--text-body)' : 'var(--text-subtle)',
        marginTop: 2
      }
    }, e.at)));
  }));
}

/* ---------- Terms grid ---------- */
function TermsGrid({
  ipo
}) {
  const t = ipo.terms;
  const items = [['招股价区间 Price Range', t.priceLow && t.priceHigh ? `HK$${t.priceLow.toFixed(2)} – ${t.priceHigh.toFixed(2)}` : '待定'], ['最终定价 Final Price', t.finalPrice ? `HK$${t.finalPrice.toFixed(2)}` : ipo.stage === 'subscribing' ? '招股中' : '—'], ['入场费 Entry Fee', t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—'], ['每手股数 Lot Size', `${t.lotSize.toLocaleString()} 股`], ['发行股数 Shares Offered', t.sharesOffered], ['公开 / 国际 Split', t.publicPct ? `${t.publicPct}% / ${t.intlPct}%` : '不适用'], ['集资额 Total Raise', t.raiseHKD], ['市值 Market Cap', t.mcapHKD], ['每股 NTA', t.nta], ['市盈率 P/E', t.pe], ['市净率 P/B', t.pb], ['超额配股权 Greenshoe', t.greenshoe]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 0,
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, items.map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      borderRight: i % 3 !== 2 ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 4
    }
  }, k), /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)"
  }, v))));
}

/* ---------- Public-offer pool + clawback ---------- */
function PoolClawback({
  ipo
}) {
  if (ipo.listingType === 'intro' || !ipo.pools) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 18,
      color: "var(--text-muted)"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-body)',
        lineHeight: 1.55
      }
    }, /*#__PURE__*/React.createElement("strong", null, LISTING_TYPE[ipo.listingType].split(' ')[0]), " \u2014 \u672C\u6B21", ipo.listingType === 'intro' ? '以介绍方式上市，无公开发售、无 Pool A/B、无回拨机制' : '尚未启动公开发售，Pool 与回拨待招股时公布', "\u3002"));
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 18
    }
  }, ipo.pools.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: {
      padding: '14px',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-primary)'
    }
  }, p.name), /*#__PURE__*/React.createElement(MBadge, {
    tone: "neutral",
    size: "sm"
  }, p.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "\u53EF\u8BA4\u8D2D Lots"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Mono, null, p.lots))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u6709\u6548\u7533\u8BF7"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    color: "var(--text-body)"
  }, p.apps ?? '招股中'))))))), ipo.clawback && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "\u56DE\u62E8\u673A\u5236 Clawback"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, ipo.clawback.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none',
      background: c.active ? 'var(--surface-honey)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, c.active && /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 13,
    color: "var(--honey-700)"
  }), "\u516C\u5F00\u8BA4\u8D2D ", c.trigger), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    color: c.active ? 'var(--honey-700)' : 'var(--text-primary)'
  }, "\u516C\u5F00\u5360 ", c.publicPct), c.active && /*#__PURE__*/React.createElement(MBadge, {
    tone: "honey",
    size: "sm"
  }, "\u5DF2\u89E6\u53D1")))))));
}

/* ---------- Allotment result ---------- */
function Allotment({
  ipo
}) {
  if (!ipo.allotment) {
    const pending = ipo.stage === 'subscribing' || ipo.stage === 'processing';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: pending ? 'clock' : 'minus-circle',
      size: 18,
      color: "var(--text-muted)"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-body)'
      }
    }, pending ? '分配结果尚未公布 — 招股 / 处理中，结果公布后将显示一手中签率、回拨比例与各档中签率。' : '本次未产生分配结果（介绍上市 / 已撤回）。'));
  }
  const a = ipo.allotment;
  const kpis = [['一手中签率 One-lot', `${a.oneLotRate}%`, a.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)', false], ['有效申请 Valid Apps', a.validApps, 'var(--text-primary)', false], ['顶头槌 Max Lots', a.headHammer, 'var(--text-primary)', true], ['回拨 Clawback', a.clawbackApplied, 'var(--text-primary)', false]];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginBottom: 16
    }
  }, kpis.map(([k, v, c, gated]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      padding: '12px 14px',
      background: 'var(--surface-muted)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 5
    }
  }, k), gated ? /*#__PURE__*/React.createElement(LockedValue, null, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-lg)",
    color: c
  }, v)) : /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-lg)",
    color: c
  }, v)))), /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "\u5404\u6863\u4E2D\u7B7E\u7387 Allotment by Tier"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr 1.6fr',
      gap: 0,
      padding: '8px 14px',
      background: 'var(--surface-muted)'
    }
  }, ['申请手数', '申请人数', '中签率 Rate'].map(h => /*#__PURE__*/React.createElement(Eyebrow, {
    key: h
  }, h))), a.result.map((r, i) => {
    const rate = parseInt(r.rate);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr 1.6fr',
        gap: 0,
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Mono, null, r.lots, " \u624B"), /*#__PURE__*/React.createElement(LockedValue, null, /*#__PURE__*/React.createElement(Mono, {
      color: "var(--text-body)",
      weight: 600
    }, r.applied)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 6,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-muted)',
        overflow: 'hidden',
        maxWidth: 90
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: rate + '%',
        height: '100%',
        background: rate >= 100 ? 'var(--green-500)' : 'var(--honey-500)',
        borderRadius: 'var(--radius-pill)'
      }
    })), /*#__PURE__*/React.createElement(Mono, {
      color: rate >= 100 ? 'var(--green-600)' : 'var(--honey-700)'
    }, r.rate)));
  })));
}

/* ---------- Cornerstones ---------- */
function Cornerstones({
  ipo
}) {
  if (!ipo.cornerstones || !ipo.cornerstones.length) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user-x",
      size: 16
    }), " \u8BE5 IPO \u672A\u5F15\u5165\u57FA\u77F3\u6295\u8D44\u8005\uFF0C\u9700\u6C42\u652F\u6491\u8F83\u5F31\u3002");
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, ipo.cornerstones.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, "\u7981\u552E Lock-up ", c.lockup)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(LockedValue, {
    tier: "enterprise"
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)"
  }, c.amount)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, c.pct, "% of offer")))));
}

/* ---------- Lockup ---------- */
function Lockup({
  ipo
}) {
  if (!ipo.lockup || !ipo.lockup.length) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)'
      }
    }, "\u65E0\u9002\u7528\u7981\u552E\u671F\u4FE1\u606F\u3002");
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, ipo.lockup.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 15,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, l.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, "\u89E3\u7981 Unlock \xB7 ", l.endDate))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)"
  }, l.pct), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, l.shares)))));
}

/* ---------- Bottom tabs ---------- */
function ProfileTabs({
  ipo
}) {
  const [tab, setTab] = React.useState('overview');
  const p = ipo.profile;
  const tabs = [['overview', '业务概览', 'Overview'], ['proceeds', '所得款用途', 'Use of Proceeds'], ['risks', '风险因素', 'Risks'], ['advantages', '竞争优势', 'Advantages'], ['company', '公司资料', 'Company'], ['tiers', '申请档位', 'App Tiers']];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-subtle)',
      flexWrap: 'wrap'
    }
  }, tabs.map(([k, cn, en]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      padding: '12px 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: tab === k ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: '2px solid ' + (tab === k ? 'var(--honey-500)' : 'transparent'),
      marginBottom: -1
    }
  }, cn, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      fontWeight: 500
    }
  }, en)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 4px 4px'
    }
  }, tab === 'overview' && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-base)',
      lineHeight: 1.75,
      color: 'var(--text-body)',
      maxWidth: 760
    }
  }, p.overview), tab === 'proceeds' && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, p.useOfProceeds.map((u, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 5,
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      fontWeight: 500
    }
  }, u.label), /*#__PURE__*/React.createElement(Mono, null, u.pct, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: u.pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: `var(--chart-${i % 6 + 1})`
    }
  }))))), tab === 'risks' && /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 760
    }
  }, p.risks.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 10,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 16,
    color: "var(--orange-500)",
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }), r))), tab === 'advantages' && /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 760
    }
  }, p.advantages.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 10,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 16,
    color: "var(--green-600)",
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }), r))), tab === 'company' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 0,
      maxWidth: 620,
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, p.company.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, c.k), /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)",
    color: "var(--text-body)"
  }, c.v)))), tab === 'tiers' && (ipo.applicationTiers ? /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 620,
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
      padding: '8px 14px',
      background: 'var(--surface-muted)'
    }
  }, ['手数 Lots', '股数 Shares', '入场金额 HK$', ipo.allotment ? '中签率' : ''].map((h, i) => /*#__PURE__*/React.createElement(Eyebrow, {
    key: i
  }, h))), ipo.applicationTiers.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
      padding: '10px 14px',
      borderTop: '1px solid var(--border-subtle)',
      alignItems: 'center',
      background: t.hot ? 'var(--surface-honey)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Mono, null, t.lots), t.hot && /*#__PURE__*/React.createElement(MBadge, {
    tone: "honey",
    size: "sm"
  }, "\u6700\u70ED")), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--text-body)"
  }, t.shares.toLocaleString()), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--text-body)"
  }, t.amount.toLocaleString()), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--honey-700)"
  }, t.rate || '—')))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px',
      background: 'var(--surface-muted)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      maxWidth: 620
    }
  }, "\u7533\u8BF7\u6863\u4F4D\u5C06\u5728\u62DB\u80A1\u542F\u52A8\u540E\u516C\u5E03\u3002"))));
}

/* ---------- Narrative section (sanitized prose) ---------- */
function NarrativeSection({
  title,
  en,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement(Eyebrow, null, en)), children);
}

/* ---------- Use of proceeds ---------- */
function Proceeds({
  ipo
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, ipo.profile.useOfProceeds.map((u, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 5,
      fontSize: 'var(--text-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      fontWeight: 500
    }
  }, u.label), /*#__PURE__*/React.createElement(Mono, null, u.pct, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: u.pct + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: `var(--chart-${i % 6 + 1})`
    }
  })))));
}

/* ---------- Company info table ---------- */
function CompanyTable({
  ipo
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 0,
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, ipo.profile.company.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, c.k), /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)",
    color: "var(--text-body)"
  }, c.v))));
}

/* ---------- Application tiers ---------- */
function AppTiers({
  ipo
}) {
  if (!ipo.applicationTiers) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px',
      background: 'var(--surface-muted)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u7533\u8BF7\u6863\u4F4D\u5C06\u5728\u62DB\u80A1\u542F\u52A8\u540E\u516C\u5E03\u3002");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
      padding: '8px 14px',
      background: 'var(--surface-muted)'
    }
  }, ['手数 Lots', '股数 Shares', '入场金额 HK$', ipo.allotment ? '中签率' : ''].map((h, i) => /*#__PURE__*/React.createElement(Eyebrow, {
    key: i
  }, h))), ipo.applicationTiers.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
      padding: '10px 14px',
      borderTop: '1px solid var(--border-subtle)',
      alignItems: 'center',
      background: t.hot ? 'var(--surface-honey)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Mono, null, t.lots), t.hot && /*#__PURE__*/React.createElement(MBadge, {
    tone: "honey",
    size: "sm"
  }, "\u6700\u70ED")), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--text-body)"
  }, t.shares.toLocaleString()), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--text-body)"
  }, t.amount.toLocaleString()), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--honey-700)"
  }, t.rate || '—'))));
}
Object.assign(window, {
  Timeline,
  TermsGrid,
  PoolClawback,
  Allotment,
  Cornerstones,
  Lockup,
  ProfileTabs,
  NarrativeSection,
  Proceeds,
  CompanyTable,
  AppTiers
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/detail-parts.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/detail.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — Detail 分 Tab 工作台
   顶栏(持续) + 8 Tab：概览/时间表/发售详情/认购回拨/配售结果/基石/公司资料/解禁
   事实层(provenance=netquity) 与分析层(aiphabee_research, 描述性非建议) 分离
   ============================================================ */
const _DDS = window.AiphaBeeDesignSystem_599c13;
const {
  Badge: DBadge,
  Button: DBtn,
  RatingStars: DStars,
  BeeNote: DBeeNote
} = _DDS;
function TopKpi({
  label,
  value,
  sub,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-lg)",
    color: tone || 'var(--text-primary)'
  }, value)), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginTop: 1
    }
  }, sub));
}
function RiskRow({
  r
}) {
  const cfg = {
    high: ['var(--red-500)', 'var(--red-50)', '高 High'],
    mid: ['var(--orange-500)', 'rgba(245,158,11,0.1)', '中 Mid'],
    low: ['var(--green-600)', 'var(--green-50)', '低 Low']
  }[r.level];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '10px 0',
      borderTop: '1px solid var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      alignSelf: 'flex-start',
      marginTop: 1,
      padding: '1px 8px',
      borderRadius: 'var(--radius-pill)',
      background: cfg[1],
      color: cfg[0],
      fontSize: 'var(--text-2xs)',
      fontWeight: 700
    }
  }, cfg[2]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, r.text));
}
function Panel({
  icon,
  title,
  en,
  right,
  children,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '14px 18px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15,
    color: accent || 'var(--honey-700)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, title), en && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)'
    }
  }, en), right && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, right)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px'
    }
  }, children));
}

/* provenance tag — distinguishes vendor fact vs AiphaBee analysis */
function Provenance({
  source = 'vendor',
  methodology
}) {
  const vendor = source === 'vendor';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      background: vendor ? 'var(--green-50)' : 'var(--violet-50)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 600,
      color: vendor ? 'var(--green-700)' : 'var(--violet-600)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: vendor ? 'database' : 'sparkles',
    size: 11
  }), vendor ? `provenance · ${VENDOR_PROVENANCE}` : `${RESEARCH_SOURCE} · ${methodology}`);
}
const DETAIL_TABS = [['overview', '概览', 'Overview'], ['timetable', '时间表', 'Timetable'], ['offering', '发售详情', 'Offering'], ['pool', '认购与回拨', 'Pool & Clawback'], ['allotment', '配售结果', 'Allotment'], ['cornerstone', '基石', 'Cornerstone'], ['corporate', '公司资料', 'Corporate'], ['lockup', '解禁', 'Lock-up']];
function DetailView({
  ipo,
  go,
  openIpo,
  compareIds,
  toggleCompare
}) {
  useLucide();
  const [tab, setTab] = React.useState('overview');
  React.useEffect(() => {
    setTab('overview');
  }, [ipo.id]);
  const st = STAGE_BY[ipo.stage];
  const stToneMap = {
    honey: 'honey',
    bullish: 'bullish',
    info: 'info',
    bearish: 'bearish',
    neutral: 'neutral'
  };
  const rec = REC_CFG[ipo.recommendation];
  const t = ipo.terms,
    live = ipo.live;
  const isAllot = ipo.stage === 'allotted';
  const inCompare = compareIds.includes(ipo.id);
  const p = ipo.profile;
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '20px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('pipeline'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " \u8FD4\u56DE Pipeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: '22px 24px',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 800,
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-lg)',
      color: 'var(--text-muted)'
    }
  }, ipo.cn), /*#__PURE__*/React.createElement(DBadge, {
    tone: stToneMap[st.tone],
    variant: "solid",
    dot: true,
    dotShape: "hex"
  }, st.label, " ", st.en)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)",
    color: "var(--text-body)"
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, ipo.board), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement(DBadge, {
    tone: "navy",
    variant: "outline",
    size: "sm"
  }, LISTING_TYPE[ipo.listingType]), /*#__PURE__*/React.createElement(DBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    size: "sm",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(EvidenceChip, {
    ev: ipo.evidence
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(DBtn, {
    size: "sm",
    variant: inCompare ? 'secondary' : 'outline',
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: inCompare ? 'check' : 'git-compare',
      size: 15
    }),
    onClick: () => toggleCompare(ipo.id)
  }, inCompare ? '已加入对比' : '加入对比'), /*#__PURE__*/React.createElement(DBtn, {
    size: "sm",
    variant: "ai",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 15
    })
  }, "\u95EE\u95EE\u5DE5\u8702")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 18,
      paddingTop: 18,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(TopKpi, {
    label: "\u62DB\u80A1\u4EF7 Offer",
    value: offerText(t),
    sub: t.finalPrice ? '最终定价' : t.priceLow ? '区间' : ''
  }), /*#__PURE__*/React.createElement(TopKpi, {
    label: "\u5165\u573A\u8D39 Entry",
    value: t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—',
    sub: `每手 ${t.lotSize.toLocaleString()} 股`
  }), /*#__PURE__*/React.createElement(TopKpi, {
    label: "\u62DB\u80A1\u671F Period",
    value: ipo.subPeriod.start,
    sub: `至 ${ipo.subPeriod.end}`
  }), /*#__PURE__*/React.createElement(TopKpi, {
    label: "\u4E0A\u5E02\u65E5 Listing",
    value: ipo.listingDate.replace(', 2026', '')
  }), /*#__PURE__*/React.createElement(TopKpi, {
    label: isAllot ? '一手中签率' : '公开认购 Sub',
    value: isAllot ? `${live.oneLotRate}%` : live.subPublic != null ? `${live.subPublic}×` : '—',
    tone: isAllot ? live.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)' : demandTone(live.subPublic),
    sub: isAllot ? `回拨 ${live.clawbackApplied}` : live.subPublic != null ? '实时 Live' : ''
  }), /*#__PURE__*/React.createElement(TopKpi, {
    label: "\u7814\u7A76\u8BC4\u5206 Score",
    value: `${ipo.score}`,
    tone: "var(--honey-700)",
    sub: `置信度 ${ipo.confidence}%`
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: 22,
      overflowX: 'auto'
    }
  }, DETAIL_TABS.map(([k, cn, en]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      padding: '12px 16px',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: tab === k ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: '2px solid ' + (tab === k ? 'var(--honey-500)' : 'transparent'),
      marginBottom: -1
    }
  }, cn, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      fontWeight: 500
    }
  }, en)))), tab === 'overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.55fr) minmax(290px, 1fr)',
      gap: 22,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    icon: "building-2",
    title: "\u4E1A\u52A1\u6982\u89C8",
    en: "Business",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-base)',
      lineHeight: 1.75,
      color: 'var(--text-body)'
    }
  }, p.overview)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    icon: "trophy",
    title: "\u7ADE\u4E89\u4F18\u52BF",
    en: "Advantages",
    accent: "var(--green-600)"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, p.advantages.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 9,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.55,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 15,
    color: "var(--green-600)",
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }), r)))), /*#__PURE__*/React.createElement(Panel, {
    icon: "alert-triangle",
    title: "\u98CE\u9669\u56E0\u7D20",
    en: "Risks",
    accent: "var(--orange-500)"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, p.risks.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 9,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.55,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 15,
    color: "var(--orange-500)",
    style: {
      flexShrink: 0,
      marginTop: 2
    }
  }), r))))), /*#__PURE__*/React.createElement(Panel, {
    icon: "pie-chart",
    title: "\u6240\u5F97\u6B3E\u9879\u7528\u9014",
    en: "Use of Proceeds",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(Proceeds, {
    ipo: ipo
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      position: 'sticky',
      top: 80
    }
  }, /*#__PURE__*/React.createElement(DBeeNote, {
    basePath: MASCOT_BP,
    pose: ipo.recommendation === 'avoid' ? 'risk' : ipo.recommendation === 'strong_buy' ? 'success' : 'insight',
    tone: "navy",
    title: "AiphaBee \u7814\u7A76\u4FE1\u53F7",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(DBadge, {
      tone: rec.tone,
      variant: "solid",
      size: "sm"
    }, rec.label), /*#__PURE__*/React.createElement(DBadge, {
      tone: "navy",
      variant: "outline",
      size: "sm"
    }, "\u7F6E\u4FE1\u5EA6 ", ipo.confidence, "%"))
  }, ipo.aiNote), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      padding: '11px 14px',
      background: 'var(--surface-muted)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 15,
    color: "var(--text-muted)",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      lineHeight: 1.55,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text-body)'
    }
  }, "\u7814\u7A76\u4FE1\u53F7 \xB7 \u975E\u6295\u8D44\u5EFA\u8BAE"), " Research signal, not advice. \u63CF\u8FF0\u6027\u4FE1\u53F7\u7531 AiphaBee \u6A21\u578B\u57FA\u4E8E\u5DF2\u62AB\u9732\u4E8B\u5B9E\u751F\u6210\uFF0C\u4E0D\u6784\u6210\u4E70\u5356\u6216\u6301\u6709\u5EFA\u8BAE\u3002", /*#__PURE__*/React.createElement(Provenance, {
    source: "research",
    methodology: ipo.evidence.methodology
  }))), /*#__PURE__*/React.createElement(Panel, {
    icon: "shield-alert",
    title: "\u98CE\u9669\u6458\u8981",
    en: "Risk",
    accent: "var(--red-500)"
  }, ipo.riskSummary.map((r, i) => /*#__PURE__*/React.createElement(RiskRow, {
    key: i,
    r: r
  }))))), tab === 'timetable' && /*#__PURE__*/React.createElement(Panel, {
    icon: "route",
    title: "\u65F6\u95F4\u8868",
    en: "Timetable",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement(Timeline, {
    events: ipo.timetable
  })), tab === 'offering' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    icon: "file-text",
    title: "\u53D1\u884C\u6761\u6B3E",
    en: "Offer Terms",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement(TermsGrid, {
    ipo: ipo
  })), /*#__PURE__*/React.createElement(Panel, {
    icon: "list-ordered",
    title: "\u7533\u8BF7\u6863\u4F4D",
    en: "Application Tiers"
  }, /*#__PURE__*/React.createElement(AppTiers, {
    ipo: ipo
  }))), tab === 'pool' && /*#__PURE__*/React.createElement(Panel, {
    icon: "layers",
    title: "\u516C\u5F00\u53D1\u552E Pool \u4E0E\u56DE\u62E8",
    en: "Pool & Clawback",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement(PoolClawback, {
    ipo: ipo
  })), tab === 'allotment' && /*#__PURE__*/React.createElement(Panel, {
    icon: "check-check",
    title: "\u914D\u552E\u7ED3\u679C",
    en: "Allotment Result",
    right: isAllot ? /*#__PURE__*/React.createElement(DBadge, {
      tone: "bullish",
      size: "sm"
    }, "\u5DF2\u516C\u5E03") : /*#__PURE__*/React.createElement(DBadge, {
      tone: "neutral",
      size: "sm"
    }, "\u5F85\u516C\u5E03")
  }, /*#__PURE__*/React.createElement(Allotment, {
    ipo: ipo
  })), tab === 'cornerstone' && /*#__PURE__*/React.createElement(Panel, {
    icon: "gem",
    title: "\u57FA\u77F3\u6295\u8D44\u8005",
    en: "Cornerstone",
    right: ipo.cornerstones && ipo.cornerstones.length ? /*#__PURE__*/React.createElement(DBadge, {
      tone: "neutral",
      size: "sm"
    }, "\u654F\u611F\u5B57\u6BB5 \xB7 \u91D1\u989D\u53D7\u6743\u9650\u4FDD\u62A4") : null
  }, /*#__PURE__*/React.createElement(Cornerstones, {
    ipo: ipo
  })), tab === 'corporate' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 22,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    icon: "building",
    title: "\u516C\u53F8\u8D44\u6599",
    en: "Company Info"
  }, /*#__PURE__*/React.createElement(CompanyTable, {
    ipo: ipo
  })), /*#__PURE__*/React.createElement(Panel, {
    icon: "users",
    title: "\u4FDD\u8350\u4EBA / \u4E3B\u8981\u53C2\u4E0E\u65B9",
    en: "Parties"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, ipo.sponsors.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 0',
      borderTop: i ? '1px solid var(--surface-muted)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, s.role)), /*#__PURE__*/React.createElement(DStars, {
    value: s.rating,
    size: 14
  })))))), tab === 'lockup' && /*#__PURE__*/React.createElement(Panel, {
    icon: "lock",
    title: "\u7981\u552E\u671F",
    en: "Lock-up",
    right: /*#__PURE__*/React.createElement(Provenance, {
      source: "vendor"
    })
  }, /*#__PURE__*/React.createElement(Lockup, {
    ipo: ipo
  })));
}
Object.assign(window, {
  DetailView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/detail.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/pipeline.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — Pipeline 首页
   IPO 生命周期看板：处理中 · 招股中 · 暗盘/上市 · 已分配 · 撤回
   ============================================================ */
const _PDS = window.AiphaBeeDesignSystem_599c13;
const {
  Badge: PBadge,
  Button: PBtn
} = _PDS;

/* offer price range / final */
function offerText(t) {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh) return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return '待定';
}
function StageRail({
  active,
  setActive
}) {
  const counts = Object.fromEntries(STAGES.map(s => [s.key, IPOS.filter(i => i.stage === s.key).length]));
  const cell = (key, label, en, count, icon, tone) => {
    const on = active === key;
    const toneColor = {
      honey: 'var(--honey-600)',
      bullish: 'var(--green-600)',
      info: 'var(--blue-500)',
      bearish: 'var(--red-500)',
      neutral: 'var(--neutral-500)'
    }[tone];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => setActive(on && key !== 'all' ? 'all' : key),
      style: {
        flex: 1,
        textAlign: 'left',
        cursor: 'pointer',
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid ' + (on ? 'var(--honey-500)' : 'var(--border-subtle)'),
        background: on ? 'var(--surface-honey)' : 'var(--surface-card)',
        boxShadow: on ? 'var(--shadow-sm)' : 'none',
        transition: 'all var(--duration-fast) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 15,
      color: toneColor
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        color: 'var(--text-primary)'
      }
    }, label)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, null, en), /*#__PURE__*/React.createElement(Mono, {
      size: "var(--text-2xl)",
      weight: 800,
      color: on ? 'var(--honey-700)' : 'var(--text-primary)'
    }, count)));
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 22,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setActive('all'),
    style: {
      cursor: 'pointer',
      padding: '14px 18px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid ' + (active === 'all' ? 'var(--ink-800)' : 'var(--border-subtle)'),
      background: active === 'all' ? 'var(--ink-800)' : 'var(--surface-card)',
      minWidth: 120
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      color: active === 'all' ? 'rgba(255,255,255,0.6)' : undefined
    }
  }, "All Pipeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-2xl)",
    weight: 800,
    color: active === 'all' ? '#fff' : 'var(--text-primary)'
  }, IPOS.length), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: active === 'all' ? 'rgba(255,255,255,0.6)' : 'var(--text-subtle)'
    }
  }, "\u4E2A\u6807\u7684"))), STAGES.map(s => cell(s.key, s.label, s.en, IPOS.filter(i => i.stage === s.key).length, s.icon, s.tone)));
}
function FilterBar({
  sector,
  setSector,
  sort,
  setSort,
  q,
  setQ
}) {
  const sectors = [['all', '全部行业'], ...Object.entries(SECTOR_LABEL)];
  const select = (val, set, opts) => /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: val,
    onChange: e => set(e.target.value),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: 'pointer',
      padding: '8px 30px 8px 12px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      font: 'inherit',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, opts.map(([v, l]) => /*#__PURE__*/React.createElement("option", {
    key: v,
    value: v
  }, l))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14,
    style: {
      position: 'absolute',
      right: 10,
      pointerEvents: 'none',
      color: 'var(--text-subtle)'
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: '1 1 240px',
      minWidth: 200,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16,
    style: {
      position: 'absolute',
      left: 12,
      color: 'var(--text-subtle)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u641C\u7D22\u516C\u53F8 / \u4EE3\u7801 Search ticker or name",
    style: {
      width: '100%',
      padding: '9px 12px 9px 34px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      font: 'inherit',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  })), select(sector, setSector, sectors), select(sort, setSort, [['sub', '按认购倍数 Subscription'], ['score', '按综合评分 Score'], ['date', '按上市日 Date'], ['raise', '按集资额 Raise']]));
}

/* dense IPO row */
function IpoRow({
  ipo,
  openIpo,
  inCompare,
  toggleCompare
}) {
  const st = STAGE_BY[ipo.stage];
  const stToneMap = {
    honey: 'honey',
    bullish: 'bullish',
    info: 'info',
    bearish: 'bearish',
    neutral: 'neutral'
  };
  const t = ipo.terms,
    live = ipo.live;
  const isAllot = ipo.stage === 'allotted';
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => openIpo(ipo),
    style: {
      display: 'grid',
      gridTemplateColumns: '2.4fr 1fr 1fr 1fr 1.1fr 0.7fr 40px',
      gap: 14,
      alignItems: 'center',
      padding: '14px 18px',
      cursor: 'pointer',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background var(--duration-fast)'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-honey)',
    onMouseLeave: e => e.currentTarget.style.background = 'var(--surface-card)'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, ipo.cn), /*#__PURE__*/React.createElement(PBadge, {
    tone: stToneMap[st.tone],
    size: "sm",
    dot: true,
    dotShape: "hex"
  }, st.label), ipo.listingType !== 'normal' && /*#__PURE__*/React.createElement(PBadge, {
    tone: "navy",
    variant: "outline",
    size: "sm"
  }, LISTING_TYPE[ipo.listingType].split(' ')[0])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-xs)",
    color: "var(--text-body)"
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Offer \xB7 \u5165\u573A\u8D39"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Mono, null, offerText(t))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      fontFamily: 'var(--font-mono)'
    }
  }, t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Listing \u4E0A\u5E02\u65E5"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, ipo.listingDate.replace(', 2026', '')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, t.raiseHKD !== '不适用（无新股发行）' ? `集资 ${t.raiseHKD}` : '介绍上市')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, isAllot ? '一手中签率' : '公开认购'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, isAllot ? /*#__PURE__*/React.createElement(Mono, {
    color: live.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)'
  }, live.oneLotRate, "%") : /*#__PURE__*/React.createElement(SubPill, {
    x: live.subPublic
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, isAllot ? `回拨 ${live.clawbackApplied}` : live.subPublic != null ? '国际 ' + (live.subIntl ?? '—') + '×' : '—')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "\u60C5\u7EEA \xB7 \u8BC4\u5206"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    size: "sm",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment].split(' ')[0]), /*#__PURE__*/React.createElement(Mono, {
    color: "var(--honey-700)"
  }, ipo.score))), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      toggleCompare(ipo.id);
    },
    title: "\u52A0\u5165\u5BF9\u6BD4",
    style: {
      justifySelf: 'center',
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      border: '1px solid ' + (inCompare ? 'var(--violet-500)' : 'var(--border-default)'),
      background: inCompare ? 'var(--violet-50)' : 'var(--surface-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: inCompare ? 'check' : 'git-compare',
    size: 15,
    color: inCompare ? 'var(--violet-600)' : 'var(--text-subtle)'
  })), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18,
    style: {
      justifySelf: 'end',
      color: 'var(--text-subtle)'
    }
  }));
}
function PipelineView({
  openIpo,
  compareIds,
  toggleCompare,
  go
}) {
  useLucide();
  const [stage, setStage] = React.useState('all');
  const [sector, setSector] = React.useState('all');
  const [sort, setSort] = React.useState('sub');
  const [q, setQ] = React.useState('');
  let rows = IPOS.filter(i => (stage === 'all' || i.stage === stage) && (sector === 'all' || i.sector === sector) && (!q || (i.name + i.cn + i.ticker).toLowerCase().includes(q.toLowerCase())));
  rows = rows.slice().sort((a, b) => {
    if (sort === 'sub') return (b.live.subPublic ?? -1) - (a.live.subPublic ?? -1);
    if (sort === 'score') return b.score - a.score;
    if (sort === 'raise') return parseFloat(b.terms.raiseHKD) - parseFloat(a.terms.raiseHKD) || 0;
    return 0;
  });
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '32px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 8
    }
  }, "\u6E2F\u80A1 IPO \xB7 HKEX Research Pipeline"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 800,
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO \u7814\u7A76\u5DE5\u4F5C\u53F0"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)',
      maxWidth: 560,
      lineHeight: 1.6
    }
  }, "\u6309 IPO \u751F\u547D\u5468\u671F\u8FFD\u8E2A\u62DB\u80A1\u3001\u6697\u76D8\u3001\u5206\u914D\u4E0E\u7981\u552E\uFF1B\u6240\u6709\u6570\u5B57\u5747\u5E26 ", /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-xs)",
    color: "var(--text-body)"
  }, "as_of"), " \u4E0E\u6570\u636E\u7248\u672C\u3002")), /*#__PURE__*/React.createElement(PBtn, {
    variant: "ai",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "git-compare",
      size: 16
    }),
    onClick: () => go('compare')
  }, "\u6A2A\u5411\u6BD4\u8F83 ", compareIds.length, "/5")), /*#__PURE__*/React.createElement(StageRail, {
    active: stage,
    setActive: setStage
  }), /*#__PURE__*/React.createElement(FilterBar, {
    sector: sector,
    setSector: setSector,
    sort: sort,
    setSort: setSort,
    q: q,
    setQ: setQ
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u5171 ", /*#__PURE__*/React.createElement(Mono, {
    size: "var(--text-sm)"
  }, rows.length), " \u4E2A\u6807\u7684", stage !== 'all' ? ` · ${STAGE_BY[stage].label}` : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-subtle)'
    }
  }, "\u70B9\u51FB\u884C\u67E5\u770B\u7814\u7A76\u5DE5\u4F5C\u53F0 \xB7 ", /*#__PURE__*/React.createElement(Icon, {
    name: "git-compare",
    size: 12
  }), " \u52A0\u5165\u5BF9\u6BD4")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }
  }, rows.length ? rows.map(ipo => /*#__PURE__*/React.createElement(IpoRow, {
    key: ipo.id,
    ipo: ipo,
    openIpo: openIpo,
    inCompare: compareIds.includes(ipo.id),
    toggleCompare: toggleCompare
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search-x",
    size: 28,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      fontSize: 'var(--text-sm)'
    }
  }, "\u8BE5\u7B5B\u9009\u4E0B\u6682\u65E0\u6807\u7684\uFF0C\u6362\u4E2A\u6761\u4EF6\u8BD5\u8BD5\u3002"))));
}
Object.assign(window, {
  PipelineView,
  offerText
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/pipeline.jsx", error: String((e && e.message) || e) }); }

// apps/ipo-workbench/shell.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO 研究工作台 — app shell + shared atoms
   ============================================================ */
const DS = window.AiphaBeeDesignSystem_599c13;
const {
  Button,
  Badge
} = DS;

/* ---------- Lucide icon helper ---------- */
function Icon({
  name,
  size = 18,
  color,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "luc",
    style: {
      display: 'inline-flex',
      lineHeight: 0,
      color,
      '--ic-size': size + 'px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": name
  }));
}
function useLucide() {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

/* ---------- Evidence / data-version chip (recurring) ---------- */
function EvidenceChip({
  ev,
  compact
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    onBlur: () => setTimeout(() => setOpen(false), 120),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      padding: compact ? '3px 8px' : '5px 10px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 12,
    color: "var(--green-600)"
  }), "as of ", ev.asOf.split(' ').slice(0, 3).join(' '), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 11
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 6,
      zIndex: 'var(--z-dropdown)',
      width: 280,
      padding: 14,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      marginBottom: 10
    }
  }, "\u8BC1\u636E\u4E0E\u6570\u636E\u7248\u672C Evidence"), [['as_of', ev.asOf], ['data_version', ev.dataVersion], ['methodology', ev.methodology], ['source', ev.source]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      padding: '5px 0',
      borderTop: '1px solid var(--surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-body)',
      textAlign: 'right',
      fontWeight: 600
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      lineHeight: 1.5
    }
  }, "\u6240\u6709\u6570\u5B57\u5747\u5E26\u6765\u6E90\u4E0E\u7248\u672C\uFF0Cdefault-deny\uFF1B\u672A\u6388\u6743\u5B57\u6BB5\u4E0D\u5C55\u793A\u3002")));
}

/* ---------- Module card with header (left-column workbench blocks) ---------- */
function Module({
  icon,
  title,
  en,
  right,
  children,
  pad = true,
  id
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: id,
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 0
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-honey)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    color: "var(--honey-700)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--text-primary)',
      lineHeight: 1.2
    }
  }, title), en && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      marginTop: 2
    }
  }, en))), right), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad ? '18px 20px' : 0
    }
  }, children));
}

/* small uppercase eyebrow */
function Eyebrow({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-caps)',
      color: 'var(--text-subtle)',
      fontWeight: 600,
      ...style
    }
  }, children);
}

/* mono stat */
function Mono({
  children,
  size = 'var(--text-sm)',
  color = 'var(--text-primary)',
  weight = 700
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: size,
      fontWeight: weight,
      color,
      fontVariantNumeric: 'tabular-nums'
    }
  }, children);
}

/* sub-multiple pill colored by demand */
function SubPill({
  x,
  suffix = '×',
  label
}) {
  if (x == null) return /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)'
    }
  }, "\u2014");
  const tone = demandTone(x);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    color: tone,
    weight: 700
  }, x.toLocaleString(), suffix), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, label));
}
const SHELL = {
  maxWidth: 'var(--container-max)',
  margin: '0 auto',
  width: '100%'
};

/* ---------- Plan context (field authorization / default-deny demo) ---------- */
const PlanCtx = React.createContext({
  plan: 'free',
  setPlan: () => {}
});
const VENDOR_PROVENANCE = 'netquity_hk_ipo';
const RESEARCH_SOURCE = 'aiphabee_research';

/* Gated value — sensitive vendor field, blocked unless plan authorizes. */
function LockedValue({
  children,
  tier = 'premium',
  inline
}) {
  const {
    plan,
    setPlan
  } = React.useContext(PlanCtx);
  const ok = plan === 'premium';
  if (ok) return /*#__PURE__*/React.createElement(React.Fragment, null, children);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlan('premium'),
    title: `${tier} 解锁`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      cursor: 'pointer',
      padding: inline ? '1px 7px' : '3px 9px',
      borderRadius: 'var(--radius-pill)',
      border: '1px dashed var(--violet-500)',
      background: 'var(--violet-50)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 700,
      color: 'var(--violet-600)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 11,
    color: "var(--violet-600)"
  }), " ", tier === 'enterprise' ? 'Enterprise' : 'Premium', " \u89E3\u9501");
}

/* ---------- Top navigation ---------- */
function NavBar({
  view,
  go,
  compareCount,
  plan,
  setPlan
}) {
  const link = (v, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(v),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: view === v ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
      padding: '4px 2px'
    }
  }, label);
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '0 24px',
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('pipeline'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "AiphaBee",
    style: {
      height: 38,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 700,
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO\xA0Workbench")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, link('pipeline', 'Pipeline'), link('calendar', 'Calendar'), link('compare', 'Compare'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlan(plan === 'premium' ? 'free' : 'premium'),
    title: "\u5207\u6362\u6743\u9650\u7B49\u7EA7\uFF08\u6F14\u793A\u5B57\u6BB5\u9ED8\u8BA4\u62D2\u7EDD\uFF09",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      padding: '5px 11px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + (plan === 'premium' ? 'var(--violet-500)' : 'var(--border-default)'),
      background: plan === 'premium' ? 'var(--violet-50)' : 'var(--surface-card)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      color: plan === 'premium' ? 'var(--violet-600)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: plan === 'premium' ? 'unlock' : 'lock',
    size: 13
  }), " ", plan === 'premium' ? 'Premium' : 'Free', " plan"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ai",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "git-compare",
      size: 15
    }),
    onClick: () => go('compare')
  }, "\u5BF9\u6BD4\u6E05\u5355"), compareCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 18,
      height: 18,
      padding: '0 4px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--honey-500)',
      color: 'var(--ink-800)',
      fontSize: 10,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)'
    }
  }, compareCount)))));
}

/* ---------- Root app ---------- */
function App() {
  const [view, setView] = React.useState('pipeline');
  const [selected, setSelected] = React.useState(IPOS[0]);
  const [compareIds, setCompareIds] = React.useState(['honeycomb', 'lotus', 'apex']);
  const [plan, setPlan] = React.useState('free');
  useLucide();
  const go = v => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const openIpo = ipo => {
    setSelected(ipo);
    go('detail');
  };
  const toggleCompare = id => setCompareIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 5 ? ids : [...ids, id]);
  return /*#__PURE__*/React.createElement(PlanCtx.Provider, {
    value: {
      plan,
      setPlan
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--surface-page)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(NavBar, {
    view: view,
    go: go,
    compareCount: compareIds.length,
    plan: plan,
    setPlan: setPlan
  }), view === 'pipeline' && /*#__PURE__*/React.createElement(PipelineView, {
    openIpo: openIpo,
    compareIds: compareIds,
    toggleCompare: toggleCompare,
    go: go
  }), view === 'calendar' && /*#__PURE__*/React.createElement(CalendarView, {
    openIpo: openIpo,
    go: go
  }), view === 'detail' && /*#__PURE__*/React.createElement(DetailView, {
    ipo: selected,
    go: go,
    openIpo: openIpo,
    compareIds: compareIds,
    toggleCompare: toggleCompare
  }), view === 'compare' && /*#__PURE__*/React.createElement(CompareView, {
    compareIds: compareIds,
    setCompareIds: setCompareIds,
    toggleCompare: toggleCompare,
    openIpo: openIpo,
    go: go
  })));
}
Object.assign(window, {
  Icon,
  useLucide,
  EvidenceChip,
  Module,
  Eyebrow,
  Mono,
  SubPill,
  SHELL,
  NavBar,
  App,
  PlanCtx,
  LockedValue,
  VENDOR_PROVENANCE,
  RESEARCH_SOURCE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "apps/ipo-workbench/shell.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Badge — the product's signal pill. Tones map to the
 * data-viz semantic tokens (sentiment, demand, status). `soft`
 * (tinted) by default; `solid` for emphasis, `outline` for quiet.
 */

const TONES = {
  honey: {
    c: 'var(--honey-700)',
    solid: 'var(--honey-500)',
    on: 'var(--ink-800)',
    soft: 'var(--honey-50)'
  },
  navy: {
    c: 'var(--ink-800)',
    solid: 'var(--ink-800)',
    on: 'var(--text-inverse)',
    soft: 'var(--neutral-100)'
  },
  neutral: {
    c: 'var(--neutral-600)',
    solid: 'var(--neutral-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--neutral-100)'
  },
  bullish: {
    c: 'var(--green-600)',
    solid: 'var(--green-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--green-50)'
  },
  bearish: {
    c: 'var(--red-600)',
    solid: 'var(--red-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--red-50)'
  },
  ai: {
    c: 'var(--violet-600)',
    solid: 'var(--violet-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--violet-50)'
  },
  info: {
    c: 'var(--blue-500)',
    solid: 'var(--blue-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--blue-50)'
  },
  warning: {
    c: '#b45309',
    solid: 'var(--orange-500)',
    on: 'var(--ink-800)',
    soft: '#fff7ed'
  }
};
const PAD = {
  sm: {
    padding: '2px 8px',
    fontSize: 'var(--text-2xs)'
  },
  md: {
    padding: '3px 10px',
    fontSize: 'var(--text-xs)'
  }
};
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  dot = false,
  dotShape = 'hex',
  icon,
  children,
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const p = PAD[size] || PAD.md;
  let look;
  if (variant === 'solid') {
    look = {
      background: t.solid,
      color: t.on,
      border: '1px solid transparent'
    };
  } else if (variant === 'outline') {
    look = {
      background: 'transparent',
      color: t.c,
      border: `1px solid ${t.c}`
    };
  } else {
    look = {
      background: t.soft,
      color: t.c,
      border: '1px solid transparent'
    };
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      ...p,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1.4,
      borderRadius: 'var(--radius-pill)',
      whiteSpace: 'nowrap',
      ...look,
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: dotShape === 'hex' ? 8 : 6,
      height: dotShape === 'hex' ? 9 : 6,
      borderRadius: dotShape === 'hex' ? 0 : '50%',
      clipPath: dotShape === 'hex' ? HEX_CLIP : 'none',
      flexShrink: 0,
      background: variant === 'solid' ? t.on : t.solid
    }
  }) : null, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Button — honey primary, navy ink, soft lift on hover.
 * Self-contained: styling references the design-system CSS variables.
 */

const SIZES = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 'var(--text-sm)',
    gap: 6
  },
  md: {
    height: 40,
    padding: '0 18px',
    fontSize: 'var(--text-sm)',
    gap: 8
  },
  lg: {
    height: 48,
    padding: '0 26px',
    fontSize: 'var(--text-base)',
    gap: 10
  }
};
function variantStyle(variant, hover) {
  switch (variant) {
    case 'secondary':
      return {
        background: hover ? 'var(--ink-700)' : 'var(--ink-800)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)'
      };
    case 'ghost':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid transparent'
      };
    case 'ai':
      return {
        background: hover ? 'var(--violet-600)' : 'var(--violet-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'danger':
      return {
        background: hover ? 'var(--red-600)' : 'var(--red-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'primary':
    default:
      return {
        background: hover ? 'var(--honey-600)' : 'var(--honey-500)',
        color: 'var(--text-on-honey)',
        border: '1px solid transparent',
        boxShadow: hover ? 'var(--shadow-honey)' : 'none'
      };
  }
}
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sz = SIZES[size] || SIZES.md;
  const v = variantStyle(variant, hover && !disabled);
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: sz.gap,
      height: sz.height,
      padding: sz.padding,
      fontFamily: 'var(--font-sans)',
      fontSize: sz.fontSize,
      fontWeight: 'var(--weight-semibold)',
      lineHeight: 1,
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
      transition: 'background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
      transform: hover && !disabled ? 'translateY(-1px)' : 'translateY(0)',
      ...v,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexShrink: 0
    }
  }, icon) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexShrink: 0
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Card — the workhorse surface. White, 12px radius, hairline
 * border, soft navy-tinted shadow. Sub-parts mirror the product's
 * ShadCN card (CardHeader / CardTitle / CardDescription / CardContent /
 * CardFooter). `interactive` adds a hover lift for clickable cards.
 */

function Card({
  interactive = false,
  padded = false,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      borderColor: hover ? 'var(--honey-300)' : 'var(--border-subtle)',
      transition: 'box-shadow var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard)',
      overflow: 'hidden',
      ...(padded ? {
        padding: 'var(--space-6)'
      } : {}),
      ...style
    }
  }, rest), children);
}
function CardHeader({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 'var(--space-6) var(--space-6) var(--space-4)',
      ...style
    }
  }, rest), children);
}
function CardTitle({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h3", _extends({
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)',
      ...style
    }
  }, rest), children);
}
function CardDescription({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      lineHeight: 'var(--leading-normal)',
      ...style
    }
  }, rest), children);
}
function CardContent({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: '0 var(--space-6) var(--space-6)',
      ...style
    }
  }, rest), children);
}
function CardFooter({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-sunken)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/RatingStars.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee RatingStars — institution / quality rating on a 5-star
 * scale. Honey-filled stars with fractional support, optional
 * numeric value and count.
 */

function RatingStars({
  value = 0,
  count = 5,
  size = 16,
  showValue = false,
  reviews,
  color = 'var(--honey-500)',
  emptyColor = 'var(--neutral-300)',
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / count * 100));
  const stars = '★'.repeat(count);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-block',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size,
      letterSpacing: 2,
      color: emptyColor,
      fontFamily: 'var(--font-sans)'
    }
  }, stars), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${pct}%`,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: size,
      letterSpacing: 2,
      color,
      fontFamily: 'var(--font-sans)'
    }
  }, stars)), showValue ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)'
    }
  }, value.toFixed(1)) : null, reviews != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "(", reviews, ")") : null);
}
Object.assign(__ds_scope, { RatingStars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RatingStars.jsx", error: String((e && e.message) || e) }); }

// components/data/ScoreMeter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ScoreMeter — the signature 0–100 signal gauge used for
 * market sentiment & analysis scores. Big number, a filled track
 * coloured by `tone`, and optional end labels.
 */

const TONE_COLOR = {
  bullish: 'var(--sentiment-bullish)',
  cautious: 'var(--sentiment-cautious)',
  neutral: 'var(--sentiment-neutral)',
  bearish: 'var(--sentiment-bearish)',
  honey: 'var(--honey-500)',
  ai: 'var(--violet-500)'
};
function ScoreMeter({
  value = 0,
  max = 100,
  label,
  tone = 'honey',
  labels,
  showValue = true,
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const color = TONE_COLOR[tone] || TONE_COLOR.honey;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, rest), label || showValue ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-muted)'
    }
  }, label) : /*#__PURE__*/React.createElement("span", null), showValue ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 'var(--weight-bold)',
      color,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-subtle)'
    }
  }, "/ ", max)) : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: color,
      transition: 'width var(--duration-slow) var(--ease-out)'
    }
  })), labels && labels.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))) : null);
}
Object.assign(__ds_scope, { ScoreMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScoreMeter.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee StatCard — the dashboard quick-stat tile. Big number,
 * caption, an icon chip tinted by `tone`, and an optional delta.
 */

const TONE_BG = {
  honey: 'var(--honey-50)',
  navy: 'var(--neutral-100)',
  green: 'var(--green-50)',
  violet: 'var(--violet-50)',
  blue: 'var(--blue-50)',
  red: 'var(--red-50)'
};
const TONE_FG = {
  honey: 'var(--honey-700)',
  navy: 'var(--ink-800)',
  green: 'var(--green-600)',
  violet: 'var(--violet-600)',
  blue: 'var(--blue-500)',
  red: 'var(--red-500)'
};
function StatCard({
  label,
  value,
  icon,
  tone = 'honey',
  delta,
  deltaDirection = 'up',
  style = {},
  ...rest
}) {
  const deltaColor = deltaDirection === 'up' ? 'var(--green-600)' : deltaDirection === 'down' ? 'var(--red-500)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, value), delta != null ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      color: deltaColor
    }
  }, deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : '', " ", delta) : null), icon ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: TONE_BG[tone] || TONE_BG.honey,
      color: TONE_FG[tone] || TONE_FG.honey,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Input — labelled text field with honey focus ring.
 * Supports a leading icon, prefix/suffix adornments (e.g. "HKD"),
 * helper text and an error state.
 */

function Input({
  label,
  icon,
  prefix,
  suffix,
  helper,
  error,
  size = 'md',
  style = {},
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId ? React.useId() : undefined;
  const inputId = id || reactId;
  const h = size === 'sm' ? 36 : size === 'lg' ? 48 : 42;
  const borderColor = error ? 'var(--red-500)' : focus ? 'var(--honey-500)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-primary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: h,
      background: 'var(--surface-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus && !error ? 'var(--ring-glow)' : 'none',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
      paddingLeft: 12,
      paddingRight: 12,
      gap: 8
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }, icon) : null, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-primary)',
      height: '100%'
    }
  })), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, suffix) : null), helper || error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--red-500)' : 'var(--text-muted)'
    }
  }, error || helper) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/mascot/BeeNote.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee BeeNote — the worker-bee insight block. The mascot
 * (in a honeycomb hexagon) delivers an AI finding in a diligent,
 * hard-working voice. `honey` (light) or `navy` (dark) surface.
 * Replaces the generic "AI" avatar circle.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function HexMascot({
  src,
  size = 56
}) {
  const border = 3;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--honey-500)',
      clipPath: HEX
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: border,
      background: 'var(--honey-100)',
      clipPath: HEX,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "AiphaBee",
    style: {
      width: '92%',
      height: '92%',
      objectFit: 'contain',
      marginBottom: '-4%'
    }
  })));
}
function BeeNote({
  pose = 'insight',
  basePath = 'assets/mascot',
  src,
  title = '工蜂洞察 · Bee Insight',
  tone = 'honey',
  mascotSize = 56,
  children,
  action,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;
  const dark = tone === 'navy';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: dark ? 'var(--ink-800)' : 'var(--honey-50)',
      border: dark ? '1px solid transparent' : '1px solid var(--honey-200)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(HexMascot, {
    src: img,
    size: mascotSize
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 5,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)',
      color: dark ? 'var(--honey-400)' : 'var(--honey-800)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83D\uDC1D"), title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: dark ? 'rgba(255,255,255,0.86)' : 'var(--ink-700)'
    }
  }, children), action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, action) : null));
}
Object.assign(__ds_scope, { BeeNote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/BeeNote.jsx", error: String((e && e.message) || e) }); }

// components/mascot/ComparePanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ComparePanel — the head-to-head "PK" view. The compare
 * worker-bee presides over a hexagon honeycomb header while two
 * candidates (IPOs, tickers, funds) are weighed metric-by-metric.
 * Winning cells get a honey-green highlight; the bee delivers the
 * verdict in the navy footer. Hero-scale mascot — one per screen.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Side({
  side
}) {
  if (!side) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 13,
      height: 14,
      clipPath: HEX,
      flexShrink: 0,
      background: side.color || 'var(--honey-500)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-lg)',
      color: 'var(--ink-800)'
    }
  }, side.name), side.ticker ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, side.ticker) : null);
}
function ComparePanel({
  pose = 'compare',
  basePath = 'assets/mascot',
  src,
  eyebrow = '蜂巢对比 · Compare',
  title = '工蜂帮你称一称',
  subtitle,
  left,
  right,
  metrics = [],
  verdict,
  mascotSize = 120,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;
  const cell = (node, win) => /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: win ? 'var(--green-600)' : 'var(--ink-800)'
    }
  }, node);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      padding: 'var(--space-5) var(--space-6)',
      background: 'var(--surface-honey)',
      borderBottom: '1px solid var(--honey-200)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'var(--pattern-honeycomb)',
      backgroundSize: '120px auto',
      opacity: 0.4,
      WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)',
      maskImage: 'linear-gradient(90deg, transparent, #000)'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      position: 'relative',
      width: mascotSize,
      height: 'auto',
      flexShrink: 0,
      filter: 'drop-shadow(0 8px 16px rgba(26,34,66,0.14))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 5px',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--honey-800)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 4px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--ink-800)'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, subtitle) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Side, {
    side: left
  }), metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, m.label), cell(m.left, m.winner === 'left')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      padding: '0 var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 42,
      background: 'var(--ink-800)',
      color: '#fff',
      clipPath: HEX,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-extrabold)',
      fontSize: 'var(--text-sm)'
    }
  }, "VS")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Side, {
    side: right
  }), metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, m.label), cell(m.right, m.winner === 'right'))))), verdict ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      background: 'var(--ink-800)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 18,
      background: 'var(--honey-500)',
      clipPath: HEX,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)'
    }
  }, verdict)) : null);
}
Object.assign(__ds_scope, { ComparePanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/ComparePanel.jsx", error: String((e && e.message) || e) }); }

// components/mascot/ForageLoader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ForageLoader — the diligent loading state. The bee
 * "forages" while a honey bar fills the comb. `pill` (compact, navy)
 * or `block` (centered, for full-panel loading). Replaces the
 * generic spinner. Set `done` for the "撒蜜收尾" tail frame — the bee
 * swaps to the honey-finish pose, the bar locks full, and the label
 * switches to `doneLabel`. Keep it briefly, then unmount/route on.
 */

function ForageLoader({
  label = '工蜂正在采集…',
  doneLabel = '采集完成 · 已撒蜜入巢',
  done = false,
  variant = 'pill',
  basePath = 'assets/mascot',
  src,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${done ? 'honey-finish' : 'forage'}.png`;
  const text = done ? doneLabel : label;
  // While foraging the bar loops; on done it locks full.
  const barAnim = done ? 'none' : 'aiphabee-honey-fill 2.2s var(--ease-out) infinite';
  const barWidth = done ? '100%' : undefined;
  const beeAnim = done ? 'aiphabee-glow 1.4s var(--ease-out) 1' : 'aiphabee-buzz 1.6s var(--ease-standard) infinite';
  if (variant === 'block') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        textAlign: 'center',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("img", {
      src: img,
      alt: "",
      style: {
        width: 96,
        height: 96,
        objectFit: 'contain',
        animation: beeAnim
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: done ? 'var(--green-600)' : 'var(--text-muted)'
      }
    }, text), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 180,
        height: 8,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-muted)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: barWidth,
        borderRadius: 'var(--radius-pill)',
        background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))',
        animation: barAnim
      }
    })));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '8px 16px 8px 10px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--ink-800)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      height: 28,
      width: 'auto',
      objectFit: 'contain',
      animation: beeAnim
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      color: '#fff'
    }
  }, text), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(255,255,255,0.18)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      height: '100%',
      width: barWidth,
      borderRadius: 'var(--radius-pill)',
      background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))',
      animation: barAnim
    }
  })));
}
Object.assign(__ds_scope, { ForageLoader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/ForageLoader.jsx", error: String((e && e.message) || e) }); }

// components/mascot/Hexvatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Hexvatar — the signature honeycomb-hexagon container for
 * avatars and icon chips. Layers a hex "border" behind a hex "fill"
 * (clip-path can't stroke), then centers an image or icon on top.
 */

const TONE = {
  honey: {
    solid: 'var(--honey-500)',
    soft: 'var(--honey-100)',
    line: 'var(--honey-500)',
    on: 'var(--ink-800)'
  },
  navy: {
    solid: 'var(--ink-800)',
    soft: 'var(--neutral-100)',
    line: 'var(--ink-800)',
    on: 'var(--honey-400)'
  },
  green: {
    solid: 'var(--green-500)',
    soft: 'var(--green-50)',
    line: 'var(--green-500)',
    on: '#fff'
  },
  violet: {
    solid: 'var(--violet-500)',
    soft: 'var(--violet-50)',
    line: 'var(--violet-500)',
    on: '#fff'
  },
  red: {
    solid: 'var(--red-500)',
    soft: 'var(--red-50)',
    line: 'var(--red-500)',
    on: '#fff'
  },
  neutral: {
    solid: 'var(--neutral-200)',
    soft: 'var(--neutral-100)',
    line: 'var(--neutral-300)',
    on: 'var(--ink-800)'
  }
};
const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Hexvatar({
  imgSrc,
  alt = '',
  icon,
  size = 56,
  tone = 'honey',
  variant = 'soft',
  clip = false,
  children,
  style = {},
  ...rest
}) {
  const t = TONE[tone] || TONE.honey;
  const border = Math.max(2, Math.round(size * 0.045));
  let fill, lineColor, content;
  if (variant === 'fill') {
    fill = t.solid;
    lineColor = t.solid;
    content = t.on;
  } else if (variant === 'outline') {
    fill = 'var(--surface-card)';
    lineColor = t.line;
    content = t.line;
  } else {
    fill = t.soft;
    lineColor = t.line;
    content = t.on === '#fff' ? t.solid : t.on;
  }
  const inner = size - border * 2;
  const media = imgSrc ? /*#__PURE__*/React.createElement("img", {
    src: imgSrc,
    alt: alt,
    style: {
      width: clip ? '100%' : '74%',
      height: clip ? '100%' : '74%',
      objectFit: clip ? 'cover' : 'contain',
      clipPath: clip ? HEX : 'none'
    }
  }) : icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: content
    }
  }, icon) : children;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: lineColor,
      clipPath: HEX
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: border,
      background: fill,
      clipPath: HEX,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, media));
}
Object.assign(__ds_scope, { Hexvatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/Hexvatar.jsx", error: String((e && e.message) || e) }); }

// components/mascot/MascotState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee MascotState — full mascot illustration for empty / success
 * / error / onboarding states. Centered pose + title + description +
 * optional action. An optional faint honeycomb backdrop frames the bee.
 */

function MascotState({
  pose = 'empty',
  basePath = 'assets/mascot',
  src,
  title,
  description,
  size = 150,
  comb = true,
  children,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-8) var(--space-6)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, comb ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '-8%',
      backgroundImage: 'var(--pattern-honeycomb)',
      backgroundSize: '26px 45px',
      opacity: 0.5,
      WebkitMaskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
      maskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
      pointerEvents: 'none'
    }
  }) : null, /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }
  })), title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '6px 0 0',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 380,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-muted)'
    }
  }, description) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, children) : null);
}
Object.assign(__ds_scope, { MascotState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/MascotState.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/app.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — UI kit shell
   App router state, nav bar, Lucide icon helper, and mock HK IPO
   data. Views live in home.jsx and research.jsx.
   ============================================================ */

const DS = window.AiphaBeeDesignSystem_599c13;
const {
  Button,
  Badge
} = DS;

/* ---------- Lucide icon helper ---------- */
function Icon({
  name,
  size = 18,
  color,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "luc",
    style: {
      display: 'inline-flex',
      lineHeight: 0,
      color,
      '--ic-size': size + 'px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": name
  }));
}
function useLucide(dep) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}
const LOGO = '../../assets/aiphabee-mascot.png';
const MASCOT_BP = '../../assets/mascot';

/* ---------- Mock HK IPO data ---------- */
const SECTOR_LABEL = {
  tech: '科技 Technology',
  health: '生物医药 Healthcare',
  fintech: '金融科技 Fintech',
  industrial: '工业 Industrials',
  energy: '能源 Energy'
};
const IPOS = [{
  id: 'honeycomb',
  name: 'Honeycomb Intelligence',
  cn: '蜂巢智能',
  ticker: '2769.HK',
  exchange: 'HKEX',
  sector: 'tech',
  status: 'pending',
  sentiment: 'bullish',
  score: 78,
  tier: 'medium',
  tierLabel: '中盘股',
  offer: 24.80,
  raiseHKD: '4.2B',
  mcapHKD: '38.6B',
  listing: 'Jun 24, 2026',
  sub: 128.4,
  rating: 4.5,
  ratingCount: 21,
  recommendation: 'strong_buy',
  confidence: 86,
  desc: 'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。Cornerstone 阵容强劲，超额认购火爆。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 82
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 88
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 74
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 90
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 68
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 84
  }],
  institutions: [{
    name: 'Morgan Stanley',
    role: '联席保荐人',
    rating: 5
  }, {
    name: 'CICC 中金公司',
    role: '联席保荐人',
    rating: 4.5
  }, {
    name: 'Goldman Sachs',
    role: '账簿管理人',
    rating: 4
  }],
  cornerstones: [{
    name: 'Hillhouse 高瓴',
    amount: 'HKD 600M',
    pct: 14.3
  }, {
    name: 'GIC Singapore',
    amount: 'HKD 420M',
    pct: 10.0
  }, {
    name: 'Tencent 腾讯',
    amount: 'HKD 380M',
    pct: 9.0
  }],
  aiNote: '科技板块情绪向好叠加优质基石阵容，128× 超额认购显示散户与机构需求旺盛。建议关注首日开盘价，回调至招股价上沿可逢低布局。'
}, {
  id: 'lotus',
  name: 'Lotus Digital Pay',
  cn: '莲花数科',
  ticker: '2611.HK',
  exchange: 'HKEX',
  sector: 'fintech',
  status: 'pending',
  sentiment: 'bullish',
  score: 71,
  tier: 'large',
  tierLabel: '大盘股',
  offer: 18.20,
  raiseHKD: '6.8B',
  mcapHKD: '92.1B',
  listing: 'Jun 27, 2026',
  sub: 64.2,
  rating: 4,
  ratingCount: 18,
  recommendation: 'buy',
  confidence: 74,
  desc: '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 70
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 80
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 78
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 66
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 82
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 72
  }],
  institutions: [{
    name: 'JPMorgan',
    role: '联席保荐人',
    rating: 4.5
  }, {
    name: 'UBS',
    role: '账簿管理人',
    rating: 4
  }, {
    name: 'Huatai 华泰',
    role: '账簿管理人',
    rating: 3.5
  }],
  cornerstones: [{
    name: 'Temasek 淡马锡',
    amount: 'HKD 800M',
    pct: 11.8
  }, {
    name: 'BlackRock',
    amount: 'HKD 500M',
    pct: 7.4
  }],
  aiNote: '基本面扎实但板块动能一般，64× 认购属健康区间。适合稳健型投资者中长期持有。'
}, {
  id: 'pearl',
  name: 'Pearl River Biotech',
  cn: '珠江生物',
  ticker: '2197.HK',
  exchange: 'HKEX',
  sector: 'health',
  status: 'priced',
  sentiment: 'cautious',
  score: 54,
  tier: 'small',
  tierLabel: '小盘股',
  offer: 9.60,
  raiseHKD: '1.1B',
  mcapHKD: '8.4B',
  listing: 'Jun 20, 2026',
  sub: 12.6,
  rating: 3.5,
  ratingCount: 11,
  recommendation: 'hold',
  confidence: 61,
  desc: '创新药企，核心管线处于 II 期临床。未盈利，估值依赖里程碑预期。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 58
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 62
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 55
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 48
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 40
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 60
  }],
  institutions: [{
    name: 'CICC 中金公司',
    role: '独家保荐人',
    rating: 4
  }, {
    name: 'CMB Intl 招银国际',
    role: '账簿管理人',
    rating: 3.5
  }],
  cornerstones: [{
    name: 'Qiming 启明创投',
    amount: 'HKD 220M',
    pct: 20.0
  }],
  aiNote: '18A 未盈利生物科技，波动较大。基本面评分偏低，建议小仓位参与并严设止损。'
}, {
  id: 'apex',
  name: 'Apex Logistics',
  cn: '顶峰物流',
  ticker: '9699.HK',
  exchange: 'HKEX',
  sector: 'industrial',
  status: 'pending',
  sentiment: 'neutral',
  score: 49,
  tier: 'medium',
  tierLabel: '中盘股',
  offer: 13.40,
  raiseHKD: '2.4B',
  mcapHKD: '21.0B',
  listing: 'Jun 30, 2026',
  sub: 6.8,
  rating: 3,
  ratingCount: 9,
  recommendation: 'hold',
  confidence: 55,
  desc: '区域智能仓储与冷链物流运营商，现金流稳定，成长性中性。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 50
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 58
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 52
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 44
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 60
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 38
  }],
  institutions: [{
    name: 'Haitong 海通国际',
    role: '联席保荐人',
    rating: 3.5
  }, {
    name: 'BOCI 中银国际',
    role: '账簿管理人',
    rating: 3
  }],
  cornerstones: [],
  aiNote: '需求平淡，6.8× 认购偏冷，缺乏基石支撑。建议观望，待二级市场企稳后再评估。'
}, {
  id: 'greenfield',
  name: 'GreenField Energy',
  cn: '绿野能源',
  ticker: '0586.HK',
  exchange: 'HKEX',
  sector: 'energy',
  status: 'listed',
  sentiment: 'bearish',
  score: 31,
  tier: 'small',
  tierLabel: '小盘股',
  offer: 6.20,
  raiseHKD: '0.9B',
  mcapHKD: '5.6B',
  listing: 'Jun 12, 2026',
  sub: 2.1,
  rating: 2.5,
  ratingCount: 7,
  recommendation: 'sell',
  confidence: 64,
  desc: '光伏组件制造商，行业产能过剩、毛利承压。上市首日破发。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 28
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 40
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 35
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 22
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 30
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 18
  }],
  institutions: [{
    name: 'Guotai Junan 国泰君安',
    role: '独家保荐人',
    rating: 2.5
  }],
  cornerstones: [],
  aiNote: '行业景气度低、认购冷淡且已破发，多维评分全面偏弱。建议规避，等待行业出清信号。'
}];
const SENTIMENT_TONE = {
  bullish: 'bullish',
  cautious: 'warning',
  neutral: 'neutral',
  bearish: 'bearish'
};
const SENTIMENT_LABEL = {
  bullish: '牛市 Bullish',
  cautious: '谨慎乐观',
  neutral: '中性 Neutral',
  bearish: '熊市 Bearish'
};
const STATUS = {
  pending: {
    tone: 'honey',
    label: 'Upcoming 招股中'
  },
  priced: {
    tone: 'info',
    label: 'Priced 已定价'
  },
  listed: {
    tone: 'bullish',
    label: 'Listed 已上市'
  },
  withdrawn: {
    tone: 'neutral',
    label: 'Withdrawn'
  }
};
const RATING_CFG = {
  strong_buy: {
    tone: 'bullish',
    label: '强力买入 Strong Buy'
  },
  buy: {
    tone: 'warning',
    label: '买入 Buy'
  },
  hold: {
    tone: 'neutral',
    label: '持有 Hold'
  },
  sell: {
    tone: 'bearish',
    label: '卖出 Sell'
  }
};

/* ---------- Top navigation ---------- */
function NavBar({
  view,
  go
}) {
  const link = (v, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(v),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: view === v ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
      padding: '4px 2px'
    }
  }, label);
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 24px',
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('home'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "AiphaBee",
    style: {
      height: 38,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO\xA0Agent")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 22
    }
  }, link('dashboard', 'Dashboard'), link('listings', 'Browse IPOs'), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go('dashboard')
  }, "Get Started"))));
}

/* ---------- Root app ---------- */
function App() {
  const [view, setView] = React.useState('home');
  const [selected, setSelected] = React.useState(IPOS[0]);
  useLucide(view);
  const go = v => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const openIpo = ipo => {
    setSelected(ipo);
    go('detail');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--surface-page)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(NavBar, {
    view: view,
    go: go
  }), view === 'home' && /*#__PURE__*/React.createElement(HomeView, {
    go: go,
    openIpo: openIpo
  }), view === 'dashboard' && /*#__PURE__*/React.createElement(DashboardView, {
    go: go,
    openIpo: openIpo
  }), view === 'listings' && /*#__PURE__*/React.createElement(ListingsView, {
    openIpo: openIpo
  }), view === 'detail' && /*#__PURE__*/React.createElement(DetailView, {
    ipo: selected,
    go: go
  }));
}
Object.assign(window, {
  Icon,
  useLucide,
  App,
  NavBar,
  IPOS,
  SECTOR_LABEL,
  SENTIMENT_TONE,
  SENTIMENT_LABEL,
  STATUS,
  RATING_CFG,
  LOGO,
  MASCOT_BP
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/home.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — Home & Dashboard views
   ============================================================ */
const _DS = window.AiphaBeeDesignSystem_599c13;
const {
  Button: HBtn,
  Badge: HBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  ScoreMeter,
  RatingStars,
  BeeNote,
  Hexvatar,
  ForageLoader
} = _DS;
const SHELL = {
  maxWidth: 'var(--container-max)',
  margin: '0 auto',
  padding: '0 24px'
};

/* ---------- Market sentiment panel (recreates MarketSentimentCard) ---------- */
function MarketSentimentPanel() {
  return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardTitle, null, "\u5E02\u573A\u60C5\u7EEA\u6307\u6807 \xB7 HKEX"), /*#__PURE__*/React.createElement(CardDescription, null, "\u6700\u540E\u66F4\u65B0 5 \u5206\u949F\u524D \xB7 30 \u65E5\u7A97\u53E3")), /*#__PURE__*/React.createElement(HBadge, {
    tone: "bullish",
    dot: true
  }, "\u8C28\u614E\u4E50\u89C2 \u2192 \u725B\u5E02"))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ScoreMeter, {
    label: "\u60C5\u7EEA\u6307\u6570 Sentiment Index",
    value: 72,
    tone: "bullish",
    labels: ['极度悲观', '中性', '极度乐观']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(BeeNote, {
    basePath: MASCOT_BP,
    pose: "insight",
    title: "\u5DE5\u8702\u6D1E\u5BDF \xB7 \u5DF2\u4E3A\u60A8\u52E4\u52B3\u641C\u7F57"
  }, "\u6E2F\u7F8E\u80A1 IPO \u5E02\u573A\u60C5\u7EEA\u56DE\u6696\uFF0C\u79D1\u6280\u4E0E\u91D1\u878D\u79D1\u6280\u677F\u5757\u8BA4\u8D2D\u706B\u7206\u3002\u5EFA\u8BAE\u4F18\u5148\u5173\u6CE8\u57FA\u77F3\u9635\u5BB9\u5F3A\u52B2\u3001\u8D85\u989D\u8BA4\u8D2D 50\xD7 \u4EE5\u4E0A\u7684\u6807\u7684\u3002"))));
}
function FeatureCard({
  icon,
  tone,
  title,
  body
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Hexvatar, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 22
    }),
    tone: tone,
    variant: "soft",
    size: 52
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '16px 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.65,
      color: 'var(--text-body)'
    }
  }, body));
}
function HomeView({
  go,
  openIpo
}) {
  useLucide();
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingTop: 64,
      paddingBottom: 56,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: MASCOT_BP + '/greeting.png',
    alt: "AiphaBee",
    style: {
      width: 132,
      height: 132,
      objectFit: 'contain',
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--honey-50)',
      border: '1px solid var(--honey-200)',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 15,
    color: "var(--honey-700)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--honey-800)'
    }
  }, "\u6E2F\u80A1 IPO \u6295\u7814 Agent \xB7 Powered by Claude")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-6xl)',
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--ink-800)'
    }
  }, "Find the alpha.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--honey-500)'
    }
  }, "Let the bee do the digging.")), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 640,
      margin: '24px auto 0',
      fontSize: 'var(--text-lg)',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, "\u6570\u636E\u9A71\u52A8\u7684\u6E2F\u80A1 IPO \u6295\u7814\u5E73\u53F0\uFF1A\u591A\u6A21\u578B\u4F30\u503C\u3001AI \u62DB\u80A1\u4E66\u89E3\u8BFB\u3001\u57FA\u77F3\u6295\u8D44\u8005\u8BC4\u5206\u4E0E\u5168\u7EF4\u5EA6\u98CE\u9669\u6253\u5206\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(HBtn, {
    size: "lg",
    onClick: () => go('dashboard'),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Start Analysis"), /*#__PURE__*/React.createElement(HBtn, {
    size: "lg",
    variant: "outline",
    onClick: () => go('listings')
  }, "Browse IPOs"))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingBottom: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 22,
    color: "var(--violet-500)"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "\u5B9E\u65F6\u5E02\u573A\u6982\u89C8")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--text-muted)'
    }
  }, "AI \u9A71\u52A8\u7684\u5E02\u573A\u60C5\u7EEA\u5206\u6790\uFF0C\u5E2E\u52A9\u60A8\u628A\u63E1 IPO \u6295\u8D44\u65F6\u673A")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 680,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(MarketSentimentPanel, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--ink-700)',
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)'
    }
  }, "\u67E5\u770B\u6240\u6709 IPO \u5206\u6790 ", /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up",
    size: 16
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingBottom: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "trending-up",
    tone: "honey",
    title: "Multi-Model Valuation",
    body: "DCF\u3001\u53EF\u6BD4\u516C\u53F8\u4E0E\u5148\u4F8B\u4EA4\u6613\u4E09\u6CD5\u5408\u4E00\uFF0C\u7ED3\u5408 6 \u7EF4\u5206\u5C42\u6A21\u578B\u7ED9\u51FA\u516C\u5141\u4EF7\u503C\u533A\u95F4\u3002"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "shield",
    tone: "green",
    title: "Risk Scoring Engine",
    body: "15+ \u8D22\u52A1\u5065\u5EB7\u4E0E\u5E02\u573A\u73AF\u5883\u6307\u6807\uFF0C\u91CF\u5316\u7B79\u7801\u3001\u4FDD\u8350\u3001\u627F\u9500\u4E0E\u57FA\u77F3\u8D28\u91CF\u3002"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "sparkles",
    tone: "violet",
    title: "AI Prospectus Analysis",
    body: "Claude \u89E3\u8BFB\u5197\u957F\u62DB\u80A1\u4E66\uFF0C\u79D2\u7EA7\u63D0\u70BC\u5173\u952E\u98CE\u9669\u3001\u4EAE\u70B9\u4E0E\u8BA4\u8D2D\u60C5\u7EEA\u3002"
  }))), /*#__PURE__*/React.createElement(Footer, null));
}
function DashboardView({
  go,
  openIpo
}) {
  useLucide();
  const upcoming = IPOS.filter(i => i.status === 'pending');
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '32px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rocket",
    size: 30,
    color: "var(--honey-500)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "IPO Agent Dashboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u6B22\u8FCE\u56DE\u6765\uFF01\u8FD9\u662F\u60A8\u7684\u6E2F\u80A1 IPO \u5E02\u573A\u6982\u89C8\u3002"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '32px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active IPOs \u62DB\u80A1\u4E2D",
    value: "12",
    tone: "honey",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u672C\u5468\u4E0A\u5E02 This week",
    value: "5",
    tone: "green",
    delta: "2 vs \u4E0A\u5468",
    deltaDirection: "up",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "trending-up",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5E73\u5747\u8D85\u989D\u8BA4\u8D2D",
    value: "42.8\xD7",
    tone: "violet",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "layers",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Watchlist \u5173\u6CE8",
    value: "7",
    tone: "blue",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 20
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 24,
      marginTop: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(CardTitle, null, "\u672C\u5468\u62DB\u80A1 Upcoming this week"), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-700)',
      fontWeight: 600,
      fontSize: 'var(--text-xs)',
      fontFamily: 'var(--font-sans)'
    }
  }, "View all \u2192"))), /*#__PURE__*/React.createElement(CardContent, {
    style: {
      padding: 0
    }
  }, upcoming.map((ipo, i) => /*#__PURE__*/React.createElement("button", {
    key: ipo.id,
    onClick: () => openIpo(ipo),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '14px 24px',
      background: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      border: 'none',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-primary)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, ipo.ticker)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, ipo.listing, " \xB7 ", SECTOR_LABEL[ipo.sector])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(HBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    size: "sm",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ipo.sub, "\xD7")))))), /*#__PURE__*/React.createElement(MarketSentimentPanel, null))), /*#__PURE__*/React.createElement(Footer, null));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '40px 24px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "AiphaBee",
    style: {
      height: 44,
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\xA9 2026 AiphaBee \xB7 IPO Agent. \u6E2F\u80A1 IPO \u6295\u7814 \xB7 Insight \u5E73\u53F0."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-subtle)'
    }
  }, "Data shown is illustrative mock data for design purposes.")));
}
Object.assign(window, {
  HomeView,
  DashboardView,
  MarketSentimentPanel,
  Footer,
  SHELL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/research.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — Listings & Detail (research) views
   ============================================================ */
const _RDS = window.AiphaBeeDesignSystem_599c13;
const {
  Button: RBtn,
  Badge: RBadge,
  Card: RCard,
  CardHeader: RCH,
  CardTitle: RCT,
  CardDescription: RCD,
  CardContent: RCC,
  ScoreMeter: RScore,
  RatingStars: RStars,
  BeeNote: RBeeNote,
  MascotState: RMascotState
} = _RDS;

/* ---------- 6-dimension radar chart (SVG) ---------- */
function Radar({
  dims,
  size = 260,
  color = 'var(--chart-1)'
}) {
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 34;
  const n = dims.length;
  const pt = (i, rad) => {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPoly = f => dims.map((_, i) => pt(i, r * f).join(',')).join(' ');
  const dataPoly = dims.map((d, i) => pt(i, r * (d.score / 100)).join(',')).join(' ');
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      display: 'block',
      margin: '0 auto'
    }
  }, rings.map((f, i) => /*#__PURE__*/React.createElement("polygon", {
    key: i,
    points: gridPoly(f),
    fill: "none",
    stroke: "var(--border-subtle)",
    strokeWidth: "1"
  })), dims.map((_, i) => {
    const [x, y] = pt(i, r);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      stroke: "var(--border-subtle)",
      strokeWidth: "1"
    });
  }), /*#__PURE__*/React.createElement("polygon", {
    points: dataPoly,
    fill: color,
    fillOpacity: "0.28",
    stroke: color,
    strokeWidth: "2",
    strokeLinejoin: "round"
  }), dims.map((d, i) => {
    const [x, y] = pt(i, r * (d.score / 100));
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: "3.5",
      fill: color
    });
  }), dims.map((d, i) => {
    const [x, y] = pt(i, r + 18);
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: x,
      y: y,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontFamily: "var(--font-sans)",
      fontSize: "11",
      fontWeight: "600",
      fill: "var(--text-muted)"
    }, d.label);
  }));
}

/* ---------- Listings ---------- */
function IpoListCard({
  ipo,
  openIpo
}) {
  const st = STATUS[ipo.status];
  return /*#__PURE__*/React.createElement(RCard, {
    interactive: true,
    onClick: () => openIpo(ipo),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement(RBadge, {
    tone: st.tone,
    size: "sm"
  }, st.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600
    }
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, ipo.exchange), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]))), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up-right",
    size: 20,
    color: "var(--text-subtle)"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 16px',
      fontSize: 'var(--text-sm)',
      lineHeight: 1.6,
      color: 'var(--text-body)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, ipo.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      paddingTop: 14,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Listing",
    value: ipo.listing.replace(', 2026', '')
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Offer",
    value: `HK$${ipo.offer.toFixed(2)}`,
    mono: true
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "\u8D85\u989D\u8BA4\u8D2D",
    value: `${ipo.sub}×`,
    mono: true,
    tone: ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : undefined
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Sentiment",
    value: /*#__PURE__*/React.createElement(RBadge, {
      tone: SENTIMENT_TONE[ipo.sentiment],
      size: "sm",
      dot: true
    }, ipo.sentiment)
  }))));
}
function Metric({
  label,
  value,
  mono,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: tone || 'var(--text-primary)'
    }
  }, value));
}
function ListingsView({
  openIpo
}) {
  useLucide();
  const [filter, setFilter] = React.useState('All');
  const chips = ['All', 'Upcoming', 'Priced', 'Listed', 'HKEX'];
  const shown = IPOS.filter(i => filter === 'All' || filter === 'HKEX' ? true : filter === 'Upcoming' ? i.status === 'pending' : filter === 'Priced' ? i.status === 'priced' : filter === 'Listed' ? i.status === 'listed' : true);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '40px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '0 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "IPO Listings"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 24px',
      fontSize: 'var(--text-lg)',
      color: 'var(--text-muted)'
    }
  }, "\u6E2F\u80A1 IPO \u5168\u7EF4\u5EA6 AI \u4F30\u503C\u4E0E\u98CE\u9669\u5206\u6790"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 28
    }
  }, chips.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setFilter(c),
    style: {
      padding: '8px 16px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      border: '1px solid ' + (filter === c ? 'var(--honey-500)' : 'var(--border-default)'),
      background: filter === c ? 'var(--honey-500)' : 'var(--surface-card)',
      color: filter === c ? 'var(--ink-800)' : 'var(--text-body)'
    }
  }, c))), shown.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, shown.map(ipo => /*#__PURE__*/React.createElement(IpoListCard, {
    key: ipo.id,
    ipo: ipo,
    openIpo: openIpo
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement(RMascotState, {
    basePath: MASCOT_BP,
    pose: "empty",
    title: "\u8FD9\u4E2A\u7B5B\u9009\u4E0B\u8FD8\u6CA1\u6709\u6807\u7684",
    description: "\u6362\u4E2A\u7B5B\u9009\u6761\u4EF6\uFF0C\u5DE5\u8702\u7EE7\u7EED\u4E3A\u4F60\u91C7\u96C6\u6E2F\u7F8E\u80A1\u7684\u65B0\u673A\u4F1A\u3002"
  })), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- Detail (research view) ---------- */
function DetailView({
  ipo,
  go
}) {
  useLucide();
  const rcfg = RATING_CFG[ipo.recommendation];
  const scoreTone = ipo.sentiment === 'bullish' ? 'bullish' : ipo.sentiment === 'bearish' ? 'bearish' : ipo.sentiment === 'cautious' ? 'cautious' : 'neutral';
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '24px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Back to listings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement(RBadge, {
    tone: STATUS[ipo.status].tone
  }, STATUS[ipo.status].label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, ipo.cn), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(RBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    variant: "solid",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment]), /*#__PURE__*/React.createElement(RBtn, {
    variant: "ai",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 16
    })
  }, "Ask the Bee"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(KV, {
    label: "Offer Price",
    value: `HK$${ipo.offer.toFixed(2)}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Total Raise",
    value: `HK$${ipo.raiseHKD}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Market Cap",
    value: `HK$${ipo.mcapHKD}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "\u8D85\u989D\u8BA4\u8D2D",
    value: `${ipo.sub}×`,
    tone: ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : 'var(--text-primary)'
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Listing Date",
    value: ipo.listing.replace(', 2026', '')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(RCT, null, "\u5206\u5C42\u5206\u6790 Tier Analysis"), /*#__PURE__*/React.createElement(RCD, null, "6 \u7EF4\u667A\u80FD\u8BC4\u4F30 \xB7 ", ipo.tierLabel)), /*#__PURE__*/React.createElement(RBadge, {
    tone: rcfg.tone,
    variant: "solid"
  }, rcfg.label))), /*#__PURE__*/React.createElement(RCC, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      background: 'var(--surface-muted)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u7EFC\u5408\u8BC4\u5206 Overall"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-5xl)',
      fontWeight: 800,
      color: 'var(--honey-500)',
      lineHeight: 1
    }
  }, ipo.score), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, "/ 100"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "\u7F6E\u4FE1\u5EA6 Confidence"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, ipo.confidence, "%"))), /*#__PURE__*/React.createElement(Radar, {
    dims: ipo.dims
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: 8
    }
  }, ipo.dims.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d.k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-sm)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      fontWeight: 500
    }
  }, d.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, d.score)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${d.score}%`,
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: `var(--chart-${i + 1})`
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u5E02\u573A\u60C5\u7EEA Sentiment"), /*#__PURE__*/React.createElement(RCD, null, "\u8BE5\u6807\u7684 30 \u65E5\u60C5\u7EEA\u6307\u6570")), /*#__PURE__*/React.createElement(RCC, null, /*#__PURE__*/React.createElement(RScore, {
    value: ipo.score,
    tone: scoreTone,
    labels: ['极度悲观', '中性', '极度乐观']
  }))), /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u673A\u6784\u8BC4\u7EA7 Institutions"), /*#__PURE__*/React.createElement(RCD, null, "\u4FDD\u8350\u4EBA\u4E0E\u627F\u9500\u56E2\u8D28\u91CF")), /*#__PURE__*/React.createElement(RCC, {
    style: {
      padding: 0
    }
  }, ipo.institutions.map((ins, i) => /*#__PURE__*/React.createElement("div", {
    key: ins.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ins.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, ins.role)), /*#__PURE__*/React.createElement(RStars, {
    value: ins.rating,
    size: 15
  }))))), /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u57FA\u77F3\u6295\u8D44\u8005 Cornerstone"), /*#__PURE__*/React.createElement(RCD, null, ipo.cornerstones.length ? `${ipo.cornerstones.length} 名基石` : '暂无基石投资者')), /*#__PURE__*/React.createElement(RCC, {
    style: {
      padding: ipo.cornerstones.length ? 0 : '0 24px 24px'
    }
  }, ipo.cornerstones.length ? ipo.cornerstones.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, c.amount), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, c.pct, "% of offer")))) : /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u8BE5 IPO \u672A\u5F15\u5165\u57FA\u77F3\u6295\u8D44\u8005\uFF0C\u9700\u6C42\u652F\u6491\u8F83\u5F31\u3002"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(RBeeNote, {
    basePath: MASCOT_BP,
    pose: ipo.recommendation === 'sell' ? 'risk' : ipo.recommendation === 'strong_buy' ? 'success' : 'insight',
    tone: "navy",
    title: "AiphaBee \u6295\u8D44\u5EFA\u8BAE",
    action: /*#__PURE__*/React.createElement(RBadge, {
      tone: rcfg.tone,
      variant: "solid",
      size: "sm"
    }, rcfg.label, " \xB7 \u7F6E\u4FE1\u5EA6 ", ipo.confidence, "%")
  }, ipo.aiNote)), /*#__PURE__*/React.createElement(Footer, null));
}
function KV({
  label,
  value,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 5
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      color: tone || 'var(--text-primary)'
    }
  }, value));
}
Object.assign(window, {
  ListingsView,
  DetailView,
  Radar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/research.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardDescription = __ds_scope.CardDescription;

__ds_ns.CardContent = __ds_scope.CardContent;

__ds_ns.CardFooter = __ds_scope.CardFooter;

__ds_ns.RatingStars = __ds_scope.RatingStars;

__ds_ns.ScoreMeter = __ds_scope.ScoreMeter;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.BeeNote = __ds_scope.BeeNote;

__ds_ns.ComparePanel = __ds_scope.ComparePanel;

__ds_ns.ForageLoader = __ds_scope.ForageLoader;

__ds_ns.Hexvatar = __ds_scope.Hexvatar;

__ds_ns.MascotState = __ds_scope.MascotState;

})();
