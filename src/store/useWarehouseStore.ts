import { create } from "zustand";

type RackInventory = {
  stock: number;
  capacity: number;
};

type WarehouseState = {
  selectedRack: string | null;
  racks: Record<string, RackInventory>;
  selectRack: (id: string) => void;
  addStock: (id: string) => void;
  removeStock: (id: string) => void;
};

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  selectedRack: null,

  racks: {},

  selectRack: (id) =>
    set((state) => ({
      selectedRack: id,
      racks: {
        ...state.racks,
        [id]: state.racks[id] || {
          stock: 0,
          capacity: 20, // 🔥 default capacity
        },
      },
    })),

  addStock: (id) =>
    set((state) => {
      const rack = state.racks[id];
      if (!rack) return state;

      if (rack.stock >= rack.capacity) return state; // ❌ prevent overfill

      return {
        racks: {
          ...state.racks,
          [id]: {
            ...rack,
            stock: rack.stock + 1,
          },
        },
      };
    }),

  removeStock: (id) =>
    set((state) => {
      const rack = state.racks[id];
      if (!rack) return state;

      return {
        racks: {
          ...state.racks,
          [id]: {
            ...rack,
            stock: Math.max(rack.stock - 1, 0),
          },
        },
      };
    }),
}));
