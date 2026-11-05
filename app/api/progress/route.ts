import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("game_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("game_progress")
    .upsert(
      {
        user_id: user.id,
        level: body.level ?? 1,
        petals: body.petals ?? 0,
        save_data: body.save_data ?? {},
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
