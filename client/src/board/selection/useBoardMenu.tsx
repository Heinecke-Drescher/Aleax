import { Text } from "@mantine/core";
import {
  IconArrowsMove,
  IconClipboard,
  IconClipboardCopy,
  IconPhoto,
  IconPhotoOff,
  IconScissors,
  IconTrash,
  IconWallpaper,
} from "@tabler/icons-react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Vector2d } from "konva/lib/types";
import {
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
} from "mantine-contextmenu";
import type { useBackgroundFile } from "../../background/useBackgroundFile";
import type { useMapImageFile } from "../../mapImage/useMapImageFile";
import { cellAt, containsCell } from "../../room/grid";
import { useRoom } from "../../room/RoomContext";
import { showMenuAt } from "../tokens/showMenuAt";
import type { useClipboard } from "./useClipboard";
import type { SelectionControls } from "./useSelection";

export function shortcut(keys: string) {
  return (
    <Text size="xs" c="dimmed">
      {keys}
    </Text>
  );
}

interface MapImageItems {
  mapImage: ReturnType<typeof useMapImageFile>;
  background: ReturnType<typeof useBackgroundFile>;
}

export function useBoardMenu(
  selection: SelectionControls,
  clipboard: ReturnType<typeof useClipboard>,
  { mapImage, background }: MapImageItems,
) {
  const { showContextMenu } = useContextMenu();
  const room = useRoom();

  function open(event: KonvaEventObject<MouseEvent>, point: Vector2d) {
    const cell = cellAt(point);
    if (containsCell(room.mapBounds(), cell.x, cell.y)) {
      openOnMap(event, point);
    } else {
      openBesideMap(event);
    }
  }

  // Copying, cutting and deleting act on the selection wherever one clicks, and a paste beside the
  // map lands on its edge, so beside it only the background is offered.
  function openBesideMap(event: KonvaEventObject<MouseEvent>) {
    if (!background.canSet) {
      event.evt.preventDefault();
      return;
    }
    showMenuAt(
      showContextMenu,
      (close) => (
        <>
          <ContextMenuItem
            title="Set background"
            icon={<IconWallpaper size={16} />}
            onClick={background.chooseBackground}
            onHide={close}
            submenuProps={{}}
          />
          {background.hasBackground && (
            <>
              <ContextMenuDivider />
              <ContextMenuItem
                title="Remove background"
                icon={<IconTrash size={16} />}
                color="red"
                onClick={background.removeBackground}
                onHide={close}
                submenuProps={{}}
              />
            </>
          )}
        </>
      ),
      event,
    );
  }

  function openOnMap(event: KonvaEventObject<MouseEvent>, point: Vector2d) {
    const hasSelection = selection.selection.kind !== "none";
    showMenuAt(
      showContextMenu,
      (close) => (
        <>
          <ContextMenuItem
            title="Copy"
            icon={<IconClipboardCopy size={16} />}
            iconRight={shortcut("Ctrl+C")}
            disabled={!hasSelection}
            onClick={clipboard.copy}
            onHide={close}
            submenuProps={{}}
          />
          <ContextMenuItem
            title="Cut"
            icon={<IconScissors size={16} />}
            iconRight={shortcut("Ctrl+X")}
            disabled={!hasSelection}
            onClick={clipboard.cut}
            onHide={close}
            submenuProps={{}}
          />
          <ContextMenuItem
            title="Paste here"
            icon={<IconClipboard size={16} />}
            iconRight={shortcut("Ctrl+V")}
            disabled={!clipboard.hasClip()}
            onClick={() => clipboard.pasteAt(point)}
            onHide={close}
            submenuProps={{}}
          />
          {mapImage.canSet && (
            <>
              <ContextMenuDivider />
              <ContextMenuItem
                title="Set map image"
                icon={<IconPhoto size={16} />}
                onClick={mapImage.chooseMapImage}
                onHide={close}
                submenuProps={{}}
              />
              {mapImage.hasMapImage && (
                <ContextMenuItem
                  title="Align map image"
                  icon={<IconArrowsMove size={16} />}
                  onClick={mapImage.alignMapImage}
                  onHide={close}
                  submenuProps={{}}
                />
              )}
            </>
          )}
          <ContextMenuDivider />
          <ContextMenuItem
            title="Delete"
            icon={<IconTrash size={16} />}
            iconRight={shortcut("Del")}
            color="red"
            disabled={!hasSelection}
            onClick={clipboard.remove}
            onHide={close}
            submenuProps={{}}
          />
          {mapImage.canSet && mapImage.hasMapImage && (
            <ContextMenuItem
              title="Remove map image"
              icon={<IconPhotoOff size={16} />}
              color="red"
              onClick={mapImage.removeMapImage}
              onHide={close}
              submenuProps={{}}
            />
          )}
        </>
      ),
      event,
    );
  }

  return { open };
}
