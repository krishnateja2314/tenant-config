import { useEffect, useState } from "react";
import { useParams, useSearch } from "@tanstack/react-router";
import { Button, Card, Spinner, Alert } from "../shared/components";
import {
  markAttendance,
  checkTimeWindow,
} from "../features/attendance/services/attendanceApi";
import { useAuthStore } from "../stores/auth.store";
import { useErrorMessage } from "../hooks/useErrorMessage";

interface MarkAttendanceSearchParams {
  callbackUrl?: string;
}

export default function MarkAttendancePage() {
  const { eventId } = useParams({
    from: "/mark_attendance/$eventId",
  });
  const searchParams = useSearch({
    from: "/mark_attendance/$eventId",
  });
  const callbackUrl = (searchParams as MarkAttendanceSearchParams)?.callbackUrl;

  const [loading, setLoading] = useState(false);
  const { error, setError } = useErrorMessage();
  const [success, setSuccess] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [timeWindow, setTimeWindow] = useState<{
    isWithinWindow: boolean;
    minutesRemaining: number;
    hasMarked?: boolean;
  } | null>(null);
  const [checkingTime, setCheckingTime] = useState(true);

  const admin = useAuthStore((state) => state.admin);
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    // We will handle redirect to auth after getting tenantId from checkTimeWindow
    if (!eventId) {
      setError("Missing event information");
      return;
    }

    const checkTimeWindowFunc = async () => {
      try {
        setCheckingTime(true);
        const response = await checkTimeWindow(eventId, token || undefined);

        if (response.success) {
          const fetchedTenantId = response.data.tenantId;

          // If user doesn't have a token, enforce login
          if (!token) {
            const currentUrl = window.location.pathname + window.location.search;
            const authUrl = `/tenantconfig/auth/${fetchedTenantId}?callbackUrl=${encodeURIComponent(currentUrl)}`;
            window.location.href = authUrl;
            return;
          }

          setTimeWindow({
            isWithinWindow: response.data.isWithinWindow,
            minutesRemaining: response.data.minutesRemaining,
            hasMarked: response.data.hasMarked,
          });
        } else {
          setTimeWindow({
            isWithinWindow: false,
            minutesRemaining: 0,
            hasMarked: false,
          });
        }
      } catch (err) {
        console.error("Failed to check time window", err);
        setTimeWindow({
          isWithinWindow: false,
          minutesRemaining: 0,
        });
      } finally {
        setCheckingTime(false);
      }
    };

    checkTimeWindowFunc();
    const interval = setInterval(checkTimeWindowFunc, 30000);
    return () => clearInterval(interval);
  }, [eventId, admin?.tenantId, token]);

  const handleMarkAttendance = async () => {
    if (!eventId || !token) {
      setError("Missing event information or auth token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await markAttendance(eventId, token);

      if (response.success) {
        setSuccess(true);
        setAttendanceStats(response.data.attendanceStats);

        if (callbackUrl) {
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 2000);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(`Failed to mark attendance: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4">
      <Card className="max-w-md w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Mark Attendance
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Click the button below to mark your attendance
            </p>
          </div>

          {error && <Alert type="error" message={error} />}

          {success && (
            <Alert
              type="success"
              message="Your attendance has been recorded successfully"
            />
          )}

          {checkingTime ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-text-muted">
                Checking time window...
              </span>
            </div>
          ) : timeWindow && !timeWindow.isWithinWindow ? (
            <Alert
              type="info"
              message="You can only mark attendance during the scheduled session time"
            />
          ) : null}

          {timeWindow && timeWindow.isWithinWindow && (
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-sm font-medium text-green-400">
                ✓ Within Marking Window
              </p>
              <p className="mt-2 text-xs text-green-300">
                Time remaining: {timeWindow.minutesRemaining} minutes
              </p>
            </div>
          )}

          {timeWindow && timeWindow.hasMarked && !success && (
            <Alert
              type="info"
              message="You have already marked attendance for this session."
            />
          )}

          {attendanceStats && (
            <div className="bg-surface-2 border border-border rounded-lg p-4">
              <p className="text-sm font-medium text-accent">
                Your Attendance Stats
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-text-muted">Attended</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {attendanceStats.attended}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Total</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {attendanceStats.total}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Percentage</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {attendanceStats.attendancePercentage}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleMarkAttendance}
            disabled={
              loading ||
              success ||
              checkingTime ||
              (timeWindow && !timeWindow.isWithinWindow) ||
              (timeWindow && timeWindow.hasMarked) ||
              !eventId
            }
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Marking...</span>
              </>
            ) : success ? (
              "Attendance Marked ✓"
            ) : (
              "Mark Attendance"
            )}
          </Button>

          {callbackUrl && (
            <p className="text-xs text-text-muted text-center">
              You will be returned to your original location in a few seconds
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
