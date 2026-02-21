import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================
   Rack Type
========================= */
export type Rack = {
  id: string;
  name: string;

  position: [number, number, number];

  stock: number;
  bagsPerLevel: number;

  width: number;
  depth: number;

  entryDate: string;
  expiryDate: string;
  rate: number;
};

/* =========================
   Warehouse Type
========================= */
export type Warehouse = {
  id: string;
  name: string;
  racks: Rack[];
};

type WarehouseState = {
  warehouses: Warehouse[];
  selectedWarehouseId: string | null;
  selectedRack: string | null;
  editMode: boolean;

  /* Warehouse Controls */
  addWarehouse: (name: string) => void;
  selectWarehouse: (id: string) => void;
  deleteWarehouse: (id: string) => void;

  /* Rack Controls */
  addRack: () => void;
  deleteRack: (id: string) => void;
  selectRack: (id: string) => void;

  addStock: (id: string) => void;
  removeStock: (id: string) => void;
  updateBagsPerLevel: (id: string, value: number) => void;

  moveRack: (id: string, position: [number, number, number]) => void;
  updateRackSize: (id: string, width: number, depth: number) => void;

  updateRackName: (id: string, name: string) => void;

  updateRackDetails: (
    id: string,
    details: Partial<{
      name: string;
      entryDate: string;
      expiryDate: string;
      rate: number;
      stock: number;
    }>,
  ) => void;

  toggleEditMode: () => void;
  renameWarehouse: (id: string, name: string) => void;
};

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      /* =========================
         Initial State
      ========================= */
      warehouses: [
        {
          id: "W-1",
          name: "Main Warehouse",
          racks: [],
        },
      ],
      selectedWarehouseId: "W-1",
      selectedRack: null,
      editMode: false,

      /* =========================
         Warehouse Controls
      ========================= */
      addWarehouse: (name) => {
        const newWarehouse: Warehouse = {
          id: `W-${Date.now()}`,
          name,
          racks: [],
        };

        set((state) => ({
          warehouses: [...state.warehouses, newWarehouse],
          selectedWarehouseId: newWarehouse.id,
        }));
      },

      selectWarehouse: (id) =>
        set({
          selectedWarehouseId: id,
          selectedRack: null,
        }),

      deleteWarehouse: (id) =>
        set((state) => {
          const updated = state.warehouses.filter((w) => w.id !== id);

          return {
            warehouses: updated,
            selectedWarehouseId: updated.length ? updated[0].id : null,
            selectedRack: null,
          };
        }),

      /* =========================
         Helper
      ========================= */
      getCurrentWarehouse: () => {
        const { warehouses, selectedWarehouseId } = get();
        return warehouses.find((w) => w.id === selectedWarehouseId);
      },

      /* =========================
         Edit Mode
      ========================= */
      toggleEditMode: () =>
        set((state) => ({
          editMode: !state.editMode,
        })),
      renameWarehouse: (id, name) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === id ? { ...w, name } : w,
          ),
        })),

      /* =========================
         Add Rack
      ========================= */
      addRack: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];

          const newRack: Rack = {
            id: `R-${Date.now()}`,
            name: `Rack-${state.warehouses.length}`,
            position: [Math.random() * 30 - 15, 1, Math.random() * 30 - 15],
            stock: 0,
            bagsPerLevel: 5,
            width: 1.5,
            depth: 1,
            entryDate: today,
            expiryDate: "",
            rate: 0,
          };

          return {
            warehouses: state.warehouses.map((w) =>
              w.id === state.selectedWarehouseId
                ? { ...w, racks: [...w.racks, newRack] }
                : w,
            ),
          };
        }),

      /* =========================
         Rack Updates
      ========================= */
      selectRack: (id) => set({ selectedRack: id }),

      deleteRack: (id) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.filter((r) => r.id !== id),
                }
              : w,
          ),
          selectedRack: state.selectedRack === id ? null : state.selectedRack,
        })),

      addStock: (id) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id ? { ...r, stock: r.stock + 1 } : r,
                  ),
                }
              : w,
          ),
        })),

      removeStock: (id) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id ? { ...r, stock: Math.max(r.stock - 1, 0) } : r,
                  ),
                }
              : w,
          ),
        })),

      updateBagsPerLevel: (id, value) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id
                      ? { ...r, bagsPerLevel: Math.max(value, 1) }
                      : r,
                  ),
                }
              : w,
          ),
        })),

      moveRack: (id, position) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id ? { ...r, position } : r,
                  ),
                }
              : w,
          ),
        })),

      updateRackSize: (id, width, depth) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id
                      ? {
                          ...r,
                          width: Math.max(width, 1),
                          depth: Math.max(depth, 1),
                        }
                      : r,
                  ),
                }
              : w,
          ),
        })),

      updateRackName: (id, name) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) => (r.id === id ? { ...r, name } : r)),
                }
              : w,
          ),
        })),

      updateRackDetails: (id, data) =>
        set((state) => ({
          warehouses: state.warehouses.map((w) =>
            w.id === state.selectedWarehouseId
              ? {
                  ...w,
                  racks: w.racks.map((r) =>
                    r.id === id ? { ...r, ...data } : r,
                  ),
                }
              : w,
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
