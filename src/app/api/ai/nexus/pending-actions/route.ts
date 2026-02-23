import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePendingAction } from "@/lib/ai/nexus-engine";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("aiva_pending_actions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["pending"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { actionId, decision } = await req.json();
    if (!actionId || !decision) {
      return NextResponse.json({ error: "Missing actionId or decision" }, { status: 400 });
    }

    if (decision === "approve") {
      const result = await executePendingAction(supabase, user.id, actionId);
      return NextResponse.json(result);
    }

    if (decision === "reject") {
      const { error } = await supabase
        .from("aiva_pending_actions")
        .update({ status: "rejected", executed_at: new Date().toISOString() })
        .eq("id", actionId)
        .eq("user_id", user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Action rejected" });
    }

    return NextResponse.json({ error: "Invalid decision (use 'approve' or 'reject')" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
