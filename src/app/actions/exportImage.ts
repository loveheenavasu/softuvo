'use server';
import sharp from "sharp";

export async function exportImage(dataUrl : string) {
  try {
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const jpgImage = await sharp(buffer).jpeg().toBuffer();
    const base64String = jpgImage.toString("base64");
    return { data: base64String };
  } catch (error) {
    console.log("Error exporting image", error);
    return { data: null };
  }
}
