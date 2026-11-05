import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  verifyWebhookSignature,
  type LSWebhookEvent,
} from "@/lib/lemonsqueezy";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers.get("x-signature");

  if (!secret || !verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: LSWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const admin = createAdminClient();
  const eventName = event.meta.event_name;
  const attrs = event.data.attributes;
  const eventId = event.data.id ?? event.meta.event_id ?? "";
  const orderId = String(attrs.order_number ?? event.data.id ?? "");
  const entitlement = process.env.ENTITLEMENT_FULL_GAME ?? "full_game";
  const configuredVariant = process.env.LEMONSQUEEZY_VARIANT_ID;

  // 幂等标记只在业务成功之后写入：处理中途失败时返回 5xx，
  // 让 LemonSqueezy 重发能重新执行，避免「收了钱却卡在半路」。
  if (eventId) {
    const { data: existing } = await admin
      .from("ls_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (existing) return NextResponse.json({ ok: true, duplicated: true });
  }

  let userId = event.meta.custom_data?.user_id ?? "";

  // 退款 / 订阅类事件通常不携带结账时的 custom_data，按订单号反查归属用户。
  if (!userId && orderId) {
    const { data: purchase } = await admin
      .from("purchases")
      .select("user_id")
      .eq("ls_order_id", orderId)
      .maybeSingle();
    userId = purchase?.user_id ?? "";
  }

  let handled = false;

  if (eventName === "order_created" && userId) {
    const variantId = String(attrs.first_order_item?.variant_id ?? "");
    if (!configuredVariant || variantId === configuredVariant) {
      const { error: licenseError } = await admin.from("licenses").upsert(
        {
          user_id: userId,
          entitlement,
          status: "active",
          product_id: "full_game",
        },
        { onConflict: "user_id,entitlement" },
      );
      const { error: purchaseError } = await admin.from("purchases").upsert(
        {
          user_id: userId,
          ls_order_id: orderId,
          variant_id: variantId,
          status: "completed",
          product_id: "full_game",
        },
        { onConflict: "ls_order_id", ignoreDuplicates: true },
      );
      if (licenseError || purchaseError) {
        return NextResponse.json({ error: "processing failed" }, { status: 500 });
      }
      handled = true;
    }
  }

  if (eventName === "order_refunded" && userId) {
    const { error } = await admin
      .from("licenses")
      .update({ status: "revoked" })
      .eq("user_id", userId)
      .eq("entitlement", entitlement);
    if (error) {
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }
    handled = true;
  }

  if (eventId) {
    await admin.from("ls_events").insert({
      id: eventId,
      event_type: eventName,
      payload: event,
    });
  }

  return NextResponse.json({ ok: true, handled });
}
