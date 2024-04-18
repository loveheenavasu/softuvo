"use server";
import axios from "axios";
import sharp from "sharp";

export async function getGeoTiff(id: string, apiKey: string): Promise<Buffer | undefined> {
  try {
    const response = await axios.get(
      `https://solar.googleapis.com/v1/geoTiff:get?id=${id}&key=${apiKey}`,
      {
        headers: {
          Accept: "image/tiff",
        },
        responseType: "arraybuffer",
      }
    );

    const geoTiffImage = Buffer.from(response.data);

    const jpgImage = await sharp(geoTiffImage).jpeg().toBuffer();
    console.log(jpgImage, "jpgImage324");
    return jpgImage;
  } catch (error) {
    console.error("Error fetching solar layer data:", error);
    return undefined;
  }
}
