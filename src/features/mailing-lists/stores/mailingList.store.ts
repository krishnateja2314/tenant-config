import { create } from "zustand";
import { MailingList, PendingMLMutation } from "../types/mailingList.types";

interface MLWorkspaceState {
  // UI State
  selectedListId: string | null;
  isCreating: boolean;
  isEditing: boolean;

  // Data & History
  localLists: MailingList[];
  pastStates: MailingList[][];
  futureStates: MailingList[][];
  pendingMutations: PendingMLMutation[];

  // Actions
  setSelectedListId: (id: string | null) => void;
  setIsCreating: (isCreating: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  
  // Workspace Engine
  initWorkspace: (lists: MailingList[]) => void;
  commitLocalChange: (newLists: MailingList[], mutation: PendingMLMutation) => void;
  undo: () => void;
  redo: () => void;
}

export const useMLWorkspaceStore = create<MLWorkspaceState>((set) => ({
  selectedListId: null,
  isCreating: false,
  isEditing: false,
  localLists: [],
  pastStates: [],
  futureStates: [],
  pendingMutations: [],

  setSelectedListId: (id) => set({ selectedListId: id, isCreating: false, isEditing: false }),
  setIsCreating: (isCreating) => set({ isCreating, isEditing: false, selectedListId: null }),
  setIsEditing: (isEditing) => set({ isEditing, isCreating: false }),

  initWorkspace: (lists) => set({ localLists: lists, pastStates: [], futureStates: [], pendingMutations: [] }),

  commitLocalChange: (newLists, mutation) => set((state) => {
    let updatedMutations = [...state.pendingMutations];
    if (mutation.type === 'UPDATE') {
      const existingCreate = updatedMutations.find(m => m.id === mutation.id && m.type === 'CREATE');
      if (existingCreate) {
        existingCreate.data = { ...existingCreate.data, ...mutation.data };
      } else {
        updatedMutations.push(mutation);
      }
    } else {
      updatedMutations.push(mutation);
    }

    return {
      pastStates: [...state.pastStates, state.localLists],
      localLists: newLists,
      futureStates: [],
      pendingMutations: updatedMutations
    };
  }),

  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previous = state.pastStates[state.pastStates.length - 1];
    return {
      pastStates: state.pastStates.slice(0, -1),
      localLists: previous,
      futureStates: [state.localLists, ...state.futureStates],
      pendingMutations: state.pendingMutations.slice(0, -1)
    };
  }),

  redo: () => set((state) => {
    if (state.futureStates.length === 0) return state;
    const next = state.futureStates[0];
    return {
      pastStates: [...state.pastStates, state.localLists],
      localLists: next,
      futureStates: state.futureStates.slice(1),
    };
  })
}));