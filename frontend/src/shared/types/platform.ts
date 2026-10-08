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
  agriculturalProductCode: string;
  expertCode: string;
  qualityDescription: string;
  qualityGrade: string;
  suggestedPrice?: number;
  assessmentDate?: string;
}
export interface ArticleSummary {
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
  street: string;
  postalCode: string;
  provinceCode: string;
  countyCode: string;
  cityCode?: string;
  villageCode?: string;
  isDefault: boolean;
}
export interface CartItem {
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
  statusTitle: string;
  statusCode: string;
  totalPrice: number;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
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
  code: string;
  payableAmount: number;
  isPaid: boolean;
  isSubmitted: boolean;
  isExpired: boolean;
  expiresAt: string;
  paymentStatus: string;
  orders: Order[];
}

export interface StoreProduct extends ProductOption {
  description: string;
  retailPrice: number;
  wholesalePrice?: number;
  imageUrls?: string[];
  createdAt: string;
  categoryCodes?: string[];
}
