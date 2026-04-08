export type DomainType = 'DEPARTMENT' | 'YEAR' | 'SECTION' | 'ROOT';

export interface DomainMetadata {
  domainType: DomainType;
  description: string;
}

export interface DomainNode {
  _id: string;
  tenantId: string;
  domainName: string;
  parentDomainId: string | null;
  domainAdminId: string | null;
  metadata: DomainMetadata;
  createdAt: string;
  updatedAt: string;
  children?: DomainNode[]; 
}

// DTOs for API calls (Restored!)
export interface CreateDomainDTO {
  domainName: string;
  parentDomainId: string | null;
  domainAdminId?: string | null;
  metadata: DomainMetadata;
}

export interface UpdateDomainDTO extends Partial<CreateDomainDTO> {}

// Used to track what needs to be sent to the backend on "Save"
export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface PendingMutation {
  id: string; // The ID of the node being changed
  type: MutationType;
  data?: any; // The payload to send to the backend
}