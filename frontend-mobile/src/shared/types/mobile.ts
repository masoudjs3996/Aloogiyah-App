import type { Address, StoreProduct, Profile as BaseProfile, ProductSpecificationValue } from "./platform";
export type Product = Omit<StoreProduct, "price" | "farmCode"> & {
  farmCode: string;
  price?: number;
} & {
  statusCode: string;
  isSellable?: boolean;
  dailyProductionCapacity?: number;
  slug?: string;
  productTemplateCode?: string | null;
  productTemplateName?: string | null;
  specifications?: ProductSpecificationValue[];
};
export type Farm = {
  createdAt?: string;
  code: string;
  name: string;
  description: string;
  ownerCode: string;
  imageUrl?: string;
  capacity?: number;
  minPurchase: number;
  address: Address;
};
export type Profile = Omit<BaseProfile, "user"> & {
  user?: {
    code: string;
    fName: string;
    lName: string;
    email: string;
    isEmailConfirmed?: boolean;
    isPhoneConfirmed?: boolean;
    isPhoneOnly?: boolean;
    phoneNumber: string;
    roleName: string;
    roleCode: string;
    profileImageUrl?: string;
    userName?: string;
    createdAt?: string;
  };
};
export type Tokens = { token: string; refreshToken?: string; expires?: string };
export type Wallet = {
  code: string;
  balance: number;
  availableBalance: number;
  heldAmount: number;
};
export type Notice = {
  code: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};
export type Review = {
  userFullName?: string;
  code: string;
  content: string;
  rating?: number;
  userName?: string;
  name?: string;
  createdAt: string;
  replies?: Review[];
  subComments?: Review[];
};
export type Upload = { uri: string; name: string; type: string };
export type PickedImage = Upload & { file?: File };
export type Point = { latitude: number; longitude: number };

export type FarmSummary = {
  code: string;
  name: string;
  description: string;
  imageUrl?: string;
  ownerCode?: string;
};

export type MyFarm = Omit<FarmSummary, "imageUrl"> & {
  farmImageUrl?: string;
  provinceName?: string;
  countyName?: string;
  statusName?: string;
};

export type ProductSummary = Pick<
  Product,
  "code" | "name" | "stock" | "retailPrice"
> &
  Partial<Product>;
