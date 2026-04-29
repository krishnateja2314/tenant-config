import {
  AcademicPolicy,
  CreatePolicyDTO,
  EffectivePolicyResponse,
  AuditLog,
  AuditLogStats,
} from "../types/academicPolicy.types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const academicPolicyApi = {
  // ── Academic Policy Management ──
  getPolicies: async (tenantId: string): Promise<AcademicPolicy[]> => {
    const response = await fetch(`${API_BASE}/academic-policies/${tenantId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch policies: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  resolveEffectivePolicy: async (
    tenantId: string,
    domainId: string,
  ): Promise<EffectivePolicyResponse> => {
    const response = await fetch(
      `${API_BASE}/academic-policies/${tenantId}/resolve/${domainId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to resolve policy: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  createPolicy: async (
    tenantId: string,
    policy: CreatePolicyDTO,
  ): Promise<AcademicPolicy> => {
    const response = await fetch(`${API_BASE}/academic-policies/${tenantId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policy),
    });

    if (!response.ok) {
      throw new Error(`Failed to create policy: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  updatePolicy: async (
    tenantId: string,
    policy: CreatePolicyDTO & { _id: string },
  ): Promise<AcademicPolicy> => {
    const { _id, ...policyData } = policy;
    const response = await fetch(`${API_BASE}/academic-policies/${tenantId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update policy: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  deletePolicy: async (tenantId: string, policyId: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE}/academic-policies/${tenantId}/${policyId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete policy: ${response.statusText}`);
    }
  },

  // ── Audit Log Management ──
  getAuditLogs: async (
    tenantId: string,
    limit: number = 50,
    skip: number = 0,
    studentId?: string,
    decision?: "ALLOWED" | "DENIED",
  ): Promise<{ data: AuditLog[]; pagination: any }> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    if (studentId) params.append("studentId", studentId);
    if (decision) params.append("decision", decision);

    const response = await fetch(
      `${API_BASE}/audit-logs/${tenantId}?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }

    const data = await response.json();
    return { data: data.data, pagination: data.pagination };
  },

  getStudentAuditLogs: async (
    tenantId: string,
    studentId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<{ data: AuditLog[]; pagination: any }> => {
    const response = await fetch(
      `${API_BASE}/audit-logs/${tenantId}/student/${studentId}?limit=${limit}&skip=${skip}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch student audit logs: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return { data: data.data, pagination: data.pagination };
  },

  getDomainAuditLogs: async (
    tenantId: string,
    domainId: string,
    limit: number = 50,
    skip: number = 0,
    decision?: "ALLOWED" | "DENIED",
  ): Promise<{ data: AuditLog[]; pagination: any }> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    if (decision) params.append("decision", decision);

    const response = await fetch(
      `${API_BASE}/audit-logs/${tenantId}/domain/${domainId}?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch domain audit logs: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return { data: data.data, pagination: data.pagination };
  },

  getAuditStats: async (tenantId: string): Promise<AuditLogStats> => {
    const response = await fetch(
      `${API_BASE}/audit-logs/${tenantId}/stats/summary`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch audit statistics: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.data;
  },
};
