import { DomainNode, CreateDomainDTO, UpdateDomainDTO } from "../types/domain.types";

// Simulated In-Memory Database
let mockDomainsDb: DomainNode[] = [
  {
    _id: "root-1",
    tenantId: "tenant-a",
    domainName: "University Root",
    parentDomainId: null,
    domainAdminId: null,
    metadata: { domainType: "ROOT", description: "Base enterprise domain" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "dept-cse",
    tenantId: "tenant-a",
    domainName: "Computer Science Dept",
    parentDomainId: "root-1",
    domainAdminId: "admin-2",
    metadata: { domainType: "DEPARTMENT", description: "CSE Department" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "sec-a",
    tenantId: "tenant-a",
    domainName: "Section A",
    parentDomainId: "dept-cse",
    domainAdminId: null,
    metadata: { domainType: "SECTION", description: "3rd Year Section A" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Prevent circular dependencies
const isDescendant = (domains: DomainNode[], targetId: string, potentialChildId: string): boolean => {
  let currentId: string | null = potentialChildId;
  while (currentId) {
    if (currentId === targetId) return true;
    const parent = domains.find(d => d._id === currentId);
    currentId = parent?.parentDomainId || null;
  }
  return false;
};

export const domainApi = {
  // CHANGED: Now returns a flat array instead of building a nested tree
  getTree: async (tenantId: string): Promise<DomainNode[]> => {
    await delay(600);
    return mockDomainsDb.filter(d => d.tenantId === tenantId);
  },

  create: async (tenantId: string, data: CreateDomainDTO): Promise<DomainNode> => {
    await delay(800);
    const newNode: DomainNode = {
      ...data,
      _id: `dom-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      domainAdminId: data.domainAdminId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDomainsDb.push(newNode);
    return newNode;
  },

  update: async (id: string, data: UpdateDomainDTO): Promise<DomainNode> => {
    await delay(700);
    if (data.parentDomainId && isDescendant(mockDomainsDb, id, data.parentDomainId)) {
      throw new Error("409 Conflict: Circular dependency detected.");
    }
    const index = mockDomainsDb.findIndex(d => d._id === id);
    if (index === -1) throw new Error("Not found");
    mockDomainsDb[index] = { ...mockDomainsDb[index], ...data, updatedAt: new Date().toISOString() };
    return mockDomainsDb[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    const hasChildren = mockDomainsDb.some(d => d.parentDomainId === id);
    if (hasChildren) {
      throw new Error("409 Conflict: Cannot delete a domain that has active child domains.");
    }
    mockDomainsDb = mockDomainsDb.filter(d => d._id !== id);
  }
};