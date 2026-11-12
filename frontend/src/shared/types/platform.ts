import type { QualityReport } from "../utils/quality-report";
import type { ProductOffer } from "./productOffer";
// قراردادهای این فایل از DTOهای بک‌اند ارسالی استخراج شده‌اند.
export interface ApiResult<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}
export interface Page<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
export type Filters = Record<
  string,
  string | number | boolean | string[] | undefined
>;
export interface Profile {
  isGuest: boolean;
  cartId?: string;
  user?: {
    code: string;
    fName: string;
    lName: string;
    roleName?: string;
    phoneNumber?: string;
    isPhoneConfirmed?: boolean;
    isEmailConfirmed?: boolean;
  };
}
export interface ServiceRequest {
  code: string;
  serviceType: number | string;
  statusCode: string;
  userCode: string;
  providerCode?: string;
  addressCode?: string;
  addressStreet?: string;
  addressProvince?: string;
  addressCounty?: string;
  addressCity?: string;
  price: number;
  description: string;
  serviceDate?: string;
  numberOfVases?: number;
  gardenArea?: number;
  greenhouseArea?: number;
}
export interface ServiceInput {
  serviceType: number;
  addressCode?: string;
  statusCode?: string;
  description: string;
  serviceDate?: string;
  numberOfVases?: number;
  gardenArea?: number;
  greenhouseArea?: number;
}
export interface Assessment {
  report?: QualityReport;
  agriculturalOrderCode?: string;
  productName?: string;
  applicantCode?: string;
  requestDescription?: string;
  requestedQuantity?: number;
  fee?: number;
  discountAmount?: number;
  paidAmount?: number;
  paidAt?: string;
  reportFileUrl?: string;
  code: string;
  agriculturalProductCode: string;
  expertCode?: string;
  qualityDescription: string;
  qualityGrade: string;
  suggestedPrice?: number;
  assessmentDate?: string;
  createdAt: string;
}
export interface AssessmentInput {
  report: QualityReport;
  agriculturalProductCode: string;
  expertCode: string;
  qualityDescription: string;
  qualityGrade: string;
  suggestedPrice?: number;
  assessmentDate?: string;
}
export interface ArticleSummary {
  summary?: string;
  code: string;
  title: string;
  authorCode: string;
  categoryCodes: string[];
  slug: string;
  createdAt: string;
}
export interface Article extends ArticleSummary {
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
}
export interface ArticleInput {
  title: string;
  content: string;
  categoryCodes: string[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
}
export interface Message {
    isDeleted?: boolean;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  attachmentPreview?: string;
  attachmentGroupId?: string;
  attachmentGroupPosition?: number;
  code: string;
  conversationCode: string;
  message: string;
  senderCode: string;
  receiverCode: string;
  senderName: string;
  receiverName: string;
  senderFarmName?: string;
  receiverFarmName?: string;
  senderProductName?: string;
  receiverProductName?: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
}
export interface ChatContact {
  code: string;
  displayName: string;
  farmName?: string;
  productName?: string;
}
export interface ChatConversation {
  code: string;
  peerCode: string;
  peerName: string;
    peerOnline?: boolean;
  farmName?: string;
  productName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
export interface AuctionBid {
  code: string;
  bidAmount: number;
  createdAt: string;
}
export interface Auction {
  code: string;
  agriculturalProductCode: string;
  startDate: string;
  endDate: string;
  startingPrice: number;
  currentPrice?: number;
  winnerCode?: string;
  statusCode: string;
  createdAt: string;
  bids: AuctionBid[];
}
export interface AuctionInput {
  agriculturalProductCode: string;
  startDate: string;
  endDate: string;
  startingPrice: number;
  statusCode: string;
}
export interface ProductOption {
  saleUnit?: string | null;
  code: string;
  name: string;
  price: number;
  stock: number;
  farmCode?: string;
  primaryImageUrl?: string;
  imageUrl?: string;
}
export interface CategoryOption {
  code: string;
  name: string;
  title?: string;
}
export interface LocationOption {
  code: string;
  name: string;
  type?: string;
}
export interface Address {
  latitude?: number | null;
  longitude?: number | null;
  code: string;
  street: string;
  postalCode: string;
  provinceCode: string;
  provinceName: string;
  countyCode: string;
  countyName: string;
  cityCode?: string;
  cityName?: string;
  villageCode?: string;
  villageName?: string;
  isDefault: boolean;
}
export interface AddressInput {
  latitude?: number | null;
  longitude?: number | null;
  street: string;
  postalCode: string;
  provinceCode: string;
  countyCode: string;
  cityCode?: string;
  villageCode?: string;
  isDefault: boolean;
}
export interface CartItem {
  saleUnit?: string | null;
  code: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
  primaryImageUrl?: string;
}
export interface CartFarm {
  farmCode: string;
  farmName: string;
  totalPrice: number;
  province: string;
  county: string;
  items: CartItem[];
}
export interface Cart {
  cartId: string;
  code: string;
  farms: CartFarm[];
  itemCount: number;
  totalPrice: number;
  isGuest: boolean;
}
export interface OrderItem {
  receivedAtOriginQuantity?: number;
  receivedAtHubQuantity?: number;
  deliveredQuantity?: number;
  saleUnit?: string | null;
  code: string;
  agriculturalProductCode: string;
  productName: string;
  quantity: number;
  price: number;
  lineTotal: number;
}
export interface Order {
  code: string;
  checkoutCode?: string;
  farmCode?: string;
  farmName: string;
  buyerCode: string;
  sellerCode?: string;
  statusTitle: string;
  statusCode: string;
  totalPrice: number;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  discountFundingSource?: "Platform" | "Seller" | null;
  platformDiscountAmount?: number;
  sellerDiscountAmount?: number;
  paymentStatus: string;
  isPaid: boolean;
  isHeld: boolean;
  createdAt: string;
  orderItems: OrderItem[];
  allowedActions: string[];
  trackingCode?: string;
  shippingMethod?: string;
  rejectionReason?: string;
  refundStatus: string;
  refundAmount: number;
  history: { action: string; createdAt: string; reason?: string }[];
  address?: {
    recipient: string;
    phoneNumber: string;
    street: string;
    province: string;
    county: string;
    postalCode: string;
  };
}
export interface Checkout {
  deferredDeliveryFeeLimit?: number;
  code: string;
  payableAmount: number;
  isPaid: boolean;
  isSubmitted: boolean;
  isExpired: boolean;
  expiresAt: string;
  paymentStatus: string;
  orders: Order[];
}

export interface StoreProduct extends ProductOption, ProductOffer {
  saleUnit?: string | null;
  description: string;
  retailPrice: number;
  wholesalePrice?: number;
  imageUrls?: string[];
  createdAt: string;
  categoryCodes?: string[];
  productTemplateCode?: string | null;
  productTemplateName?: string | null;
  specifications?: ProductSpecificationValue[];
}

export interface ProductSpecificationValue {
  specificationCode: string;
  name: string;
  optionCode: string;
  value: string;
  colorHex?: string | null;
  icon?: string | null;
  sortOrder: number;
}

export interface ProductInquiry {
  code: string;
  productCode: string;
  productName: string;
  primaryImageUrl?: string | null;
  farmCode?: string;
  farmName: string;
  saleUnit: string;
  quantity: number;
  unitPrice: number;
  estimatedTotal: number;
  status: string;
  buyerCode: string;
  buyerName: string;
  sellerCode: string;
  sellerName: string;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

export interface CheckoutDiscountPreview {
  discountCode: string;
  subtotal: number;
  discountAmount: number;
  payableAmount: number;
}

export type QualityQuote = { fee: number; discountAmount: number; payableAmount: number; availableBalance: number };

