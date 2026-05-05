import { useState } from "react";
import { Card, Badge } from "../../../shared/components";
import EventAttendanceModal from "./EventAttendanceModal";
import { useDomains } from "../../../features/domains/hooks/useDomains";

interface AttendanceEvent {
  _id: string;
  title: string;
  eventType: "ONE_TIME" | "RECURRING";
  scheduledDate?: string;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceDays?: string[];
  startTime: string;
  endTime: string;
  domainId?: string;
}

interface EventListProps {
  events: AttendanceEvent[];
  tenantId: string;
  onDeleteEvent: (eventId: string) => void;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (time: string) => {
  return time;
};

export default function EventList({
  events,
  tenantId,
  onDeleteEvent,
}: EventListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = events.find((e) => e._id === selectedEventId);
  const { treeQuery } = useDomains();
  
  const domains = treeQuery.data || [];

  const getDomainName = (domainId?: string | null) => {
    if (!domainId) return "Whole Tenant";
    const domain = domains.find((d: any) => d._id === domainId);
    return domain ? domain.domainName : "Unknown Domain";
  };

  if (events.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-text-primary">No events created yet</p>
          <p className="text-sm text-text-muted mt-2">
            Create your first attendance event to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Card key={event._id}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-text-primary">
                  {event.title}
                </h3>
                <Badge
                  variant={
                    event.eventType === "ONE_TIME" ? "default" : "success"
                  }
                >
                  {event.eventType === "ONE_TIME" ? "One-Time" : "Recurring"}
                </Badge>
                <Badge variant="default">
                  {getDomainName(event.domainId)}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Time</p>
                  <p className="text-text-primary font-medium">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>

                {event.eventType === "ONE_TIME" ? (
                  <div>
                    <p className="text-text-muted">Date</p>
                    <p className="text-text-primary font-medium">
                      {formatDate(event.scheduledDate)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-text-muted">Period & Days</p>
                    <p className="text-text-primary font-medium">
                      {formatDate(event.recurrenceStartDate)} -{" "}
                      {formatDate(event.recurrenceEndDate)}
                    </p>
                    {event.recurrenceDays && event.recurrenceDays.length > 0 && (
                      <p className="text-xs text-text-muted mt-1">
                        {event.recurrenceDays.map(d => d.substring(0,3)).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="ml-4 flex gap-2">
              <button
                className="px-3 py-2 text-sm font-medium text-blue-400 bg-blue-900/30 rounded-md hover:bg-blue-900/50"
                onClick={() => setSelectedEventId(event._id)}
              >
                View Attendance
              </button>
              <button
                className="px-3 py-2 text-sm font-medium text-accent bg-accent/10 rounded-md hover:bg-accent/20"
                onClick={() => {
                  const url = `${window.location.origin}/mark_attendance/${event._id}`;
                  navigator.clipboard.writeText(url);
                  alert("Attendance link copied to clipboard:\n" + url);
                }}
              >
                Copy Link
              </button>
              <button
                className="px-3 py-2 text-sm font-medium text-red-400 bg-red-900/30 rounded-md hover:bg-red-900/50"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this event?")) {
                    onDeleteEvent(event._id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Card>
      ))}

      {selectedEventId && selectedEvent && (
        <EventAttendanceModal
          eventId={selectedEvent._id}
          eventTitle={selectedEvent.title}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}
