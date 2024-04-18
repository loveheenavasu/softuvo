"use server";
import axios from "axios";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface SolarData {
  results: any;
}

export async function getGeoCode(
  formData: FormData
): Promise<SolarData | undefined> {
  try {
    const address = formData.get("address") as string;
    const geocodeResponse = await axios.get<any>(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    return geocodeResponse.data;
  } catch (error) {
    console.error("Error fetching solar data:", error);
    return undefined;
  }
}
