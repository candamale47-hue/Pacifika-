/**
 * Client-side image compression before upload
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/webp";
}

const DEFAULTS: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  format: "image/jpeg",
};

/**
 * Compress a File/ Blob to a smaller JPEG/WebP.
 * Returns a new File ready for upload.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const { maxWidth, maxHeight, quality, format } = { ...DEFAULTS, ...opts };

  const bitmap = await createImageBitmap(file);

  // Calculate new dimensions
  let { width, height } = bitmap;
  if (width > maxWidth! || height > maxHeight!) {
    const ratio = Math.min(maxWidth! / width, maxHeight! / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, format, quality)
  );
  if (!blob) throw new Error("Compression failed");

  const ext = format === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), {
    type: format,
  });
}

/**
 * Compress multiple files in parallel
 */
export async function compressImages(
  files: File[],
  opts?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, opts)));
}
