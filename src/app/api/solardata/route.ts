// import axios from 'axios';
// import { NextRequest, NextResponse } from 'next/server';

// export default async GET(req : NextRequest, res : NextResponse) {
//  const { latitude, longitude } = req.query;

//  try {
//    const response = await axios.get('https://solar.googleapis.com/v1/dataLayers:get', {
//      params: {
//        'location.latitude': latitude,
//        'location.longitude': longitude,
//        pixelSizeMeters: 0.1,
//        radiusMeters: 100,
//        requiredQuality: 'HIGH',
//        view: 'FULL_LAYERS',
//        key: process.env.GOOGLE_MAPS_API_KEY,  // replace with your actual API key
//      },
//    });

//    const rgbUrl = response.data.rgbUrl;
//    const id = rgbUrl.split('id=')[1];

//    res.status(200).json({ id });
//  } catch (error) {
//    res.status(500).json({ error: 'Failed to get solar data' });
//  }
// }