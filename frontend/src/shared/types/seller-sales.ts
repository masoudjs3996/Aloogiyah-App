export type SellerCustomer = { code: string; name: string; orderCount: number; purchasedAmount: number; lastOrderAt: string };
export type SellerSalesSummary = { customerCount: number; orderCount: number; purchasedAmount: number; activeDiscounts: number };
export type SellerProduct = {
  saleUnit?: string | null; code: string; name: string; farmCode: string; farmName: string };
export type SellerCustomerOrder = { code: string; farmName: string; totalPrice: number; isPaid: boolean; status: string; createdAt: string };
export type SellerDiscount = { code: string; customerCode: string; customerName: string; farmCode: string; farmName: string; discountType: "Percentage" | "Fixed" | 0 | 1; value: number; maxDiscountAmount: number | null; endDate: string | null; usageCount: number; maxUsage: number | null; isActive: boolean; productCodes: string[] };
