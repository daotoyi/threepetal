import crypto from "node:crypto";

const LS_API = "https://api.lemonsqueezy.com/v1";

export type CheckoutInput = {
  userId: string;
  variantId: string;
  storeId: string;
  redirectUrl: string;
};

/**
 * 创建 LemonSqueezy 托管结账会话（MoR）。
 * 返回的 url 直接前端跳转即可，税务/VAT 由 LS 自动处理。
 */
export async function createCheckout({
  userId,
  variantId,
  storeId,
  redirectUrl,
}: CheckoutInput): Promise<string> {
  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          custom_data: { user_id: userId },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LemonSqueezy checkout failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) throw new Error("LemonSqueezy did not return a checkout url");
  return url as string;
}

/** 校验 LS webhook 签名（HMAC-SHA256，常量时间比较）。 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type LSWebhookEvent = {
  meta: {
    event_name: string;
    event_id?: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id?: string;
    attributes: {
      user_email?: string;
      order_number?: number;
      first_order_item?: { variant_id?: number | string };
    };
  };
};
