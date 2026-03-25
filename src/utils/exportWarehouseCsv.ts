import { Rack, Stick, Warehouse } from "@/src/types/warehouse";

const escapeCsv = (value: string | number | null | undefined) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const buildWarehouseCsv = (
  warehouse: Warehouse,
  sticks: Stick[],
  racks: Rack[],
) => {
  const header = [
    "Warehouse Name",
    "Stick Name",
    "Stick Row",
    "Stick Column",
    "Stick Area (sq ft)",
    "Rack Name",
    "Material",
    "Bags",
    "Stacks",
    "Occupancy (%)",
    "Rack Area (sq ft)",
    "Entry Date",
  ];

  const rows = sticks
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((stick) => {
      const stickRacks = racks
        .filter((rack) => rack.stickId === stick.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      const stickArea = warehouse.stickWidth * warehouse.stickLength;

      if (stickRacks.length === 0) {
        return [[
          warehouse.name,
          stick.name,
          stick.row,
          stick.col,
          stickArea.toFixed(0),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]];
      }

      return stickRacks.map((rack) => [
        warehouse.name,
        stick.name,
        stick.row,
        stick.col,
        stickArea.toFixed(0),
        rack.name,
        rack.material ?? "",
        rack.stock,
        rack.stackCount ?? "",
        rack.occupancyPercent ?? "",
        ((rack.width ?? 0) * (rack.depth ?? 0)).toFixed(2),
        rack.entryDate ?? "",
      ]);
    });

  return [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
};
