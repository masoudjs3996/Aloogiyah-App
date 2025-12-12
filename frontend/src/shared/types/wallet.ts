import { IApiResponse } from "./general";

export interface IWallet {
  availableBalance: number;
  balance: number;
  code: string;
  heldAmount: number;
}

export type WalletResponse = IApiResponse<IWallet>;
