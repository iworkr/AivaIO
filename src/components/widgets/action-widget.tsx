import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import type { ActionWidgetData } from "@/types";

export function ActionWidget({ data }: { data: ActionWidgetData["data"] }) {
  return (
    <div className="rounded-lg border border-[var(--aiva-blue-border)] bg-transparent p-3 flex items-start gap-2">
      <Sparkles size={14} className="text-[var(--aiva-blue)] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {data.suggestion}
        </p>
        <div className="flex gap-2 mt-2">
          {data.actions.map((action) => (
            <Button
              key={action.actionId}
              variant={action.actionType === "primary" ? "blue" : "ghost"}
              size="sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
