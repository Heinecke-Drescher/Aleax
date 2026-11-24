import { useBackgroundFile } from "../background/useBackgroundFile";
import { useClearDrawings } from "../drawings/useClearDrawings";
import { useMapFiles } from "../mapFile/useMapFiles";
import { useMapImageFile } from "../mapImage/useMapImageFile";

export interface BoardModes {
  onAlignMapImage: () => void;
  onResizeCanvas: () => void;
}

// Called where it stays mounted: the file dialogs drop their input when the menu closes.
export function useMapActions({ onAlignMapImage, onResizeCanvas }: BoardModes) {
  return {
    files: useMapFiles(),
    mapImage: useMapImageFile(onAlignMapImage),
    background: useBackgroundFile(),
    drawings: useClearDrawings(),
    resizeCanvas: onResizeCanvas,
  };
}

export type MapActions = ReturnType<typeof useMapActions>;
