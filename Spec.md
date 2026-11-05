# Spec - Threepetal v0.1.0（出海网页小游戏 MVP）

> 生成日期：2026-11-04 ｜ 契约对齐：2026-11-05
> 基于：PRD v1 + 架构文档 v1 + UIUX 方向 v1（三文档已用户确认）
> 状态：已确认（用户于 2026-11-04 确认开干），第 4/5/6/7/11/12 节按落地代码校正
> 项目路径：threepetal/（Next.js 15 App Router）；仓库：https://github.com/daotoyi/threepetal
> **正式定名（2026-11-05）：Threepetal，slogan "Three petals at a time."** 原工作名 Tiny Haven 因与 `tinyhaven.gg` 同赛道撞名已弃用；工程目录已由 `tiny-haven/` 改名为 `threepetal/`，npm 包名同步为 `threepetal`。

---

## 1. 产品定义
- **一句话描述**：无广告、买断制、可云端存档的欧美精品休闲解谜游戏——免费试玩首章，一次付费 $4.99 永久解锁。
- **目标用户**：欧美 25-45 岁休闲玩家（女性偏高），午休/睡前碎片化放松，厌恶广告与逼氪。
- **核心问题**：现有免费网页游戏广告疲劳、进度无归属、内容换皮；用户要一个属于自己的精品买断游戏。

## 2. MVP 范围（锁定）
| 优先级 | 功能 | 验收标准摘要 | RICE |
|--------|------|-------------|------|
| P0 | 免费试玩闸门（首章免费、其余锁定 UI + 解锁态） | 未付费仅可玩首章，锁定章节展示解锁页 | 10.0 |
| P0 | MoR 收银台（LemonSqueezy 一次性产品 + license 激活） | 点击购买跳转 LS 结账，自动算 VAT | 6.4 |
| P0 | 支付成功→解锁 + 恢复购买（license 校验） | webhook 落 licenses，entitlements 返回解锁项 | 9.6 |
| P0 | 核心玩法 + 6 关（免费 3 + 付费 3，数据驱动可扩）+ 装饰元进度 | 可玩、可通关产出素材、装修小空间 | 3.75 |
| P0 | 云端存档（Supabase 匿名→绑定） | 换设备进度延续 | 2.8 |
| P1 | 每日挑战 + 连续登录 | 促活 | 1.17 |
| P1 | 多语言（EN+DE/FR/ES） | i18n 预留 | 1.4 |
| P1 | DLC 季包 $2.99 | MoR 加购 | 1.75 |

## 3. 明确不做（Out-of-Scope）
| 不做 | 原因 | 何时考虑 |
|------|------|----------|
| 实时联机/对战 | 工程成本陡增，单人解谜才是差异点 | v2 |
| 原生 App | 纯网页要求，且 App Store 内购走不通 | PWA 后期 |
| 广告变现 | 与"无广告"定位冲突 | 永不 |
| 订阅主模型 | 单游戏订阅留存风险高 | P2 验证后 |
| 抽卡/随机经济 | 目标用户厌恶，破坏信任 | 永不 |
| UGC/关卡编辑器 | 内容管线成本超 MVP | v2 |

## 4. 技术架构（锁定 — 版本按 package.json 实测锚定）
| 层 | 技术 | 实际版本 | 锁定原因 |
|----|------|----------|----------|
| 前端框架 | Next.js (App Router) | 15.5.x（安全补丁线） | Vercel 一等支持，BFF 同仓 |
| UI | React + Tailwind CSS | React 19.0.0 / Tailwind 3.4.17 | Token 化、响应式 |
| 游戏渲染 | 原生 DOM Grid（未引入 Phaser/Canvas） | 浏览器 API | 单文件引擎、零额外包体 |
| 图标 | lucide-react | ^0.468.0 | 统一描边 SVG，禁 emoji |
| 后端/DB | Supabase (Postgres 15) | @supabase/ssr 0.5.2 | Auth+RLS 一体 |
| 认证 | Supabase Auth（邮箱 magic link） | - | JWT + RLS |
| 支付 | LemonSqueezy（MoR） | REST API v1 直连 | 自动全球税，webhook 落自建 licenses 表 |
| 部署 | Vercel Pro | Platform | Hobby 禁商用，须 Pro $20/月 |
| 后端Pro | Supabase Pro | Platform | 免费层暂停无备份，须 Pro $25/月 |

## 5. API 端点清单（锁定 — 与 app/api/ 逐一对齐）
| Method | Path | 认证 | 功能 |
|--------|------|------|------|
| POST | /api/checkout | Supabase session cookie | 创建 LS 结账；`custom_data.user_id` 由服务端会话取，不接受客户端传参 → 返回 `{ url }` |
| POST | /api/webhook | `X-Signature` HMAC-SHA256 | LS Webhook（验签 + 幂等 + 写 licenses/purchases）；处理 `order_created` / `order_refunded` |
| GET | /api/entitlements | Supabase session cookie | 返回当前用户 active 解锁项（服务端 gate 真相源）；未登录返回空数组 |
| GET / PUT | /api/progress | Supabase session cookie | 存档读写（RLS 强制，upsert on user_id） |

