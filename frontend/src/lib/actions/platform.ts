import axios, { type AxiosRequestConfig } from "axios";
import http from "@/shared/lib/config/axions";
import type {
  ApiResult,
  Page,
  Filters,
  Profile,
  ServiceRequest,
  ServiceInput,
  Assessment,
  AssessmentInput,
  Auction,
  AuctionInput,
  Article,
  ArticleSummary,
  ArticleInput,
  Message,
  ChatContact,
  ChatConversation,
  ProductOption,
  CategoryOption,
  LocationOption,
  Address,
  AddressInput,
  Cart,
  Order,
  Checkout,
} from "@/shared/types/platform";
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (body?.errors && typeof body.errors === "object")
      return Object.values(body.errors).flat().join("؛ ");
    if (body?.message || body?.title) return body.message || body.title;
    if (error.response?.status === 403)
      return "اجازه دسترسی به این بخش را ندارید";
    if (error.response?.status === 401)
      return "برای ادامه وارد حساب کاربری شوید";
    if (error.response?.status === 404) return "اطلاعات موردنظر پیدا نشد";
    if (!error.response) return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید";
  }
  return error instanceof Error ? error.message : "عملیات انجام نشد";
}
export async function request<T>(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<T> {
  const response = await http.request<ApiResult<T>>({ url, ...options });
  if (response.data?.isSuccess === false)
    throw new Error(response.data.message || "عملیات انجام نشد");
  if (!response.data || !("data" in response.data))
    throw new Error("پاسخ سرور معتبر نیست");
  return response.data.data;
}
// تنها endpointهای قدیمیِ فهرست خالی 404 می‌دهند؛ خطای سایر endpointها پنهان نمی‌شود.
export async function paged<T>(
  url: string,
  params: Filters = {},
  empty404 = false,
  signal?: AbortSignal,
): Promise<Page<T>> {
  try {
    const data = await request<Page<T> | T[]>(url, {
      params,
      signal,
      // ASP.NET Core binds list filters from repeated keys, e.g.
      // CategoryCodes=A&CategoryCodes=B (without Axios' default [] suffix).
      paramsSerializer: { indexes: null },
    });
    if (Array.isArray(data))
      return {
        items: data,
        totalCount: data.length,
        pageNumber: Number(params.PageNumber || 1),
        pageSize: Number(params.PageSize || 12),
      };
    if (!data || !Array.isArray(data.items))
      throw new Error("ساختار فهرست دریافتی معتبر نیست");
    return data;
  } catch (error) {
    if (empty404 && axios.isAxiosError(error) && error.response?.status === 404)
      return {
        items: [],
        totalCount: 0,
        pageNumber: Number(params.PageNumber || 1),
        pageSize: Number(params.PageSize || 12),
      };
    throw error;
  }
}
export const platformApi = {
  profile: (signal?: AbortSignal) =>
    request<Profile>("/User/GetMyProfile", { signal }),
  services: (params: Filters, signal?: AbortSignal) =>
    paged<ServiceRequest>("/ServiceRequest/GetByfilter", params, false, signal),
  service: (code: string) =>
    request<ServiceRequest>("/ServiceRequest/GetByCode", { params: { code } }),
  createService: (data: ServiceInput) =>
    request<ServiceRequest>("/ServiceRequest/Create", { method: "POST", data }),
  updateService: (
    data: Partial<ServiceInput> & { code: string; providerCode?: string },
  ) => request<boolean>("/ServiceRequest/Update", { method: "PUT", data }),
  assignProvider: (data: { code: string; providerCode: string }) =>
    request<unknown>("/ServiceRequest/AddProvider", { method: "PATCH", data }),
  assessments: (params: Filters, signal?: AbortSignal) =>
    paged<Assessment>("/QualityAssessment/GetByFilter", params, true, signal),
  assessment: (code: string) =>
    request<Assessment>("/QualityAssessment/GetByCode", { params: { code } }),
  createAssessment: (data: AssessmentInput) =>
    request<Assessment>("/QualityAssessment/Create", { method: "POST", data }),
  updateAssessment: (
    data: Omit<AssessmentInput, "agriculturalProductCode"> & { code: string },
  ) => request<boolean>("/QualityAssessment/Update", { method: "PUT", data }),
  assignExpert: (data: { code: string; expertCode: string }) =>
    request<unknown>("/QualityAssessment/AddExpert", { method: "PATCH", data }),
  articles: (params: Filters, signal?: AbortSignal) =>
    paged<ArticleSummary>("/Article/GetByFilter", params, false, signal),
  article: (code: string) =>
    request<Article>("/Article/GetByCode", { params: { code } }),
  createArticle: (data: ArticleInput) =>
    request<Article>("/Article/CreateArticle", { method: "POST", data }),
  updateArticle: (data: ArticleInput & { articleCode: string }) =>
    request<boolean>("/Article/UpdateArticle", { method: "PUT", data }),
  deleteArticle: (code: string) =>
    request<unknown>("/Article/DeleteArticle", {
      method: "DELETE",
      params: { code },
    }),
  auctions: (params: Filters, signal?: AbortSignal) =>
    paged<Auction>("/Auction/GetByFilter", params, true, signal),
  auction: (code: string) =>
    request<Auction>("/Auction/GetByCode", { params: { code } }),
  createAuction: (data: AuctionInput) =>
    request<Auction>("/Auction/CreateAuction", { method: "POST", data }),
  bid: (data: { auctionCode: string; bidAmount: number }) =>
    request<unknown>("/AuctionBid/CreateAuctionBid", { method: "POST", data }),
  finalizeAuction: (code: string) =>
    request<unknown>("/Auction/FinalizeAuction", {
      method: "POST",
      params: { code },
    }),
  messages: (params: Filters, signal?: AbortSignal) =>
    paged<Message>("/ChatMessage/GetByFilter", params, true, signal),
  chatContact: (code: string, signal?: AbortSignal) =>
    request<ChatContact>("/ChatMessage/GetContact", { params: { code }, signal }),
  getOrCreateConversation: (receiverCode: string) =>
    request<ChatConversation>("/ChatMessage/GetOrCreateConversation", { method: "POST", params: { receiverCode } }),
  chatRooms: (signal?: AbortSignal) =>
    request<ChatConversation[]>("/ChatMessage/GetMyConversations", { signal }),
  conversationInfo: (conversationCode: string, signal?: AbortSignal) =>
    request<ChatConversation>("/ChatMessage/GetConversationInfo", { params: { conversationCode }, signal }),
  conversation: (
    conversationCode: string,
    pageNumber: number,
    signal?: AbortSignal,
  ) =>
    paged<Message>(
      "/ChatMessage/GetConversation",
      { conversationCode, pageNumber, pageSize: 30 },
      true,
      signal,
    ),
  sendMessage: (data: { conversationCode: string; message: string }) =>
    request<Message>("/ChatMessage/Create", { method: "POST", data }),
  markMessageRead: (item: Message) =>
    request<boolean>("/ChatMessage/Update", {
      method: "PUT",
      data: { code: item.code, message: item.message, isRead: true },
    }),
  products: (params: Filters, signal?: AbortSignal) =>
    paged<ProductOption>(
      "/AgriculturalProduct/GetByFilter",
      params,
      true,
      signal,
    ),
  categories: () =>
    paged<CategoryOption>("/Category/GetByFilter", { PageSize: 100 }, true),
  addresses: (params: Filters = {}) =>
    paged<Address>("/Address/GetByFilter", params),
  createAddress: (data: AddressInput) =>
    request<Address>("/Address/Create", { method: "POST", data }),
  updateAddress: (data: AddressInput & { addressCode: string }) =>
    request<boolean>("/Address/Update", { method: "PUT", data }),
  deleteAddress: (code: string) =>
    request<unknown>("/Address/Delete", { method: "DELETE", params: { code } }),
  provinces: () =>
    request<LocationOption[]>("/location/Provinces", {
      params: { PageSize: 100 },
    }),
  counties: (provinceCode: string) =>
    request<LocationOption[]>("/location/Counties", {
      params: { provinceCode, PageSize: 100 },
    }),
  countyLocations: (countyCode: string) =>
    request<LocationOption[]>("/location/CityAndVillage", {
      params: { countyCode },
    }),
  cart: () => request<Cart>("/Cart"),
  updateCart: (data: { cartId: string; itemCode: string; quantity: number }) =>
    request<Cart>("/Cart/UpdateItem", { method: "PUT", data }),
  removeCart: (data: { cartId: string; itemCode: string }) =>
    request<Cart>("/Cart/RemoveItem", { method: "DELETE", data }),
  createCheckout: (data: {
    cartId: string;
    addressCode: string;
    discountCode?: string;
    idempotencyKey: string;
  }) => request<Checkout>("/Checkout/CreateFromCart", { method: "POST", data }),
  checkout: (code: string) =>
    request<Checkout>(`/Checkout/${encodeURIComponent(code)}`),
  payWallet: (code: string) =>
    request<Checkout>(`/Checkout/${encodeURIComponent(code)}/Pay/Wallet`, {
      method: "POST",
    }),
  cancelCheckout: (code: string) =>
    request<unknown>(`/Checkout/${encodeURIComponent(code)}/Cancel`, {
      method: "POST",
    }),
  orders: (params: Filters, signal?: AbortSignal) =>
    paged<Order>("/AgriculturalOrder/GetByFilter", params, false, signal),
  order: (code: string) =>
    request<Order>("/AgriculturalOrder/GetByCode", { params: { code } }),
  orderAction: (
    code: string,
    data: {
      action: string;
      reason?: string;
      shippingMethod?: string;
      trackingCode?: string;
    },
  ) =>
    request<Order>(`/AgriculturalOrder/${encodeURIComponent(code)}/Action`, {
      method: "POST",
      data,
    }),
  completeRefund: (code: string, reference: string) =>
    request<Order>(
      `/AgriculturalOrder/${encodeURIComponent(code)}/Refund/Complete`,
      { method: "POST", data: { reference } },
    ),
};
