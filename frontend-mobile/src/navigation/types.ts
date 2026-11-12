import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
export type MainTabRoutes = {
  Home: undefined;
  Catalog: undefined;
  CategoryList: undefined;
  Requests: undefined;
  Account: undefined;
};
export type Routes = {
  Business: { type?: "Farmer" | "Shop" } | undefined;
  Tabs: NavigatorScreenParams<MainTabRoutes> | undefined;
  Login: undefined;
  Recovery: undefined;
  Register: undefined;
  Products:
    | {
        category?: string;
        categoryCodes?: string[];
        farm?: string;
        discounted?: boolean;
        search?: string;
      }
    | undefined;
  Product: { code: string };
  Farms: undefined;
  Farm: { code: string };
  Categories: undefined;
  Cart: undefined;
  Checkout: { code: string };
  CheckoutDetails: undefined;
  Orders: undefined;
  Inquiries: undefined;
  Order: { code: string };
  Addresses: undefined;
  AddressForm: { code?: string } | undefined;
  Wallet: undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  NotificationPreferences: undefined;
  Saved: undefined;
  Services: undefined;
  ServiceForm: { code?: string } | undefined;
  Service: { code: string };
  Quality: { productCode?: string } | undefined;
  QualityForm: { productCode?: string } | undefined;
  Assessment: { code: string };
  Chat: undefined;
  ChatRoom: { code: string; title?: string };
  Auctions: undefined;
  AuctionForm: undefined;
  Auction: { code: string };
  Articles: undefined;
  Article: { code: string };

  MyFarms: undefined;
  FarmForm: { code?: string } | undefined;
  FarmProducts: { farm: string };
  ProductForm: { farm: string; code?: string };
  Rewards: undefined;
  Security: undefined;
  NotFound: undefined;
};
export type Props<K extends keyof Routes> = NativeStackScreenProps<Routes, K>;
