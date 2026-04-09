export type DynamicRuleAction = 'AUTO_ADD' | 'APPROVAL_REQUIRED';

export interface DynamicRule {
  action: DynamicRuleAction;
  includeChildren: boolean;
}

export interface MailingList {
  _id: string;
  tenantId: string;
  listName: string;
  domainLinkedId: string;
  dynamicRule: DynamicRule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMailingListDTO {
  listName: string;
  domainLinkedId: string;
  dynamicRule: DynamicRule;
  isActive: boolean;
}

export interface UpdateMailingListDTO extends Partial<CreateMailingListDTO> {}

export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface PendingMLMutation {
  id: string;
  type: MutationType;
  data?: any;
}