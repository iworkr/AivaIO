import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyBriefing } from "@/lib/ai/nexus-engine";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const timezone = "America/New_York";
    const briefing = await generateDailyBriefing(supabase, user.id, timezone);

    return NextResponse.json(briefing);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
