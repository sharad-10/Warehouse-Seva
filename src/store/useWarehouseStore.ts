import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Rack = {
  id: string;
  name: string; // NEW
  position: [number, number, number];
  stock: number;
  bagsPerLevel: number;
  width: number;
  depth: number;
};

type WarehouseState = {
  racks: Rack[];
  selectedRack: string | null;
  editMode: boolean;
  updateRackName: (id: string, name: string) => void;

  addRack: () => void;
  deleteRack: (id: string) => void;
  selectRack: (id: string) => void;
  addStock: (id: string) => void;
  removeStock: (id: string) => void;
  updateBagsPerLevel: (id: string, value: number) => void;
  moveRack: (id: string, position: [number, number, number]) => void;
  updateRackSize: (id: string, width: number, depth: number) => void;

  toggleEditMode: () => void;
};

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set) => ({
      racks: [],
      selectedRack: null,
      editMode: false,

      /* =========================
         Edit Mode
      ========================= */
      toggleEditMode: () =>
        set((state) => ({
          editMode: !state.editMode,
        })),

      /* =========================
         Add Rack
      ========================= */
      addRack: () =>
        set((state) => {
          const id = `R-${Date.now()}`;

          return {
            racks: [
              ...state.racks,
              {
                id,
                name: id,
                position: [Math.random() * 30 - 15, 1, Math.random() * 30 - 15],
                stock: 0,
                bagsPerLevel: 5,
                width: 1.5,
                depth: 1,
              },
            ],
          };
        }),

      /* =========================
         Delete Rack
      ========================= */
      deleteRack: (id) =>
        set((state) => ({
          racks: state.racks.filter((r) => r.id !== id),
          selectedRack: state.selectedRack === id ? null : state.selectedRack,
        })),

      selectRack: (id) => set({ selectedRack: id }),

      /* =========================
         Stock Controls
      ========================= */
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
              ? {
                  ...rack,
                  stock: Math.max(rack.stock - 1, 0),
                }
              : rack,
          ),
        })),

      updateBagsPerLevel: (id, value) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id
              ? {
                  ...rack,
                  bagsPerLevel: Math.max(value, 1),
                }
              : rack,
          ),
        })),

      /* =========================
         Move Rack
      ========================= */
      moveRack: (id, newPosition) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id ? { ...rack, position: newPosition } : rack,
          ),
        })),

      updateRackName: (id, name) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id ? { ...rack, name } : rack,
          ),
        })),

      /* =========================
         Resize Rack
      ========================= */
      updateRackSize: (id, width, depth) =>
        set((state) => ({
          racks: state.racks.map((rack) =>
            rack.id === id
              ? {
                  ...rack,
                  width: Math.max(width, 1),
                  depth: Math.max(depth, 1),
                }
              : rack,
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
