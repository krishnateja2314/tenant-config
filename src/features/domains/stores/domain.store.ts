import { create } from "zustand";
import { DomainNode, PendingMutation } from "../types/domain.types";

interface DomainWorkspaceState {
  // --- UI State ---
  selectedNodeId: string | null;
  isCreatingChild: boolean;
  isEditing: boolean;
  viewMode: 'list' | 'canvas';
  leftPaneWidth: number; // For the resizable pane (percentage 20-80)

  // --- Local Data & History ---
  localNodes: DomainNode[]; // Flat list of nodes for easy manipulation
  pastStates: DomainNode[][]; // For Undo
  futureStates: DomainNode[][]; // For Redo
  pendingMutations: PendingMutation[]; // Queue for the Save button

  // --- Actions ---
  setLeftPaneWidth: (width: number) => void;
  setViewMode: (mode: 'list' | 'canvas') => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsCreatingChild: (isCreating: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  
  // --- Workspace Data Management ---
  initWorkspace: (nodes: DomainNode[]) => void; // Load from server
  commitLocalChange: (newNodes: DomainNode[], mutation: PendingMutation) => void; // Make a change
  undo: () => void;
  redo: () => void;
  clearPendingMutations: () => void; // Called after successful save
}

export const useDomainWorkspaceStore = create<DomainWorkspaceState>((set, get) => ({
  // UI State Defaults
  selectedNodeId: null,
  isCreatingChild: false,
  isEditing: false,
  viewMode: 'list',
  leftPaneWidth: 33.33, 

  // Data Defaults
  localNodes: [],
  pastStates: [],
  futureStates: [],
  pendingMutations: [],

  // UI Setters
  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, isCreatingChild: false, isEditing: false }),
  setIsCreatingChild: (isCreating) => set({ isCreatingChild: isCreating, isEditing: false }),
  setIsEditing: (isEditing) => set({ isEditing, isCreatingChild: false }),

  // Initialization (When data fetches from React Query)
  initWorkspace: (nodes) => set({ 
    localNodes: nodes, 
    pastStates: [], 
    futureStates: [], 
    pendingMutations: [] 
  }),

  // Core Mutation Engine (Handles history and queueing)
  commitLocalChange: (newNodes, mutation) => set((state) => {
    // 1. Check if we are updating an already pending 'CREATE' mutation
    // (e.g., creating a node, then renaming it before saving)
    let updatedMutations = [...state.pendingMutations];
    
    if (mutation.type === 'UPDATE') {
      const existingCreate = updatedMutations.find(m => m.id === mutation.id && m.type === 'CREATE');
      if (existingCreate) {
        // Merge the update data into the pending CREATE payload
        existingCreate.data = { ...existingCreate.data, ...mutation.data };
      } else {
        updatedMutations.push(mutation);
      }
    } else {
      updatedMutations.push(mutation);
    }

    return {
      pastStates: [...state.pastStates, state.localNodes],
      localNodes: newNodes,
      futureStates: [], // Clear redo history on new action
      pendingMutations: updatedMutations
    };
  }),

  // History Controls
  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const previous = state.pastStates[state.pastStates.length - 1];
    const newPast = state.pastStates.slice(0, -1);
    
    // We also pop the last mutation off the queue (simplified logic)
    const newMutations = state.pendingMutations.slice(0, -1);

    return {
      pastStates: newPast,
      localNodes: previous,
      futureStates: [state.localNodes, ...state.futureStates],
      pendingMutations: newMutations
    };
  }),

  redo: () => set((state) => {
    if (state.futureStates.length === 0) return state;
    const next = state.futureStates[0];
    const newFuture = state.futureStates.slice(1);

    return {
      pastStates: [...state.pastStates, state.localNodes],
      localNodes: next,
      futureStates: newFuture,
      // Note: Full redo queue tracking requires more complex mutation recreation, 
      // keeping it simple for now by disabling redo if mutations are strictly queued.
    };
  }),

  clearPendingMutations: () => set({ pendingMutations: [] })
}));