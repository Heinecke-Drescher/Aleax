import {
  createImage,
  LARGE_IMAGE_FILE_MEGABYTES,
  LARGE_IMAGE,
} from "../images/createImage";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { notifyError } from "../notifyError";
import { openImageChoice } from "../recentImages/openImageChoice";
import {
  onlyChosen,
  rememberUpload,
  rememberUse,
  type RecentImage,
} from "../recentImages/recentImages";
import { MAP_IMAGE_KEY } from "../room/mapImage";
import { useRoom } from "../room/RoomContext";
import { useMapImage } from "../room/useMapImage";
import { useCanChangeMap } from "../player/useCanChangeMap";

async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}

async function dataUrlSize(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

// Setting an image goes on to aligning it, which is also offered on its own.
export function useMapImageFile(onAlign: () => void) {
  const room = useRoom();

  function setMapImage(image: string, size: { width: number; height: number }) {
    room.assertSpaceForImage(image, MAP_IMAGE_KEY);
    room.setMapImage(image, size);
    onAlign();
  }

  const uploadMapImage = useImageFileDialog({
    maxMegabytes: LARGE_IMAGE_FILE_MEGABYTES,
    multiple: false,
    onFile: async (file) => {
      const size = await imageSize(file);
      const image = await createImage(file, LARGE_IMAGE);
      rememberUpload("large", file, image);
      setMapImage(image, size);
    },
  });

  async function setRecentMapImage(image: RecentImage) {
    try {
      setMapImage(image.dataUrl, await dataUrlSize(image.dataUrl));
      rememberUse(image);
    } catch (error) {
      notifyError(`Could not add ${image.name}`, error);
    }
  }

  return {
    canSet: useCanChangeMap(),
    hasMapImage: useMapImage() !== null,
    chooseMapImage: () =>
      void openImageChoice({
        title: "Set map image",
        kind: "large",
        multiple: false,
        confirmLabel: "Set",
        onChoose: (images) => void setRecentMapImage(onlyChosen(images)),
        onUpload: uploadMapImage,
        moreTiles: [],
      }),
    alignMapImage: onAlign,
    removeMapImage: room.removeMapImage,
  };
}
