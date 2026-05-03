import { Infrastructure, ComputeLimit, StorageQuota, SpecialAccessFlags, InfrastructureMetadata } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const infrastructureService = {
  // Get all infrastructure allocations for a tenant
  async getInfrastructureByTenant(tenantId: string): Promise<Infrastructure[]> {
    const response = await fetch(`${API_BASE_URL}/api/infrastructure/${tenantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch infrastructure allocations");
    }

    const data = await response.json();
    return data.data;
  },

  // Update or create infrastructure allocation for a domain
  async updateInfrastructure(
    domainId: string,
    updates: {
      storageQuota?: Partial<StorageQuota>;
      computeLimit?: Partial<ComputeLimit>;
      specialAccessFlags?: Partial<SpecialAccessFlags>;
      allocationStatus?: string;
      metadata?: Partial<InfrastructureMetadata>;
    }
  ): Promise<Infrastructure> {
    const response = await fetch(`${API_BASE_URL}/api/infrastructure/${domainId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update infrastructure allocation");
    }

    const data = await response.json();
    return data.data;
  },
};