> v0.1 未实现、P1 延后：`GET/POST /leaderboard`、`GET /features`。数据库表已预留，前端不引用，避免契约虚锁。

## 6. 数据库表清单（锁定 — Supabase Postgres 15）
- **profiles**(id uuid PK=auth.users.id, display_name, avatar_url, country, created/updated_at) — RLS 本人读写
- **ls_events**(id text PK=事件id, event_type, payload jsonb, processed_at) — 幂等键，仅 service_role 写，**业务成功后才写入**
- **purchases**(id, user_id FK, ls_customer_id, ls_order_id, product_id, variant_id, amount, currency, status, created/updated_at) — 本人读
- **licenses**(id, user_id FK, product_id, entitlement, status active/revoked, granted_at, created/updated_at) — 本人只读，**仅 webhook 写**
- **game_progress**(id, user_id FK, level int, score bigint, petals int, save_data jsonb, updated_at) — 本人读写
- **leaderboard**(id, user_id FK, mode, score bigint, meta jsonb, created_at) — 公开读，本人写
- **feature_flags**(key PK, enabled, rollout_pct, whitelist_user_ids) — 公开读

唯一索引：`game_progress(user_id)`、`licenses(user_id, entitlement)`、`purchases(ls_order_id)` —— 供 upsert 与订单幂等使用。

## 7. 页面清单（锁定）
| 页面 | 路由 | 核心组件 | 对应 API | Token 主题 |
|------|------|----------|----------|-----------|
| 落地页 | / | Hero(真实游戏预览)+HowItWorks+DesignPrinciples | - | Brand 寄存器 |
| 游戏页 | /play | GameCanvas + HUD + 装饰面板 | progress, entitlements | Product 寄存器 |
| 支付页 | /unlock | 订单摘要 + LS 结账按钮 + 信任徽章 | checkout, entitlements | Product 寄存器 |
| 账户页 | /account | 邮箱登录 + 已购列表 + 恢复购买 | entitlements | Linear 质感 |

## 8. 设计 Token（锁定）
- 主色：`--accent` #2E9E8A（鼠尾草青绿），hover #248275，active #1C6B5F
- 背景：`--bg` #FAFAF7，surface #FFFFFF，surface-warm #F3F0EA
- 文本：`--fg` #26221E，fg-2 #4A443D，muted #6F6760
- 语义：success #3FA66A / warn #D99A1C / danger #D9625A
- 花瓣色板：`--petal-1` ~ `--petal-5`（青绿/陶土/麦黄/雾蓝/珊瑚），游戏画布与落地页预览共用，组件只写 `var(--petal-N)`
- 字体：display Quicksand / body Inter / 中文 Noto Sans SC / 数值 JetBrains Mono
- 圆角：sm8/md14/lg20/pill999；阴影：柔和扩散；动效 200ms 标准缓动（禁 elastic）
- **禁止**：紫→粉渐变、emoji 图标、硬编码色值（除 #fff/#000）；色值只在 `globals.css` 的 Token 定义处出现
- 图标库：Lucide（16 行内 / 20 按钮 / 24 独立）

## 9. 验收标准（EARS）
| 编号 | 功能 | 标准 |
|------|------|------|
| AC-01 | 免费试玩 | When 新访客打开 /，系统必须在 3s 内加载首章并可玩，无需注册、无广告 |
| AC-02 | 支付闸门 | When 免费玩家到首章末点击锁定章节，系统必须展示含价格与"无广告永久拥有"的解锁页 |
| AC-03 | 解锁 | When LS 支付成功且 webhook 确认，系统必须在 5s 内解锁 Chapter 2+ 并生效云存档 |
| AC-04 | 恢复购买 | When 老玩家换设备点恢复购买，系统必须凭 license/邮箱还原解锁状态 |
| AC-05 | 失败兜底 | When 支付失败/放弃，系统必须保持免费档，无部分解锁、无卡死 |
| AC-06 | 防篡改 | When 他人 JWT 尝试读他人 licenses，RLS 必须拒绝 |
| AC-07 | 支付链路可达 | When 已登录用户点 Unlock，系统必须命中 `POST /api/checkout` 并返回 LS 结账 URL，不得 404 |
| AC-08 | 中途失败可重试 | If webhook 写 licenses 失败，系统必须返回 5xx 且不写幂等标记，使 LS 重发能补齐权益 |
| AC-09 | 文案真实性 | Where 落地页与支付页展示产品描述，系统**不得**出现虚构用户证言或未兑现的关卡数/功能宣称 |

## 10. 边界与约束
- 不支持 IE；响应式断点 768/1024
- 性能：首屏 <3s，API p95 <500ms
- 弱网：已解锁内容可离线玩，联网同步；未买断不可绕过锁定
- 合规：隐私政策/退款政策/GDPR 注销链路（上线前补齐，当前未实现）
- 合规：仅陈述已实现能力，禁止带姓名/国别的虚构用户评价与未兑现功能宣称（FTC 广告规范 / EU 消费者保护法）
- 命名：正式名 Threepetal；正式上线前须查 USPTO/EUIPO 商标、域名与应用商店重名

