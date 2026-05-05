import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createAttendanceEvent,
  deleteAttendanceEvent,
  getAttendanceEvents,
  uploadCSVSessions,
} from "../services/attendanceApi";

interface AttendanceEvent {
  _id: string;
  tenantId: string;
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
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceSession {
  _id: string;
  eventId: string;
  sessionDate: string;
  startAt: string;
  endAt: string;
}

interface AttendanceStore {
  events: AttendanceEvent[];
  selectedEvent: AttendanceEvent | null;
  sessions: AttendanceSession[];
  loading: boolean;
  error: string | null;

  fetchEvents: (tenantId: string) => Promise<void>;
  createEvent: (
    tenantId: string,
    eventData: Omit<
      AttendanceEvent,
      "_id" | "createdAt" | "updatedAt" | "tenantId"
    >,
  ) => Promise<void>;
  deleteEvent: (tenantId: string, eventId: string) => Promise<void>;
  selectEvent: (event: AttendanceEvent) => void;
  clearError: () => void;
  uploadCSV: (
    tenantId: string,
    eventId: string,
    records: Array<{ date: string; start_time: string; end_time: string }>,
  ) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceStore>()(
  devtools((set, get) => ({
    events: [],
    selectedEvent: null,
    sessions: [],
    loading: false,
    error: null,

    fetchEvents: async (tenantId: string) => {
      set({ loading: true, error: null });
      try {
        const response = await getAttendanceEvents(tenantId);
        if (response.success) {
          set({ events: response.data, loading: false });
        } else {
          set({ error: response.message, loading: false });
        }
      } catch (error) {
        set({ error: String(error), loading: false });
      }
    },

    createEvent: async (tenantId: string, eventData: any) => {
      set({ loading: true, error: null });
      try {
        const response = await createAttendanceEvent(tenantId, eventData);
        if (response.success) {
          set((state) => ({
            events: [...state.events, response.data],
            loading: false,
          }));
        } else {
          set({ error: response.message, loading: false });
        }
      } catch (error) {
        set({ error: String(error), loading: false });
      }
    },

    deleteEvent: async (tenantId: string, eventId: string) => {
      set({ loading: true, error: null });
      try {
        const response = await deleteAttendanceEvent(tenantId, eventId);
        if (response.success) {
          set((state) => ({
            events: state.events.filter((event) => event._id !== eventId),
            loading: false,
          }));
        } else {
          set({ error: response.message, loading: false });
        }
      } catch (error) {
        set({ error: String(error), loading: false });
      }
    },

    selectEvent: (event: AttendanceEvent) => {
      set({ selectedEvent: event });
    },

    clearError: () => {
      set({ error: null });
    },

    uploadCSV: async (
      tenantId: string,
      eventId: string,
      records: Array<{ date: string; start_time: string; end_time: string }>,
    ) => {
      set({ loading: true, error: null });
      try {
        const response = await uploadCSVSessions(tenantId, eventId, records);
        if (response.success) {
          set({ loading: false });
        } else {
          set({ error: response.message, loading: false });
        }
      } catch (error) {
        set({ error: String(error), loading: false });
      }
    },
  })),
);
