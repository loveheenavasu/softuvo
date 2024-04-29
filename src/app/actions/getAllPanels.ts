'use server'
import axios, { AxiosResponse } from "axios";

interface Dimension {
  length: number;
  width: number;
}

interface PanelImage {
  url: string;
  name: string;
  type: string;
  _id: string;
}

export interface Panel {
  _id: string;
  modelName: string;
  powerWattage: number;
  dimension: Dimension;
  panelEfficiency: number;
  createdBy: string;
  dealerBusinessId: string;
  panelImages: PanelImage[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PanelData {
  panels: Panel[];
  totalCount: number;
  pages: null | any;
}

export async function getAllPanels(): Promise<PanelData | undefined> {
  try {
    const response: AxiosResponse<PanelData> = await axios.post(
      "https://c538yydra9.execute-api.us-east-1.amazonaws.com/proposal/list-all-panels"
    );
    return response.data;
    console.log(response.data)
  } catch (error) {
    console.error("Error fetching panel data:", error);
    return undefined;
  }
}
