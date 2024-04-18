import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { imageData } = req.body;
    console.log(req.body , '324tdfgg')
    if (!imageData) {
      return res.status(400).json({ error: "No image data provided" });
    }
    const base64Data = imageData.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    const jpgImage = await sharp(buffer).jpeg().toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.status(200).send(jpgImage);
  } catch (error) {
    console.error("Error saving image:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
