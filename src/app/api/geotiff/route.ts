import axios from 'axios';
import sharp from 'sharp';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 const { id } = req.query;
 try {
   const response = await axios.get(`https://solar.googleapis.com/v1/geoTiff:get?id=${id}`, {
     headers: {
       'Accept': 'image/tiff',
       'Authorization': `Bearer ${process.env.GOOGLE_MAPS_API_KEY}`,  // replace with your actual API key
     },
     responseType: 'arraybuffer',  // to handle binary data
   });

   // Convert the ArrayBuffer to a Buffer
   const geoTiffImage = Buffer.from(response.data);

   // Convert the GeoTIFF image to a JPG image
   const jpgImage = await sharp(geoTiffImage).jpeg().toBuffer();

   res.setHeader('Content-Type', 'image/jpeg');
   res.status(200).send(jpgImage);
 } catch (error) {
   res.status(500).json({ error: 'Failed to get GeoTIFF image' });
 }
}