## 11. 内嵌已知坑
| 坑 | 指纹 | 根因 | 修法 |
|----|------|------|------|
| LS webhook 重放 | lemonsqueezy | 重试机制 | 事件 id 幂等落 ls_events |
| 幂等标记早于业务写入 | lemonsqueezy | 失败时重发被拦，用户付款不解锁 | 业务成功后才 insert ls_events，失败返回 5xx |
| 退款事件无 custom_data | lemonsqueezy | LS 退款 payload 不带结账透传字段 | 按 ls_order_id 反查 purchases.user_id |
| 结账路径前后端不一致 | next.js | 文档写 /checkout/session，路由实为 /checkout | 契约以 app/api/ 目录为准，前端 fetch 逐一对齐 |
| 用邮件匹配用户 | lemonsqueezy | 邮箱不可靠 | 用 custom_data.user_id 关联 |
| Vercel Hobby 商用违规 | vercel | ToS | 必须 Pro |
| Supabase 免费层暂停 | supabase | 7天不活跃 | 必须 Pro + 连接池 6543 |
| service_role 绕过RLS | supabase | 权限误用 | 仅 webhook 服务端用 |
| 构建期客户端初始化 | @supabase/ssr | 模块级 createBrowserClient 在预渲染时无 env | 在 useEffect / 事件处理内惰性创建 |
| SSR 包类型推断为 never | @supabase/ssr 0.5.2 | 双参调用类型缺陷 | 给封装函数显式标注 SupabaseClient 返回类型 |
| 花瓣色值散落在组件 | tailwind/css | 游戏色板直接在 TSX 里写 hex | 集中为 `--petal-1..5` Token，组件只引用 var |
| 工作名撞车 | naming | cozy+花园+花瓣词根已被大量占用 | 正式定名从机制词根切入（Threepetal），上线前查商标 |

## 12. 端到端验证步骤
```bash
# 1. 构建并启动生产服务器（无需本地 Supabase 也能渲染页面）
npm run build && npm run start        # http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/play   # 断言 200

# 2. 配置凭证：cp .env.example .env.local，填 Supabase / LemonSqueezy 沙箱凭证
#    并在 Supabase SQL Editor 执行 supabase/migrations/0001_init.sql

# 3. 沙箱支付：LS Sandbox 建 product/variant → /unlock 登录并点击
#    → POST /api/checkout → 返回 LS 结账 URL → 跳转完成测试支付（断言不是 404）

# 4. webhook：LS 发 order_created → 断言 licenses 出现 active(full_game)
#    → GET /api/entitlements 返回 ["full_game"]；重复事件 → 幂等拦截

# 5. 失败流：篡改 webhook body 重发 → 签名校验 401；
#    模拟 DB 写入失败 → 返回 5xx 且不落幂等标记，重发可补齐

# 6. 退款流：发 order_refunded → license 状态变 revoked
```

## 13. 变更记录
| 日期 | 变更 | 原因 | 影响 |
|------|------|------|------|
| 2026-11-04 | 初始 Spec 冻结 | 用户确认开干 | 全范围 |
| 2026-11-05 | 修复支付链路 3 项 P0：结账 404、幂等标记早于业务写入、退款不撤销 | 交付前契约复查 | api/webhook、unlock、migration |
| 2026-11-05 | API 收敛为 `/api/*`（去掉 /v1 与 /checkout/session）；技术版本按 package.json 实测锚定；标注 leaderboard/features 为 P1 未实现 | 代码与 Spec 契约对齐 | 第 4/5/6/7/11/12 节 |
| 2026-11-05 | Next 升级至 15.5.x 安全补丁线 | 出海商用不带着已知告警上线 | package.json / lock |
| 2026-11-05 | 正式定名 Threepetal（弃用撞名的 Tiny Haven）；移除虚构用户证言与未兑现功能宣称；花瓣色板收敛为 `--petal-1..5` Token；游戏渲染描述校正为 DOM Grid | 命名查重 + 上线合规 + P0-3 硬编码色值整改 | 全站文案、落地页、GameCanvas、globals.css、README、计划文档、第 1/2/4/7/8/9/10/11 节 |
| 2026-11-05 | 工程目录 `tiny-haven/` → `threepetal/`；建立 git 版本管理并推送 `daotoyi/threepetal`；README 增补英文 How to play | 用户要求目录与仓库同名、玩法文案入文档 | 全项目路径引用、README、.gitignore |
| 2026-11-05 | README 拆为中英双版本：`README.md`（英文，GitHub 默认渲染）+ `README.zh-CN.md`（中文），两份顶部互置左右语言切换栏 | 用户要求 GitHub 上可点击切换语言；GitHub 会过滤 JS/自定义 CSS，故采用原生双文件互链方案 | README.md、README.zh-CN.md、变更记录 |
