import { FEET_PER_CELL } from "../../room/grid";
import { shapeSize, type AreaShape } from "../../room/shapes";
import { labelPlace } from "../labelPlace";
import { MapLabel } from "../MapLabel";

interface ShapeSizeLabelProps {
  shape: AreaShape;
  zoom: number;
  color: string;
}

export function ShapeSizeLabel({ shape, zoom, color }: ShapeSizeLabelProps) {
  return (
    <MapLabel
      place={labelPlace(shape.from, shape.to, 0)}
      zoom={zoom}
      color={color}
      text={sizeText(shape)}
    />
  );
}

function sizeText(shape: AreaShape) {
  const { width, height } = shapeSize(shape);
  const feet = (cells: number) => cells * FEET_PER_CELL;
  switch (shape.kind) {
    case "rectangle":
      return `${feet(width)} × ${feet(height)} ft`;
    case "circle":
      return `${feet(width)} ft radius`;
    case "cone":
      return `${feet(width)} ft`;
  }
}
