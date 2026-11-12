import { request, paged } from "./platform";
import type { Filters, CategoryOption, Reward } from "../shared/types/platform";
import type {
  Product,
  Farm,
  Profile,
  Wallet,
  Notice,
  Review,
  Tokens,
  Upload,
  MyFarm,
  ProductSummary,
} from "../shared/types/mobile";
export const api = {
  homeCategories: () =>
    request<CategoryOption[]>("/Category/GetCategoriesByType", {
      params: { type: "Home" },
    }),
  profile: () => request<Profile>("/User/GetMyProfile"),
  login: (userName: string, password: string) =>
    request<Tokens>("/Auth/Login", {
      method: "POST",
      data: { userName, password },
    }),
  phone: (data: {
    phoneNumber: string;
    purpose: "Login" | "Register";
    fName?: string;
    lName?: string;
  }) =>
    request<{ challengeCode: string; expiresAt: string; expiresInSeconds?: number; testCode?: string }>(
      "/Auth/RequestPhoneCode",
      { method: "POST", data },
    ),
  verify: (challengeCode: string, code: string) =>
    request<Tokens>("/Auth/VerifyPhoneCode", {
      method: "POST",
      data: { challengeCode, code },
    }),
  register: (data: {
    userName: string;
    password: string;
    fName: string;
    lName: string;
  }) => request<Tokens>("/Auth/Register", { method: "POST", data }),
  products: (filters: Filters = {}, signal?: AbortSignal) =>
    paged<Product>("/AgriculturalListing/GetPage", filters, false, signal),
  commerceProducts: (filters: Filters = {}, signal?: AbortSignal) =>
    paged<Product>("/MobileCatalog/Products", filters, false, signal),
  product: (code: string) =>
    request<Product>("/AgriculturalListing/GetByCode", { params: { code } }),
  farms: (filters: Filters = {}, signal?: AbortSignal) =>
    paged<{
      farmCode: string;
      farmName: string;
      description: string;
      farmImageUrl?: string;
      userCode: string;
    }>("/MobileCatalog/Farms", filters, false, signal).then((page) => ({
      ...page,
      items: page.items.map((f) => ({
        code: f.farmCode,
        name: f.farmName,
        description: f.description,
        imageUrl: f.farmImageUrl,
        ownerCode: f.userCode,
      })),
    })),
  farm: (code: string) =>
    request<Farm>("/Farm/GetByCode", { params: { code } }),
  farmContact: (code: string) =>
    request<{ phoneNumber: string | null }>("/Farm/Contact", { params: { code } }),
  myFarms: (pageNumber = 1, name?: string, signal?: AbortSignal) =>
    paged<MyFarm>(
      "/MobileCatalog/MyFarms",
      { Name: name || undefined, PageNumber: pageNumber, PageSize: 12 },
      false,
      signal,
    ),
  addCart: (productCode: string, quantity: number) =>
    request("/Cart/Add", { method: "POST", data: { productCode, quantity } }),
  saved: () =>
    request<(Omit<ProductSummary, "code"> & { productCode: string })[]>(
      "/SavedListings",
    ).then((items) =>
      items.map((p) => ({
        ...p,
        code: p.productCode,
      })),
    ),
  save: (code: string, on: boolean) =>
    request(`/SavedListings/${encodeURIComponent(code)}`, {
      method: on ? "PUT" : "DELETE",
    }),
  wallet: () => request<Wallet>("/Wallet/MyWallet"),
  paymentCapabilities: () => request<{ onlinePaymentAvailable: boolean; automaticPayoutAvailable: boolean; settlementMode: string }>("/Wallet/Capabilities"),
  deposit: (amount: number, redirectUrl: string) =>
    request<{ paymentUrl: string; transactionId: string }>("/Wallet/Deposit", {
      method: "POST",
      data: { amount, redirectUrl },
    }),
  notifications: () => request<Notice[]>("/Notification/MyNotifications"),
  readNotice: (notificationCode: string) =>
    request("/Notification/Read", {
      method: "PUT",
      params: { notificationCode },
    }),
  deleteNotice: (notificationCode: string) =>
    request("/Notification/DeleteNotification", {
      method: "DELETE",
      params: { notificationCode },
    }),
  updateProfile: (data: {
    fName: string;
    lName: string;
    email: string | null;
    phoneNumber: string | null;
  }) => request("/User/UpdateProfile", { method: "PUT", data }),
  reviews: (entityCode: string, entityComment = 2) =>
    paged<Review>(
      "/Comment/GetTreeComments",
      { EntityCode: entityCode, EntityComment: entityComment, PageSize: 30 },
      true,
    ),
  review: (
    entityCode: string,
    content: string,
    rating: number,
    entityComment = 2,
  ) =>
    request("/Comment/Create", {
      method: "POST",
      data: { entityCode, content, rating, entityComment },
    }),
  sliders: () =>
    request<{ code: string; imageUrl: string; description: string }[]>(
      "/Slider/GetActive",
    ),
  rewards: async (signal?: AbortSignal) => {
    const first = await paged<Reward>(
      "/Discount/GetByFilter",
      { PageSize: 100 },
      true,
      signal,
    );
    const items = [...first.items];
    let pageNumber = first.pageNumber;
    while (items.length < first.totalCount) {
      const next = await paged<Reward>(
        "/Discount/GetByFilter",
        { PageSize: 100, PageNumber: ++pageNumber },
        true,
        signal,
      );
      if (!next.items.length) break;
      items.push(...next.items);
    }
    return { ...first, items };
  },
  createFarm: (body: FormData) =>
    request<Farm>("/Farm/Create", { method: "POST", data: body }),
  updateFarm: (data: unknown) =>
    request("/Farm/Update", { method: "PUT", data }),
  createProduct: (body: FormData) =>
    request<Product>("/AgriculturalListing/CreateWithImages", {
      method: "POST",
      data: body,
    }),
  updateProduct: (data: unknown) =>
    request("/AgriculturalListing/Update", { method: "PUT", data }),
  deleteProduct: (code: string) =>
    request("/AgriculturalListing/Delete", {
      method: "DELETE",
      params: { code },
    }),
  upload: (
    url: string,
    key: string,
    file: Upload,
    params?: Record<string, string>,
  ) => {
    const data = new FormData();
    data.append(key, file as unknown as Blob);
    return request(url, { method: "POST", data, params });
  },
};
