export interface ApiResult<T = unknown> {
  code: number
  message?: string
  msg?: string
  data: T
}

export interface PageRequest {
  pageNum: number
  pageSize: number
}

export interface PageResult<T> {
  list?: T[]
  records?: T[]
  total: number
  pageNum?: number
  pageSize?: number
  pages?: number
}

export interface LoginUser {
  userName: string
  password: string
}

export interface LoginDTO {
  loginType: 'sms' | 'account'
  username?: string
  password?: string
  phone?: string
  code?: string
}

export interface AuthResult {
  token: string
  role: string
  username: string
  avatar?: string
}

export interface UserProfile {
  username: string
  avatar: string
  phone: string
  createTime: string
  role: string
}

export interface PasswordUpdateForm {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface ManagedAccount {
  id?: number
  userName: string
  nickName: string
  phone?: string
  email?: string
  status?: number
  remark?: string
  createTime?: string
}

export interface ManagedAccountForm {
  id?: number
  userName: string
  nickName: string
  phone: string
  email: string
  password?: string
  status: number
  remark: string
}

export interface ManagedAccountQueryParams extends PageRequest {
  userName?: string
  nickName?: string
  phone?: string
  status?: number | ''
}

export interface Product {
  productId?: number
  productSn: string
  productName: string
  productDescription?: string
  price: number
  stock?: number
  productCategoryId?: number
  category?: Category
  imageUrl?: string
  detailUrl?: string
}

export interface Category {
  categoryId?: number
  parentId: number
  categoryName: string
  children?: Category[]
}

export interface CartItem {
  id?: number
  productId: number
  productName: string
  productPic: string
  price: number
  currentPrice?: number
  quantity: number
}

export interface ProductQueryParams extends PageRequest {
  productName?: string
  productSn?: string
  productCategoryId?: number
}

export interface Coupon {
  id?: number
  couponId?: number
  name: string
  amount: number
  count: number
  minPoint: number
  perLimit?: number
  startTime: string
  endTime: string
  useStatus?: 0 | 1
  scopeType?: 'MALL' | 'MERCHANT'
  scopeName?: string
}

export interface CouponForm {
  id?: number
  name: string
  count: number
  amount: number
  minPoint: number
  perLimit: number
  startTime: string
  endTime: string
  scopeType?: 'MALL' | 'MERCHANT'
}

export interface CouponQueryParams extends Partial<PageRequest> {
  name?: string
  scopeType?: 'MALL' | 'MERCHANT'
}

export interface OrderParam {
  addressId: number
  payType: number
  note: string
  couponId?: number | null
}

export interface CreateOrderResult {
  orderId: number
  payAmount?: number | string
}

export interface OrderSummary {
  orderId: number
  payAmount: number | string
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'REFUNDING'
  | 'REFUNDED'
  | 'RETURN_REJECTED'

export interface Order {
  orderId: number
  orderNo: string
  status: OrderStatus
  totalAmount: number
  payAmount: number
  totalQuantity: number
  createTime: string
  updateTime?: string
  buyerName?: string
  buyerPhone?: string
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  refundReason?: string
  refundRemark?: string
  refundApplyTime?: string
  refundAuditTime?: string
}

export interface OrderReturnApplyPayload {
  reason: string
}

export interface OrderReturnAuditPayload {
  approved: boolean
  remark?: string
}

export interface OrderItem {
  itemId?: number
  productId: number
  productName: string
  productPic?: string
  price: number
  quantity: number
  subtotal: number
}

export interface OrderDetail {
  order: Order
  items: OrderItem[]
}

export interface OrderQueryParams extends PageRequest {
  orderNo?: string
  status?: OrderStatus | ''
  startTime?: string
  endTime?: string
  buyerName?: string
  buyerPhone?: string
}

export interface OrderStatusCount {
  status: OrderStatus | 'ALL'
  count: number
}

export interface UserCouponRecord {
  id?: number
  couponId: number
  name: string
  amount: number
  count: number
  minPoint: number
  startTime: string
  endTime: string
  perLimit?: number
  useStatus: 0 | 1
}

export interface Sale {
  saleId?: number
  saleNo: string
  total: number
  totalQuantity: number
  status: string
}

export interface SaleItem {
  index?: number
  itemSn: string
  productId?: number
  productName: string
  price: number
  quantity: number
}

export interface EnterItemForm {
  itemSn: string
  quantity: number
}

export interface MakePaymentForm {
  saleId?: number
  payMethod: string
  cashTendered: number
  changeDue: number
}

// ==================== 收货地址相关类型 ====================

export interface Address {
  id?: number
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  zipCode?: string
  isDefault: number // 0 否, 1 是
  createTime?: string
  updateTime?: string
}

export interface AddressForm {
  id?: number
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  zipCode?: string
  isDefault: number
}

export interface AddressQueryParams extends PageRequest {
  receiverName?: string
  receiverPhone?: string
}
