import { create } from 'zustand'

interface SelectionState {
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set<string>(),

  toggleSelection: (id: string) => {
    set((state) => {
      const newSet = new Set(state.selectedIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedIds: newSet }
    })
  },

  selectAll: (ids: string[]) => {
    set((state) => {
      const current = state.selectedIds
      const allSelected = ids.every(id => current.has(id))

      if (allSelected) {
        // Deselect all
        return { selectedIds: new Set<string>() }
      } else {
        // Select all
        return { selectedIds: new Set(ids) }
      }
    })
  },

  clearSelection: () => {
    set({ selectedIds: new Set<string>() })
  },

  isSelected: (id: string) => {
    return get().selectedIds.has(id)
  },
}))
