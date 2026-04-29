export interface AcademicPolicy {
  _id: string;
  tenantId: string;
  domainId: string | null;
  policyType: "ATTENDANCE" | "ELIGIBILITY";
  threshold: number;
  isHardConstraint: boolean;
  actionRestrictions: string[];
  metadata: {
    lastModifiedBy?: string;
    updatedAt?: Date;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyDTO {
  domainId?: string | null;
  threshold: number;
  policyType?: "ATTENDANCE" | "ELIGIBILITY";
  isHardConstraint?: boolean;
  actionRestrictions?: string[];
  description?: string;
}

export interface UpdatePolicyDTO extends CreatePolicyDTO {}

export interface EffectivePolicyResponse {
  policyId: string;
  threshold: number;
  policyType: string;
  isHardConstraint: boolean;
  sourceType: "domain" | "tenant";
  sourceDomainId: string | null;
}

export interface AuditLog {
  _id: string;
  tenantId: string;
  studentId: string;
  domainId: string;
  policyId: string;
  action: string;
  requestPath: string;
  actualAttendance: number;
  requiredThreshold: number;
  decision: "ALLOWED" | "DENIED";
  reasonForDenial?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLogStats {
  totalRequests: number;
  allowed: number;
  denied: number;
  denialRate: string;
}
