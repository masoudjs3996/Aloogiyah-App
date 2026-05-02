import axiosInstance from "@/shared/lib/config/axions";
import { GetSliderResponse } from "@/shared/types/slider";

export async function getSlider(): Promise<GetSliderResponse | null> {
  try {
    const { data } = await axiosInstance.get<GetSliderResponse | null>(
      "Slider/GetActive",
    );
    return data;
  } catch (error) {
    console.error("Error fetching Slider:", error);
    return null;
  }
}
