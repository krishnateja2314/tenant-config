export interface StorageQuota {
  totalGB: number;
  usedGB: number;
}

export interface ComputeLimit {
  cpuCores: number;
  memoryGB: number;
  maxConcurrentJobs: number;
}

export interface CustomFlag {
  name: string;
  enabled: boolean;
}

export interface SpecialAccessFlags {
  labSystemAccess: boolean;
  biometricAccess: boolean;
  faceRecognitionAccess: boolean;
  deviceIdentityVerification: boolean;
  advancedLabAccess: boolean;
  customFlags?: CustomFlag[];
}

export interface InfrastructureMetadata {
  allocatedBy?: string;
  allocationReason?: string;
  notes?: string;
}

export interface Infrastructure {
  _id: string;
  tenantId: string;
  domainId: string;
  storageQuota: StorageQuota;
  computeLimit: ComputeLimit;
  specialAccessFlags: SpecialAccessFlags;
  allocationStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  metadata: InfrastructureMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  _id: string;
  domainName: string;
}
