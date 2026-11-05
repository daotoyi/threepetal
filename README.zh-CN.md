<div align="center">

[English](README.md) &nbsp; | &nbsp; **简体中文**

</div>

# Threepetal

> Threepetal is a quiet, ad-free puzzle garden: match three petals at a time, earn them back, and grow a little haven you own forever.

一款面向欧美市场的无广告、买断制（$4.99）治愈系三消解谜游戏，带云端存档。凑花瓣、布置小花园，一次买断永久拥有。

- **品牌标语：** *Three petals at a time.*
- **技术栈：** Next.js 15 (App Router) + Supabase (Postgres / Auth / RLS) + LemonSqueezy（MoR 商户代管，自动处理全球销售税）
- **仓库：** https://github.com/daotoyi/threepetal
- **唯一契约：** 行为与验收标准以 `Spec.md` 为准。

> 原工作名 Tiny Haven 因与 `tinyhaven.gg`（网页端 cozy 生活模拟，同赛道）撞名弃用；工程目录与 npm 包名均为 `threepetal`。

## 怎么玩

1. 点击两朵相邻的花瓣交换位置。
2. 把三个及以上同色花瓣连成一线即可消除，每消除一格获得 2 枚花瓣。
3. 在步数用尽前达到本关的花瓣目标。凑不出三消的交换不生效，也不扣步数。
4. 用花瓣购买花园装饰，进度自动保存到云端。

没有计时器，没有广告。前 3 关免费，一次 $4.99 买断解锁全部 6 关。

> 关卡数据见 `lib/game/levels.ts`：6 关（免费 3 + 付费 3），首关 5×5 / 30 花瓣 / 12 步，第 6 关 8×8 / 130 花瓣 / 22 步。扩关卡时请同步更新本节与 `/unlock` 页的 "All 6 chapters" 表述。

英文玩法文案见 [README.md 的 How to play](README.md#how-to-play)。

## 目录结构

```
app/
  page.tsx             落地页（真实游戏预览 Hero）
  play/page.tsx        游戏页（关卡选择 + 画布 + 装饰面板 + 云端存档）
  unlock/page.tsx      支付页（LemonSqueezy 结账）
  account/page.tsx     账户页（邮箱 magic link 登录 + 恢复购买）
  api/checkout         创建 LS 结账会话
  api/webhook          LS Webhook（验签 + 幂等 + 写 licenses）
  api/entitlements     服务端解锁校验（真相源）
  api/progress         云端存档读写
components/            ui / SiteHeader / SiteFooter / GameCanvas / DecorationPanel
lib/supabase/          browser + server 客户端（@supabase/ssr）
lib/lemonsqueezy.ts    checkout 创建 + webhook 签名校验
lib/game/              types / engine（match-3） / levels
supabase/migrations/   0001_init.sql（含 RLS 与唯一索引）
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写（详见下方账号开通步骤）：

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_VARIANT_ID / LEMONSQUEEZY_WEBHOOK_SECRET
NEXT_PUBLIC_SITE_URL
ENTITLEMENT_FULL_GAME=full_game
```

仓库中不含任何真实凭证。

## 本地运行

```bash
npm install
npm run dev            # http://localhost:3000
```

> Vercel Hobby 禁止商用，上线必须 Vercel Pro；Supabase 免费层会暂停且无备份，生产用 Pro。

## 开通账号（一次性）

1. **Supabase**：新建项目 → SQL Editor 执行 `supabase/migrations/0001_init.sql` → Project Settings 取 URL / anon / service_role key。
2. **LemonSqueezy**：注册商家（KYC）→ 建 Product「Full Game Unlock」$4.99（一次性）→ 取 Store ID、Variant ID → Settings → Webhooks 建端点指向 `https://<你的域名>/api/webhook`，生成 Webhook Secret。沙箱测试用 LS Sandbox 环境同理。

## 支付全流程测试（沙箱）

1. 启动 dev，登录账户页（magic link）。
2. 进入 `/unlock` 点「Unlock」→ 前端 POST `/api/checkout` → 返回 LS 结账 URL → 跳转。
3. 用 LS Sandbox / Simulator 完成测试支付 → LS 触发 `order_created` webhook。
4. Webhook 验签通过 → 写 `purchases` / `licenses`(`full_game`, active) 成功后才落 `ls_events` 幂等标记；写入失败返回 5xx，让 LS 重发补齐。
5. 前端 `/api/entitlements` 返回 `full_game` → 付费关卡解锁、装饰面板可用、云端存档生效。
6. 换设备点「Restore」→ 凭 license 还原解锁状态。

退款事件（`order_refunded`）按 `purchases.ls_order_id` 反查用户并撤销权限，因为退款事件不带 `custom_data.user_id`。

## 质量门禁（专家团 P0）

- 全程 Lucide SVG 图标，零 emoji 图标；禁止紫→粉渐变；组件仅引用 Design Token（禁硬编码色值）。
- 解锁真相源 = `licenses` 表，仅由 webhook 经 service_role 写入；前端 gate 仅为 UX。
- Webhook 签名校验 + 事件幂等 + RLS 强制，防客户端伪造与重放。
- 落地页与支付页只陈述已实现能力，禁止虚构用户证言与未兑现的功能宣称。

## 当前状态

代码、玩法循环与支付链路均已实现，并通过生产构建与运行时冒烟测试。仍未完成：

- 第三方凭证：Supabase 建库并执行 migration、LemonSqueezy 沙箱支付联调、Vercel Pro 上线。
- 隐私政策、退款政策与 GDPR 注销链路**尚未实现**。
- 上线前须完成 USPTO / EUIPO 商标、域名与应用商店名称查重。
