const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const parseApiResponse = async (response: Response) => {
  const text = await response.text();
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      payload?.error ||
      payload?.errors?.[0]?.message ||
      text?.trim() ||
      response.statusText;
    throw new Error(`${errorMessage} (${response.status})`);
  }

  return payload;
};

export const createAttendanceEvent = async (
  tenantId: string,
  eventData: {
    domainId?: string;
    title: string;
    description?: string;
    eventType: "ONE_TIME" | "RECURRING";
    scheduledDate?: string;
    startTime: string;
    endTime: string;
    recurrenceStartDate?: string;
    recurrenceEndDate?: string;
    recurrenceDays?: string[];
  },
) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/create-event`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    },
  );
  return parseApiResponse(response);
};

export const getAttendanceEvents = async (tenantId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/events`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return parseApiResponse(response);
};

export const getAttendanceEvent = async (tenantId: string, eventId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/events/${eventId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return parseApiResponse(response);
};

export const deleteAttendanceEvent = async (
  tenantId: string,
  eventId: string,
) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/events/${eventId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return parseApiResponse(response);
};

export const uploadCSVSessions = async (
  tenantId: string,
  eventId: string,
  records: Array<{
    date: string;
    start_time: string;
    end_time: string;
  }>,
) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/upload-csv`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, records }),
    },
  );
  return parseApiResponse(response);
};

export const checkTimeWindow = async (eventId: string, token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(
    `${API_BASE_URL}/mark-attendance/${eventId}/check-window`,
    {
      method: "GET",
      headers,
    },
  );
  return parseApiResponse(response);
};

export const markAttendance = async (eventId: string, token: string) => {
  const response = await fetch(
    `${API_BASE_URL}/mark-attendance/${eventId}/mark`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    },
  );
  return parseApiResponse(response);
};

export const getEventRecords = async (eventId: string) => {
  const authStoreStr = sessionStorage.getItem("tc-auth");
  let tenantId = "";
  if (authStoreStr) {
    try {
      const parsed = JSON.parse(authStoreStr);
      tenantId = parsed.state?.admin?.tenantId || "";
    } catch (e) {}
  }

  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/events/${eventId}/records`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  return parseApiResponse(response);
};

export const overrideAttendance = async (
  eventId: string,
  userEmail: string,
  action: "MARK" | "UNMARK"
) => {
  const authStoreStr = sessionStorage.getItem("tc-auth");
  let tenantId = "";
  if (authStoreStr) {
    try {
      const parsed = JSON.parse(authStoreStr);
      tenantId = parsed.state?.admin?.tenantId || "";
    } catch (e) {}
  }

  const response = await fetch(
    `${API_BASE_URL}/attendance-events/${tenantId}/events/${eventId}/override`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail, action }),
    },
  );
  return parseApiResponse(response);
};

export const verifyAttendance = async (
  eventId: string,
  userId: string,
  tenantId?: string,
) => {
  const url = tenantId
    ? `/mark-attendance/${eventId}/${userId}/verify?tenantId=${tenantId}`
    : `/mark-attendance/${eventId}/${userId}/verify`;
  const response = await fetch(`${API_BASE_URL}${url}`);
  return parseApiResponse(response);
};
