import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import { academicPolicyApi } from "../services/academicPolicyApi";
import { AuditLog, AuditLogStats } from "../types/academicPolicy.types";
import { Card, Badge, Alert, Button } from "../../../shared/components";

export const AuditLogViewer = () => {
  const admin = useAuthStore((s) => s.admin);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDecision, setFilterDecision] = useState<
    "" | "ALLOWED" | "DENIED"
  >("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 50,
    hasMore: false,
    total: 0,
  });

  const tenantId = admin?.tenantId;

  const fetchLogs = async (skip: number = 0) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, pagination: paginationData } =
        await academicPolicyApi.getAuditLogs(
          tenantId,
          pagination.limit,
          skip,
          filterStudentId || undefined,
          filterDecision || undefined,
        );

      setLogs(data);
      setPagination({
        skip,
        limit: pagination.limit,
        hasMore: paginationData.hasMore,
        total: paginationData.total,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!tenantId) return;

    try {
      const statsData = await academicPolicyApi.getAuditStats(tenantId);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchLogs(0);
      fetchStats();
    }
  }, [tenantId, filterDecision, filterStudentId]);

  const getDecisionColor = (decision: "ALLOWED" | "DENIED") => {
    return decision === "ALLOWED" ? "success" : "error";
  };

  const formatDate = (date: Date | string) => new Date(date).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-text-primary">Audit Logs</h2>
        <p className="text-sm text-text-muted">
          Monitor attendance enforcement decisions and review compliance
          history.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Total Requests">
            <p className="text-3xl font-bold text-text-primary">
              {stats.totalRequests}
            </p>
          </Card>
          <Card title="Allowed">
            <p className="text-3xl font-bold text-emerald-600">
              {stats.allowed}
            </p>
          </Card>
          <Card title="Denied">
            <p className="text-3xl font-bold text-rose-600">{stats.denied}</p>
          </Card>
          <Card title="Denial Rate">
            <p className="text-3xl font-bold text-amber-500">
              {stats.denialRate}%
            </p>
          </Card>
        </div>
      )}

      <Card
        title="Audit Filters"
        subtitle="Filter enforcement logs by student and decision outcome."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Student ID
            </label>
            <input
              type="text"
              placeholder="Enter student ID"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Decision
            </label>
            <select
              value={filterDecision}
              onChange={(e) =>
                setFilterDecision(e.target.value as "" | "ALLOWED" | "DENIED")
              }
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All Decisions</option>
              <option value="ALLOWED">Allowed</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setFilterStudentId("");
                setFilterDecision("");
                fetchLogs(0);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`Enforcement Logs (${pagination.total})`}>
        {loading ? (
          <div className="text-center py-8 text-text-muted">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-3xl">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase text-text-muted tracking-widest">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-t border-border hover:bg-surface"
                  >
                    <td className="px-4 py-4 text-text-muted">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-4 text-text-primary font-medium">
                      {log.studentId}
                    </td>
                    <td className="px-4 py-4 text-text-muted">{log.action}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-semibold ${
                          log.actualAttendance >= log.requiredThreshold
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {log.actualAttendance}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-muted">
                      {log.requiredThreshold}%
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getDecisionColor(log.decision)}>
                        {log.decision}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-text-muted">
              Showing {pagination.skip + 1} -{" "}
              {Math.min(pagination.skip + pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  fetchLogs(Math.max(0, pagination.skip - pagination.limit))
                }
                disabled={pagination.skip === 0}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={() => fetchLogs(pagination.skip + pagination.limit)}
                disabled={!pagination.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogViewer;
