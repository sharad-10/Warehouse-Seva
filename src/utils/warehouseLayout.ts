import { Rack, Stick } from "@/src/types/warehouse";

export type StickSceneLayout = {
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
  totalWidth: number;
  totalLength: number;
  startX: number;
  startZ: number;
};

export type SceneMetrics = {
  width: number;
  length: number;
  centerX: number;
  centerZ: number;
};

export type LaidOutStick = Stick & {
  layoutRow: number;
  layoutCol: number;
};

export function getLaidOutSticks(sticks: Stick[], stickCols: number) {
  const columns = Math.max(1, stickCols);
  const sorted = [...sticks].sort((a, b) => {
    if ((a.row ?? 0) !== (b.row ?? 0)) {
      return (a.row ?? 0) - (b.row ?? 0);
    }

    if ((a.col ?? 0) !== (b.col ?? 0)) {
      return (a.col ?? 0) - (b.col ?? 0);
    }

    if ((a.createdAt ?? "") !== (b.createdAt ?? "")) {
      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    }

    return a.name.localeCompare(b.name);
  });

  return sorted.map((stick, index) => ({
    ...stick,
    layoutRow: Math.floor(index / columns),
    layoutCol: index % columns,
  }));
}

export function getStickSceneLayout(
  sticks: Stick[],
  stickCols: number,
  stickWidth: number,
  stickLength: number,
): StickSceneLayout {
  if (sticks.length === 0) {
    return {
      minRow: 0,
      minCol: 0,
      maxRow: 0,
      maxCol: 0,
      totalWidth: 0,
      totalLength: 0,
      startX: 0,
      startZ: 0,
    };
  }

  const laidOutSticks = getLaidOutSticks(sticks, stickCols);
  const rows = laidOutSticks.map((stick) => stick.layoutRow);
  const cols = laidOutSticks.map((stick) => stick.layoutCol);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const totalWidth = (maxCol - minCol + 1) * stickWidth;
  const totalLength = (maxRow - minRow + 1) * stickLength;

  return {
    minRow,
    minCol,
    maxRow,
    maxCol,
    totalWidth,
    totalLength,
    startX: -(totalWidth / 2) + stickWidth / 2,
    startZ: -(totalLength / 2) + stickLength / 2,
  };
}

export function getStickCenter(
  stick: Stick,
  sticks: Stick[],
  stickCols: number,
  layout: StickSceneLayout,
  stickWidth: number,
  stickLength: number,
) {
  const laidOutStick = getLaidOutSticks(sticks, stickCols).find((item) => item.id === stick.id);
  const layoutCol = laidOutStick?.layoutCol ?? 0;
  const layoutRow = laidOutStick?.layoutRow ?? 0;

  return {
    x: layout.startX + (layoutCol - layout.minCol) * stickWidth,
    z: layout.startZ + (layoutRow - layout.minRow) * stickLength,
  };
}

export function getAvailableOccupancyPercent(
  racks: Rack[],
  stickId: string,
  excludeRackId?: string | null,
) {
  const used = racks.reduce((sum, rack) => {
    if (rack.stickId !== stickId || rack.id === excludeRackId) {
      return sum;
    }

    return sum + Math.max(0, rack.occupancyPercent ?? 0);
  }, 0);

  return Math.max(0, 100 - used);
}

export function getRackFootprint(
  occupancyPercent: number,
  stickWidth: number,
  stickLength: number,
) {
  const usableWidth = Math.max(10, stickWidth - 12);
  const usableDepth = Math.max(16, stickLength - 24);
  const coverage = Math.max(0.01, Math.min(1, occupancyPercent / 100));

  return {
    width: usableWidth,
    depth: Math.max(8, usableDepth * coverage),
    usableDepth,
  };
}

export function getRenderedRacksForSticks(
  racks: Rack[],
  sticks: Stick[],
  stickCols: number,
  stickWidth: number,
  stickLength: number,
) {
  const layout = getStickSceneLayout(sticks, stickCols, stickWidth, stickLength);
  const stickMap = new Map(sticks.map((stick) => [stick.id, stick]));
  const rendered = new Map<string, Rack>();

  const stickRacks = new Map<string, Rack[]>();
  racks.forEach((rack) => {
    if (!rack.stickId || !stickMap.has(rack.stickId)) {
      rendered.set(rack.id, rack);
      return;
    }

    const current = stickRacks.get(rack.stickId) ?? [];
    current.push(rack);
    stickRacks.set(rack.stickId, current);
  });

  stickRacks.forEach((group, stickId) => {
    const stick = stickMap.get(stickId);
    if (!stick) {
      return;
    }

    const center = getStickCenter(stick, sticks, stickCols, layout, stickWidth, stickLength);
    const sorted = [...group].sort((a, b) => {
      const aDate = a.entryDate ?? "";
      const bDate = b.entryDate ?? "";

      if (aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }

      return a.name.localeCompare(b.name);
    });

    const totalOccupancy = sorted.reduce(
      (sum, rack) => sum + Math.max(0, rack.occupancyPercent ?? 0),
      0,
    );
    const scale = totalOccupancy > 100 ? 100 / totalOccupancy : 1;
    const usableDepth = Math.max(16, stickLength - 24);
    const frontEdge = center.z - usableDepth / 2;
    let consumedDepth = 0;

    sorted.forEach((rack) => {
      const scaledOccupancy = Math.max(
        1,
        Math.min(100, Math.round((rack.occupancyPercent ?? 0) * scale)),
      );
      const footprint = getRackFootprint(scaledOccupancy, stickWidth, stickLength);
      const remainingDepth = Math.max(8, usableDepth - consumedDepth);
      const depth = Math.min(footprint.depth, remainingDepth);
      const z = frontEdge + consumedDepth + depth / 2;

      rendered.set(rack.id, {
        ...rack,
        width: footprint.width,
        depth,
        position: [center.x, rack.position?.[1] ?? 1, z],
      });

      consumedDepth += depth;
    });
  });

  return racks.map((rack) => rendered.get(rack.id) ?? rack);
}

export function getSceneMetrics(
  sticks: Stick[],
  racks: Rack[],
  stickCols: number,
  stickWidth: number,
  stickLength: number,
): SceneMetrics {
  const stickLayout = getStickSceneLayout(sticks, stickCols, stickWidth, stickLength);
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  };

  if (sticks.length > 0) {
    bounds.minX = -stickLayout.totalWidth / 2;
    bounds.maxX = stickLayout.totalWidth / 2;
    bounds.minZ = -stickLayout.totalLength / 2;
    bounds.maxZ = stickLayout.totalLength / 2;
  }

  racks.forEach((rack) => {
    const halfWidth = (rack.width ?? 0) / 2;
    const halfDepth = (rack.depth ?? 0) / 2;
    bounds.minX = Math.min(bounds.minX, rack.position[0] - halfWidth);
    bounds.maxX = Math.max(bounds.maxX, rack.position[0] + halfWidth);
    bounds.minZ = Math.min(bounds.minZ, rack.position[2] - halfDepth);
    bounds.maxZ = Math.max(bounds.maxZ, rack.position[2] + halfDepth);
  });

  if (!Number.isFinite(bounds.minX)) {
    return {
      width: Math.max(stickWidth, 120),
      length: Math.max(stickLength, 120),
      centerX: 0,
      centerZ: 0,
    };
  }

  return {
    width: Math.max(40, bounds.maxX - bounds.minX),
    length: Math.max(40, bounds.maxZ - bounds.minZ),
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerZ: (bounds.minZ + bounds.maxZ) / 2,
  };
}
