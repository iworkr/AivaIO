import { MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui";

interface AccommodationData {
  name: string;
  imageUrl?: string;
  checkIn: string;
  checkOut?: string;
  confirmationNumber: string;
  address?: string;
}

export function AccommodationWidget({ data }: { data: AccommodationData }) {
  const checkInDate = new Date(data.checkIn);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
      <div className="flex gap-4">
        {data.imageUrl && (
          <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface-hover)]">
            <img
              src={data.imageUrl}
              alt={data.name}
              className="w-full h-full object-cover grayscale-[20%]"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{data.name}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Calendar size={10} className="text-[var(--text-tertiary)]" />
              Check-in: {checkInDate.toLocaleDateString([], { month: "short", day: "numeric" })} at {checkInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Conf: <span className="font-mono">{data.confirmationNumber}</span>
            </p>
          </div>
        </div>
      </div>
      {data.address && (
        <Button variant="ghost" size="sm" className="w-full mt-3 justify-center">
          <MapPin size={12} /> Get Directions
        </Button>
      )}
    </div>
  );
}
