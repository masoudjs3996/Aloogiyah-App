import { IApiResponse } from "./general";

export type DiscountType = "Fixed" | "Percentage";

export interface DiscountModel {
  categoryCodes: string[];
  code: string;
  description: string;
  discountType: DiscountType;
  endDate: string;    
  farmCode: string | null;
  isActive: boolean;
  maxDiscountAmount: number;
  maxUsage: number;
  productCodes: string[];
  startDate: string;  
  usageCount: number;
  userCodes: string[];
  value: number;
}
export type GetRewardsResponse = IApiResponse<DiscountModel[]>;