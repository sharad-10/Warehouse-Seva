export type Position = [number, number, number];

export type WarehouseRole = "admin" | "edit" | "view";

export type Warehouse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: string;
  stickRows: number;
  stickCols: number;
  stickWidth: number;
  stickLength: number;
};

export type Rack = {
  id: string;
  warehouseId: string;
  stickId?: string;
  name: string;
  position: Position;
  width: number;
  depth: number;
  stock: number;
  stackCount?: number;
  bagsPerLevel: number;
  occupancyPercent?: number;
  entryDate?: string;
  expiryDate?: string;
  rate?: number;
};

export type WarehouseMember = {
  id: string;
  uid: string;
  warehouseId: string;
  username?: string;
  email?: string;
  role: WarehouseRole;
};

export type Stick = {
  id: string;
  warehouseId: string;
  name: string;
  row: number;
  col: number;
  createdAt?: string;
};
