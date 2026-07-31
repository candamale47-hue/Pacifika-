import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = join(process.cwd(), "dist", "public", "uploads");

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveUploadedFile(
  file: File,
  prefix = "product"
): Promise<string> {
  await ensureUploadDir();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${prefix}-${timestamp}-${random}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(arrayBuffer));

  return `/uploads/${filename}`;
}

export function isValidImageType(file: File): boolean {
  const valid = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return valid.includes(file.type);
}

export function isValidImageSize(file: File, maxMB = 10): boolean {
  return file.size <= maxMB * 1024 * 1024;
}
