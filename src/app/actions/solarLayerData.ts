'use server'
import axios from "axios";

export interface SolarLayerData {
  id: string;
  rgbUrl: string;
}

export async function getSolarLayerData(
  latitude: number,
  longitude: number
): Promise<SolarLayerData | undefined> {
  try {
    const response = await axios.get(
      `https://solar.googleapis.com/v1/dataLayers:get`,
      {
        params: {
          "location.latitude": latitude.toFixed(5),
          "location.longitude": longitude.toFixed(5),
          radius_meters: "30",
          // required_quality: "HIGH",
          pixelSizeMeters : "0.1",
          required_quality: "LOW",
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );
    const rgbUrl = response.data.rgbUrl;
    const id = rgbUrl.split("id=")[1];
    return id;
  } catch (error) {
    console.error("Error fetching solar layer data:", error);
    return undefined;
  }
}
