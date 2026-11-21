import { Group, Line } from "react-konva";
import { CELL_SIZE, FEET_PER_CELL, squareCenter } from "../../room/grid";
import { cellDistance, type Measurement } from "./measurement";
import { labelPlaceClearOfFinger } from "../labelPlace";
import { MapLabel } from "../MapLabel";
import { useStageZoom } from "../useStageZoom";

interface DistanceMeasureProps {
  measurement: Measurement | null;
  color: string;
}

export function DistanceMeasure({ measurement, color }: DistanceMeasureProps) {
  const { groupRef, zoom } = useStageZoom();

  if (!measurement) return <Group ref={groupRef} listening={false} />;

  const { size } = measurement;
  const from = squareCenter(measurement.from.x, measurement.from.y, size);
  const to = squareCenter(measurement.to.x, measurement.to.y, size);
  const cells = cellDistance(measurement);
  const rotation = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

  return (
    <Group ref={groupRef} listening={false}>
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke={color}
        strokeWidth={3}
        strokeScaleEnabled={false}
        lineCap="round"
      />
      {[from, to].map((point, index) => (
        <Group
          key={index}
          {...point}
          rotation={rotation}
          scaleX={1 / zoom}
          scaleY={1 / zoom}
        >
          <Line
            points={[0, -6, 0, 6]}
            stroke={color}
            strokeWidth={3}
            lineCap="round"
          />
        </Group>
      ))}
      <MapLabel
        // Beyond the end square, which often holds the token measured to.
        place={labelPlaceClearOfFinger(to, from, (size * CELL_SIZE) / 2)}
        zoom={zoom}
        color={color}
        text={`${cells * FEET_PER_CELL} ft · ${cells} ${cells === 1 ? "cell" : "cells"}`}
      />
    </Group>
  );
}
