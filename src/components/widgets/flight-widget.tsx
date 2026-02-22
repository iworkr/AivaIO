import type { FlightWidgetData } from "@/types";

const statusColors: Record<string, { bg: string; text: string }> = {
  ON_TIME: { bg: "rgba(34, 197, 94, 0.1)", text: "#4ADE80" },
  DELAYED: { bg: "rgba(251, 191, 36, 0.1)", text: "#FBBF24" },
  CANCELLED: { bg: "rgba(239, 68, 68, 0.1)", text: "#F87171" },
  BOARDING: { bg: "rgba(59, 130, 246, 0.1)", text: "#3B82F6" },
  LANDED: { bg: "rgba(34, 197, 94, 0.1)", text: "#4ADE80" },
};

export function FlightWidget({ data }: { data: FlightWidgetData["data"] }) {
  const status = statusColors[data.status] || statusColors.ON_TIME;
  const depTime = new Date(data.departure.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const arrTime = new Date(data.arrival.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">
          {data.airline} {data.flightNumber}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: status.bg, color: status.text }}
        >
          {data.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {data.departure.airport}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">{depTime}</p>
        </div>
        <div className="flex-1 mx-6 flex items-center">
          <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
          <span className="mx-3 text-lg text-[var(--text-tertiary)]">✈</span>
          <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {data.arrival.airport}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">{arrTime}</p>
        </div>
      </div>

      <div className="flex gap-6 mt-4 pt-3 border-t border-[var(--border-subtle)]">
        {data.departure.gate && (
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
            Gate {data.departure.gate}
          </span>
        )}
        {data.departure.terminal && (
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
            Terminal {data.departure.terminal}
          </span>
        )}
      </div>
    </div>
  );
}
