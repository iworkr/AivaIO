import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyEmailIntent } from "@/lib/ai/nexus-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { threadId } = await req.json();
    if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 });

    const { data: messages } = await supabase
      .from("messages")
      .select("sender_name, sender_email, subject, body, snippet")
      .eq("thread_id", threadId)
      .order("timestamp", { ascending: false })
      .limit(3);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 });
    }

    const latest = messages[0];
    const body = (latest.body as string) || (latest.snippet as string) || "";
    const subject = (latest.subject as string) || "";

    const classification = await classifyEmailIntent(subject, body, latest.sender_email || "");
    return NextResponse.json(classification);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
