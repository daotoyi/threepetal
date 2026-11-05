import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ entitlements: [] });

  const { data } = await supabase
    .from("licenses")
    .select("entitlement")
    .eq("user_id", user.id)
    .eq("status", "active");

  const entitlements = (data ?? []).map((r) => r.entitlement);
  return NextResponse.json({ entitlements });
}
