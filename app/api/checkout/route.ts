import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/lemonsqueezy";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!storeId || !variantId) {
    return NextResponse.json({ error: "payment not configured" }, { status: 500 });
  }

  try {
    const url = await createCheckout({
      userId: user.id,
      variantId,
      storeId,
      redirectUrl: `${siteUrl}/play?unlocked=1`,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
