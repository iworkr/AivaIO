import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { draft, tone } = await request.json();

  if (!draft || !tone) {
    return NextResponse.json({ error: "Missing draft or tone" }, { status: 400 });
  }

  // In production: call LLM with tone adjustment prompt
  const rewritten = adjustTone(draft, tone);

  return NextResponse.json({ draft: rewritten, tone });
}

function adjustTone(draft: string, tone: string): string {
  // Mock tone adjustment — in production this calls the LLM
  const adjustments: Record<string, (d: string) => string> = {
    Friendly: (d) => `Hey! ${d} 😊 Let me know if there's anything else I can help with!`,
    Professional: (d) => d,
    Brief: (d) => d.split(". ").slice(0, 2).join(". ") + ".",
  };

  return (adjustments[tone] || adjustments.Professional)(draft);
}
