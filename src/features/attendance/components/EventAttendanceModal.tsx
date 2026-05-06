import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
} from "../../../shared/components";
import { getEventRecords, overrideAttendance } from "../services/attendanceApi";
import { useErrorMessage } from "../../../hooks/useErrorMessage";

interface EventAttendanceModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function EventAttendanceModal({
  eventId,
  eventTitle,
  onClose,
}: EventAttendanceModalProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError } = useErrorMessage();
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overriding, setOverriding] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEventRecords(eventId);
      if (response.success) {
        setRecords(response.data);
      } else {
        setError(response.message || "Failed to load records");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [eventId]);

  const handleOverride = async (email: string, action: "MARK" | "UNMARK") => {
    if (!email) {
      setError("Please enter a user email.");
      return;
    }
    setOverriding(true);
    setError(null);
    try {
      const response = await overrideAttendance(eventId, email, action);
      if (response.success) {
        setOverrideEmail("");
        fetchRecords(); // Refresh the list
      } else {
        setError(response.message || "Failed to override attendance");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-surface border-border shadow-2xl relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-text-primary">
            Attendance Records
          </h2>
          <p className="text-sm text-text-muted mt-1">{eventTitle}</p>
        </div>

        {error && <Alert type="error" message={error} />}

        <div className="bg-surface-2 p-4 rounded-xl border border-border mb-6 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label
              htmlFor="attendance-override-email"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              Manual Override (Email)
            </label>
            <input
              id="attendance-override-email"
              type="email"
              value={overrideEmail}
              onChange={(e) => setOverrideEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => handleOverride(overrideEmail, "MARK")}
            disabled={overriding || !overrideEmail}
          >
            {overriding ? <Spinner size="sm" /> : "Mark Present"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <p>No attendance records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase text-text-muted tracking-widest sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Marked At</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record._id}
                      className="border-t border-border hover:bg-surface-2 transition-colors"
                    >
                      <td className="px-4 py-3 text-text-primary font-medium">
                        {record.userId?.name || "Unknown User"}
                        <div className="text-xs text-text-muted font-normal">
                          {record.userId?.email || record.userId?._id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {new Date(record.markedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            record.source === "ADMIN_OVERRIDE"
                              ? "error"
                              : "default"
                          }
                        >
                          {record.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to revoke attendance for this student?",
                              )
                            ) {
                              handleOverride(record.userId?.email, "UNMARK");
                            }
                          }}
                          disabled={overriding}
                          className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 px-3 py-1 rounded bg-red-900/20 hover:bg-red-900/40"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
