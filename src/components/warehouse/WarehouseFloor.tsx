import React from "react";
import { Stick } from "@/src/types/warehouse";
import { getLaidOutSticks } from "@/src/utils/warehouseLayout";

type Props = {
  sticks: Stick[];
  selectedStickId: string | null;
  onSelectStick: (stickId: string) => void;
  stickRows: number;
  stickCols: number;
  stickWidth: number;
  stickLength: number;
};

/* =========================
   Component
========================= */

export default function WarehouseFloor({
  sticks,
  selectedStickId,
  onSelectStick,
  stickRows,
  stickCols,
  stickWidth,
  stickLength,
}: Props) {
  const laidOutSticks = React.useMemo(
    () => getLaidOutSticks(sticks, stickCols),
    [stickCols, sticks],
  );

  const sceneLayout = React.useMemo(() => {
    if (sticks.length === 0) {
      return {
        minRow: 0,
        maxRow: 0,
        minCol: 0,
        maxCol: 0,
        totalWidth: 0,
        totalLength: 0,
        centerX: 0,
        centerZ: 0,
      };
    }

    const rows = laidOutSticks.map((stick) => stick.layoutRow);
    const cols = laidOutSticks.map((stick) => stick.layoutCol);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const rowCount = maxRow - minRow + 1;
    const colCount = maxCol - minCol + 1;
    const totalWidth = colCount * stickWidth;
    const totalLength = rowCount * stickLength;

    return {
      minRow,
      maxRow,
      minCol,
      maxCol,
      totalWidth,
      totalLength,
      centerX: 0,
      centerZ: 0,
    };
  }, [laidOutSticks, stickLength, stickWidth, sticks.length]);

  const gridLines = React.useMemo(() => {
    if (sticks.length === 0) {
      return [];
    }

    const lines: React.ReactNode[] = [];

    for (let row = sceneLayout.minRow; row <= sceneLayout.maxRow + 1; row += 1) {
      const relativeRow = row - sceneLayout.minRow;
      const z = -(sceneLayout.totalLength / 2) + relativeRow * stickLength;
      lines.push(
        <mesh key={`row-${row}`} position={[0, 1.18, z]}>
          <boxGeometry args={[sceneLayout.totalWidth + 2, 0.14, 0.9]} />
          <meshStandardMaterial color="#5A6770" roughness={0.85} />
        </mesh>,
      );
    }

    for (let col = sceneLayout.minCol; col <= sceneLayout.maxCol + 1; col += 1) {
      const relativeCol = col - sceneLayout.minCol;
      const x = -(sceneLayout.totalWidth / 2) + relativeCol * stickWidth;
      lines.push(
        <mesh key={`col-${col}`} position={[x, 1.18, 0]}>
          <boxGeometry args={[0.9, 0.14, sceneLayout.totalLength + 2]} />
          <meshStandardMaterial color="#5A6770" roughness={0.85} />
        </mesh>,
      );
    }

    return lines;
  }, [sceneLayout, stickLength, stickWidth, sticks.length]);

  const stickTiles = React.useMemo(() => {
    const tiles: React.ReactNode[] = [];
    const startX = -(sceneLayout.totalWidth / 2) + stickWidth / 2;
    const startZ = -(sceneLayout.totalLength / 2) + stickLength / 2;

    laidOutSticks.forEach((stick) => {
      const relativeCol = stick.layoutCol - sceneLayout.minCol;
      const relativeRow = stick.layoutRow - sceneLayout.minRow;
      const x = startX + relativeCol * stickWidth;
      const z = startZ + relativeRow * stickLength;
      const isAlt = (relativeRow + relativeCol) % 2 === 0;
      const isSelectedStick = stick.id === selectedStickId;
      const tileColor = isAlt ? "#C5C9C7" : "#B6BBB7";
      const laneColor = isAlt ? "#EEF1EB" : "#E5E8E0";

      tiles.push(
        <group
          key={stick.id}
          onPointerDown={(event: any) => {
            event.stopPropagation();
            onSelectStick(stick.id);
          }}
        >
          <mesh position={[x, 0.55, z]}>
            <boxGeometry args={[stickWidth - 2.2, 1.1, stickLength - 2.2]} />
            <meshStandardMaterial
              color={isSelectedStick ? "#E6D189" : tileColor}
              roughness={0.98}
              metalness={0.01}
            />
          </mesh>

          <mesh position={[x, 1.15, z]}>
            <boxGeometry args={[stickWidth - 12, 0.1, 3.2]} />
            <meshStandardMaterial color="#707C84" roughness={0.88} />
          </mesh>

          <mesh position={[x, 1.08, z - stickLength / 2 + 12]}>
            <boxGeometry args={[stickWidth - 16, 0.15, 5]} />
            <meshStandardMaterial color={laneColor} roughness={0.92} />
          </mesh>

          <mesh position={[x, 1.08, z + stickLength / 2 - 12]}>
            <boxGeometry args={[stickWidth - 16, 0.15, 5]} />
            <meshStandardMaterial color={laneColor} roughness={0.92} />
          </mesh>

          <mesh position={[x - stickWidth / 2 + 1, 1.45, z]}>
            <boxGeometry args={[2, 1.9, stickLength - 6]} />
            <meshStandardMaterial color="#48525A" roughness={0.95} />
          </mesh>

          <mesh position={[x + stickWidth / 2 - 1, 1.45, z]}>
            <boxGeometry args={[2, 1.9, stickLength - 6]} />
            <meshStandardMaterial color="#48525A" roughness={0.95} />
          </mesh>

          <mesh position={[x, 1.45, z - stickLength / 2 + 1]}>
            <boxGeometry args={[stickWidth - 6, 1.9, 2]} />
            <meshStandardMaterial color="#48525A" roughness={0.95} />
          </mesh>

          <mesh position={[x, 1.45, z + stickLength / 2 - 1]}>
            <boxGeometry args={[stickWidth - 6, 1.9, 2]} />
            <meshStandardMaterial color="#48525A" roughness={0.95} />
          </mesh>

          <mesh position={[x, 1.62, z]}>
            <boxGeometry args={[stickWidth - 20, 0.06, stickLength - 26]} />
            <meshStandardMaterial color="#A7AEA8" roughness={1} />
          </mesh>
        </group>,
      );
    });

    return tiles;
  }, [laidOutSticks, onSelectStick, sceneLayout, selectedStickId, stickLength, stickWidth]);

  return (
    <>
      {sticks.length > 0 ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[sceneLayout.totalWidth, sceneLayout.totalLength]} />
          <meshStandardMaterial color="#98A39A" roughness={1} />
        </mesh>
      ) : null}

      {stickTiles}

      {gridLines}

      {/* Background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#8FA089" roughness={1} />
      </mesh>
    </>
  );
}
