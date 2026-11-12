import { createChatPreview } from "../shared/utils/chat-preview";
import { isAxiosError, type AxiosRequestConfig } from "axios";
import http from "./http";
import type {
  ApiResult,
  Page,
  Filters,
  Profile,
  ServiceRequest,
  ServiceInput,
  Assessment,
  AssessmentInput,
  QualityQuote,
  Auction,
  AuctionInput,
  Article,
  ArticleSummary,
  Message,
  ChatContact,
  ChatConversation,
  ProductOption,
  CategoryOption,
  AgriculturalProductTemplate,
  ProductInquiry,
  LocationOption,
  Address,
  AddressInput,
  CheckoutDiscountPreview,
  Cart,
  Order,
  Checkout,
} from "../shared/types/platform";
export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response && error.code === "ERR_NETWORK")
      return "ارتباط برقرار نشد. اینترنت سیم‌کارت یا وای‌فای گوشی را بررسی کنید و دوباره تلاش کنید.";
    if (error.response?.status === 429)
      return "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید و دوباره تلاش کنید.";
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
    if (empty404 && isAxiosError(error) && error.response?.status === 404)
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
  productTemplates: () => request<AgriculturalProductTemplate[]>("/AgriculturalProductTemplate"),
  createProductInquiry: (data: { productCode: string; quantity: number; message?: string }) =>
    request<ProductInquiry>("/ProductInquiry", { method: "POST", data }),
  productInquiries: (role: "Buyer" | "Seller", filter: "All" | "Pending" | "Reviewed" = "All", page = 1) =>
    paged<ProductInquiry>("/ProductInquiry/Mine", { role, filter, page, pageSize: 20 }, false),
  actProductInquiry: (code: string, status: "Contacted" | "Agreed" | "Declined" | "Cancelled") =>
    request<ProductInquiry>(`/ProductInquiry/${encodeURIComponent(code)}/Action`, { method: "POST", data: { status } }),
  sendChatFile: async (conversationCode: string, file: Blob | { uri: string; name: string; type: string },
    uploadRequestId: string, caption: string, group: { id: string; position: number } | undefined, signal: AbortSignal, onProgress: (percentage: number) => void, fileSize: number) => {
    const data = new FormData();
    data.append("conversationCode", conversationCode);
    data.append("uploadRequestId", uploadRequestId);
    if (group) {
      data.append("attachmentGroupId", group.id);
      data.append("attachmentGroupPosition", String(group.position));
    }
    data.append("file", file as Blob);
    if (caption) data.append("caption", caption);
    const preview = await createChatPreview(file, signal);
    if (signal.aborted) throw new Error("ارسال لغو شد.");
    if (preview) data.append("preview", preview);
    return request<Message>("/ChatMessage/SendFile", { method: "POST", data, signal, timeout: 300000,
      onUploadProgress: event => {
        const total = event.total || fileSize;
        if (total) onProgress(event.total && event.loaded >= event.total ? 100 : Math.min(99, Math.round(event.loaded * 100 / total)));
      },
    });
  },
  downloadChatFile: async (code: string, onProgress?: (percentage: number, loaded?: number, total?: number) => void, signal?: AbortSignal, expectedSize?: number) => (await http.get<Blob>(`/ChatMessage/${encodeURIComponent(code)}/File`, { responseType: "blob", timeout: 300000, signal, onDownloadProgress: event => { const total = event.total || expectedSize; if (total) onProgress?.(Math.min(100, Math.round(event.loaded * 100 / total)), event.loaded, total); } })).data,

  categoryTree: () => request<CategoryOption[]>("/Category/CategoryTree"),
  profile: (signal?: AbortSignal) =>
    request<Profile>("/User/GetMyProfile", { signal }),
  services: (params: Filters, signal?: AbortSignal) =>
    paged<ServiceRequest>("/ServiceRequest/GetByfilter", params, false, signal),
  service: (code: string) =>
    request<ServiceRequest>("/ServiceRequest/GetByCode", { params: { code } }),
  createService: (data: ServiceInput) =>
    request<ServiceRequest>("/ServiceRequest/Create", { method: "POST", data }),
  updateService: (data: Partial<ServiceInput> & { code: string }) =>
    request<boolean>("/ServiceRequest/Update", { method: "PUT", data }),

  qualityFee: () => request<number>("/QualityAssessment/Tariff"),

  quoteQuality: (data: {
    agriculturalProductCode: string;
    discountCode?: string;
  }) =>
    request<QualityQuote>("/QualityAssessment/Quote", { method: "POST", data }),
  requestQuality: (data: {
    agriculturalProductCode: string;
    agriculturalOrderCode?: string;
    quantity: number;
    requestDescription: string;
    discountCode?: string;
    idempotencyKey: string;
    expectedAmount: number;
  }) =>
    request<Assessment>("/QualityAssessment/Request", { method: "POST", data }),
  uploadQualityReport: (data: {
    code: string;
    file: { uri: string; name: string; type: string };
  }) => {
    const body = new FormData();
    body.append("file", data.file as unknown as Blob);
    return request<string>(
      `/QualityAssessment/${encodeURIComponent(data.code)}/ReportFile`,
      { method: "POST", data: body },
    );
  },
  assessments: (params: Filters, signal?: AbortSignal) =>
    paged<Assessment>("/QualityAssessment/GetByFilter", params, true, signal),
  assessmentConversation: (code: string) => request<ChatConversation>(`/QualityAssessment/${encodeURIComponent(code)}/Conversation`, { method: "POST" }),
  assessment: (code: string) =>
    request<Assessment>("/QualityAssessment/GetByCode", { params: { code } }),
  createAssessment: (data: AssessmentInput) =>
    request<Assessment>("/QualityAssessment/Create", { method: "POST", data }),
  updateAssessment: (
    data: Omit<AssessmentInput, "agriculturalProductCode"> & { code: string },
  ) => request<boolean>("/QualityAssessment/Update", { method: "PUT", data }),

  articles: (params: Filters, signal?: AbortSignal) =>
    paged<ArticleSummary>("/Article/GetByFilter", params, false, signal),
  article: (code: string) =>
    request<Article>("/Article/GetByCode", { params: { code } }),

  auctions: (params: Filters, signal?: AbortSignal) =>
    paged<Auction>("/Auction/GetByFilter", params, true, signal),
  auction: (code: string) =>
    request<Auction>("/Auction/GetByCode", { params: { code } }),
  createAuction: (data: AuctionInput) =>
    request<Auction>("/Auction/CreateAuction", { method: "POST", data }),
  bid: (data: { auctionCode: string; bidAmount: number }) =>
    request<unknown>("/AuctionBid/CreateAuctionBid", { method: "POST", data }),

  messages: (params: Filters, signal?: AbortSignal) =>
    paged<Message>("/ChatMessage/GetByFilter", params, true, signal),
  chatContact: (code: string, signal?: AbortSignal) =>
    request<ChatContact>("/ChatMessage/GetContact", {
      params: { code },
      signal,
    }),
  getOrCreateConversation: (receiverCode: string) =>
    request<ChatConversation>("/ChatMessage/GetOrCreateConversation", {
      method: "POST",
      params: { receiverCode },
    }),
  chatRooms: (signal?: AbortSignal) =>
    request<ChatConversation[]>("/ChatMessage/GetMyConversations", { signal }),
  conversationInfo: (conversationCode: string, signal?: AbortSignal) =>
    request<ChatConversation>("/ChatMessage/GetConversationInfo", {
      params: { conversationCode },
      signal,
    }),
  setConversationBlocked: (code: string, blocked: boolean) =>
    request<boolean>(`/ChatMessage/${encodeURIComponent(code)}/Block`, { method: "PUT", data: { blocked } }),
  reportChatMessage: (code: string, reason: string) =>
    request<{ alreadyPending: boolean }>(`/ChatReport/${encodeURIComponent(code)}`, { method: "POST", data: { reason } }),
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
  editMessage: (code: string, message: string) => request<boolean>("/ChatMessage/Update", { method: "PUT", data: { code, message } }),
  deleteMessage: (code: string) => request<unknown>("/ChatMessage/Delete", { method: "DELETE", params: { code } }),
  deleteMessages: (codes: string[]) => request<string[]>("/ChatMessage/DeleteMany", { method: "POST", data: { codes } }),
  forwardMessage: (code: string, conversationCode: string) => request<Message>(`/ChatMessage/${encodeURIComponent(code)}/Forward`, { method: "POST", data: { conversationCode } }),
  markMessageRead: (item: Message) =>
    request<boolean>("/ChatMessage/Update", {
      method: "PUT",
      data: { code: item.code, message: item.message, isRead: true },
    }),
  products: (params: Filters, signal?: AbortSignal) =>
    paged<ProductOption>("/MobileCatalog/Products", params, true, signal),
  categories: () =>
    paged<CategoryOption>(
      "/MobileCatalog/Categories",
      { PageSize: 100 },
      false,
    ),
  addresses: (params: Filters = {}) =>
    paged<Address>("/Address/GetByFilter", params),
  createAddress: (data: AddressInput) =>
    request<Address>("/Address/Create", { method: "POST", data }),
  updateAddress: (data: AddressInput & { addressCode: string }) =>
    request<Address>("/Address/Update", { method: "PUT", data }),
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
  previewCheckoutDiscount: (data: { cartId: string; discountCode: string }) =>
    request<CheckoutDiscountPreview>("/Checkout/PreviewDiscount", {
      method: "POST",
      data,
    }),
  createCheckout: (data: {
    deliveryBookingCode: string;
    expectedDeliveryFee: number;
      expectedDeferredDeliveryFeeLimit?: number;
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
};

