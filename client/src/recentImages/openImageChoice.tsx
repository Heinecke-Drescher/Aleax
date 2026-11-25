import { modals } from "@mantine/modals";
import { notifyError } from "../notifyError";
import { recentImages, type RecentImageKind } from "./recentImages";
import {
  RecentImagesPicker,
  type RecentImagesPickerProps,
} from "./RecentImagesPicker";

interface ImageChoice extends Omit<
  RecentImagesPickerProps,
  "images" | "onDone"
> {
  title: string;
  kind: RecentImageKind;
}

// Without recent images there is nothing to pick from, so the file dialog opens at once, as it
// did before there were recent images; the read is short, so the browser should still count the
// file dialog as opened by the press (transient user activation lasts a few seconds). The picker
// goes through Mantine's modal manager, so a menu item can open it without a dialog mounted
// beside every menu.
export async function openImageChoice({ title, kind, ...choice }: ImageChoice) {
  let images;
  try {
    images = await recentImages(kind);
  } catch (error) {
    notifyError("Could not read recent images", error);
    choice.onUpload();
    return;
  }
  if (images.length === 0) {
    choice.onUpload();
    return;
  }
  const id = modals.open({
    title,
    children: (
      <RecentImagesPicker
        {...choice}
        images={images}
        onDone={() => modals.close(id)}
      />
    ),
  });
}
