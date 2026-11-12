import axiosInstance from "@/shared/lib/config/axions";
import { WalletResponse } from "@/shared/types/wallet";

export async function getWallet(): Promise<WalletResponse> {
  const { data } = await axiosInstance.get<WalletResponse>("/Wallet/MyWallet");
  if (!data?.isSuccess || !data.data) throw new Error(data?.message || "اطلاعات کیف پول دریافت نشد");
  return data;
}
