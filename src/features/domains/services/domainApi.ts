import { CreateDomainDTO, DomainNode, UpdateDomainDTO } from "../types/domain.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type DomainPayload = {
  domainName?: string;
  parentDomainId?: string | null;
  domainAdminId?: string | null;
  metadata?: {
    domainType?: "DEPARTMENT" | "YEAR" | "SECTION";
    description?: string;
  };
};

const normalizeDomainType = (domainType?: string) => {
  if (!domainType || domainType === "ROOT") {
    return "DEPARTMENT" as const;
  }

  return domainType as "DEPARTMENT" | "YEAR" | "SECTION";
};

const toCreatePayload = (data: CreateDomainDTO): DomainPayload => ({
  domainName: data.domainName,
  parentDomainId: data.parentDomainId ?? null,
  domainAdminId: data.domainAdminId ?? null,
  metadata: {
    domainType: normalizeDomainType(data.metadata?.domainType),
    description: data.metadata?.description || "",
  },
});

const toUpdatePayload = (data: UpdateDomainDTO): DomainPayload => {
  const payload: DomainPayload = {};

  if (typeof data.domainName === "string") {
    payload.domainName = data.domainName;
  }

  if (Object.prototype.hasOwnProperty.call(data, "parentDomainId")) {
    payload.parentDomainId = data.parentDomainId ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(data, "domainAdminId")) {
    payload.domainAdminId = data.domainAdminId ?? null;
  }

  if (data.metadata) {
    payload.metadata = {
      domainType: normalizeDomainType(data.metadata.domainType),
      description: data.metadata.description || "",
    };
  }

  return payload;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    if (body?.message && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // Ignore parse failures and return fallback below.
  }

  return `Request failed with status ${response.status}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const domainApi = {
  getTree: async (tenantId: string): Promise<DomainNode[]> => {
    const response = await fetch(`${API_BASE_URL}/api/domains/tree/${tenantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    return handleResponse<DomainNode[]>(response);
  },

  create: async (tenantId: string, data: CreateDomainDTO): Promise<DomainNode> => {
    const response = await fetch(`${API_BASE_URL}/api/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...toCreatePayload(data), tenantId }),
    });

    return handleResponse<DomainNode>(response);
  },

  update: async (id: string, data: UpdateDomainDTO): Promise<DomainNode> => {
    const response = await fetch(`${API_BASE_URL}/api/domains/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(toUpdatePayload(data)),
    });

    return handleResponse<DomainNode>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/domains/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  },
};
