import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSchedulingRules,
  getFreeBusySlots,
  findAvailableSlots,
  createPendingAction,
} from "@/lib/ai/nexus-engine";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { threadId, taskTitle, estimatedMinutes, deadline } = body;

    if (!threadId || !taskTitle) {
      return NextResponse.json({ error: "Missing threadId or taskTitle" }, { status: 400 });
    }

    const rules = await getSchedulingRules(supabase, user.id);
    const minutes = estimatedMinutes || 60;
    const deadlineDate = deadline || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split("T")[0];
    })();

    const now = new Date();
    const freeBusy = await getFreeBusySlots(
      supabase, user.id,
      now.toISOString().split("T")[0],
      deadlineDate,
      rules
    );

    const available = findAvailableSlots(freeBusy, minutes, 1);

    if (available.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No ${minutes}-minute block available before ${deadlineDate}.`,
      });
    }

    const slot = available[0];

    const action = await createPendingAction(supabase, user.id, {
      type: "timebox_task",
      summary: `Time-block "${taskTitle}" (${minutes}min)`,
      details: {
        threadId,
        task: {
          title: taskTitle,
          deadline: deadlineDate,
          estimatedMinutes: minutes,
          sourceThreadId: threadId,
        },
        calendarEvent: {
          title: `Focus: ${taskTitle}`,
          startTime: slot.start,
          endTime: slot.end,
        },
      },
      sourceThreadId: threadId,
      auditReason: `Task extracted from email and time-blocked via Nexus engine`,
      executedAt: undefined,
    });

    return NextResponse.json({
      success: true,
      pendingActionId: action.id,
      scheduledBlock: {
        start: slot.start,
        end: slot.end,
      },
      task: { title: taskTitle, estimatedMinutes: minutes, deadline: deadlineDate },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
