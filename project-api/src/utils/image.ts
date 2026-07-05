import sharp from "sharp";

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 60;

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#fff" })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
