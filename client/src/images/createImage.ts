import Compressor from "compressorjs";

interface ImageFormat extends Pick<
  Compressor.Options,
  "width" | "height" | "maxWidth" | "maxHeight" | "resize"
> {
  // Safari hands back PNG when asked for WebP, too large for big pictures in a room.
  typeWithoutWebp: "image/jpeg" | "image/png";
}

// For backgrounds and map images: large enough to look sharp on big screens, small enough to
// sync quickly to every player. Their transparent parts turn white as JPEG.
export const LARGE_IMAGE: ImageFormat = {
  maxWidth: 2500,
  maxHeight: 2500,
  typeWithoutWebp: "image/jpeg",
};
export const LARGE_IMAGE_FILE_MEGABYTES = 20;
export const TOKEN_IMAGE: ImageFormat = {
  width: 128,
  height: 128,
  resize: "cover",
  typeWithoutWebp: "image/png",
};

export async function createImage(
  file: File,
  format: ImageFormat,
): Promise<string> {
  const shrunk = await shrink(file, format);
  return readAsDataUrl(shrunk);
}

let webpEncoding: boolean | undefined;

function encodesWebp() {
  if (webpEncoding === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    webpEncoding = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpEncoding;
}

function shrink(file: File, format: ImageFormat): Promise<Blob> {
  const { typeWithoutWebp, ...size } = format;
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      ...size,
      mimeType: encodesWebp() ? "image/webp" : typeWithoutWebp,
      success: resolve,
      error: reject,
    });
  });
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("FileReader did not return a data URL"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
