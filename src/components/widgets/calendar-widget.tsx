import { Calendar, MapPin, Users, Video } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { CalendarWidgetData } from "@/types";

export function CalendarWidget({ data }: { data: CalendarWidgetData["data"] }) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const timeStr = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const dateStr = start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-[var(--aiva-blue)]" />
        <span className="text-xs font-medium text-[var(--text-primary)]">{data.title}</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Calendar size={12} className="text-[var(--text-tertiary)]" />
          <span>{dateStr} · {timeStr}</span>
        </div>

        {data.location && (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <MapPin size={12} className="text-[var(--text-tertiary)]" />
            <span>{data.location}</span>
          </div>
        )}

        {data.conferenceUrl && (
          <div className="flex items-center gap-2">
            <Video size={12} className="text-[var(--text-tertiary)]" />
            <a href={data.conferenceUrl} className="text-[var(--aiva-blue)] hover:underline text-xs" target="_blank" rel="noopener noreferrer">
              Join Meeting
            </a>
          </div>
        )}

        {data.attendees.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <Users size={12} className="text-[var(--text-tertiary)]" />
            <div className="flex -space-x-1">
              {data.attendees.slice(0, 4).map((a, i) => (
                <Avatar key={i} initials={a.name.split(" ").map(n => n[0]).join("").slice(0, 2)} size="sm" />
              ))}
              {data.attendees.length > 4 && (
                <span className="text-[10px] text-[var(--text-tertiary)] ml-2">+{data.attendees.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
