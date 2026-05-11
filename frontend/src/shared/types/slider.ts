import { IApiResponse } from "./general";

export interface ISlider {
  code: string;
  description: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  title: string;
}
export type GetSliderResponse = IApiResponse<ISlider[]>;
