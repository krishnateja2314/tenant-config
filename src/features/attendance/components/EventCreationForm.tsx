import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Alert,
  Spinner,
} from "../../../shared/components";
import { useAttendanceStore } from "../../../features/attendance/stores/attendance.store";
import { useDomains } from "../../../features/domains/hooks/useDomains";
import { useErrorMessage } from "../../../hooks/useErrorMessage";
import { useEffect } from "react";

const WEEKDAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

interface EventCreationFormProps {
  tenantId: string;
}

export default function EventCreationForm({
  tenantId,
}: EventCreationFormProps) {
  const { createEvent, loading } = useAttendanceStore();
  const { treeQuery } = useDomains();
  const { error, setError } = useErrorMessage();

  const domains = treeQuery.data || [];
  const [eventType, setEventType] = useState<"ONE_TIME" | "RECURRING">(
    "ONE_TIME",
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:00",
    scheduledDate: new Date().toISOString().split("T")[0],
    recurrenceStartDate: new Date().toISOString().split("T")[0],
    recurrenceEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    recurrenceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
    domainId: "",
  });
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter((d) => d !== day)
        : [...prev.recurrenceDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    try {
      await createEvent(tenantId, {
        title: formData.title,
        description: formData.description,
        eventType,
        domainId: formData.domainId || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        ...(eventType === "ONE_TIME" && {
          scheduledDate: formData.scheduledDate,
        }),
        ...(eventType === "RECURRING" && {
          recurrenceStartDate: formData.recurrenceStartDate,
          recurrenceEndDate: formData.recurrenceEndDate,
          recurrenceDays: formData.recurrenceDays,
        }),
      });

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        startTime: "09:00",
        endTime: "10:00",
        scheduledDate: new Date().toISOString().split("T")[0],
        recurrenceStartDate: new Date().toISOString().split("T")[0],
        recurrenceEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        recurrenceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
        domainId: "",
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(String(error));
    }
  };

  return (
    <Card
      title="Create New Attendance Event"
      subtitle="Configure event details and scheduling"
    >
      {success && <Alert type="success" message="Event created successfully" />}

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Event Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="ONE_TIME"
                checked={eventType === "ONE_TIME"}
                onChange={(e) =>
                  setEventType(e.target.value as "ONE_TIME" | "RECURRING")
                }
                className="h-4 w-4 text-accent"
              />
              <span className="ml-2 text-sm text-text-primary">
                One-Time Event
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="RECURRING"
                checked={eventType === "RECURRING"}
                onChange={(e) =>
                  setEventType(e.target.value as "ONE_TIME" | "RECURRING")
                }
                className="h-4 w-4 text-accent"
              />
              <span className="ml-2 text-sm text-text-primary">
                Recurring Event
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="event-title"
            label="Event Title"
            name="title"
            placeholder="e.g., Biology Lab Session"
            value={formData.title}
            onChange={handleInputChange}
            required
          />

          <div>
            <label
              htmlFor="event-target-domain"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Target Domain
            </label>
            <select
              id="event-target-domain"
              name="domainId"
              value={formData.domainId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, domainId: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Whole Tenant (All Users)</option>
              {domains.map((domain: any) => (
                <option key={domain._id} value={domain._id}>
                  {domain.domainName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="event-description"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Description
          </label>
          <textarea
            id="event-description"
            name="description"
            placeholder="Optional description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-border bg-surface text-text-primary rounded-md text-sm focus:outline-none focus:ring-accent focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="event-start-time"
            label="Start Time"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleInputChange}
            required
          />
          <Input
            id="event-end-time"
            label="End Time"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleInputChange}
            required
          />
        </div>

        {eventType === "ONE_TIME" ? (
          <Input
            id="event-date"
            label="Event Date"
            name="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={handleInputChange}
            required
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="recurrence-start-date"
                label="Recurrence Start Date"
                name="recurrenceStartDate"
                type="date"
                value={formData.recurrenceStartDate}
                onChange={handleInputChange}
                required
              />
              <Input
                id="recurrence-end-date"
                label="Recurrence End Date"
                name="recurrenceEndDate"
                type="date"
                value={formData.recurrenceEndDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Recurrence Days
              </label>
              <div className="grid grid-cols-2 gap-3">
                {WEEKDAYS.map((day) => (
                  <label key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recurrenceDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="h-4 w-4 text-accent"
                    />
                    <span className="ml-2 text-sm text-text-primary">
                      {day.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Spinner size="sm" />
              Creating...
            </>
          ) : (
            "Create Event"
          )}
        </Button>
      </form>
    </Card>
  );
}
