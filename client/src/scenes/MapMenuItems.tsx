import { Menu } from "@mantine/core";
import type { MapActions } from "./useMapActions";

interface SceneItems {
  showToPlayers?: () => void;
  rename: () => void;
  deleteScene: () => void;
  canDelete: boolean;
}

export function MapMenuItems({
  actions: { files, mapImage, background, drawings, resizeCanvas },
  scene,
}: {
  actions: MapActions;
  scene?: SceneItems;
}) {
  const showsMapImageItems = mapImage.canSet && mapImage.hasMapImage;
  const canRemoveBackground = background.canSet && background.hasBackground;
  const hasRemovals =
    showsMapImageItems ||
    canRemoveBackground ||
    drawings.canClear ||
    scene !== undefined;

  return (
    <>
      {scene && (
        <>
          {scene.showToPlayers && (
            <Menu.Item onClick={scene.showToPlayers}>Show to players</Menu.Item>
          )}
          <Menu.Item onClick={scene.rename}>Rename</Menu.Item>
          <Menu.Divider />
        </>
      )}
      <Menu.Item onClick={resizeCanvas}>Resize canvas</Menu.Item>
      {mapImage.canSet && (
        <Menu.Item onClick={mapImage.chooseMapImage}>Set map image</Menu.Item>
      )}
      {showsMapImageItems && (
        <Menu.Item onClick={mapImage.alignMapImage}>Align map image</Menu.Item>
      )}
      {background.canSet && (
        <Menu.Item onClick={background.chooseBackground}>
          Set background
        </Menu.Item>
      )}
      <Menu.Divider />
      {files.canImport && (
        <Menu.Item onClick={files.importMap}>Import map</Menu.Item>
      )}
      <Menu.Item onClick={files.exportMap}>Export map</Menu.Item>
      {hasRemovals && <Menu.Divider />}
      {showsMapImageItems && (
        <Menu.Item color="red" onClick={mapImage.removeMapImage}>
          Remove map image
        </Menu.Item>
      )}
      {canRemoveBackground && (
        <Menu.Item color="red" onClick={background.removeBackground}>
          Remove background
        </Menu.Item>
      )}
      {drawings.canClear && (
        <Menu.Item color="red" onClick={drawings.clearDrawings}>
          Clear drawings
        </Menu.Item>
      )}
      {scene && (
        <Menu.Item
          color="red"
          disabled={!scene.canDelete}
          onClick={scene.deleteScene}
        >
          Delete scene
        </Menu.Item>
      )}
    </>
  );
}
