import { Canvas } from "@react-three/fiber/native";
import React from "react";
import Rack from "../../components/Rack";
import WarehouseCamera from "./WarehouseCamera";
import WarehouseFloor from "./WarehouseFloor";

import { Rack as RackType, Stick } from "@/src/types/warehouse";
import {
  getSceneMetrics,
  getRenderedRacksForSticks,
} from "@/src/utils/warehouseLayout";

/* =========================
   Props
========================= */

type Props = {
  racks: RackType[];
  sticks: Stick[];
  selectedRackId: string | null;
  selectedStickId: string | null;
  setSelectedRackId: (id: string | null) => void;
  onSelectStick: (stickId: string) => void;

  zoom: number;
  panX: number;
  panY: number;
  rotateX: number;
  rotateY: number;

  stickRows: number;
  stickCols: number;
  stickWidth: number;
  stickLength: number;
};

/* =========================
   Component
========================= */

export default function WarehouseCanvas({
  racks,
  sticks,
  selectedRackId,
  selectedStickId,
  setSelectedRackId,
  onSelectStick,
  zoom,
  panX,
  panY,
  rotateX,
  rotateY,
  stickRows,
  stickCols,
  stickWidth,
  stickLength,
}: Props) {
  const renderedRacks = React.useMemo(
    () => getRenderedRacksForSticks(racks, sticks, stickWidth, stickLength),
    [racks, stickLength, stickWidth, sticks],
  );
  const sceneMetrics = React.useMemo(() => {
    return getSceneMetrics(sticks, renderedRacks, stickWidth, stickLength);
  }, [renderedRacks, stickLength, stickWidth, sticks]);

  return (
    <Canvas
      camera={{ position: [15, 20, 25], fov: 42 }}
      shadows
    >
      <WarehouseCamera
        zoom={zoom}
        panX={panX}
        panY={panY}
        rotateX={rotateX}
        rotateY={rotateY}
        sceneWidth={sceneMetrics.width}
        sceneLength={sceneMetrics.length}
        sceneCenterX={sceneMetrics.centerX}
        sceneCenterZ={sceneMetrics.centerZ}
      />

      <ambientLight intensity={0.55} />

      <directionalLight position={[120, 220, 80]} intensity={1.6} castShadow />
      <directionalLight position={[-80, 140, -60]} intensity={0.5} />

      <WarehouseFloor
        sticks={sticks}
        selectedStickId={selectedStickId}
        onSelectStick={onSelectStick}
        stickRows={stickRows}
        stickCols={stickCols}
        stickWidth={stickWidth}
        stickLength={stickLength}
      />

      {renderedRacks.map((rack) => (
        <Rack
          key={rack.id}
          id={rack.id}
          position={rack.position}
          stock={rack.stock}
          bagsPerLevel={rack.bagsPerLevel}
          stackCount={rack.stackCount}
          width={rack.width}
          depth={rack.depth}
          expiryDate={rack.expiryDate}
          isSelected={selectedRackId === rack.id}
          onSelect={setSelectedRackId}
        />
      ))}
    </Canvas>
  );
}
