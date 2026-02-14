import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Rack = {
  id: string;
  position: [number, number, number];
  stock: number;
  bagsPerLevel: number;
};

type WarehouseState = {
  racks: Rack[];
  selectedRack: string | null;

  editMode: boolean;

  addRack: () => void;
  deleteRack: (id: string) => void;
  selectRack: (id: string) => void;
  addStock: (id: string) => void;
  removeStock: (id: string) => void;
  updateBagsPerLevel: (id: string, value: number) => void;
  moveRack: (id: string, position: [number, number, number]) => void;

  toggleEditMode: () => void;
};

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set) => ({
      racks: [],
      selectedRack: null,
      editMode: false,

      toggleEditMode: () =>
        set((state) => ({
          editMode: !state.editMode,
        })),

      addRack: () =>
        set((state) => ({
          racks: [
            ...state.racks,
            {
              id: `R-${Date.now()}`,
              position: [Math.random() * 30 - 15, 1, Math.random() * 30 - 15],
              stock: 0,
              bagsPerLevel: 5,
            },
          ],
        })),

      deleteRack: (id) =>
        set((state) => ({
          racks: state.racks.filter((r) => r.id !== id),
          selectedRack: state.selectedRack === id ? null : state.selectedRack,
        })),

      selectRack: (id) => set({ selectedRack: id }),

      addStock: (id) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id ? { ...rack, stock: rack.stock + 1 } : rack,
          ),
        })),

      removeStock: (id) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id
              ? { ...rack, stock: Math.max(rack.stock - 1, 0) }
              : rack,
          ),
        })),

      updateBagsPerLevel: (id, value) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id ? { ...rack, bagsPerLevel: value } : rack,
          ),
        })),

      moveRack: (id, newPosition) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id ? { ...rack, position: newPosition } : rack,
          ),
        })),
    }),
    {
      name: "warehouse-storage",

      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    },
  ),
);
