import { useState } from "react";
import { Button, Card, Alert, Spinner } from "../../../shared/components";
import { useAttendanceStore } from "../../../features/attendance/stores/attendance.store";
import { useErrorMessage } from "../../../hooks/useErrorMessage";

interface CSVUploadFormProps {
  tenantId: string;
  events: any[];
}

interface CSVRecord {
  date: string;
  start_time: string;
  end_time: string;
}

export default function CSVUploadForm({
  tenantId,
  events,
}: CSVUploadFormProps) {
  const { uploadCSV, loading } = useAttendanceStore();
  const { error, setError } = useErrorMessage();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [csvRecords, setCsvRecords] = useState<CSVRecord[]>([]);
  const { error: parseError, setError: setParseError } = useErrorMessage();
  const [success, setSuccess] = useState(false);
  const [recordsImported, setRecordsImported] = useState(0);

  const parseCSV = (content: string): CSVRecord[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have header and at least one data row");
    }

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());
    const dateIdx = headers.indexOf("date");
    const startTimeIdx = headers.indexOf("start_time");
    const endTimeIdx = headers.indexOf("end_time");

    if (dateIdx === -1 || startTimeIdx === -1 || endTimeIdx === -1) {
      throw new Error("CSV must have columns: date, start_time, end_time");
    }

    const records: CSVRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      if (cells.length > Math.max(dateIdx, startTimeIdx, endTimeIdx)) {
        records.push({
          date: cells[dateIdx],
          start_time: cells[startTimeIdx],
          end_time: cells[endTimeIdx],
        });
      }
    }

    return records;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setParseError(null);
        const content = event.target?.result as string;
        const records = parseCSV(content);
        setCsvRecords(records);
      } catch (err) {
        setParseError(String(err));
        setCsvRecords([]);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId || csvRecords.length === 0) {
      setParseError("Please select an event and upload a valid CSV file");
      return;
    }

    setSuccess(false);
    await uploadCSV(tenantId, selectedEventId, csvRecords);
    setSuccess(true);
    setRecordsImported(csvRecords.length);
    setCsvRecords([]);
    setSelectedEventId("");

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card>
      {success && (
        <Alert
          type="success"
          message={`${recordsImported} sessions imported successfully`}
        />
      )}

      {error && <Alert type="error" message={error} />}

      {parseError && <Alert type="error" message={parseError} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="csv-upload-event-select"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Select Event
          </label>
          <select
            id="csv-upload-event-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border bg-surface rounded-md text-sm text-text-primary focus:outline-none focus:ring-accent focus:border-accent"
          >
            <option value="">-- Select an event --</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="csv-upload-file-input"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Upload CSV File
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-accent cursor-pointer transition bg-surface">
            <input
              id="csv-upload-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full cursor-pointer"
            />
            <p className="text-xs text-text-muted mt-2">
              CSV format: date, start_time, end_time
            </p>
            <p className="text-xs text-text-muted">
              Example: 2024-01-15, 09:00, 10:00
            </p>
          </div>
        </div>

        {csvRecords.length > 0 && (
          <div>
            <label
              htmlFor="csv-upload-preview-table"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Preview ({csvRecords.length} records)
            </label>
            <div
              id="csv-upload-preview-table"
              className="overflow-x-auto border border-border rounded-md"
            >
              <table className="min-w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-text-muted">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-text-muted">
                      Start Time
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-text-muted">
                      End Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvRecords.slice(0, 5).map((record, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-surface" : "bg-surface-2"}
                    >
                      <td className="px-4 py-2 text-text-primary">
                        {record.date}
                      </td>
                      <td className="px-4 py-2 text-text-primary">
                        {record.start_time}
                      </td>
                      <td className="px-4 py-2 text-text-primary">
                        {record.end_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRecords.length > 5 && (
                <div className="px-4 py-2 bg-surface-2 text-sm text-text-muted">
                  ... and {csvRecords.length - 5} more records
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !selectedEventId || csvRecords.length === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">Importing...</span>
            </>
          ) : (
            "Import Sessions"
          )}
        </Button>
      </form>
    </Card>
  );
}
