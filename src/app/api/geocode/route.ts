import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { address } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address as string)}&key=${apiKey}`);
    console.log("response",response)
    const { results } = response.data;

    if (results.length > 0) {
      const { lat, lng } = results[0].geometry.location;
      res.status(200).json({ lat, lng });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
