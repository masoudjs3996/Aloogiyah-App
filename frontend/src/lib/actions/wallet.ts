import axiosInstance from "@/shared/lib/config/axions";
import { WalletResponse } from "@/shared/types/wallet";

export async function getWallet(): Promise<WalletResponse | null> {
  try {
    const { data } = await axiosInstance.get<WalletResponse | null>(
      "/Wallet/MyWallet"
    );
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
}
