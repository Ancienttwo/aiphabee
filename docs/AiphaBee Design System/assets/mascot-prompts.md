# AiphaBee 吉祥物图集 · 生成提示词

> 用法：先用「角色设定锚点」生成主形象并锁定，再逐个套用「姿势清单」。
> 强烈建议：把现有 `assets/aiphabee-logo-full.png` 作为参考图上传，并要求模型"keep the exact same character design as the reference"。一次性出整套或复用同一 seed，一致性最佳。
> 输出统一要求：**transparent background, PNG, single character centered, 1:1, high-resolution**。

---

## 0) 角色设定锚点（Style Anchor — 每次都带上这段）

```
A friendly cartoon bee mascot named "AiphaBee", an investment-research bee.
Flat vector illustration, clean thick rounded outlines, minimal shading, modern fintech sticker style.
Character design (keep IDENTICAL every time):
- Chubby rounded body with honey-yellow (#FBCB0A) and deep-navy (#1A2242) stripes
- Bold deep-navy (#1A2242) outline, no gradients
- Round black-rimmed nerd glasses, big friendly eyes, tiny smile
- Two small antennae with rounded tips, translucent white rounded wings
- Short arms and legs, approachable and smart, NOT cute-baby, NOT scary
Palette: honey yellow #FBCB0A, deep navy #1A2242, white, with small accents of growth-green #10B981.
Transparent background. Centered. Consistent line weight. PNG.
```

---

## 1) 姿势清单（每条 = 锚点 + 下面这句）

| 用途 (UI) | 追加提示词 |
|---|---|
| **采集 / 加载 ForageLoader** | `...flying energetically toward a glowing honey-yellow hexagon honeycomb cell, holding a tiny magnifying glass, motion lines, busy and hard-working "foraging" pose.` |
| **工蜂洞察 BeeNote (主)** | `...standing and presenting, one arm pointing up to a small navy candlestick chart with a rising green arrow, confident helpful expression.` |
| **思考 / 研究 Thinking** | `...sitting and reading a tiny prospectus document through the glasses, one hand on chin, a small hexagon thought-bubble above, diligent researcher pose.` |
| **成功 / 看涨 Success** | `...cheering with both arms up, holding a honey dipper dripping honey, a green up-arrow nearby, joyful confident pose.` |
| **空状态 Empty** | `...resting inside an empty hexagon honeycomb cell, gently shrugging with a soft apologetic smile, calm.` |
| **警示 / 风险 Risk** | `...holding a small honey-yellow warning sign, slightly alert but calm expression, one antenna raised.` |
| **打招呼 / 引导 Greeting** | `...waving one hand, friendly welcoming pose, slight forward lean.` |
| **小头像 Avatar (半身)** | `...front-facing bust/half-body portrait, fits neatly inside a hexagon frame, friendly smile, simple.` |
| **对比 / PK Compare** | `...the bee holds up a balance scale OUT IN FRONT at chest height with BOTH hands on the beam, arms extended away from the torso so the scale never overlaps the striped belly. The two honey-dipper pans hang clearly to the LEFT and RIGHT, well clear of the body, one pan slightly lower. Keep generous empty space between the scale beam and the body; give the beam a clean dark outline. Two floating honeycomb hexagon cells sit BEHIND the bee (one per side), not crossed by the scale. Analytical "weighing it up" pose. Hero-scale.` |
| **撒蜜收尾 HoneyFinish (success 变体)** | `...tilting a honey dipper so a glossy honey-yellow drip falls and fills a hexagon cell below, satisfied "job done" smile, small sparkle, celebratory finishing pose. Use as the tail frame of a completed ForageLoader, NOT a standalone state.` |

---

## 2) 蜂巢图标/场景（可选，统一氛围）

```
Same flat-vector style and palette as the AiphaBee mascot. A clean honeycomb hexagon motif:
a cluster of honey-yellow (#FBCB0A) hexagon outlines on transparent background, some filled with honey,
one cell containing a tiny navy candlestick chart. Minimal, modern, no text.
```

---

## 3) 出图建议
- 一套至少出：采集、洞察、思考、成功、空状态、警示、打招呼、半身头像 —— 共 8 张。
- 选配：**对比/PK**（接进 Compare 对比视图）、**撒蜜收尾**（作为 ForageLoader 跑满后的收尾帧，不单独立状态）。
- 每张都要 **transparent PNG**；半身头像额外出一张方形便于裁六边形。
- 若模型漂移，附一句：`Keep the exact same character, glasses, stripes, and outline weight as the reference image. Only change the pose.`
- 拿到图后发我，我把它们接进 `BeeNote / Hexvatar / ForageLoader` 等真组件里。
