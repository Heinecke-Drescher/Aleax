import { LARGE_IMAGE_FILE_MEGABYTES } from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { notifyError } from "../notifyError";
import { useCanChangeMap } from "../player/useCanChangeMap";
import { openImageChoice } from "../recentImages/openImageChoice";
import {
  onlyChosen,
  rememberUse,
  type RecentImage,
} from "../recentImages/recentImages";
import { BACKGROUND_IMAGE_ID } from "../room/background";
import { useRoom } from "../room/RoomContext";
import { useBackgroundImage } from "../room/useBackgroundImage";
import { setBackgroundFromFile } from "./setBackgroundFromFile";

export function useBackgroundFile() {
  const room = useRoom();
  const uploadBackground = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: (file) => setBackgroundFromFile(room, file),
  });

  function setRecentBackground(image: RecentImage) {
    try {
      room.assertSpaceForImage(image.dataUrl, BACKGROUND_IMAGE_ID);
      room.setBackground(image.dataUrl);
      rememberUse(image);
    } catch (error) {
      notifyError(`Could not add ${image.name}`, error);
    }
  }

  return {
    canSet: useCanChangeMap(),
    hasBackground: useBackgroundImage() !== null,
    chooseBackground: () =>
      void openImageChoice({
        title: "Set background",
        kind: "large",
        multiple: false,
        confirmLabel: "Set",
        onChoose: (images) => setRecentBackground(onlyChosen(images)),
        onUpload: uploadBackground,
        moreTiles: [],
      }),
    removeBackground: room.removeBackground,
  };
}
